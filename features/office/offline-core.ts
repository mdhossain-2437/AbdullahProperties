import { z } from "zod";

/**
 * Storage-neutral offline contracts shared by the web sync boundary and a future
 * native client. This module deliberately has no Next.js, Cloudflare, SQL, or
 * Tauri imports so the same validated protocol can run on every side.
 */

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | JsonObject;

export type JsonObject = Readonly<{ [key: string]: JsonValue }>;

function isJsonValue(value: unknown, ancestors: Set<object>): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object") return false;
  if (ancestors.has(value)) return false;

  ancestors.add(value);
  let valid: boolean;
  if (Array.isArray(value)) {
    valid = value.every((item) => isJsonValue(item, ancestors));
  } else {
    const prototype = Object.getPrototypeOf(value);
    valid =
      (prototype === Object.prototype || prototype === null) &&
      Object.values(value).every((item) => isJsonValue(item, ancestors));
  }
  ancestors.delete(value);
  return valid;
}

export function isJsonObject(value: unknown): value is JsonObject {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    isJsonValue(value, new Set<object>())
  );
}

const jsonObjectSchema = z.custom<JsonObject>(
  isJsonObject,
  "Payload must be a finite, acyclic JSON object.",
);
const isoTimestampSchema = z.string().datetime({ offset: true });
const nonNegativeVersionSchema = z.number().int().nonnegative().safe();
const positiveLimitSchema = z.number().int().min(1).max(100);
const uuidSchema = z.string().uuid();

export const offlineDraftIdSchema = uuidSchema.brand<"OfflineDraftId">();
export const offlineAggregateIdSchema = uuidSchema.brand<"OfflineAggregateId">();
export const clientOperationIdSchema = uuidSchema.brand<"ClientOperationId">();
export const offlineIdempotencyKeySchema = uuidSchema.brand<"OfflineIdempotencyKey">();

export type OfflineDraftId = z.infer<typeof offlineDraftIdSchema>;
export type OfflineAggregateId = z.infer<typeof offlineAggregateIdSchema>;
export type ClientOperationId = z.infer<typeof clientOperationIdSchema>;
export type OfflineIdempotencyKey = z.infer<typeof offlineIdempotencyKeySchema>;

export const offlineAggregateTypeSchema = z.enum([
  "contact",
  "lead",
  "invoice_draft",
  "payment_acknowledgement",
  "notice_draft",
]);
export const offlineCommandSchema = z.enum(["create", "update", "submit", "archive"]);

export type OfflineAggregateType = z.infer<typeof offlineAggregateTypeSchema>;
export type OfflineCommand = z.infer<typeof offlineCommandSchema>;

export const offlineLifecycleStates = [
  "editing",
  "local_saved",
  "queued",
  "syncing",
  "synced",
  "retry_wait",
  "conflict",
  "permission_blocked",
] as const;

export const offlineLifecycleStateSchema = z.enum(offlineLifecycleStates);
export const offlineDraftStateSchema = z.enum(["editing", "local_saved"]);
export const offlineOutboxStateSchema = z.enum([
  "queued",
  "syncing",
  "synced",
  "retry_wait",
  "conflict",
  "permission_blocked",
]);

export type OfflineLifecycleState = z.infer<typeof offlineLifecycleStateSchema>;
export type OfflineDraftState = z.infer<typeof offlineDraftStateSchema>;
export type OfflineOutboxState = z.infer<typeof offlineOutboxStateSchema>;

export const offlineLifecycleEvents = [
  "edit",
  "autosave_succeeded",
  "enqueue",
  "sync_started",
  "sync_succeeded",
  "retry_scheduled",
  "retry_due",
  "conflict_detected",
  "permission_denied",
  "conflict_resolved",
  "permission_restored",
] as const;

export const offlineLifecycleEventSchema = z.enum(offlineLifecycleEvents);
export type OfflineLifecycleEvent = z.infer<typeof offlineLifecycleEventSchema>;

type OfflineTransitionTable = Readonly<
  Record<
    OfflineLifecycleState,
    Readonly<Partial<Record<OfflineLifecycleEvent, OfflineLifecycleState>>>
  >
>;

const offlineTransitions: OfflineTransitionTable = {
  editing: { autosave_succeeded: "local_saved" },
  local_saved: { edit: "editing", enqueue: "queued" },
  queued: { sync_started: "syncing" },
  syncing: {
    sync_succeeded: "synced",
    retry_scheduled: "retry_wait",
    conflict_detected: "conflict",
    permission_denied: "permission_blocked",
  },
  synced: { edit: "editing" },
  retry_wait: { retry_due: "queued", permission_denied: "permission_blocked" },
  conflict: { conflict_resolved: "queued" },
  permission_blocked: { permission_restored: "queued" },
};

