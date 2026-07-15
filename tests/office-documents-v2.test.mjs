import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildOfficeDocumentHandoff } from "../features/office/document-handoff.ts";
import {
  createPaymentNotifications,
  DisabledEmailTransport,
  DisabledSmsTransport,
  normalizeBangladeshPhone,
} from "../features/office/notifications.ts";

test("normalizes Bangladesh numbers and creates idempotent payment notification commands", async () => {
  assert.equal(normalizeBangladeshPhone("01735-877654"), "+8801735877654");
  assert.equal(normalizeBangladeshPhone("+880 1955 169930"), "+8801955169930");
  assert.equal(normalizeBangladeshPhone("123"), null);

  const commands = createPaymentNotifications({
    paymentId: "11111111-1111-4111-8111-111111111111",
    receiptNumber: "RCP-JOY-2026-000001",
    invoiceNumber: "INV-JOY-2026-000001",
    amountDisplay: "BDT 25,000.00",
    balanceDisplay: "BDT 75,000.00",
    trackingUrl: "https://example.test/track/rct_reference",
    locale: "bn",
    email: "CUSTOMER@EXAMPLE.COM",
    phone: "01735-877654",
    emailEnabled: true,
    smsEnabled: true,
  });

  assert.equal(commands.length, 2);
  assert.deepEqual(commands.map((item) => item.channel), ["email", "sms"]);
  assert.equal(commands[0].recipient, "customer@example.com");
  assert.equal(commands[1].recipient, "+8801735877654");
  assert.match(commands[0].idempotencyKey, /payment:.*:receipt:email:v1/);
  assert.match(commands[1].idempotencyKey, /payment:.*:receipt:sms:v1/);

  const message = { id: "message", channel: "email", recipient: "test@example.com", subject: "Receipt", body: "Body", idempotencyKey: "one" };
  assert.deepEqual(await new DisabledEmailTransport().send(message), { status: "deferred", code: "provider_not_configured" });
  assert.deepEqual(await new DisabledSmsTransport().send({ ...message, channel: "sms" }), { status: "deferred", code: "provider_not_configured" });
});

test("creates privacy-preserving, high-entropy public tracking identifiers", async () => {
  const [tracking, publicTracking, route, worker, robots] = await Promise.all([
    readFile(new URL("../features/office/tracking.ts", import.meta.url), "utf8"),
    readFile(new URL("../features/office/public-tracking.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/track/[trackingCode]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/robots.ts", import.meta.url), "utf8"),
  ]);
  assert.match(tracking, /new Uint8Array\(16\)/);
  assert.match(tracking, /crypto\.getRandomValues\(entropy\)/);
  assert.match(tracking, /trackingPrefixes = \["inv", "rct", "ntc"\]/);
  assert.match(tracking, /\{prefix\}_\$\{encodeBase64Url\(entropy\)\}/);
  assert.match(publicTracking, /maskRecipientName/);
  assert.doesNotMatch(publicTracking, /amount_minor|balance_minor|email|phone/);
  assert.match(route, /index: false/);
  assert.match(route, /noarchive: true/);
  assert.match(route, /nocache: true/);
  assert.match(worker, /url\.pathname\.startsWith\("\/track\/"\)/);
  assert.match(worker, /headers\.set\("Cache-Control", "private, no-store"\)/);
  assert.match(worker, /headers\.set\("Referrer-Policy", "no-referrer"\)/);
  assert.match(robots, /"\/track"/);
});

