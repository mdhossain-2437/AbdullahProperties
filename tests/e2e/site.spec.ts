import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  "/",
  "/properties",
  "/properties/joypurhat-residence",
  "/projects",
  "/projects/nirapad-nibas",
  "/services",
  "/services/residential-development",
  "/buyers",
  "/landowners",
  "/process",
  "/solutions",
  "/joint-venture",
  "/quality",
  "/client-care",
  "/resources",
  "/property-planner",
  "/area-guides",
  "/area-guides/joypurhat-property-decisions",
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
      text.includes("abdullah-properties.com") &&
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

  const trigger = page.getByRole("button", { name: "Open Explore navigation" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.waitForTimeout(250);
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("link", { name: /^About\b/ }).click();
  await expect(page).toHaveURL(/\/about$/);
});

test("language toggle preserves the current page and exposes a hand-written Bengali experience", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about", { waitUntil: "networkidle" });

  await page.getByRole("link", { name: "এই পাতাটি বাংলায় দেখুন" }).click();

  await expect(page).toHaveURL(/\/bn\/about$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "bn-BD");
  await expect(page.getByRole("heading", { level: 1, name: "স্থানীয় আবাসনকাজ—সহজ ভাষায়, দৃশ্যমান দায়িত্বে।" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View this page in English" })).toHaveAttribute("href", "/about");

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    accessibility.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target),
    })),
    "Bengali route accessibility violations",
  ).toEqual([]);

  const hasPageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasPageOverflow).toBe(false);
});

test("compact bilingual header switches before navigation can overlap", async ({ page }) => {
  await page.setViewportSize({ width: 1060, height: 780 });
  await page.goto("/bn", { waitUntil: "networkidle" });

  const header = page.getByRole("banner");
  await expect(header.getByRole("button", { name: "নেভিগেশন খুলুন" })).toBeVisible();
  await expect(header.getByRole("navigation", { name: "প্রধান নেভিগেশন" })).toBeHidden();
  await expect(header.getByRole("navigation", { name: "ভাষা নির্বাচন" })).toBeVisible();

  const headerBounds = await header.boundingBox();
  expect(headerBounds).not.toBeNull();
  expect((headerBounds?.x ?? 0) + (headerBounds?.width ?? 0)).toBeLessThanOrEqual(1060);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
});

test("desktop Explore navigation opens, dismisses, and restores trigger focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Explore", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Every route to a clearer property decision." })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.locator("[data-explore-overlay]").click({ position: { x: 4, y: 4 } });
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("cinematic homepage story supports keyboard and direct chapter selection", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { level: 1, name: "Property decisions, made clear." })).toBeVisible();
  const story = page.locator('section[aria-labelledby="decision-story-heading"]');
  await story.scrollIntoViewIfNeeded();
  await expect(story.getByRole("heading", { level: 3 })).toHaveCount(5);

  const stage = story.getByLabel("Active process chapter");
  const verificationChapter = story.getByRole("link", { name: /^Go to chapter 03:/ });
  await verificationChapter.focus();
  await page.keyboard.press("Enter");
  await expect(verificationChapter).toHaveAttribute("aria-current", "step");
  await expect(stage).toContainText("Chapter 03");
  await expect(stage.getByAltText("Illustrative Abdullah Properties office and document review environment")).toBeVisible();

  const handoverChapter = story.getByRole("link", { name: /^Go to chapter 05:/ });
  await handoverChapter.click();
  await expect(handoverChapter).toHaveAttribute("aria-current", "step");
  await expect(stage).toContainText("Chapter 05");
});

test("homepage decision tools and office handoff work by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1720, height: 960 });
  await page.goto("/", { waitUntil: "networkidle" });

  const storyIndex = page.getByRole("navigation", { name: "Homepage story chapters" });
  await expect(storyIndex).toBeVisible();
  await expect(storyIndex.getByRole("link")).toHaveCount(6);

  const decisionRoom = page.locator("#choose-route");
  const routes = decisionRoom.locator('details[name="property-decision-route"]');
  await expect(routes).toHaveCount(3);
  await expect(routes.nth(0)).toHaveAttribute("open", "");

  const landownerSummary = routes.nth(1).locator("summary");
  await landownerSummary.focus();
  await page.keyboard.press("Enter");
  await expect(routes.nth(1)).toHaveAttribute("open", "");
  await expect(routes.nth(0)).not.toHaveAttribute("open", "");
  await expect(routes.nth(1).getByRole("link", { name: "Explore the landowner route" })).toBeVisible();

  const ledger = page.locator('section[aria-labelledby="evidence-ledger-title"]');
  const ledgerRows = ledger.locator("details");
  await expect(ledgerRows).toHaveCount(3);
  const confirmSummary = ledgerRows.nth(1).locator("summary");
  await confirmSummary.focus();
  await page.keyboard.press("Enter");
  await expect(ledgerRows.nth(1)).toHaveAttribute("open", "");
  await expect(ledgerRows.nth(1)).toContainText("Ownership, plans, specifications, and approvals");

  const office = page.locator("#visit-office");
  await expect(office.getByText("2nd Floor, Pouro Market")).toBeVisible();
  await expect(office.getByRole("link", { name: /Call \+880 1735-877654/ })).toHaveAttribute("href", "tel:+8801735877654");
  await expect(office.getByRole("link", { name: "Choose your contact channel" })).toHaveAttribute("href", "/contact");
});