export class OfflineTransitionError extends Error {
  readonly code = "offline_transition_invalid" as const;
  readonly from: OfflineLifecycleState;
  readonly event: OfflineLifecycleEvent;

  constructor(from: OfflineLifecycleState, event: OfflineLifecycleEvent) {
    super(`Offline lifecycle cannot apply ${event} while ${from}.`);
    this.name = "OfflineTransitionError";
    this.from = from;
    this.event = event;
  }
}

export function canTransitionOfflineLifecycle(
  fromValue: unknown,
  eventValue: unknown,
): boolean {
  const from = offlineLifecycleStateSchema.safeParse(fromValue);
  const event = offlineLifecycleEventSchema.safeParse(eventValue);
  if (!from.success || !event.success) return false;
  return offlineTransitions[from.data][event.data] !== undefined;
}

export function transitionOfflineLifecycle(
  fromValue: unknown,
  eventValue: unknown,
): OfflineLifecycleState {
  const from = offlineLifecycleStateSchema.parse(fromValue);
  const event = offlineLifecycleEventSchema.parse(eventValue);
  const next = offlineTransitions[from][event];
  if (!next) throw new OfflineTransitionError(from, event);
  return next;
}

export function getAllowedOfflineLifecycleEvents(
  stateValue: unknown,
): readonly OfflineLifecycleEvent[] {
  const state = offlineLifecycleStateSchema.parse(stateValue);
  return Object.freeze(Object.keys(offlineTransitions[state]) as OfflineLifecycleEvent[]);
}

export const offlineFailureSchema = z.strictObject({
  code: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z][a-z0-9_.-]*$/, "Failure codes must be stable machine keys."),
  message: z.string().trim().min(1).max(500),
  retryable: z.boolean(),
  occurredAt: isoTimestampSchema,
  details: jsonObjectSchema.nullable().default(null),
});

export type OfflineFailure = z.infer<typeof offlineFailureSchema>;

function addTimestampIssues(
  value: Readonly<{
    createdAt: string;
    updatedAt: string;
    lastSavedAt?: string | null;
    syncedAt?: string | null;
  }>,
  context: z.RefinementCtx,
): void {
  const createdAt = Date.parse(value.createdAt);
  const updatedAt = Date.parse(value.updatedAt);
  if (updatedAt < createdAt) {
    context.addIssue({
      code: "custom",
      path: ["updatedAt"],
      message: "Updated time cannot precede created time.",
    });
  }
  for (const key of ["lastSavedAt", "syncedAt"] as const) {
    const timestamp = value[key];
    if (timestamp && Date.parse(timestamp) < createdAt) {
      context.addIssue({
        code: "custom",
        path: [key],
        message: `${key} cannot precede created time.`,
      });
    }
  }
}

export const offlineDraftSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    draftId: offlineDraftIdSchema,
    aggregateType: offlineAggregateTypeSchema,
    aggregateId: offlineAggregateIdSchema,
    state: offlineDraftStateSchema,
    payload: jsonObjectSchema,
    localRevision: nonNegativeVersionSchema,
    baseServerVersion: nonNegativeVersionSchema.nullable(),
    lastSavedAt: isoTimestampSchema.nullable(),
    createdAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema,
  })
  .superRefine((draft, context) => {
    addTimestampIssues(draft, context);
    if (draft.state === "local_saved" && draft.lastSavedAt === null) {
      context.addIssue({
        code: "custom",
        path: ["lastSavedAt"],
        message: "A locally saved draft requires a saved timestamp.",
      });
    }
    if (draft.localRevision === 0 && draft.lastSavedAt !== null) {
      context.addIssue({
        code: "custom",
        path: ["localRevision"],
        message: "An unsaved draft cannot have a saved timestamp.",
      });
    }
  });

export type OfflineDraft = z.infer<typeof offlineDraftSchema>;

export type CreateOfflineDraftInput = Readonly<{
  draftId: string;
  aggregateType: OfflineAggregateType;
  aggregateId: string;
  payload: JsonObject;
  now: string;
  baseServerVersion?: number | null;
}>;

function cloneJsonObject(value: JsonObject): JsonObject {
  return jsonObjectSchema.parse(JSON.parse(JSON.stringify(value)));
}

