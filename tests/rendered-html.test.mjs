import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);
const siteUrl = "https://abdullah-properties-joypurhat.delowarhossain-dev.chatgpt.site";
const brandKitPublicPath = "/brand/abdullah-properties-brand-kit.zip";
const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const workerPromise = import(workerUrl.href).then(({ default: worker }) => worker);

async function render(pathname = "/", assetFetch = async () => new Response("Not found", { status: 404 })) {
  const worker = await workerPromise;

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: assetFetch,
      },
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
    ["/about", /Leadership details without invented identities/],
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
  assert.match(about, /Approved name pending/);
  assert.match(about, /Representative company image/);
  assert.match(project, /Dhanmondi, Joypurhat/);
  assert.match(contact, /mailto:abdullahproperties\.24@gmail\.com/);
  assert.match(contact, /https:\/\/wa\.me\/8801735877654/);

  assert.doesNotMatch(combined, /Md\. Co-Founder Name|4\.9(?!\d)|52 reviews|15\+ years|25% guaranteed/i);
  assert.doesNotMatch(combined, /Joypurhat(?:'|&apos;|&#x27;)?s #1|#1 real estate/i);
});

test("emits parseable, visible, and non-misleading structured data", async () => {
  const [homeHtml, servicesHtml, faqHtml, articleHtml] = await Promise.all([
    render("/").then((response) => response.text()),
    render("/services").then((response) => response.text()),
    render("/faq").then((response) => response.text()),
    render("/insights/evaluate-land-with-clarity").then((response) => response.text()),
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
  assert.ok(extractJsonLd(articleHtml).some((entry) => entry["@type"] === "Article"));

  const allStructuredData = JSON.stringify([...homeData, ...serviceData, ...extractJsonLd(faqHtml), ...extractJsonLd(articleHtml)]);
  const keys = collectObjectKeys([...homeData, ...serviceData, ...extractJsonLd(faqHtml), ...extractJsonLd(articleHtml)]);
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
  assert.match(robots, new RegExp(`Sitemap: ${siteUrl.replaceAll(".", "\\.")}\/sitemap\\.xml`));

  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  for (const path of ["/about", "/services", "/projects/nirapad-nibas", "/faq", "/brand-kit", "/privacy"]) {
    assert.ok(sitemap.includes(`${siteUrl}${path}`), `sitemap should include ${path}`);
  }
  assert.doesNotMatch(sitemap, /<loc>[^<]*\?|properties\/joypurhat-residence/);

  assert.equal(manifestResponse.status, 200);
  const manifest = JSON.parse(await manifestResponse.text());
  assert.equal(manifest.name, "Abdullah Properties");
  assert.equal(manifest.icons.length, 2);
  assert.ok(manifest.icons.every((icon) => icon.purpose === "any"));

  const home = await homeResponse.text();
  assert.match(home, new RegExp(`href="${siteUrl.replaceAll(".", "\\.")}\/manifest\\.webmanifest"`));
  assert.match(home, new RegExp(`href="${siteUrl.replaceAll(".", "\\.")}\/favicon\\.ico`));
  assert.match(home, new RegExp(`href="${siteUrl.replaceAll(".", "\\.")}\/apple-icon\\.png"`));
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
  await assert.rejects(access(new URL("public/favicon.svg", templateRoot)));
});

test("keeps the starter preview, local paths, and production security regressions out", async () => {
  const [response, page, layout, packageJson, architecture, workerSource] = await Promise.all([
    render("/"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
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
  assert.doesNotMatch(`${html}\n${workerSource}`, /(?:^|[^A-Za-z])[A-Za-z]:[\\/]|\\\\Users\\|\.vinext[\\/]fonts|mdhos/i);
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
