import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);
const siteUrl = "https://abdullah-properties-joypurhat.delowarhossain-dev.chatgpt.site";
const brandKitPublicPath = "/brand/abdullah-properties-brand-kit.zip";
const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const workerPromise = import(workerUrl.href).then(({ default: worker }) => worker);

async function render(pathname = "/", assetFetch = async () => new Response("Not found", { status: 404 }), options = {}) {
  const worker = await workerPromise;
  const requestHeaders = new Headers({ accept: "text/html", ...(options.headers ?? {}) });

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: requestHeaders,
    }),
    {
      ASSETS: {
        fetch: assetFetch,
      },
      ...(options.bindings ?? {}),
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

function extractJsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
}

function collectObjectKeys(value, keys = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectObjectKeys(item, keys);
    return keys;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      keys.push(key);
      collectObjectKeys(item, keys);
    }
  }
  return keys;
}

function containsRobotsNoIndex(html) {
  return /<meta[^>]+(?:name="robots"[^>]+content="[^"]*noindex|content="[^"]*noindex[^"]*"[^>]+name="robots")/i.test(html);
}

function readPngHeader(buffer) {
  assert.equal(buffer.subarray(1, 4).toString("ascii"), "PNG");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25],
  };
}

function readJpegSize(buffer) {
  assert.equal(buffer[0], 0xff);
  assert.equal(buffer[1], 0xd8);
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = buffer.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += length;
  }

  throw new Error("JPEG dimensions were not found");
}

function assertPublicHead(html, path) {
  const canonical = `${siteUrl}${path === "/" ? "/" : path}`;
  assert.match(html, /<html lang="en-BD">/);
  assert.match(html, /<meta name="description" content="[^"]+"\/>/);
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}"/>`), `${path} should expose its absolute canonical URL`);
  assert.match(html, new RegExp(`<meta property="og:image" content="${siteUrl.replaceAll(".", "\\.")}\/og\/[^\"]+\.jpg"\/>`));
  assert.match(html, new RegExp(`<meta name="twitter:image" content="${siteUrl.replaceAll(".", "\\.")}\/og\/[^\"]+\.jpg"\/>`));
  assert.doesNotMatch(html, /rel="canonical" href="[^"]*localhost/i);
  assert.doesNotMatch(html, /<meta name="robots" content="noindex/i);
}

test("server-renders every public route with unique SEO metadata", async () => {
  const cases = [
    ["/", /Property decisions carry real weight/],
    ["/properties", /Find the fit, not just the listing/],
    ["/projects", /Nirapad Nibas/],
    ["/projects/nirapad-nibas", /Name and locality are consistent/],
    ["/services", /Six services around one clear housing journey/],
    ["/services/residential-development", /Good scope begins with better questions/],
    ["/services/joint-venture-housing", /Joint-venture housing/],
    ["/services/land-documentation-support", /Land &amp; documentation support|Land & documentation support/],
    ["/services/project-consultation", /Project consultation/],
    ["/services/design-project-planning", /Design &amp; project planning|Design & project planning/],
    ["/services/handover-after-sales", /Handover &amp; after-sales|Handover & after-sales/],
    ["/buyers", /Make the property earn your confidence/],
    ["/landowners", /Build the agreement before the building/],
    ["/process", /One visible route through a complex decision/],
    ["/solutions", /One property system\. Four useful starting points\./],
    ["/joint-venture", /Build the agreement before the building\./],
    ["/quality", /Quality should leave a decision trail\./],
    ["/client-care", /The relationship continues after the keys\./],
    ["/resources", /Bring better questions to the property decision\./],
    ["/property-planner", /Prepare the questions before the enquiry\./],
    ["/area-guides", /Read the place before the property/],
    ["/area-guides/joypurhat-property-decisions", /A practical lens for property decisions in Joypurhat/],
    ["/about", /Responsibility without placeholder people/],
    ["/insights", /Think clearly before the property carries weight/],
    ["/insights/evaluate-land-with-clarity", /How to evaluate land with more clarity/],
    ["/contact", /Talk to the Joypurhat office/],
    ["/faq", /Clarity before commitment/],
    ["/brand-kit", /One brand, used with care/],
    ["/privacy", /Privacy Policy/],
    ["/terms", /Website Terms &amp; Conditions|Website Terms & Conditions/],
    ["/cookies", /Cookie Policy/],
    ["/property-disclaimer", /Property Information Disclaimer/],
    ["/accessibility", /Accessibility Statement/],
  ];
  const titles = new Set();

  for (const [pathname, expected] of cases) {
    const response = await render(pathname);
    assert.equal(response.status, 200, `${pathname} should render successfully`);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    const html = await response.text();
    assert.match(html, expected);
    assert.match(html, /<h1[\s>]/);
    assertPublicHead(html, pathname);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title, `${pathname} should have a title`);
    assert.ok(!titles.has(title), `${pathname} should have a unique title`);
    titles.add(title);
    assert.doesNotMatch(html, /opacity:\s*0/);
  }
});