export function createOfflineDraft(input: CreateOfflineDraftInput): OfflineDraft {
  const payload = jsonObjectSchema.parse(input.payload);
  return offlineDraftSchema.parse({
    schemaVersion: 1,
    draftId: input.draftId,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    state: "editing",
    payload: cloneJsonObject(payload),
    localRevision: 0,
    baseServerVersion: input.baseServerVersion ?? null,
    lastSavedAt: null,
    createdAt: input.now,
    updatedAt: input.now,
  });
}

export function beginOfflineDraftEdit(
  draftValue: unknown,
  payloadValue: unknown,
  nowValue: unknown,
): OfflineDraft {
  const draft = offlineDraftSchema.parse(draftValue);
  const payload = jsonObjectSchema.parse(payloadValue);
  const now = isoTimestampSchema.parse(nowValue);
  const state =
    draft.state === "editing"
      ? draft.state
      : offlineDraftStateSchema.parse(transitionOfflineLifecycle(draft.state, "edit"));

  return offlineDraftSchema.parse({
    ...draft,
    state,
    payload: cloneJsonObject(payload),
    updatedAt: now,
  });
}

export function completeOfflineDraftAutosave(
  draftValue: unknown,
  nowValue: unknown,
): OfflineDraft {
  const draft = offlineDraftSchema.parse(draftValue);
  const now = isoTimestampSchema.parse(nowValue);
  const state = offlineDraftStateSchema.parse(
    transitionOfflineLifecycle(draft.state, "autosave_succeeded"),
  );

  return offlineDraftSchema.parse({
    ...draft,
    state,
    localRevision: draft.localRevision + 1,
    lastSavedAt: now,
    updatedAt: now,
  });
}

export const offlineOutboxOperationSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    clientOperationId: clientOperationIdSchema,
    idempotencyKey: offlineIdempotencyKeySchema,
    draftId: offlineDraftIdSchema,
    draftLocalRevision: z.number().int().positive().safe(),
    aggregateType: offlineAggregateTypeSchema,
    aggregateId: offlineAggregateIdSchema,
    command: offlineCommandSchema,
    payload: jsonObjectSchema,
    expectedServerVersion: nonNegativeVersionSchema.nullable(),
    state: offlineOutboxStateSchema,
    attemptCount: z.number().int().nonnegative().max(100),
    nextAttemptAt: isoTimestampSchema.nullable(),
    leaseOwner: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-zA-Z0-9._:-]+$/)
      .nullable(),
    leaseExpiresAt: isoTimestampSchema.nullable(),
    lastFailure: offlineFailureSchema.nullable(),
    syncedAt: isoTimestampSchema.nullable(),
    createdAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema,
  })
  .superRefine((operation, context) => {
    addTimestampIssues(operation, context);

    const hasLease = operation.leaseOwner !== null || operation.leaseExpiresAt !== null;
    if (operation.state === "syncing") {
      if (operation.leaseOwner === null || operation.leaseExpiresAt === null) {
        context.addIssue({
          code: "custom",
          path: ["leaseOwner"],
          message: "A syncing operation requires an owner and lease expiry.",
        });
      }
    } else if (hasLease) {
      context.addIssue({
        code: "custom",
        path: ["leaseOwner"],
        message: "Only a syncing operation may hold a lease.",
      });
    }

    if (operation.state === "retry_wait" && operation.nextAttemptAt === null) {
      context.addIssue({
        code: "custom",
        path: ["nextAttemptAt"],
        message: "A retry wait operation requires its next attempt time.",
      });
    } else if (operation.state !== "retry_wait" && operation.nextAttemptAt !== null) {
      context.addIssue({
        code: "custom",
        path: ["nextAttemptAt"],
        message: "Only a retry wait operation may have a next attempt time.",
      });
    }

    if (operation.state === "synced" && operation.syncedAt === null) {
      context.addIssue({
        code: "custom",
        path: ["syncedAt"],
        message: "A synced operation requires its server acknowledgement time.",
      });
    } else if (operation.state !== "synced" && operation.syncedAt !== null) {
      context.addIssue({
        code: "custom",
        path: ["syncedAt"],
        message: "Only a synced operation may have a synced time.",
      });
    }

    if (
      (operation.state === "retry_wait" ||
        operation.state === "conflict" ||
        operation.state === "permission_blocked") &&
      operation.lastFailure === null
    ) {
      context.addIssue({
        code: "custom",
        path: ["lastFailure"],
        message: `${operation.state} requires a visible failure record.`,
      });
    }
  });

export type OfflineOutboxOperation = z.infer<typeof offlineOutboxOperationSchema>;

export type UuidFactory = () => string;

