import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { gzipSync } from "node:zlib";

const assetDirectory = new URL("../dist/client/assets/", import.meta.url);

const budgets = {
  // Assets are route-split; no browser downloads the release-wide totals at once.
  // Per-file caps protect route payloads while aggregate caps catch accidental bloat.
  largestCssGzip: 25 * 1024,
  // The public homepage deliberately combines the shared multi-route system with
  // three progressive decision sections. Keep the release-wide split total tight
  // while allowing that verified experience to ship without inflating any file.
  totalCssGzip: 42 * 1024,
  largestJavaScriptGzip: 65 * 1024,
  totalJavaScriptGzip: 260 * 1024,
};

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

test("keeps compiled browser assets inside the release budgets", async () => {
  const entries = await readdir(assetDirectory, { withFileTypes: true });
  const assetNames = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const javascriptNames = assetNames.filter((name) => name.endsWith(".js"));
  const cssNames = assetNames.filter((name) => name.endsWith(".css"));

  assert.ok(javascriptNames.length > 0, "the build should emit browser JavaScript");
  assert.ok(cssNames.length > 0, "the build should emit browser CSS");

  const javascriptSizes = await Promise.all(
    javascriptNames.map(async (name) => ({
      name,
      gzipBytes: gzipSync(await readFile(new URL(name, assetDirectory))).byteLength,
    })),
  );
  const cssSizes = await Promise.all(
    cssNames.map(async (name) => ({
      name,
      gzipBytes: gzipSync(await readFile(new URL(name, assetDirectory))).byteLength,
    })),
  );
  const cssGzipBytes = cssSizes.reduce((total, asset) => total + asset.gzipBytes, 0);
  const totalJavaScriptGzipBytes = javascriptSizes.reduce((total, asset) => total + asset.gzipBytes, 0);
  const largestJavaScript = javascriptSizes.toSorted((left, right) => right.gzipBytes - left.gzipBytes)[0];
  const largestCss = cssSizes.toSorted((left, right) => right.gzipBytes - left.gzipBytes)[0];

  assert.ok(
    totalJavaScriptGzipBytes <= budgets.totalJavaScriptGzip,
    `total JavaScript is ${formatBytes(totalJavaScriptGzipBytes)}; budget is ${formatBytes(budgets.totalJavaScriptGzip)}`,
  );
  assert.ok(
    largestJavaScript.gzipBytes <= budgets.largestJavaScriptGzip,
    `${largestJavaScript.name} is ${formatBytes(largestJavaScript.gzipBytes)} gzip; per-file budget is ${formatBytes(budgets.largestJavaScriptGzip)}`,
  );
  assert.ok(
    cssGzipBytes <= budgets.totalCssGzip,
    `total route-split CSS is ${formatBytes(cssGzipBytes)}; budget is ${formatBytes(budgets.totalCssGzip)}`,
  );
  assert.ok(
    largestCss.gzipBytes <= budgets.largestCssGzip,
    `${largestCss.name} is ${formatBytes(largestCss.gzipBytes)} gzip; per-file CSS budget is ${formatBytes(budgets.largestCssGzip)}`,
  );
});
