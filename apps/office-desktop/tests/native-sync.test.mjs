import assert from "node:assert/strict";
import test from "node:test";
import { createQueuedLocalRecord } from "../src/offline/model.ts";
import {
  normalizeApiOrigin,
  parseDevicePairingCode,
  selectEligibleQueuedOperations,
} from "../src/offline/native-sync.ts";

function deterministicContext(offset) {
  let index = offset;
  return {
    now: () => new Date("2026-07-15T12:00:00.000Z"),
    createId: () => `${String(index++).padStart(8, "0")}-1111-4111-8111-111111111111`,
  };
}

test("normalizes the short one-time pairing code without exposing a bearer", () => {
  assert.equal(parseDevicePairingCode(" ap-abcd-2345 "), "AP-ABCD-2345");
  assert.throws(() => parseDevicePairingCode("ap-0000-0000"), /pairing code/i);
});

test("requires a clean HTTPS API origin", () => {
  assert.equal(
    normalizeApiOrigin("https://abdullah-properties-joypurhat.delowarhossain-dev.chatgpt.site/"),
    "https://abdullah-properties-joypurhat.delowarhossain-dev.chatgpt.site",
  );
  assert.throws(() => normalizeApiOrigin("http://office.example.com"), /requires HTTPS/);
  assert.throws(() => normalizeApiOrigin("https://office.example.com"), /verified Abdullah Properties/);
  assert.throws(() => normalizeApiOrigin("https://user@example.com/api"), /without a path/);
});

test("selects safe draft creates and keeps payments local", () => {
  const lead = createQueuedLocalRecord({
    kind: "lead",
    input: {
      customerName: "Demo Lead",
      phone: "+880 1712-345678",
      interest: "Apartment consultation",
      location: "Joypurhat Sadar",
      followUpDate: "2026-07-20",
      priority: "normal",
      notes: "Native sync test.",
    },
  }, deterministicContext(1));
  const payment = createQueuedLocalRecord({
    kind: "payment_acknowledgement",
    input: {
      customerName: "Demo Payer",
      phone: "+880 1712-345679",
      email: "",
      amount: "25000",
      method: "cash",
      reference: "LOCAL-ONLY",
      paidAt: "2026-07-15",
      invoiceReference: "DRAFT-001",
      locale: "en",
      notes: "Must not synchronize as a posted payment.",
    },
  }, deterministicContext(10));
  assert.equal(lead.ok, true);
  assert.equal(payment.ok, true);
  if (!lead.ok || !payment.ok) return;

  const selected = selectEligibleQueuedOperations([payment.operation, lead.operation]);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].aggregateType, "lead");
});

test("releases only persisted retry operations whose backoff is due", () => {
  const lead = createQueuedLocalRecord({
    kind: "lead",
    input: {
      customerName: "Retry Lead",
      phone: "+880 1712-345678",
      interest: "Apartment consultation",
      location: "Joypurhat Sadar",
      followUpDate: "2026-07-20",
      priority: "normal",
      notes: "Retry boundary test.",
    },
  }, deterministicContext(30));
  assert.equal(lead.ok, true);
  if (!lead.ok) return;
  const waiting = {
    ...lead.operation,
    state: "retry_wait",
    attemptCount: 2,
    nextAttemptAt: "2026-07-15T12:01:00.000Z",
    lastFailure: {
      code: "network_unavailable",
      message: "Offline",
      retryable: true,
      occurredAt: "2026-07-15T12:00:00.000Z",
    },
  };
  assert.equal(selectEligibleQueuedOperations([waiting], 25, Date.parse("2026-07-15T12:00:59.000Z")).length, 0);
  assert.equal(selectEligibleQueuedOperations([waiting], 25, Date.parse("2026-07-15T12:01:00.000Z")).length, 1);
});
