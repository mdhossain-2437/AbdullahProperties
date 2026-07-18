import assert from "node:assert/strict";
import test from "node:test";
import {
  createQueuedLocalRecord,
  formatBdt,
  parseBdtToMinorUnits,
  parseLocalOfficeRecord,
  provisionalDocumentNumber,
  recordAmountMinor,
  recordDisplayName,
  recordSummary,
} from "../src/offline/model.ts";

const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
];

function deterministicContext() {
  const queue = [...ids];
  return {
    now: () => new Date("2026-07-15T04:00:00.000Z"),
    createId: () => queue.shift() ?? "55555555-5555-4555-8555-555555555555",
  };
}

test("parses BDT with integer minor-unit arithmetic", () => {
  assert.equal(parseBdtToMinorUnits("1,250.50"), 125050);
  assert.equal(parseBdtToMinorUnits("500"), 50000);
  assert.equal(parseBdtToMinorUnits("0.01"), 1);
  assert.equal(parseBdtToMinorUnits("12.345"), null);
  assert.equal(parseBdtToMinorUnits("-1"), null);
  assert.equal(parseBdtToMinorUnits("1e5"), null);
});

test("creates an invoice using the shared versioned offline protocol", () => {
  const result = createQueuedLocalRecord({
    kind: "invoice_draft",
    input: {
      customerName: "  Demo\u0000 Customer  ",
      phone: "+880 1712-345678",
      email: "DEMO@EXAMPLE.COM",
      purpose: " Property   installment ",
      amount: "250000",
      issueDate: "2026-07-15",
      dueDate: "2026-08-15",
      locale: "bn",
      notes: "  local   note ",
    },
  }, deterministicContext());

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.draft.aggregateType, "invoice_draft");
  assert.equal(result.draft.state, "local_saved");
  assert.equal(result.draft.localRevision, 1);
  assert.equal(result.operation.state, "queued");
  assert.equal(result.operation.clientOperationId, ids[2]);
  assert.equal(result.operation.idempotencyKey, ids[3]);
  assert.equal(result.commit.expectedLocalRevision, 0);

  const record = parseLocalOfficeRecord(result.draft);
  assert.equal(recordDisplayName(record), "Demo Customer");
  assert.equal(recordSummary(record), "Property installment");
  assert.equal(recordAmountMinor(record), 25000000);
  assert.equal(provisionalDocumentNumber(record), "LOCAL-INV-20260715-11111111");
  assert.match(formatBdt(recordAmountMinor(record)), /2,50,000\.00|250,000\.00/);
});

test("creates typed lead, payment and notice records", () => {
  const lead = createQueuedLocalRecord({
    kind: "lead",
    input: {
      customerName: "[DEMO] Joypurhat Buyer",
      phone: "+880 1700-000001",
      interest: "Two-bedroom apartment",
      location: "Joypurhat Sadar",
      followUpDate: "2026-07-20",
      priority: "high",
      notes: "Demonstration record.",
    },
  }, deterministicContext());
  assert.equal(lead.ok, true);
  if (lead.ok) assert.equal(parseLocalOfficeRecord(lead.draft).kind, "lead");

  const payment = createQueuedLocalRecord({
    kind: "payment_acknowledgement",
    input: {
      customerName: "[DEMO] Installment Customer",
      phone: "+880 1700-000002",
      email: "",
      amount: "50000",
      method: "bank_transfer",
      reference: "DEMO-REF-001",
      paidAt: "2026-07-15",
      invoiceReference: "DEMO-INVOICE",
      locale: "en",
      notes: "Provisional acknowledgement only.",
    },
  }, deterministicContext());
  assert.equal(payment.ok, true);
  if (payment.ok) assert.equal(recordAmountMinor(parseLocalOfficeRecord(payment.draft)), 5000000);

  const notice = createQueuedLocalRecord({
    kind: "notice_draft",
    input: {
      recipientName: "[DEMO] Landowner",
      phone: "",
      email: "demo@example.com",
      subject: "Planning meeting notice",
      body: "Please review the proposed meeting date and bring the listed documents.",
      effectiveDate: "2026-07-18",
      locale: "bn",
    },
  }, deterministicContext());
  assert.equal(notice.ok, true);
  if (notice.ok) assert.equal(recordSummary(parseLocalOfficeRecord(notice.draft)), "Planning meeting notice");
});

test("rejects invalid dates, contacts and zero-value financial drafts", () => {
  const badInvoice = createQueuedLocalRecord({
    kind: "invoice_draft",
    input: {
      customerName: "Valid Customer",
      phone: "not-a-phone",
      email: "bad-email",
      purpose: "Invoice",
      amount: "0",
      issueDate: "2026-07-15",
      dueDate: "2026-07-14",
      locale: "en",
      notes: "",
    },
  }, deterministicContext());
  assert.equal(badInvoice.ok, false);

  const badNotice = createQueuedLocalRecord({
    kind: "notice_draft",
    input: {
      recipientName: "A",
      phone: "",
      email: "",
      subject: "x",
      body: "short",
      effectiveDate: "not-a-date",
      locale: "en",
    },
  }, deterministicContext());
  assert.equal(badNotice.ok, false);
});
