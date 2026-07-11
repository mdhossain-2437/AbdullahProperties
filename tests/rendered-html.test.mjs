import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the branded home experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Abdullah Properties/);
  assert.match(html, /Discover/);
  assert.match(html, /Housing Base Total Solutions/);
  assert.match(html, /Joypurhat-first market focus/);
  assert.match(html, /href="\/properties"/);
  assert.match(html, /href="\/services"/);
  assert.match(html, /href="\/contact"/);
  assert.match(html, /Skip to content/);
  assert.doesNotMatch(html, /opacity:\s*0/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
});

test("renders every primary route and dynamic content route", async () => {
  const cases = [
    ["/properties", /Find the fit/],
    ["/properties/joypurhat-residence", /Joypurhat Residence/],
    ["/projects", /Built work starts/],
    ["/services", /One team around/],
    ["/about", /Local trust/],
    ["/insights", /Think clearly/],
    ["/insights/evaluate-land-with-clarity", /How to evaluate land/],
    ["/contact", /Start with the decision/],
    ["/contact?interest=joypurhat-residence", /value="Joypurhat Residence"/],
  ];

  for (const [pathname, expected] of cases) {
    const response = await render(pathname);
    assert.equal(response.status, 200, `${pathname} should render successfully`);
    assert.match(await response.text(), expected);
  }
});

test("keeps the private preview non-indexable and handles unknown routes", async () => {
  const [robotsResponse, missingResponse] = await Promise.all([
    render("/robots.txt"),
    render("/properties/not-a-real-study"),
  ]);

  assert.equal(robotsResponse.status, 200);
  assert.match(await robotsResponse.text(), /Disallow:\s*\//);
  assert.equal(missingResponse.status, 404);
  assert.match(await missingResponse.text(), /This address is not in the plan/);
});

test("keeps the starter preview removed and production metadata present", async () => {
  const [page, layout, packageJson, architecture] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../docs/ARCHITECTURE.md", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /_sites-preview|SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|WRANGLER_LOG_PATH=/);
  assert.match(layout, /Abdullah Properties/);
  assert.match(architecture, /Modular monolith/);
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