export function createClientOperationIdentity(
  uuidFactory: UuidFactory,
): Readonly<{
  clientOperationId: ClientOperationId;
  idempotencyKey: OfflineIdempotencyKey;
}> {
  return Object.freeze({
    clientOperationId: clientOperationIdSchema.parse(uuidFactory()),
    idempotencyKey: offlineIdempotencyKeySchema.parse(uuidFactory()),
  });
}

export type BuildQueuedOfflineOperationInput = Readonly<{
  clientOperationId: string;
  idempotencyKey: string;
  draft: OfflineDraft;
  command: OfflineCommand;
  now: string;
}>;

export function buildQueuedOfflineOperation(
  input: BuildQueuedOfflineOperationInput,
): OfflineOutboxOperation {
  const draft = offlineDraftSchema.parse(input.draft);
  if (draft.state !== "local_saved") {
    throw new OfflineTransitionError(draft.state, "enqueue");
  }
  offlineOutboxStateSchema.parse(transitionOfflineLifecycle(draft.state, "enqueue"));

  return offlineOutboxOperationSchema.parse({
    schemaVersion: 1,
    clientOperationId: input.clientOperationId,
    idempotencyKey: input.idempotencyKey,
    draftId: draft.draftId,
    draftLocalRevision: draft.localRevision,
    aggregateType: draft.aggregateType,
    aggregateId: draft.aggregateId,
    command: input.command,
    payload: cloneJsonObject(draft.payload),
    expectedServerVersion: draft.baseServerVersion,
    state: "queued",
    attemptCount: 0,
    nextAttemptAt: null,
    leaseOwner: null,
    leaseExpiresAt: null,
    lastFailure: null,
    syncedAt: null,
    createdAt: input.now,
    updatedAt: input.now,
  });
}

export const retryBackoffPolicySchema = z
  .strictObject({
    baseDelayMs: z.number().int().min(100).max(86_400_000),
    maxDelayMs: z.number().int().min(100).max(604_800_000),
    multiplier: z.number().finite().min(1).max(10),
    jitterRatio: z.number().finite().min(0).max(1),
    maxAttempts: z.number().int().min(1).max(50),
  })
  .superRefine((policy, context) => {
    if (policy.baseDelayMs > policy.maxDelayMs) {
      context.addIssue({
        code: "custom",
        path: ["baseDelayMs"],
        message: "Base retry delay cannot exceed its cap.",
      });
    }
  });

export type RetryBackoffPolicy = z.infer<typeof retryBackoffPolicySchema>;

export const defaultRetryBackoffPolicy: Readonly<RetryBackoffPolicy> = Object.freeze(
  retryBackoffPolicySchema.parse({
    baseDelayMs: 1_000,
    maxDelayMs: 300_000,
    multiplier: 2,
    jitterRatio: 0.2,
    maxAttempts: 8,
  }),
);

export type OfflineRetrySchedule = Readonly<{
  failureCount: number;
  nextAttemptNumber: number;
  delayMs: number;
  retryAt: string;
}>;

export type ScheduleOfflineRetryInput = Readonly<{
  failureCount: number;
  nowEpochMs: number;
  policy?: RetryBackoffPolicy;
  random: () => number;
}>;

export function scheduleOfflineRetry(
  input: ScheduleOfflineRetryInput,
): OfflineRetrySchedule | null {
  const policy = retryBackoffPolicySchema.parse(input.policy ?? defaultRetryBackoffPolicy);
  const failureCount = z.number().int().positive().max(100).parse(input.failureCount);
  const nowEpochMs = z.number().int().nonnegative().safe().parse(input.nowEpochMs);

  if (failureCount >= policy.maxAttempts) return null;

  const randomValue = z.number().finite().min(0).max(1).parse(input.random());
  const exponentialDelay = policy.baseDelayMs * policy.multiplier ** (failureCount - 1);
  const boundedDelay = Number.isFinite(exponentialDelay)
    ? Math.min(policy.maxDelayMs, exponentialDelay)
    : policy.maxDelayMs;
  const jitterMultiplier = 1 + (randomValue * 2 - 1) * policy.jitterRatio;
  const delayMs = Math.min(
    policy.maxDelayMs,
    Math.max(0, Math.round(boundedDelay * jitterMultiplier)),
  );
  const retryDate = new Date(nowEpochMs + delayMs);
  if (Number.isNaN(retryDate.getTime())) {
    throw new RangeError("Retry timestamp exceeds the supported date range.");
  }

  return Object.freeze({
    failureCount,
    nextAttemptNumber: failureCount + 1,
    delayMs,
    retryAt: retryDate.toISOString(),
  });
}

