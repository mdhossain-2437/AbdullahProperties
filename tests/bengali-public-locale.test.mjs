import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  bengaliPathFromSegments,
  bengaliPublicPaths,
  isBengaliPath,
  isPublishedBengaliPath,
  localeFromPathname,
  localizedPublicHref,
  publicLanguageAlternates,
  stripBengaliPrefix,
  toBengaliPath,
  toEnglishPath,
} from "../lib/i18n/public-locale.ts";

test("publishes a deterministic Bengali route map without translating unknown pages", () => {
  assert.ok(bengaliPublicPaths.length >= 18);
  assert.equal(new Set(bengaliPublicPaths).size, bengaliPublicPaths.length);
  assert.equal(toBengaliPath("/services"), "/bn/services");
  assert.equal(toEnglishPath("/bn/services"), "/services");
  assert.equal(toBengaliPath("/services/residential-development"), "/bn");
  assert.equal(isPublishedBengaliPath("/services"), true);
  assert.equal(isPublishedBengaliPath("/services/residential-development"), false);
  assert.deepEqual(bengaliPathFromSegments(["joint-venture"]), "/joint-venture");
  assert.equal(bengaliPathFromSegments(["not-published"]), null);
});

test("detects locale and preserves protected workspace routes", () => {
  assert.equal(isBengaliPath("/bn"), true);
  assert.equal(isBengaliPath("/bn/contact"), true);
  assert.equal(isBengaliPath("/contact"), false);
  assert.equal(localeFromPathname("/bn/contact"), "bn-BD");
  assert.equal(localeFromPathname("/contact"), "en-BD");
  assert.equal(stripBengaliPrefix("/bn/contact/"), "/contact");
  assert.equal(localizedPublicHref("/contact", "bn-BD"), "/bn/contact");
  assert.equal(localizedPublicHref("/office", "bn-BD"), "/office");
});

test("emits self-referencing English and Bengali alternate paths", () => {
  assert.deepEqual(publicLanguageAlternates("/about"), {
    "en-BD": "/about",
    "bn-BD": "/bn/about",
    "x-default": "/about",
  });
  assert.equal(publicLanguageAlternates("/projects/nirapad-nibas"), null);
});

test("keeps Bengali public content curated and independent from runtime translation", async () => {
  const source = await readFile(new URL("../lib/i18n/bengali-public-content.ts", import.meta.url), "utf8");
  const routeSource = await readFile(new URL("../app/(public)/bn/[[...slug]]/page.tsx", import.meta.url), "utf8");
  const proxySource = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");

  assert.match(source, /আবাসনের সিদ্ধান্ত, হোক নিশ্চিন্ত ও স্বচ্ছ/);
  assert.match(source, /প্রতিশ্রুতির আগে প্রমাণ/);
  assert.match(source, /কোনো পরিচয় অনুমান করে দেখানো হয় না/);
  assert.doesNotMatch(source, /googletrans|translateText|machine translation|autoTranslate/i);
  assert.match(routeSource, /generateStaticParams/);
  assert.match(routeSource, /inLanguage: "bn-BD"/);
  assert.match(proxySource, /x-abdullah-public-locale/);
  assert.match(proxySource, /localeFromPathname\(request\.nextUrl\.pathname\)/);
});