test("kinetic rail animates only while visible and respects its keyboard control", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

  const rail = page.locator('[data-kinetic-rail="true"]');
  await expect(rail).toHaveAttribute("data-enhanced", "true");

  await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
  await expect(rail).toHaveAttribute("data-running", "false");

  await rail.scrollIntoViewIfNeeded();
  await expect(rail).toHaveAttribute("data-running", "true");

  const pauseButton = rail.locator("button");
  await expect(pauseButton).toHaveAccessibleName("Pause moving text");
  await pauseButton.focus();
  await page.keyboard.press("Enter");
  await expect(pauseButton).toHaveAttribute("aria-pressed", "true");
  await expect(pauseButton).toHaveAccessibleName("Resume moving text");
  await expect(rail).toHaveAttribute("data-running", "false");

  await page.keyboard.press("Enter");
  await expect(pauseButton).toHaveAttribute("aria-pressed", "false");
  await expect(pauseButton).toHaveAccessibleName("Pause moving text");
  await expect(rail).toHaveAttribute("data-running", "true");

  await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
  await expect(rail).toHaveAttribute("data-running", "false");
});

test("kinetic rail is readable, static, and control-safe without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  try {
    await page.goto("/", { waitUntil: "networkidle" });
    const rail = page.locator('[data-kinetic-rail="true"]');
    await expect(rail).toHaveAttribute("data-enhanced", "false");
    await expect(rail).toHaveAttribute("data-running", "false");
    await expect(rail).toContainText("Buy with evidence");
    await expect(rail.getByRole("button", { name: "Pause moving text", includeHidden: true })).toBeHidden();
    await expect(rail.locator('[aria-hidden="true"] > div')).toHaveCSS("animation-play-state", "paused");

    const routes = page.locator('#choose-route details[name="property-decision-route"]');
    await expect(routes).toHaveCount(3);
    await expect(routes.nth(0)).toHaveAttribute("open", "");
    await routes.nth(2).locator("summary").click();
    await expect(routes.nth(2)).toHaveAttribute("open", "");
    await expect(page.locator("#visit-office")).toContainText("Purbo Bazar, Joypurhat");
  } finally {
    await context.close();
  }
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

test("property planner validates locally and prepares a reviewable summary", async ({ page }) => {
  await page.goto("/property-planner");
  await page.getByRole("button", { name: "Prepare summary" }).click();
  await expect(page.getByText("Choose the conversation you want to prepare.")).toBeVisible();

  await page.getByLabel("Conversation to prepare").selectOption("buyer");
  await page.getByLabel("Closest intended use").selectOption("home");
  await page.getByLabel("Location context").fill("Joypurhat town");
  await page.getByLabel("Decision timeline").selectOption("within-six-months");
  await page.getByLabel("Budget readiness").selectOption("under-review");
  await page.getByLabel("Documents and verification").check();
  await page.getByLabel("Whole cost and responsibilities").check();
  await page.getByRole("button", { name: "Prepare summary" }).click();

  await expect(page.getByRole("status")).toContainText("summary is ready");
  await expect(page.getByLabel("Prepared enquiry summary")).toContainText("Joypurhat town");
  await page.getByRole("button", { name: "Prepare another" }).click();
  await expect(page.getByRole("button", { name: "Prepare summary" })).toBeVisible();
});

test("brand kit download returns the packaged ZIP with enforced headers", async ({ request }) => {
  const response = await request.get("/brand/abdullah-properties-brand-kit.zip");
  const body = await response.body();

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/zip");
  expect(response.headers()["content-disposition"]).toBe('attachment; filename="abdullah-properties-brand-kit.zip"');
  expect(response.headers()["cache-control"]).toBe("public, max-age=86400, stale-while-revalidate=604800");
  expect(body.subarray(0, 2).toString("ascii")).toBe("PK");
});

for (const route of [
  "/", "/properties", "/properties/joypurhat-residence", "/projects/nirapad-nibas", "/services/residential-development",
  "/about", "/contact", "/faq", "/buyers", "/landowners", "/process", "/area-guides",
  "/area-guides/joypurhat-property-decisions", "/insights/evaluate-land-with-clarity",
  "/solutions", "/joint-venture", "/quality", "/client-care", "/resources", "/property-planner",
] as const) {
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

test("new creative journeys remain mobile-safe at the narrow supported viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  for (const route of ["/", "/buyers", "/landowners", "/process", "/solutions", "/joint-venture", "/property-planner", "/area-guides/purbo-bazar-office-visit", "/services/land-documentation-support"] as const) {
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow, `${route} should not overflow at 320px`).toBe(false);
  }
});