test("renders verified company data, responsible leadership boundaries, and direct contact channels", async () => {
  const [home, about, services, contact, project] = await Promise.all([
    render("/").then((response) => response.text()),
    render("/about").then((response) => response.text()),
    render("/services").then((response) => response.text()),
    render("/contact").then((response) => response.text()),
    render("/projects/nirapad-nibas").then((response) => response.text()),
  ]);
  const combined = `${home}\n${about}\n${services}\n${contact}\n${project}`;

  assert.match(combined, /2nd Floor, Pouro Market/);
  assert.match(combined, /Purbo Bazar, Joypurhat/);
  assert.match(combined, /\+880 1735-877654/);
  assert.match(combined, /abdullahproperties\.24@gmail\.com/);
  assert.match(combined, /Saturday(?:–|&ndash;)Thursday/);
  assert.match(services, /Residential development/);
  assert.match(services, /Joint-venture housing/);
  assert.match(services, /Land &amp; documentation support|Land & documentation support/);
  assert.match(services, /Inspection &amp; handover|Inspection & handover/);
  assert.match(about, /Identity and portrait will appear only after owner-supplied evidence is approved/);
  assert.doesNotMatch(about, /Approved name pending|Representative company image|Md\. Co-Founder Name/);
  assert.match(project, /Dhanmondi, Joypurhat/);
  assert.match(contact, /mailto:abdullahproperties\.24@gmail\.com/);
  assert.match(contact, /https:\/\/wa\.me\/8801735877654/);

  assert.doesNotMatch(combined, /Md\. Co-Founder Name|4\.9(?!\d)|52 reviews|15\+ years|25% guaranteed/i);
  assert.doesNotMatch(combined, /Joypurhat(?:'|&apos;|&#x27;)?s #1|#1 real estate/i);
});

test("server-renders the cinematic decision story and accessible footer signature", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /<h1[^>]*id="home-hero-title"[^>]*>/);
  assert.match(html, /Property decisions, made clear\./);
  assert.match(html, /id="decision-story-heading"/);
  assert.match(html, /data-kinetic-rail="true"/);
  assert.match(html, /data-enhanced="false"[^>]*data-kinetic-rail="true"[^>]*data-running="false"/);
  assert.match(html, /aria-label="Pause moving text"/);
  assert.match(html, /aria-label="Homepage story chapters"/);
  for (const sectionId of ["story-start", "choose-route", "operating-system", "decision-process", "selected-work", "visit-office"]) {
    assert.ok(html.includes(`href="#${sectionId}"`), `the chapter index should link to ${sectionId}`);
    assert.ok(html.includes(`id="${sectionId}"`), `the homepage should expose the ${sectionId} chapter target`);
  }

  assert.match(html, /name="property-decision-route"/);
  assert.match(html, /Compare the whole decision(?:—|&mdash;)not only the property/);
  assert.match(html, /Make the partnership reviewable before it becomes a project/);
  assert.match(html, /Connect the brief, evidence, delivery, and handover/);
  assert.match(html, /Nirapad Nibas \/ Evidence ledger/);
  assert.match(html, /What still needs direct evidence/);
  assert.match(html, /Come with a question\. Leave with a named action\./);
  assert.match(html, /2nd Floor, Pouro Market/);
  assert.match(html, /Saturday(?:–|&ndash;)Thursday, 10:00 AM(?:–|&ndash;)8:00 PM/);

  const chapterTitles = [
    "Start with the outcome, not the brochure.",
    "See the site as a living system.",
    "Separate what is known from what needs proof.",
    "Put scope, responsibility, and change in writing.",
    "Keep the record connected through handover.",
  ];

  for (const title of chapterTitles) {
    assert.ok(html.includes(title), `the server response should include the chapter: ${title}`);
  }
  assert.equal(
    (html.match(/aria-label="Go to chapter \d{2}:/g) ?? []).length,
    chapterTitles.length,
    "each story chapter should have a directly selectable control",
  );
  for (const chapterId of ["01", "02", "03", "04", "05"]) {
    assert.ok(
      html.includes(`href="#decision-story-chapter-${chapterId}"`),
      `chapter ${chapterId} should retain native no-JavaScript navigation`,
    );
  }

  assert.match(html, /aria-label="Abdullah Properties home"/);
  assert.match(html, /data-footer-ghost-marquee="true"/);
  assert.match(html, /data-enhanced="false"/);
  assert.match(html, /<div[^>]*aria-hidden="true"[^>]*>/);
  assert.match(html, /aria-label="Pause footer brand animation"/);
  const decorativeMarks = [...html.matchAll(/<img[^>]*src="\/brand\/logo-mark-inverse\.png"[^>]*>/g)].map(
    (match) => match[0],
  );
  assert.equal(decorativeMarks.length, 2, "the seamless footer loop should contain exactly two mark/name groups");
  for (const mark of decorativeMarks) assert.match(mark, /alt=""/);

  const transparentMark = readPngHeader(await readFile(new URL("../public/brand/logo-mark-inverse.png", import.meta.url)));
  assert.equal(transparentMark.colorType, 6, "the repeated footer mark should retain its alpha channel");
});

test("emits parseable, visible, and non-misleading structured data", async () => {
  const [homeHtml, servicesHtml, faqHtml, articleHtml, areaGuideHtml] = await Promise.all([
    render("/").then((response) => response.text()),
    render("/services").then((response) => response.text()),
    render("/faq").then((response) => response.text()),
    render("/insights/evaluate-land-with-clarity").then((response) => response.text()),
    render("/area-guides/joypurhat-property-decisions").then((response) => response.text()),
  ]);

  const homeData = extractJsonLd(homeHtml);
  const graph = homeData.find((entry) => Array.isArray(entry["@graph"]))?.["@graph"];
  assert.ok(graph?.some((entry) => entry["@type"] === "RealEstateAgent"));
  assert.ok(graph?.some((entry) => entry["@type"] === "WebSite"));

  const serviceData = extractJsonLd(servicesHtml);
  assert.ok(serviceData.some((entry) => entry["@type"] === "ItemList"));
  const faqData = extractJsonLd(faqHtml).find((entry) => entry["@type"] === "FAQPage");
  assert.equal(faqData?.mainEntity?.length, 5);
  for (const question of faqData.mainEntity) assert.ok(faqHtml.includes(question.name));
  const articleData = extractJsonLd(articleHtml);
  assert.ok(articleData.some((entry) => entry["@type"] === "Article"));
  const areaGuideData = extractJsonLd(areaGuideHtml);
  const areaGuideArticle = areaGuideData.find((entry) => entry["@type"] === "Article");
  assert.equal(areaGuideArticle?.image, `${siteUrl}/og/properties.jpg`);
  assert.equal(areaGuideArticle?.author?.url, `${siteUrl}/about`);
  assert.equal(areaGuideArticle?.publisher?.["@id"], `${siteUrl}/#organization`);

  const allData = [...homeData, ...serviceData, ...extractJsonLd(faqHtml), ...articleData, ...areaGuideData];
  const allStructuredData = JSON.stringify(allData);
  const keys = collectObjectKeys(allData);
  for (const forbiddenKey of ["aggregateRating", "sameAs", "geo", "latitude", "longitude"]) {
    assert.ok(!keys.includes(forbiddenKey), `structured data should not include ${forbiddenKey}`);
  }
  assert.doesNotMatch(allStructuredData, /Md\. Co-Founder Name|52 reviews|15\+ years/i);
});

test("publishes crawl controls, sitemap, manifest, and branded discovery assets", async () => {
  const [robotsResponse, sitemapResponse, manifestResponse, homeResponse] = await Promise.all([
    render("/robots.txt"),
    render("/sitemap.xml"),
    render("/manifest.webmanifest"),
    render("/"),
  ]);

  assert.equal(robotsResponse.status, 200);
  const robots = await robotsResponse.text();
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow: \/$/m);
  assert.match(robots, /^Disallow: \/studio$/m);
  assert.match(robots, /^Disallow: \/office$/m);
  assert.match(robots, new RegExp(`Sitemap: ${siteUrl.replaceAll(".", "\\.")}\/sitemap\\.xml`));

  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  for (const path of ["/about", "/services", "/services/residential-development", "/buyers", "/landowners", "/process", "/solutions", "/joint-venture", "/quality", "/client-care", "/resources", "/property-planner", "/area-guides/joypurhat-property-decisions", "/projects/nirapad-nibas", "/faq", "/brand-kit", "/privacy"]) {
    assert.ok(sitemap.includes(`${siteUrl}${path}`), `sitemap should include ${path}`);
  }
  assert.doesNotMatch(sitemap, /<loc>[^<]*\?|properties\/joypurhat-residence/);
  assert.match(
    sitemap,
    new RegExp(`<loc>${siteUrl.replaceAll(".", "\\.")}\/</loc>[\\s\\S]*?<lastmod>2026-07-13T18:00:00\\.000Z</lastmod>`),
  );
  assert.match(sitemap, new RegExp(`hreflang="en-BD" href="${siteUrl.replaceAll(".", "\\.")}\/"`));
  assert.match(sitemap, new RegExp(`hreflang="bn-BD" href="${siteUrl.replaceAll(".", "\\.")}\/bn"`));

  assert.equal(manifestResponse.status, 200);
  const manifest = JSON.parse(await manifestResponse.text());
  assert.equal(manifest.name, "Abdullah Properties");
  assert.equal(manifest.icons.length, 2);
  assert.ok(manifest.icons.every((icon) => icon.purpose === "any"));
  assert.equal("orientation" in manifest, false);

  const home = await homeResponse.text();
  assert.match(home, new RegExp(`href="${siteUrl.replaceAll(".", "\\.")}\/manifest\\.webmanifest"`));
  assert.match(home, new RegExp(`href="${siteUrl.replaceAll(".", "\\.")}\/favicon\\.ico`));
  assert.match(home, new RegExp(`href="${siteUrl.replaceAll(".", "\\.")}\/apple-icon\\.png"`));
});

test("keeps the CMS authenticated, allowlisted, durable, noindexed, and fail-closed", async () => {
  const anonymous = await render("/studio");
  assert.equal(anonymous.status, 307);
  assert.match(anonymous.headers.get("location") ?? "", /\/signin-with-chatgpt\?return_to=/);
  assert.equal(anonymous.headers.get("cache-control"), "private, no-store");
  assert.equal(anonymous.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");

  const denied = await render("/studio", undefined, {
    headers: { "oai-authenticated-user-email": "unapproved@example.com" },
    bindings: { CMS_ALLOWED_EMAILS: "owner@example.com" },
  });
  assert.equal(denied.status, 200);
  const deniedHtml = await denied.text();
  assert.match(deniedHtml, /not an approved editor|allowlists? are not configured|Loading protected content/);
  assert.doesNotMatch(deniedHtml, /Create a blank draft|Import curated content|Structured entries/);
  assert.doesNotMatch(deniedHtml, /class="site-header"/);
  assert.doesNotMatch(deniedHtml, /class="site-footer"/);
  assert.doesNotMatch(deniedHtml, /Skip to content/);
  assert.doesNotMatch(deniedHtml, /RealEstateAgent/);
  assert.ok(containsRobotsNoIndex(deniedHtml));

  const [hosting, migration, schema, authSource, actionSource, workflowSource, publicContentSource, robotsResponse] = await Promise.all([
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0000_many_living_tribunal.sql", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../features/cms/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../features/cms/actions.ts", import.meta.url), "utf8"),
    readFile(new URL("../features/cms/workflow.ts", import.meta.url), "utf8"),
    readFile(new URL("../features/cms/public-content.ts", import.meta.url), "utf8"),
    render("/robots.txt").then((response) => response.text()),
  ]);
  assert.equal(JSON.parse(hosting).d1, "DB");
  assert.match(migration, /CREATE TABLE `content_entries`/);
  assert.match(migration, /CREATE TABLE `content_revisions`/);
  assert.match(migration, /CREATE TABLE `audit_events`/);
  assert.match(migration, /content_entries_type_slug_unique/);
  assert.match(migration, /content_revisions_entry_version_unique/);
  assert.match(schema, /verification/);
  assert.match(schema, /version/);
  assert.match(authSource, /CMS_OWNER_EMAILS/);
  assert.match(actionSource, /validateCmsSubmission\(actor\.role/);
  assert.match(actionSource, /validateCmsTransition\(actor\.role/);
  assert.match(workflowSource, /verification === "owner_approved" && role !== "owner"/);
  assert.match(workflowSource, /current === "published" && role !== "owner"/);
  assert.match(publicContentSource, /listPublicFaqs/);
  assert.match(publicContentSource, /listPublicAnnouncements/);
  assert.match(publicContentSource, /removeManagedFallback/);
  assert.match(robotsResponse, /^Disallow: \/studio$/m);
  assert.match(robotsResponse, /^Disallow: \/office$/m);
});

test("keeps Office OS authenticated, private, noindexed, and separate from the public shell", async () => {
  const anonymous = await render("/office");
  assert.equal(anonymous.status, 307);
  assert.match(anonymous.headers.get("location") ?? "", /\/signin-with-chatgpt\?return_to=/);
  assert.equal(anonymous.headers.get("cache-control"), "private, no-store");
  assert.equal(anonymous.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");

  const previousOwnerEmails = process.env.CMS_OWNER_EMAILS;
  process.env.CMS_OWNER_EMAILS = "owner@example.com";
  let ownerWithoutDatabase;
  try {
    ownerWithoutDatabase = await render("/office", undefined, {
      headers: {
        "oai-authenticated-user-email": "owner@example.com",
        "oai-authenticated-user-full-name": "Office%20Owner",
        "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
      },
    });
  } finally {
    if (previousOwnerEmails === undefined) delete process.env.CMS_OWNER_EMAILS;
    else process.env.CMS_OWNER_EMAILS = previousOwnerEmails;
  }
  assert.equal(ownerWithoutDatabase.status, 200);
  assert.equal(ownerWithoutDatabase.headers.get("cache-control"), "private, no-store");
  const html = await ownerWithoutDatabase.text();
  assert.match(html, /office database is not ready/i);
  assert.match(html, /Office OS \/ Joypurhat/);
  assert.ok(containsRobotsNoIndex(html));
  assert.doesNotMatch(html, /class="site-header"/);
  assert.doesNotMatch(html, /class="site-footer"/);
  assert.doesNotMatch(html, /RealEstateAgent/);
});

test("keeps filters and illustrative detail pages out of the index and noindexes 404 responses", async () => {
  const cases = [
    ["/properties?q=joypurhat", 200],
    ["/properties/joypurhat-residence", 200],
    ["/properties/not-a-real-study", 404],
    ["/not-a-real-route", 404],
  ];

  for (const [pathname, status] of cases) {
    const response = await render(pathname);
    assert.equal(response.status, status);
    const html = await response.text();
    assert.ok(containsRobotsNoIndex(html), `${pathname} should contain a noindex robots directive`);
    if (status === 404) assert.match(html, /This address is not in the site plan/);
  }
});

test("preserves important legacy paths with permanent focused redirects", async () => {
  const redirects = [
    ["/work", "/projects"],
    ["/blog", "/insights"],
    ["/nirapad-nibas", "/projects/nirapad-nibas"],
    ["/inquiry", "/contact"],
    ["/privacy-policy", "/privacy"],
    ["/terms-and-conditions", "/terms"],
    ["/cookie-policy", "/cookies"],
    ["/disclaimer", "/property-disclaimer"],
    ["/brand", "/brand-kit"],
  ];

  for (const [source, destination] of redirects) {
    const response = await render(source);
    assert.equal(response.status, 308, `${source} should permanently redirect`);
    assert.equal(response.headers.get("location"), destination);
  }
});

test("ships transparent logos, correct icon sizes, social previews, and a complete brand bundle", async () => {
  const transparentPngs = [
    ["../public/brand/logo-primary.png", 942, 316],
    ["../public/brand/logo-dark.png", 944, 317],
    ["../public/brand/logo-mark.png", 330, 308],
    ["../public/brand/logo-mark-inverse.png", 332, 309],
    ["../app/icon.png", 512, 512],
    ["../app/apple-icon.png", 180, 180],
  ];

  for (const [relativePath, width, height] of transparentPngs) {
    const header = readPngHeader(await readFile(new URL(relativePath, import.meta.url)));
    assert.deepEqual({ width: header.width, height: header.height }, { width, height });
    assert.equal(header.colorType, 6, `${relativePath} should be an RGBA PNG`);
  }

  for (const name of ["home", "about", "services", "projects", "properties", "insights", "contact", "brand-kit", "faq"]) {
    const size = readJpegSize(await readFile(new URL(`../public/og/${name}.jpg`, import.meta.url)));
    assert.deepEqual(size, { width: 1200, height: 630 });
  }

  const zip = await readFile(new URL("../public/downloads/abdullah-properties-brand-kit-v1.zip", import.meta.url));
  assert.equal(zip.subarray(0, 2).toString("ascii"), "PK");
  await access(new URL("../public/fonts/anybody-latin.woff2", import.meta.url));
  await access(new URL("../public/fonts/work-sans-latin.woff2", import.meta.url));
  await access(new URL("../public/fonts/OFL-Anybody.txt", import.meta.url));
  await access(new URL("../public/fonts/OFL-Work-Sans.txt", import.meta.url));
  const tokens = JSON.parse(await readFile(new URL("../public/brand/brand-tokens.json", import.meta.url), "utf8"));
  assert.equal(tokens.colors.housingOrange, "#FF6B2C");
  await access(new URL("app/favicon.ico", templateRoot));
  const faviconSvg = await readFile(new URL("public/favicon.svg", templateRoot), "utf8");
  assert.match(faviconSvg, /fill="#0c0c0c"/);
  assert.match(faviconSvg, /fill="#ff6b2c"/);

  const brandKitPage = await render("/brand-kit").then((response) => response.text());
  assert.ok(brandKitPage.includes(`${siteUrl}/og/home.jpg`), "brand-kit shares should use a verified Abdullah Properties social card");
  assert.ok(!brandKitPage.includes(`${siteUrl}/og/brand-kit.jpg`), "the legacy-labelled brand card must not be published in metadata");
});

test("keeps the starter preview, local paths, and production security regressions out", async () => {
  const [response, page, layout, packageJson, architecture, workerSource] = await Promise.all([
    render("/"),
    readFile(new URL("../app/(public)/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../docs/ARCHITECTURE.md", import.meta.url), "utf8"),
    readFile(new URL("../dist/server/index.js", import.meta.url), "utf8"),
  ]);
  const html = await response.text();

  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\)/);
  assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000");
  assert.doesNotMatch(page, /_sites-preview|SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|WRANGLER_LOG_PATH=/);
  assert.doesNotMatch(`${html}\n${workerSource}`, /[A-Za-z]:[\\/](?:Users|ProgramData|Windows|Program Files)|\\\\Users\\|\.vinext[\\/]fonts|mdhos/i);
  assert.equal(
    `${html}\n${workerSource}`.replaceAll("\\", "/").toLowerCase().includes(process.cwd().replaceAll("\\", "/").toLowerCase()),
    false,
    "rendered output should not expose the absolute build workspace",
  );
  assert.match(packageJson, /"next": "\^16\.2\.10"/);
  assert.match(packageJson, /"react": "\^19\.2\.7"/);
  assert.match(architecture, /Modular monolith/);
  await assert.rejects(access(new URL("app/_sites-preview", templateRoot)));
});

test("disables the unused image transformation surface with a strict response policy", async () => {
  const response = await render("/_vinext/image?url=%2Fproperties%2Fjoypurhat-residence.jpg&w=640&q=75");
  const contentSecurityPolicy = response.headers.get("content-security-policy") ?? "";

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(contentSecurityPolicy, /default-src 'none'/);
  assert.match(contentSecurityPolicy, /sandbox/);
  assert.doesNotMatch(contentSecurityPolicy, /unsafe-inline/);
});

test("serves the public brand bundle through a hardened download boundary", async () => {
  const zipFixture = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
  const response = await render(brandKitPublicPath, async (request) => {
    assert.equal(new URL(request.url).pathname, "/downloads/abdullah-properties-brand-kit-v1.zip");
    return new Response(zipFixture, { status: 200, headers: { "Content-Type": "application/zip" } });
  });
  const contentSecurityPolicy = response.headers.get("content-security-policy") ?? "";

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-disposition"), 'attachment; filename="abdullah-properties-brand-kit.zip"');
  assert.equal(response.headers.get("cache-control"), "public, max-age=86400, stale-while-revalidate=604800");
  assert.equal(response.headers.get("content-type"), "application/zip");
  assert.match(contentSecurityPolicy, /default-src 'none'/);
  assert.doesNotMatch(contentSecurityPolicy, /unsafe-inline/);
  assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 2).toString("ascii"), "PK");
});

test("packages hosting metadata, deployable assets, and security disclosure", async () => {
  const [sourceHosting, stagedHosting, securityDisclosure] = await Promise.all([
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../dist/.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../dist/client/.well-known/security.txt", import.meta.url), "utf8"),
  ]);

  assert.deepEqual(JSON.parse(stagedHosting), JSON.parse(sourceHosting));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/client/assets", import.meta.url));
  await access(new URL("../dist/client/downloads/abdullah-properties-brand-kit-v1.zip", import.meta.url));
  await access(new URL("../dist/.openai/drizzle/meta/_journal.json", import.meta.url));
  assert.match(securityDisclosure, /Contact: mailto:abdullahproperties\.24@gmail\.com/);
  assert.match(securityDisclosure, /Preferred-Languages: en, bn/);
});
