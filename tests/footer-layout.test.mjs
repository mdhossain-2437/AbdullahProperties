import assert from "node:assert/strict";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("footer-layout-test", `${process.pid}-${Date.now()}`);
const workerPromise = import(workerUrl.href).then(({ default: worker }) => worker);

async function render(pathname) {
  const worker = await workerPromise;
  const response = await worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  return response.text();
}

function assertCategorizedFooter(html, headings) {
  const groups = html.match(/class="site-footer__nav-group"/g) ?? [];
  assert.equal(groups.length, 4, "footer should expose four concise link categories");

  const { locale, ...labels } = headings;
  for (const [key, label] of Object.entries(labels)) {
    const headingId = `footer-${key}-${locale}`;
    assert.match(html, new RegExp(`<h3 id="${headingId}">${label}</h3>`));
    assert.match(html, new RegExp(`<nav aria-labelledby="${headingId}">`));
  }
}

test("English footer groups existing routes into vertical, labelled columns", async () => {
  const html = await render("/");

  assertCategorizedFooter(html, {
    locale: "en",
    explore: "Explore",
    journeys: "Journeys",
    guides: "Guides &amp; insight",
    company: "Company &amp; standards",
  });
  assert.match(html, /class="brand-logo brand-logo--dark site-footer__logo"/);
  assert.match(html, /href="\/properties"/);
  assert.match(html, /href="\/property-planner"/);
  assert.match(html, /href="\/office">Office sign in<\/a>/);
});

test("Bengali footer keeps the same hierarchy with localized public links", async () => {
  const html = await render("/bn");

  assertCategorizedFooter(html, {
    locale: "bn",
    explore: "সম্পত্তি ও সেবা",
    journeys: "সিদ্ধান্তের পথ",
    guides: "সহায়িকা ও ধারণা",
    company: "প্রতিষ্ঠান ও নীতিমালা",
  });
  assert.match(html, /href="\/bn\/properties"/);
  assert.match(html, /href="\/bn\/contact">যোগাযোগ<\/a>/);
  assert.match(html, /href="\/office">কর্মীদের প্রবেশ<\/a>/);
});