export const offlineDraftAndOperationCommitSchema = z
  .strictObject({
    draft: offlineDraftSchema,
    operation: offlineOutboxOperationSchema,
    expectedLocalRevision: nonNegativeVersionSchema,
  })
  .superRefine((commit, context) => {
    if (commit.draft.state !== "local_saved") {
      context.addIssue({
        code: "custom",
        path: ["draft", "state"],
        message: "Only a locally saved draft can be committed to the outbox.",
      });
    }
    if (commit.operation.state !== "queued") {
      context.addIssue({
        code: "custom",
        path: ["operation", "state"],
        message: "A new outbox operation must start queued.",
      });
    }
    if (
      commit.draft.draftId !== commit.operation.draftId ||
      commit.draft.aggregateId !== commit.operation.aggregateId ||
      commit.draft.aggregateType !== commit.operation.aggregateType ||
      commit.draft.localRevision !== commit.operation.draftLocalRevision
    ) {
      context.addIssue({
        code: "custom",
        path: ["operation"],
        message: "Outbox operation must snapshot the same draft aggregate and revision.",
      });
    }
    if (
      commit.draft.localRevision < commit.expectedLocalRevision ||
      commit.draft.localRevision > commit.expectedLocalRevision + 1
    ) {
      context.addIssue({
        code: "custom",
        path: ["expectedLocalRevision"],
        message: "Committed draft must be the expected revision or its immediate successor.",
      });
    }
  });

export type OfflineDraftAndOperationCommit = z.infer<
  typeof offlineDraftAndOperationCommitSchema
>;

export type OfflineDraftWriteResult =
  | Readonly<{ status: "saved"; draft: OfflineDraft }>
  | Readonly<{ status: "conflict"; currentDraft: OfflineDraft }>
  | Readonly<{ status: "not_found" }>;

export type OfflineDraftAndOperationCommitResult =
  | Readonly<{
      status: "committed";
      draft: OfflineDraft;
      operation: OfflineOutboxOperation;
    }>
  | Readonly<{
      status: "duplicate";
      draft: OfflineDraft;
      operation: OfflineOutboxOperation;
    }>
  | Readonly<{
      status: "idempotency_conflict";
      existingOperationId: ClientOperationId;
    }>
  | Readonly<{ status: "draft_conflict"; currentDraft: OfflineDraft }>;

export type OfflineOperationWriteResult =
  | Readonly<{ status: "saved"; operation: OfflineOutboxOperation }>
  | Readonly<{ status: "conflict"; currentOperation: OfflineOutboxOperation }>
  | Readonly<{ status: "not_found" }>;

export type ClaimReadyOfflineOperationsInput = Readonly<{
  now: string;
  limit: number;
  leaseOwner: string;
  leaseExpiresAt: string;
}>;

export const claimReadyOfflineOperationsSchema = z
  .strictObject({
    now: isoTimestampSchema,
    limit: positiveLimitSchema,
    leaseOwner: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9._:-]+$/),
    leaseExpiresAt: isoTimestampSchema,
  })
  .superRefine((claim, context) => {
    if (Date.parse(claim.leaseExpiresAt) <= Date.parse(claim.now)) {
      context.addIssue({
        code: "custom",
        path: ["leaseExpiresAt"],
        message: "A sync lease must expire after its claim time.",
      });
    }
  });

/**
 * Durable local persistence boundary. `commitDraftAndEnqueue` and
 * `claimReadyOperations` must each be implemented as one atomic SQLite
 * transaction. The port avoids leaking database callbacks across a native IPC
 * boundary and keeps optimistic concurrency explicit.
 */
export interface OfflineStoragePort {
  getDraft(draftId: OfflineDraftId): Promise<OfflineDraft | null>;
  saveDraft(input: Readonly<{
    draft: OfflineDraft;
    expectedLocalRevision: number | null;
  }>): Promise<OfflineDraftWriteResult>;
  commitDraftAndEnqueue(
    input: OfflineDraftAndOperationCommit,
  ): Promise<OfflineDraftAndOperationCommitResult>;
  getOperation(clientOperationId: ClientOperationId): Promise<OfflineOutboxOperation | null>;
  getOperationByIdempotencyKey(
    idempotencyKey: OfflineIdempotencyKey,
  ): Promise<OfflineOutboxOperation | null>;
  claimReadyOperations(
    input: ClaimReadyOfflineOperationsInput,
  ): Promise<readonly OfflineOutboxOperation[]>;
  compareAndSetOperation(input: Readonly<{
    operation: OfflineOutboxOperation;
    expectedState: OfflineOutboxState;
    expectedAttemptCount: number;
  }>): Promise<OfflineOperationWriteResult>;
  countPendingOperations(): Promise<number>;
}