test("renders branded color documents with logo, watermark, tracking QR, and A4 print rules", async () => {
  const [documentSource, printCss] = await Promise.all([
    readFile(new URL("../components/office/branded-document.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/office/branded-document.module.css", import.meta.url), "utf8"),
  ]);
  assert.match(documentSource, /logo-primary\.png/);
  assert.match(documentSource, /logo-mark\.png/);
  assert.match(documentSource, /QRCodeSVG/);
  assert.match(documentSource, /trackingUrl/);
  assert.match(documentSource, /DRAFT — NOT ISSUED|PROVISIONAL — NOT POSTED/);
  assert.match(documentSource, /map\(\(paragraph, index\)/);
  assert.match(printCss, /--doc-orange:\s*#ff6b2c/);
  assert.match(printCss, /print-color-adjust:\s*exact/);
  assert.match(printCss, /@page\s*\{\s*size:\s*A4/);
});

test("validates notice authoring and issue transitions at the Server Action boundary", async () => {
  const formSource = await readFile(
    new URL("../features/office/notices/forms.ts", import.meta.url),
    "utf8",
  );
  assert.match(formSource, /officeNoticeFormSchema = z/);
  assert.match(formSource, /kind === "payment_reminder" && !value\.contactId/);
  assert.match(formSource, /effectiveDate < value\.issueDate/);
  assert.match(formSource, /expiresAt < validityStart/);
  assert.match(formSource, /officeIssueNoticeFormSchema/);
  assert.match(formSource, /z\.coerce\.number\(\)\.int\(\)\.positive\(\)/);
  assert.match(formSource, /toUpperCase\(\)/);
});

test("builds manual handoff copy without claiming that a PDF or message was sent", () => {
  const handoff = buildOfficeDocumentHandoff({
    documentType: "notice",
    documentNumber: "JOY-NTC-2026-000001",
    verificationUrl: "https://example.test/track/ntc_AAAAAAAAAAAAAAAAAAAAAA",
    locale: "en",
  });
  assert.match(handoff.subject, /Abdullah Properties notice JOY-NTC-2026-000001/);
  assert.match(handoff.message, /\/track\/ntc_AAAAAAAAAAAAAAAAAAAAAA/);
  assert.match(handoff.message, /No PDF is attached automatically/);
  assert.doesNotMatch(handoff.message, /sent successfully|delivered/);

  const bengaliHandoff = buildOfficeDocumentHandoff({
    documentType: "payment receipt",
    documentNumber: "JOY-RCT-2026-000009",
    verificationUrl: "https://example.test/track/rct_BBBBBBBBBBBBBBBBBBBBBB",
    locale: "bn",
  });
  assert.equal(
    bengaliHandoff.subject,
    "আব্দুল্লাহ প্রোপার্টিজের পেমেন্ট রসিদ JOY-RCT-2026-000009",
  );
  assert.match(bengaliHandoff.message, /আপনার পেমেন্টের রসিদ/);
  assert.match(bengaliHandoff.message, /নথিটি যাচাই করুন/);
  assert.match(bengaliHandoff.message, /কোনো PDF স্বয়ংক্রিয়ভাবে সংযুক্ত হয়নি/);
  assert.doesNotMatch(bengaliHandoff.message, /পাঠানো হয়েছে|ডেলিভারি হয়েছে/);

  for (const [documentType, label] of [["invoice", "ইনভয়েস"], ["notice", "নোটিশ"]]) {
    const localized = buildOfficeDocumentHandoff({
      documentType,
      documentNumber: "JOY-2026-000001",
      verificationUrl: null,
      locale: "bn",
    });
    assert.match(localized.subject, new RegExp(label));
    assert.match(localized.message, /অনলাইন যাচাই লিংক তৈরি হয়নি/);
  }
});

test("keeps print documents shell-free, authenticated, and explicit about manual handoff", async () => {
  const [invoicePrint, paymentPrint, noticePrint, printLayout, actions, noticeActions] = await Promise.all([
    readFile(new URL("../app/(office-print)/office/print/invoices/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(office-print)/office/print/payments/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(office-print)/office/print/notices/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(office-print)/office/print/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/office/document-actions.tsx", import.meta.url), "utf8"),
    readFile(new URL("../features/office/notices/actions.ts", import.meta.url), "utf8"),
  ]);

  assert.match(invoicePrint, /requireOfficePermission\("finance\.read"/);
  assert.match(invoicePrint, /BrandedInvoiceDocument/);
  assert.match(paymentPrint, /requireOfficePermission\("finance\.read"/);
  assert.match(paymentPrint, /BrandedReceiptDocument/);
  assert.match(noticePrint, /requireOfficePermission\("documents\.read"/);
  assert.match(noticePrint, /BrandedNoticeDocument/);
  assert.match(printLayout, /index:\s*false/);
  assert.doesNotMatch(printLayout, /OfficeShell|office\/layout/);
  assert.match(actions, /window\.print\(\)/);
  assert.match(actions, /mailto:/);
  assert.match(actions, /sms:/);
  assert.match(actions, /no message is sent/i);
  assert.match(noticeActions, /authorize\("documents\.write"\)/);
  assert.match(noticeActions, /authorize\("documents\.review"\)/);
  assert.doesNotMatch(noticeActions, /notifications\/repository|enqueueOfficeNotification/);
});

test("posts a payment and its notification intents through one idempotent transaction", async () => {
  const repository = await readFile(new URL("../features/office/repository.ts", import.meta.url), "utf8");
  const start = repository.indexOf("export async function recordOfficePayment");
  const end = repository.indexOf("export async function createOfficeExpense", start);
  assert.ok(start >= 0 && end > start);
  const paymentSource = repository.slice(start, end);
  assert.match(paymentSource, /clientOperationId/);
  assert.match(paymentSource, /office_notification_outbox/);
  assert.match(paymentSource, /idempotency_key/);
  assert.match(paymentSource, /database\.batch\(\[/);
  assert.match(paymentSource, /\.\.\.notificationStatements/);
  assert.match(paymentSource, /payment\.recorded/);
  assert.match(paymentSource, /client_operation_id, status/);
  assert.match(paymentSource, /'posted'/);
});

test("keeps demo records permission-gated, environment-gated, fictional, and idempotent", async () => {
  const [seed, action, page] = await Promise.all([
    readFile(new URL("../features/office/demo-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../features/office/demo-data-action.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/(office)/office/settings/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(seed, /OFFICE_DEMO_SEED_ENABLED/);
  assert.match(seed, /NODE_ENV !== "production"/);
  assert.match(seed, /\[DEMO\]/);
  assert.match(seed, /Fictional test record/);
  assert.match(seed, /find\(\(item\) => item\.displayName === definition\.displayName\)/);
  assert.doesNotMatch(seed, /@gmail\.com|\+8801\d{9}/);
  assert.match(action, /settings\.manage/);
  assert.match(action, /officeDemoConfirmationSchema/);
  assert.match(page, /Remove or archive them before production reporting/);
});

test("notification operations expose truthful queued states instead of claiming delivery", async () => {
  const [page, repository] = await Promise.all([
    readFile(new URL("../app/(office)/office/notifications/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../features/office/notifications/repository.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /marked sent only after a configured provider confirms acceptance/);
  assert.match(page, /Provider dispatch is intentionally disabled/);
  assert.match(page, /recipientMasked/);
  assert.match(repository, /maskRecipient/);
  assert.match(repository, /status IN \('failed', 'dead'\)/);
  assert.match(repository, /notification\.retry_requested/);
});
