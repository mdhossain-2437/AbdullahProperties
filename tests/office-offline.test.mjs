import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  OfflineTransitionError,
  beginOfflineDraftEdit,
  buildQueuedOfflineOperation,
  canTransitionOfflineLifecycle,
  claimReadyOfflineOperationsSchema,
  completeOfflineDraftAutosave,
  createClientOperationIdentity,
  createOfflineDraft,
  getAllowedOfflineLifecycleEvents,
  isJsonObject,
  offlineDraftAndOperationCommitSchema,
  offlineLifecycleStates,
  offlineOutboxOperationSchema,
  retryBackoffPolicySchema,
  scheduleOfflineRetry,
  transitionOfflineLifecycle,
} from "../features/office/offline-core.ts";

const ids = {
  draft: "11111111-1111-4111-8111-111111111111",
  aggregate: "22222222-2222-4222-8222-222222222222",
  operation: "33333333-3333-4333-8333-333333333333",
  idempotency: "44444444-4444-4444-8444-444444444444",
};

const timestamps = {
  created: "2026-07-14T08:00:00.000Z",
  saved: "2026-07-14T08:00:01.000Z",
  edited: "2026-07-14T08:00:02.000Z",
  resaved: "2026-07-14T08:00:03.000Z",
};

function createSavedDraft() {
  return completeOfflineDraftAutosave(
    createOfflineDraft({
      draftId: ids.draft,
      aggregateType: "invoice_draft",
      aggregateId: ids.aggregate,
      payload: { customer: "Rahim Uddin", amountMinor: 125_000, lines: ["Booking"] },
      now: timestamps.created,
      baseServerVersion: 3,
    }),
    timestamps.saved,
  );
}

function createQueuedOperation() {
  return buildQueuedOfflineOperation({
    clientOperationId: ids.operation,
    idempotencyKey: ids.idempotency,
    draft: createSavedDraft(),
    command: "submit",
    now: timestamps.saved,
  });
}

test("defines and enforces the complete offline lifecycle", () => {
  assert.deepEqual(offlineLifecycleStates, [
    "editing",
    "local_saved",
    "queued",
    "syncing",
    "synced",
    "retry_wait",
    "conflict",
    "permission_blocked",
  ]);

  let state = transitionOfflineLifecycle("editing", "autosave_succeeded");
  assert.equal(state, "local_saved");
  state = transitionOfflineLifecycle(state, "enqueue");
  assert.equal(state, "queued");
  state = transitionOfflineLifecycle(state, "sync_started");
  assert.equal(state, "syncing");
  state = transitionOfflineLifecycle(state, "retry_scheduled");
  assert.equal(state, "retry_wait");
  state = transitionOfflineLifecycle(state, "retry_due");
  assert.equal(state, "queued");
  state = transitionOfflineLifecycle(state, "sync_started");
  state = transitionOfflineLifecycle(state, "conflict_detected");
  assert.equal(state, "conflict");
  state = transitionOfflineLifecycle(state, "conflict_resolved");
  state = transitionOfflineLifecycle(state, "sync_started");
  state = transitionOfflineLifecycle(state, "permission_denied");
  assert.equal(state, "permission_blocked");
  state = transitionOfflineLifecycle(state, "permission_restored");
  state = transitionOfflineLifecycle(state, "sync_started");
  state = transitionOfflineLifecycle(state, "sync_succeeded");
  assert.equal(state, "synced");
  assert.equal(transitionOfflineLifecycle(state, "edit"), "editing");

  assert.equal(canTransitionOfflineLifecycle("queued", "sync_started"), true);
  assert.equal(canTransitionOfflineLifecycle("queued", "sync_succeeded"), false);
  assert.equal(canTransitionOfflineLifecycle("unknown", "sync_started"), false);
  assert.deepEqual(getAllowedOfflineLifecycleEvents("conflict"), ["conflict_resolved"]);

  assert.throws(
    () => transitionOfflineLifecycle("editing", "sync_succeeded"),
    (error) =>
      error instanceof OfflineTransitionError &&
      error.code === "offline_transition_invalid" &&
      error.from === "editing",
  );
});