test("Bengali public routes remain readable at the 320px supported viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });

  for (const route of ["/bn", "/bn/about", "/bn/services", "/bn/properties", "/bn/contact"] as const) {
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", "bn-BD");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "নেভিগেশন খুলুন" })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow, `${route} should not overflow at 320px`).toBe(false);
  }
});

test("cinematic story and legal footer remain readable without mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/", { waitUntil: "networkidle" });

  const storyStage = page.getByLabel("Active process chapter");
  await storyStage.scrollIntoViewIfNeeded();
  const stagePosition = await storyStage.evaluate((element) => getComputedStyle(element).position);
  expect(stagePosition).toBe("relative");

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();
  const signature = footer.locator("[data-footer-ghost-marquee]");
  await expect(signature).toBeVisible();

  const legal = footer.locator(".site-footer__legal");
  await expect(legal).toBeVisible();
  await expect(legal).toContainText(/© \d{4} Abdullah Properties/);
  const legalLinks = legal.getByRole("link");
  await expect(legalLinks).toHaveCount(4);
  expect(
    await legalLinks.evaluateAll((links) =>
      links.every((link) => {
        const style = getComputedStyle(link);
        return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && link.getClientRects().length > 0;
      }),
    ),
  ).toBe(true);

  const hasPageOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasPageOverflow).toBe(false);
});

test("the CMS is noindexed and fails closed without configured allowlists", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "oai-authenticated-user-email": "unapproved@example.com" });
  const response = await page.goto("/studio", { waitUntil: "networkidle" });

  expect(response?.status()).toBe(200);
  expect(response?.headers()["cache-control"]).toBe("private, no-store");
  expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow, noarchive");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/allowlists are not configured|not an approved editor or owner/i);
  await expect(page.getByRole("link", { name: "New entry" })).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
});

for (const route of ["/office", "/office/settings", "/office/payroll", "/office/desktop-inbox"] as const) {
  test(`${route} redirects anonymous visitors back to the requested private route`, async ({ request }) => {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toContain(
      `/signin-with-chatgpt?return_to=${encodeURIComponent(route)}`,
    );
    expect(response.headers()["cache-control"]).toBe("private, no-store");
    expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow, noarchive");
  });
}

test("Office return paths are derived from the request instead of a client-supplied header", async ({ request }) => {
  const returnTo = "/office/payroll?view=pending";
  const response = await request.get(returnTo, {
    headers: { "x-abdullah-office-return-to": "https://attacker.example/collect" },
    maxRedirects: 0,
  });

  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toContain(
    `/signin-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`,
  );
  expect(response.headers()["location"]).not.toContain("attacker.example");
});

test("public tracking fails privately without exposing record details", async ({ page }) => {
  const response = await page.goto("/track/not-a-valid-tracking-code", { waitUntil: "networkidle" });

  expect(response?.status()).toBe(200);
  expect(response?.headers()["cache-control"]).toBe("private, no-store");
  expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow, noarchive");
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Check the printed code");
  await expect(page.getByText("Recipient", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Amount", { exact: true })).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(/\b(?:invoice|receipt|notice)[-_ ]?\d{3,}\b/i);
});

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

test("reduced motion keeps the cinematic hero, story, and footer signature static", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });

  const signature = page.locator("[data-footer-ghost-marquee]");
  await expect(signature).toHaveAttribute("data-running", "false");
  await expect(signature.getByRole("button", { name: "Pause footer brand animation", includeHidden: true })).toBeHidden();

  const kineticRail = page.locator('[data-kinetic-rail="true"]');
  await expect(kineticRail).toHaveAttribute("data-running", "false");
  await expect(kineticRail.getByRole("button", { name: "Pause moving text", includeHidden: true })).toBeHidden();

  const animationCounts = await page.evaluate(() => {
    const regions = [
      document.querySelector<HTMLElement>('section[aria-labelledby="home-hero-title"]'),
      document.querySelector<HTMLElement>('[data-kinetic-rail="true"]'),
      document.querySelector<HTMLElement>('section[aria-labelledby="decision-story-heading"]'),
      document.querySelector<HTMLElement>("[data-footer-ghost-marquee]"),
    ];

    return regions.map((region) => {
      if (!region) return -1;
      return region
        .getAnimations({ subtree: true })
        .filter((animation) => {
          const duration = animation.effect?.getComputedTiming().duration;
          return typeof duration === "number" && duration > 1;
        }).length;
    });
  });

  expect(animationCounts).toEqual([0, 0, 0, 0]);
});
