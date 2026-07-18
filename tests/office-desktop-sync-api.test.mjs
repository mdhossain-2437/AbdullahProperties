import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DesktopApiRequestError,
  DesktopSyncCapabilityError,
  OFFICE_DESKTOP_MAX_OPERATIONS,
  assertDesktopOperationCanSync,
  classifyDesktopSyncReplay,
  createDesktopPairingCode,
  desktopJsonResponse,
  formatDesktopDeviceCredential,
  hashDesktopDeviceCredential,
  hashDesktopPairingCode,
  hashDesktopSyncOperation,
  officeDesktopBearerCredentialSchema,
  officeDesktopSyncRequestSchema,
  parseSafeDesktopDraftPayload,
  readBearerCredential,
  readBoundedJson,
} from "../features/office/desktop-sync-contract.ts";
import { offlineOutboxOperationSchema } from "../features/office/offline-core.ts";

const ids = {
  operation: "11111111-1111-4111-8111-111111111111",
  idempotency: "22222222-2222-4222-8222-222222222222",
  draft: "33333333-3333-4333-8333-333333333333",
  aggregate: "44444444-4444-4444-8444-444444444444",
};

function operation(overrides = {}) {
  return offlineOutboxOperationSchema.parse({
    schemaVersion: 1,
    clientOperationId: ids.operation,
    idempotencyKey: ids.idempotency,
    draftId: ids.draft,
    draftLocalRevision: 1,
    aggregateType: "lead",
    aggregateId: ids.aggregate,
    command: "create",
    payload: {
      customerName: "Rahim Uddin",
      phone: "+880 1712-345678",
      interest: "Residential land",
      location: "Joypurhat",
      followUpDate: "2026-08-01",
      priority: "high",
      notes: "Requested a site visit.",
    },
    expectedServerVersion: null,
    state: "queued",
    attemptCount: 0,
    nextAttemptAt: null,
    leaseOwner: null,
    leaseExpiresAt: null,
    lastFailure: null,
    syncedAt: null,
    createdAt: "2026-07-15T08:00:00.000Z",
    updatedAt: "2026-07-15T08:00:00.000Z",
    ...overrides,
  });
}

test("creates opaque 256-bit bearer credentials and stores only deterministic hashes", async () => {
  const credential = formatDesktopDeviceCredential(new Uint8Array(32).fill(7));
  assert.equal(officeDesktopBearerCredentialSchema.safeParse(credential).success, true);
  assert.equal(credential.startsWith("apd_v1_"), true);
  assert.equal((await hashDesktopDeviceCredential(credential)).length, 64);
  assert.equal(await hashDesktopDeviceCredential(credential), await hashDesktopDeviceCredential(credential));
  assert.doesNotMatch(await hashDesktopDeviceCredential(credential), new RegExp(credential));

  const request = new Request("https://example.test/api/office/v1/sync", {
    headers: { Authorization: `Bearer ${credential}` },
  });
  assert.equal(readBearerCredential(request), credential);
  assert.equal(readBearerCredential(new Request("https://example.test", { headers: { Authorization: `Basic ${credential}` } })), null);
});