test("autosaves immutable draft snapshots with optimistic local revisions", () => {
  const mutablePayload = { title: "Initial lead", tags: ["Joypurhat"] };
  const draft = createOfflineDraft({
    draftId: ids.draft,
    aggregateType: "lead",
    aggregateId: ids.aggregate,
    payload: mutablePayload,
    now: timestamps.created,
  });
  mutablePayload.title = "Mutated outside contract";

  assert.equal(draft.state, "editing");
  assert.equal(draft.localRevision, 0);
  assert.equal(draft.payload.title, "Initial lead");
  assert.equal(draft.lastSavedAt, null);

  const saved = completeOfflineDraftAutosave(draft, timestamps.saved);
  assert.equal(saved.state, "local_saved");
  assert.equal(saved.localRevision, 1);
  assert.equal(saved.lastSavedAt, timestamps.saved);

  const edited = beginOfflineDraftEdit(
    saved,
    { title: "Updated lead", tags: ["Joypurhat", "Site visit"] },
    timestamps.edited,
  );
  assert.equal(edited.state, "editing");
  assert.equal(edited.localRevision, 1);
  assert.equal(edited.payload.title, "Updated lead");

  const resaved = completeOfflineDraftAutosave(edited, timestamps.resaved);
  assert.equal(resaved.localRevision, 2);
  assert.throws(
    () => completeOfflineDraftAutosave(resaved, "2026-07-14T08:00:04.000Z"),
    OfflineTransitionError,
  );
  assert.throws(
    () => beginOfflineDraftEdit(resaved, { invalid: Number.NaN }, timestamps.resaved),
    /finite, acyclic JSON object/,
  );
});

test("validates separately branded UUID operation and idempotency identities", () => {
  const values = [ids.operation, ids.idempotency];
  const identity = createClientOperationIdentity(() => values.shift());
  assert.equal(identity.clientOperationId, ids.operation);
  assert.equal(identity.idempotencyKey, ids.idempotency);

  assert.throws(
    () => createClientOperationIdentity(() => "not-a-uuid"),
    /Invalid UUID/,
  );
});

test("builds a queued operation only from a persisted local draft snapshot", () => {
  const draft = createSavedDraft();
  const operation = createQueuedOperation();

  assert.equal(operation.state, "queued");
  assert.equal(operation.draftLocalRevision, draft.localRevision);
  assert.equal(operation.expectedServerVersion, 3);
  assert.equal(operation.clientOperationId, ids.operation);
  assert.equal(operation.idempotencyKey, ids.idempotency);
  assert.deepEqual(operation.payload, draft.payload);

  const editing = beginOfflineDraftEdit(draft, { customer: "Changed" }, timestamps.edited);
  assert.throws(
    () =>
      buildQueuedOfflineOperation({
        clientOperationId: ids.operation,
        idempotencyKey: ids.idempotency,
        draft: editing,
        command: "submit",
        now: timestamps.edited,
      }),
    OfflineTransitionError,
  );

  assert.throws(
    () =>
      buildQueuedOfflineOperation({
        clientOperationId: "invalid",
        idempotencyKey: ids.idempotency,
        draft,
        command: "submit",
        now: timestamps.saved,
      }),
    /Invalid UUID/,
  );
});

test("rejects malformed operation state metadata at the persistence boundary", () => {
  const queued = createQueuedOperation();
  assert.equal(
    offlineOutboxOperationSchema.safeParse({ ...queued, state: "retry_wait" }).success,
    false,
  );
  assert.equal(
    offlineOutboxOperationSchema.safeParse({ ...queued, state: "syncing" }).success,
    false,
  );
  assert.equal(
    offlineOutboxOperationSchema.safeParse({ ...queued, state: "synced" }).success,
    false,
  );
  assert.equal(
    offlineOutboxOperationSchema.safeParse({ ...queued, state: "conflict" }).success,
    false,
  );

  const failure = {
    code: "network.timeout",
    message: "Sync timed out.",
    retryable: true,
    occurredAt: timestamps.resaved,
    details: null,
  };
  const retryWait = offlineOutboxOperationSchema.parse({
    ...queued,
    state: "retry_wait",
    attemptCount: 1,
    nextAttemptAt: "2026-07-14T08:00:05.000Z",
    lastFailure: failure,
    updatedAt: timestamps.resaved,
  });
  assert.equal(retryWait.state, "retry_wait");

  const syncing = offlineOutboxOperationSchema.parse({
    ...queued,
    state: "syncing",
    attemptCount: 1,
    leaseOwner: "desktop.joypurhat-01",
    leaseExpiresAt: "2026-07-14T08:01:00.000Z",
    updatedAt: timestamps.resaved,
  });
  assert.equal(syncing.leaseOwner, "desktop.joypurhat-01");
});

