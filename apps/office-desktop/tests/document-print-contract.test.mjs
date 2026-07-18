import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL("../src/components/BrandedDocument.tsx", import.meta.url);
const appUrl = new URL("../src/App.tsx", import.meta.url);
const stylesheetUrl = new URL("../src/App.css", import.meta.url);
const vectorMarkUrl = new URL("../public/brand/logo-mark-print.svg", import.meta.url);

test("invoice print sheet renders one customer copy and one office copy", async () => {
  const [source, appSource] = await Promise.all([
    readFile(componentUrl, "utf8"),
    readFile(appUrl, "utf8"),
  ]);

  assert.match(source, /data-invoice-print-sheet="a4-two-up"/);
  assert.match(source, /<InvoiceCopy record=\{record\} copyKind="customer" \/>/);
  assert.match(source, /<InvoiceCopy record=\{record\} copyKind="office" \/>/);
  assert.match(source, /role="separator"/);
  assert.match(source, /Cut here \/ এখানে কাটুন/);
  assert.match(source, /Customer copy \/ গ্রাহক কপি/);
  assert.match(source, /Office copy \/ অফিস কপি/);
  assert.match(appSource, /A4 portrait · customer \+ office half-page copies/);
  assert.match(appSource, /Print 2 copies \/ PDF/);
});

test("each half-page invoice preserves provisional and amount boundaries", async () => {
  const source = await readFile(componentUrl, "utf8");

  assert.match(source, /PROVISIONAL DRAFT · NOT A RECEIPT/);
  assert.match(source, /Server confirmation and official number pending/);
  assert.match(source, /provisionalDocumentNumber\(record\)/);
  assert.match(source, /no additional charge, tax, discount or prior balance is implied/);
  assert.match(source, /does not confirm payment, booking, approval or a binding property transaction/);
  assert.match(source, /Full note retained in the local digital record/);
  assert.match(source, /Name, signature & date/);
});

test("print CSS locks the two invoice copies to one exact A4 portrait sheet", async () => {
  const css = await readFile(stylesheetUrl, "utf8");

  assert.match(css, /@page\s*\{\s*size:\s*A4;\s*margin:\s*0;\s*\}/);
  assert.match(css, /\.invoice-print-sheet\s*\{[\s\S]*?grid-template-rows:\s*148\.5mm 0 148\.5mm;[\s\S]*?width:\s*210mm;[\s\S]*?height:\s*297mm;/);
  assert.match(css, /\.invoice-print-sheet \.invoice-copy\s*\{[\s\S]*?height:\s*148\.5mm;[\s\S]*?min-height:\s*148\.5mm;[\s\S]*?max-height:\s*148\.5mm;/);
  assert.match(css, /print-color-adjust:\s*exact/);
  assert.match(css, /\.invoice-cut-line::before\s*\{[\s\S]*?border-top:\s*1px dashed/);
});

test("invoice copies use the print-safe vector brand mark", async () => {
  const [source, vectorMark] = await Promise.all([
    readFile(componentUrl, "utf8"),
    readFile(vectorMarkUrl, "utf8"),
  ]);

  assert.match(source, /src="\/brand\/logo-mark-print\.svg"/);
  assert.match(vectorMark, /^<svg[\s\S]*viewBox="0 0 64 64"/);
  assert.match(vectorMark, /#041114/);
  assert.match(vectorMark, /#ff6b2c/);
});