test("browser pairing uses a short-lived one-time code instead of exposing the bearer", async () => {
  const code = createDesktopPairingCode();
  assert.match(code, /^AP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  assert.equal((await hashDesktopPairingCode(code)).length, 64);
  assert.equal(await hashDesktopPairingCode(code.toLowerCase()), await hashDesktopPairingCode(code));
});

test("validates bounded strict request envelopes before any draft is accepted", async () => {
  const valid = officeDesktopSyncRequestSchema.parse({ protocolVersion: 1, operations: [operation()] });
  assert.equal(valid.operations.length, 1);
  assert.equal(
    officeDesktopSyncRequestSchema.safeParse({ protocolVersion: 2, operations: [operation()] }).success,
    false,
  );
  assert.equal(
    officeDesktopSyncRequestSchema.safeParse({
      protocolVersion: 1,
      operations: Array.from({ length: OFFICE_DESKTOP_MAX_OPERATIONS + 1 }, () => operation()),
    }).success,
    false,
  );

  await assert.rejects(
    readBoundedJson(
      new Request("https://example.test", { method: "POST", body: "{}", headers: { "Content-Type": "text/plain" } }),
      32,
    ),
    (error) => error instanceof DesktopApiRequestError && error.status === 415,
  );
  await assert.rejects(
    readBoundedJson(
      new Request("https://example.test", { method: "POST", body: JSON.stringify({ value: "too large" }), headers: { "Content-Type": "application/json" } }),
      8,
    ),
    (error) => error instanceof DesktopApiRequestError && error.status === 413,
  );
});

test("accepts only safe create drafts and explicitly gates financial acknowledgements", () => {
  const lead = operation();
  assert.doesNotThrow(() => assertDesktopOperationCanSync(lead));
  assert.equal(parseSafeDesktopDraftPayload(lead).aggregateType, "lead");

  assert.throws(
    () => assertDesktopOperationCanSync(operation({ command: "submit" })),
    (error) => error instanceof DesktopSyncCapabilityError && error.code === "command_not_supported",
  );
  assert.throws(
    () => assertDesktopOperationCanSync(operation({ expectedServerVersion: 1 })),
    (error) => error instanceof DesktopSyncCapabilityError && error.code === "unexpected_server_version",
  );
  assert.throws(
    () => assertDesktopOperationCanSync(operation({ aggregateType: "payment_acknowledgement", payload: { amountMinor: 100 } })),
    (error) =>
      error instanceof DesktopSyncCapabilityError &&
      error.code === "financial_posting_disabled" &&
      error.resultStatus === "permission_blocked",
  );
});

test("uses canonical operation hashes to distinguish a duplicate retry from an idempotency conflict", async () => {
  const first = operation();
  const reordered = operation({
    payload: {
      notes: "Requested a site visit.",
      priority: "high",
      followUpDate: "2026-08-01",
      location: "Joypurhat",
      interest: "Residential land",
      phone: "+880 1712-345678",
      customerName: "Rahim Uddin",
    },
  });
  const hash = await hashDesktopSyncOperation(first);
  assert.equal(hash, await hashDesktopSyncOperation(reordered));
  const receipt = {
    aggregateId: first.aggregateId,
    aggregateType: first.aggregateType,
    clientOperationId: first.clientOperationId,
    idempotencyKey: first.idempotencyKey,
    operationHash: hash,
  };
  assert.equal(classifyDesktopSyncReplay(first, hash, receipt), "duplicate");
  assert.equal(classifyDesktopSyncReplay(first, "0".repeat(64), receipt), "conflict");
  assert.equal(
    classifyDesktopSyncReplay(
      operation({ aggregateId: "55555555-5555-4555-8555-555555555555" }),
      hash,
      receipt,
    ),
    "conflict",
  );
});

test("marks every desktop API response private and documents the standard bearer boundary", async () => {
  const response = desktopJsonResponse({ ok: true });
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");

  const [syncRoute, deviceRoute, activationRoute, inboxPage, migration, hardeningMigration] = await Promise.all([
    readFile(new URL("../app/api/office/v1/sync/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/office/v1/devices/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/office/v1/devices/activate/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/(office)/office/desktop-inbox/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0003_flaky_bullseye.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0004_desktop_activation_inbox.sql", import.meta.url), "utf8"),
  ]);
  assert.match(syncRoute, /Authorization|readBearerCredential/);
  assert.doesNotMatch(syncRoute, /oai-authenticated-user/);
  assert.ok(
    syncRoute.indexOf("const ingress = await consumeOfficeDesktopIngressRateLimit")
      < syncRoute.indexOf("const authorization = await authenticateOfficeDesktopCredential"),
    "ingress throttling must run before credential database authentication",
  );
  assert.match(deviceRoute, /getAuthorizedOfficeActor/);
  assert.match(deviceRoute, /OneTimeCode/);
  assert.doesNotMatch(deviceRoute, /token:\s*paired\.credential/);
  assert.match(activationRoute, /activateOfficeDesktopDevice/);
  assert.match(inboxPage, /Server received is not the same as official/);
  assert.match(migration, /office_desktop_devices/);
  assert.match(migration, /office_desktop_drafts_idempotency_unique/);
  assert.match(migration, /office_desktop_rate_limits_device_window_unique/);
  assert.match(hardeningMigration, /office_desktop_pairing_codes/);
  assert.match(hardeningMigration, /office_desktop_ingress_rate_limits/);
});