test("computes capped exponential retry schedules with injected deterministic jitter", () => {
  const policy = {
    baseDelayMs: 1_000,
    maxDelayMs: 10_000,
    multiplier: 2,
    jitterRatio: 0.2,
    maxAttempts: 5,
  };
  const now = Date.parse("2026-07-14T08:00:00.000Z");

  assert.deepEqual(scheduleOfflineRetry({ failureCount: 1, nowEpochMs: now, policy, random: () => 0 }), {
    failureCount: 1,
    nextAttemptNumber: 2,
    delayMs: 800,
    retryAt: "2026-07-14T08:00:00.800Z",
  });
  assert.equal(
    scheduleOfflineRetry({ failureCount: 1, nowEpochMs: now, policy, random: () => 0.5 })
      ?.delayMs,
    1_000,
  );
  assert.equal(
    scheduleOfflineRetry({ failureCount: 1, nowEpochMs: now, policy, random: () => 1 })
      ?.delayMs,
    1_200,
  );
  assert.equal(
    scheduleOfflineRetry({ failureCount: 4, nowEpochMs: now, policy, random: () => 1 })
      ?.delayMs,
    9_600,
  );

  let randomCalled = false;
  assert.equal(
    scheduleOfflineRetry({
      failureCount: 5,
      nowEpochMs: now,
      policy,
      random: () => {
        randomCalled = true;
        return 0.5;
      },
    }),
    null,
  );
  assert.equal(randomCalled, false);

  const capped = { ...policy, maxDelayMs: 5_000 };
  assert.equal(
    scheduleOfflineRetry({ failureCount: 4, nowEpochMs: now, policy: capped, random: () => 1 })
      ?.delayMs,
    5_000,
  );
  assert.throws(
    () => scheduleOfflineRetry({ failureCount: 1, nowEpochMs: now, policy, random: () => 1.1 }),
    /Too big/,
  );
  assert.equal(
    retryBackoffPolicySchema.safeParse({ ...policy, baseDelayMs: 20_000 }).success,
    false,
  );
});

test("validates atomic draft/outbox commits and bounded lease claims", () => {
  const draft = createSavedDraft();
  const operation = createQueuedOperation();
  const validCommit = offlineDraftAndOperationCommitSchema.parse({
    draft,
    operation,
    expectedLocalRevision: draft.localRevision,
  });
  assert.equal(validCommit.operation.draftLocalRevision, validCommit.draft.localRevision);

  assert.equal(
    offlineDraftAndOperationCommitSchema.safeParse({
      draft,
      operation: { ...operation, aggregateId: "55555555-5555-4555-8555-555555555555" },
      expectedLocalRevision: draft.localRevision,
    }).success,
    false,
  );
  assert.equal(
    offlineDraftAndOperationCommitSchema.safeParse({
      draft,
      operation,
      expectedLocalRevision: draft.localRevision + 2,
    }).success,
    false,
  );
  assert.equal(
    claimReadyOfflineOperationsSchema.safeParse({
      now: timestamps.saved,
      limit: 25,
      leaseOwner: "desktop.joypurhat-01",
      leaseExpiresAt: "2026-07-14T08:01:00.000Z",
    }).success,
    true,
  );
  assert.equal(
    claimReadyOfflineOperationsSchema.safeParse({
      now: timestamps.saved,
      limit: 101,
      leaseOwner: "desktop.joypurhat-01",
      leaseExpiresAt: timestamps.saved,
    }).success,
    false,
  );
});

test("accepts only finite acyclic plain JSON objects", () => {
  assert.equal(isJsonObject({ text: "বাংলা", nested: { amount: 100 }, list: [1, true] }), true);
  assert.equal(isJsonObject({ amount: Number.POSITIVE_INFINITY }), false);
  assert.equal(isJsonObject(new Date()), false);
  assert.equal(isJsonObject(["not", "an", "object"]), false);

  const cyclic = {};
  cyclic.self = cyclic;
  assert.equal(isJsonObject(cyclic), false);
});

test("keeps the offline core vendor-neutral and documents native safety boundaries", async () => {
  const [source, architecture] = await Promise.all([
    readFile(new URL("../features/office/offline-core.ts", import.meta.url), "utf8"),
    readFile(new URL("../docs/OFFLINE-OFFICE-FOUNDATION.md", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(source, /from\s+["'](?:next|@tauri|cloudflare:workers|drizzle-orm)/);
  assert.match(source, /interface OfflineStoragePort/);
  assert.match(source, /commitDraftAndEnqueue/);
  assert.match(source, /claimReadyOperations/);
  assert.match(source, /expectedLocalRevision/);
  assert.match(architecture, /DRAFT \/ PROVISIONAL/);
  assert.match(architecture, /Rust stable-MSVC/);
  assert.match(architecture, /Visual Studio 2022 C\+\+ Build Tools/);
});
