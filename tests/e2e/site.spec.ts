import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  "/",
  "/properties",
  "/properties/joypurhat-residence",
  "/projects",
  "/projects/nirapad-nibas",
  "/services",
  "/about",
  "/insights",
  "/insights/evaluate-land-with-clarity",
  "/contact",
  "/faq",
  "/brand-kit",
  "/privacy",
  "/terms",
  "/cookies",
  "/property-disclaimer",
  "/accessibility",
] as const;

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    const text = message.text();
    const isLocalMetadataCspNoise =
      page.url().startsWith("http://localhost:") &&
      text.includes("abdullah-properties-joypurhat.delowarhossain-dev.chatgpt.site") &&
      text.includes("violates the following Content Security Policy directive");

    if (message.type() === "error" && !isLocalMetadataCspNoise) errors.push(`console: ${text}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));

  return errors;
}

for (const route of publicRoutes) {
  test(`${route} renders, hydrates, and loads its images`, async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    const response = await page.goto(route, { waitUntil: "networkidle" });

    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main").first()).toBeVisible();
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);

    const brokenImages = await page.locator("img").evaluateAll((images) =>
      images
        .filter((image): image is HTMLImageElement => image instanceof HTMLImageElement)
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src") ?? "unknown image"),
    );
    const hasPageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );

    expect(brokenImages).toEqual([]);
    expect(hasPageOverflow).toBe(false);
    expect(runtimeErrors).toEqual([]);
  });
}

test("mobile navigation is keyboard operable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.waitForTimeout(250);
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
});

test("property filters expose an empty state and reset cleanly", async ({ page }) => {
  await page.goto("/properties");
  await page.getByPlaceholder("Search by project, place, or type").fill("no matching property 9374");
  await expect(page.getByRole("heading", { name: "No visual studies match that search." })).toBeVisible();

  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByRole("heading", { name: "No visual studies match that search." })).toBeHidden();
  await expect(page.locator(".property-card")).toHaveCount(4);
});

test("enquiry validation and explicit channel handoff work without transmitting data", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Prepare enquiry" }).click();
  await expect(page.getByText("Enter your full name.")).toBeVisible();

  await page.getByLabel("Full name").fill("Site Quality Test");
  await page.getByLabel("Phone or email").fill("quality@example.com");
  await page.getByLabel("Property or service interest").fill("Residential consultation");
  await page.getByLabel("What would make this conversation useful?").fill(
    "I would like to understand the verification and consultation process.",
  );
  await page.getByRole("button", { name: "Prepare enquiry" }).click();

  const success = page.getByRole("alert");
  await expect(success).toBeFocused();
  await expect(success).toContainText("Nothing is transmitted until you confirm send");
  await expect(success.getByRole("link", { name: "Open email" })).toHaveAttribute("href", /^mailto:/);
  await expect(success.getByRole("link", { name: "Open WhatsApp" })).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/8801735877654\?text=/,
  );
  await expect(page.getByRole("button", { name: "Prepare enquiry" })).toBeHidden();

  await success.getByRole("button", { name: "Prepare another" }).click();
  await expect(page.getByRole("button", { name: "Prepare enquiry" })).toBeVisible();
});

for (const route of ["/", "/properties", "/about", "/contact", "/faq"] as const) {
  test(`${route} has no automated WCAG A/AA violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const summary = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target),
    }));

    expect(summary, `${route} accessibility violations`).toEqual([]);
  });
}

test("unknown routes are a noindex 404 and reduced motion is honored", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto("/quality-check-missing-route", { waitUntil: "networkidle" });

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("This address is not in the site plan");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);

  const durations = await page.evaluate(() =>
    document
      .getAnimations()
      .map((animation) => animation.effect?.getComputedTiming().duration)
      .filter((duration): duration is number => typeof duration === "number"),
  );
  expect(durations.every((duration) => duration <= 1)).toBe(true);
});
