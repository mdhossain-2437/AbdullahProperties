import assert from "node:assert/strict";
import test from "node:test";
import {
  createDraftUpsertCommand,
  createLocalInvoiceDraft,
  formatBdt,
  parseBdtToMinorUnits,
  provisionalInvoiceNumber,
  validateDraftInput,
} from "../src/offline/model.ts";

const deterministicContext = {
  now: () => new Date("2026-07-15T04:00:00.000Z"),
  createId: () => "11111111-1111-4111-8111-111111111111",
};

test("parses BDT with integer minor-unit arithmetic", () => {
  assert.equal(parseBdtToMinorUnits("1,250.50"), 125050);
  assert.equal(parseBdtToMinorUnits("500"), 50000);
  assert.equal(parseBdtToMinorUnits("0.01"), 1);
  assert.equal(parseBdtToMinorUnits("12.345"), null);
  assert.equal(parseBdtToMinorUnits("-1"), null);
  assert.equal(parseBdtToMinorUnits("1e5"), null);
});

test("validates and sanitizes an offline invoice boundary", () => {
  const result = validateDraftInput({
    customerName: "  Demo\u0000 Customer  ",
    purpose: " Property   installment ",
    amount: "250000",
    notes: "  local   note ",
    locale: "bn-BD",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.customerName, "Demo Customer");
  assert.equal(result.value.purpose, "Property installment");
  assert.equal(result.value.amountMinor, 25000000);
  assert.equal(result.value.notes, "local note");
});

test("creates a provisional draft and idempotent outbox identity", () => {
  const result = createLocalInvoiceDraft({
    customerName: "[DEMO] Joypurhat Buyer",
    purpose: "Booking discussion",
    amount: "250000",
    notes: "No live contact data.",
    locale: "bn-BD",
  }, deterministicContext);
  assert.equal(result.ok, true);
  assert.ok(result.draft);
  if (!result.draft) return;

  const command = createDraftUpsertCommand(result.draft, deterministicContext);
  assert.equal(result.draft.status, "queued");
  assert.equal(command.state, "pending");
  assert.match(command.idempotencyKey, /^desktop:.*:revision:1:invoice-draft-upsert:v1$/);
  assert.equal(provisionalInvoiceNumber(result.draft), "LOCAL-20260715-11111111");
  assert.match(formatBdt(result.draft.payload.amountMinor), /2,50,000\.00|250,000\.00/);
});

test("rejects incomplete and zero-value drafts", () => {
  assert.deepEqual(
    validateDraftInput({ customerName: "A", purpose: "x", amount: "0", notes: "", locale: "en-BD" }),
    { ok: false, message: "Enter a customer or account name." },
  );
  assert.equal(
    validateDraftInput({ customerName: "Valid", purpose: "Invoice", amount: "0", notes: "", locale: "en-BD" }).ok,
    false,
  );
});
