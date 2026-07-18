import assert from "node:assert/strict";
import test from "node:test";

const siteUrl = "https://abdullah-properties-joypurhat.zedamorello0079.chatgpt.site";
const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("bengali-test", `${process.pid}-${Date.now()}`);
const workerPromise = import(workerUrl.href).then(({ default: worker }) => worker);

async function render(pathname) {
  const worker = await workerPromise;
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

for (const [path, phrase] of [
  ["/bn", "আবাসনের সিদ্ধান্ত"],
  ["/bn/services", "ছয়টি সংযুক্ত সেবা"],
  ["/bn/properties", "যাচাইকৃত বিক্রয়তালিকা নয়"],
  ["/bn/contact", "জয়পুরহাট অফিসের সঙ্গে কথা বলুন"],
  ["/bn/privacy", "গোপনীয়তা নীতির বাংলা"],
]) {
  test(`${path} server-renders reviewed Bengali content and locale metadata`, async () => {
    const response = await render(path);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, new RegExp(phrase));
    assert.match(html, /<html[^>]+lang="bn-BD"/);
    assert.match(html, /<main[^>]+data-public-locale="bn-BD"[^>]+lang="bn-BD"/);
    assert.ok(html.includes(`<link rel="canonical" href="${siteUrl}${path}"/>`));
    assert.match(html, /<link rel="alternate" hreflang="en-BD"/i);
    assert.match(html, /<link rel="alternate" hreflang="bn-BD"/i);
    assert.match(html, /<meta property="og:locale" content="bn_BD"\/>/);
    assert.match(html, /এই পাতাটি বাংলায় দেখুন|aria-current="page"[^>]*>বাংলা/);
  });
}

test("an unpublished Bengali route fails closed with a localized 404", async () => {
  const response = await render("/bn/not-published");
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.match(html, /এই পাতাটি এখনো প্রকাশিত হয়নি/);
  assert.match(html, /<meta (?=[^>]*name="robots")(?=[^>]*content="noindex")[^>]*>/);
});
