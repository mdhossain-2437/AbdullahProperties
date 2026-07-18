import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import { z } from "zod";
import {
  offlineDraftAndOperationCommitSchema,
  offlineDraftSchema,
  offlineOutboxOperationSchema,
  type OfflineDraft,
  type OfflineDraftAndOperationCommit,
  type OfflineOutboxOperation,
} from "../../../../features/office/offline-core.ts";
import {
  localRecordKinds,
  parseLocalOfficeRecord,
  type FormDraftEnvelope,
  type LocalOfficeRecord,
  type LocalRecordKind,
} from "./model";

export type OfflineWorkspaceSnapshot = Readonly<{
  records: readonly LocalOfficeRecord[];
  outbox: readonly OfflineOutboxOperation[];
  formDrafts: readonly FormDraftEnvelope[];
  legacyRecovery: Readonly<{
    drafts: readonly LegacyRecoveryDraft[];
    outboxCount: number;
  }>;
  storage: "sqlite" | "browser-preview";
}>;

export type LegacyRecoveryDraft = Readonly<{
  id: string;
  entityType: "lead" | "invoice" | "payment" | "notice";
  legacyStatus: string;
  localRevision: number;
  payload: unknown;
  updatedAt: string;
}>;

export interface OfflineOfficeRepository {
  load(): Promise<OfflineWorkspaceSnapshot>;
  commitRecord(input: OfflineDraftAndOperationCommit): Promise<"committed" | "duplicate">;
  saveFormDraft(input: FormDraftEnvelope): Promise<void>;
  clearFormDraft(kind: LocalRecordKind): Promise<void>;
}

type SqlDraftRow = {
  readonly schema_version: number;
  readonly draft_id: string;
  readonly aggregate_type: string;
  readonly aggregate_id: string;
  readonly state: string;
  readonly payload_json: string;
  readonly local_revision: number;
  readonly base_server_version: number | null;
  readonly last_saved_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
};

type SqlOperationRow = {
  readonly schema_version: number;
  readonly client_operation_id: string;
  readonly idempotency_key: string;
  readonly draft_id: string;
  readonly draft_local_revision: number;
  readonly aggregate_type: string;
  readonly aggregate_id: string;
  readonly command: string;
  readonly payload_json: string;
  readonly expected_server_version: number | null;
  readonly state: string;
  readonly attempt_count: number;
  readonly next_attempt_at: string | null;
  readonly lease_owner: string | null;
  readonly lease_expires_at: string | null;
  readonly last_failure_json: string | null;
  readonly synced_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
};

type SqlFormDraftRow = {
  readonly record_kind: string;
  readonly payload_json: string;
  readonly updated_at: string;
};

type SqlLegacyDraftRow = {
  readonly legacy_draft_id: string;
  readonly entity_type: "lead" | "invoice" | "payment" | "notice";
  readonly legacy_status: string;
  readonly local_revision: number;
  readonly payload_json: string;
  readonly updated_at: string;
};

const localRecordKindSchema = z.enum(localRecordKinds);
const isoTimestampSchema = z.string().datetime({ offset: true });
const stringRecordSchema = z.record(z.string(), z.string());
const browserEnvelopeSchema = z.strictObject({
  drafts: z.array(offlineDraftSchema),
  outbox: z.array(offlineOutboxOperationSchema),
  formDrafts: z.array(z.strictObject({
    kind: localRecordKindSchema,
    payload: stringRecordSchema,
    updatedAt: isoTimestampSchema,
  })),
});

function parseJson(input: string): unknown {
  return JSON.parse(input) as unknown;
}

function parseFormDraft(value: unknown): FormDraftEnvelope {
  const parsed = z.strictObject({
    kind: localRecordKindSchema,
    payload: stringRecordSchema,
    updatedAt: isoTimestampSchema,
  }).parse(value);
  return { kind: parsed.kind, payload: parsed.payload, updatedAt: parsed.updatedAt };
}

function draftFromRow(row: SqlDraftRow): OfflineDraft {
  return offlineDraftSchema.parse({
    schemaVersion: row.schema_version,
    draftId: row.draft_id,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    state: row.state,
    payload: parseJson(row.payload_json),
    localRevision: row.local_revision,
    baseServerVersion: row.base_server_version,
    lastSavedAt: row.last_saved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function operationFromRow(row: SqlOperationRow): OfflineOutboxOperation {
  return offlineOutboxOperationSchema.parse({
    schemaVersion: row.schema_version,
    clientOperationId: row.client_operation_id,
    idempotencyKey: row.idempotency_key,
    draftId: row.draft_id,
    draftLocalRevision: row.draft_local_revision,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    command: row.command,
    payload: parseJson(row.payload_json),
    expectedServerVersion: row.expected_server_version,
    state: row.state,
    attemptCount: row.attempt_count,
    nextAttemptAt: row.next_attempt_at,
    leaseOwner: row.lease_owner,
    leaseExpiresAt: row.lease_expires_at,
    lastFailure: row.last_failure_json === null ? null : parseJson(row.last_failure_json),
    syncedAt: row.synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function formDraftFromRow(row: SqlFormDraftRow): FormDraftEnvelope {
  return parseFormDraft({
    kind: row.record_kind,
    payload: parseJson(row.payload_json),
    updatedAt: row.updated_at,
  });
}

function canonicalOperationValue(operation: OfflineOutboxOperation) {
  return JSON.stringify({
    clientOperationId: operation.clientOperationId,
    draftId: operation.draftId,
    draftLocalRevision: operation.draftLocalRevision,
    aggregateType: operation.aggregateType,
    aggregateId: operation.aggregateId,
    command: operation.command,
    payload: operation.payload,
    expectedServerVersion: operation.expectedServerVersion,
  });
}

class SqliteOfficeRepository implements OfflineOfficeRepository {
  constructor(private readonly database: Database) {}

  async load(): Promise<OfflineWorkspaceSnapshot> {
    const [draftRows, operationRows, formRows, legacyRows, legacyOutboxRows] = await Promise.all([
      this.database.select<SqlDraftRow[]>(
        `SELECT schema_version, draft_id, aggregate_type, aggregate_id, state, payload_json,
                local_revision, base_server_version, last_saved_at, created_at, updated_at
           FROM office_offline_drafts
          ORDER BY updated_at DESC
          LIMIT 500`,
      ),
      this.database.select<SqlOperationRow[]>(
        `SELECT schema_version, client_operation_id, idempotency_key, draft_id,
                draft_local_revision, aggregate_type, aggregate_id, command, payload_json,
                expected_server_version, state, attempt_count, next_attempt_at, lease_owner,
                lease_expires_at, last_failure_json, synced_at, created_at, updated_at
           FROM office_sync_operations
          ORDER BY created_at DESC
          LIMIT 1_000`,
      ),
      this.database.select<SqlFormDraftRow[]>(
        `SELECT record_kind, payload_json, updated_at
           FROM office_form_autosaves
          ORDER BY updated_at DESC`,
      ),
      this.database.select<SqlLegacyDraftRow[]>(
        `SELECT legacy_draft_id, entity_type, legacy_status, local_revision,
                payload_json, updated_at
           FROM office_legacy_v1_drafts
          WHERE recovery_state = 'requires_review'
          ORDER BY updated_at DESC
          LIMIT 200`,
      ),
      this.database.select<Array<{ readonly count: number }>>(
        `SELECT COUNT(*) AS count
           FROM office_legacy_v1_outbox outbox
           INNER JOIN office_legacy_v1_drafts draft
             ON draft.legacy_draft_id = outbox.legacy_draft_id
          WHERE draft.recovery_state = 'requires_review'`,
      ),
    ]);

    return {
      records: draftRows.map(draftFromRow).map(parseLocalOfficeRecord),
      outbox: operationRows.map(operationFromRow),
      formDrafts: formRows.map(formDraftFromRow),
      legacyRecovery: {
        drafts: legacyRows.map((row) => ({
          id: row.legacy_draft_id,
          entityType: row.entity_type,
          legacyStatus: row.legacy_status,
          localRevision: row.local_revision,
          payload: parseJson(row.payload_json),
          updatedAt: row.updated_at,
        })),
        outboxCount: legacyOutboxRows[0]?.count ?? 0,
      },
      storage: "sqlite",
    };
  }

  async commitRecord(value: OfflineDraftAndOperationCommit) {
    const input = offlineDraftAndOperationCommitSchema.parse(value);
    return invoke<"committed" | "duplicate">("commit_offline_record", { value: input });
  }

  async saveFormDraft(value: FormDraftEnvelope) {
    const input = parseFormDraft(value);
    await this.database.execute(
      `INSERT INTO office_form_autosaves (record_kind, payload_json, updated_at)
       VALUES ($1, $2, $3)
       ON CONFLICT(record_kind) DO UPDATE SET
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at`,
      [input.kind, JSON.stringify(input.payload), input.updatedAt],
    );
  }

  async clearFormDraft(kind: LocalRecordKind) {
    await this.database.execute("DELETE FROM office_form_autosaves WHERE record_kind = $1", [
      localRecordKindSchema.parse(kind),
    ]);
  }
}

const BROWSER_STORE_KEY = "abdullah-properties-office-preview-v2";

class BrowserPreviewRepository implements OfflineOfficeRepository {
  private readEnvelope() {
    const stored = window.localStorage.getItem(BROWSER_STORE_KEY);
    if (!stored) return browserEnvelopeSchema.parse({ drafts: [], outbox: [], formDrafts: [] });
    const result = browserEnvelopeSchema.safeParse(parseJson(stored));
    if (!result.success) {
      throw new Error("The browser preview workspace is damaged. Clear only the preview storage and try again.");
    }
    return result.data;
  }

  private writeEnvelope(envelope: z.infer<typeof browserEnvelopeSchema>) {
    window.localStorage.setItem(BROWSER_STORE_KEY, JSON.stringify(envelope));
  }

  async load(): Promise<OfflineWorkspaceSnapshot> {
    const envelope = this.readEnvelope();
    return {
      records: envelope.drafts.map(parseLocalOfficeRecord),
      outbox: envelope.outbox,
      formDrafts: envelope.formDrafts.map(parseFormDraft),
      legacyRecovery: { drafts: [], outboxCount: 0 },
      storage: "browser-preview",
    };
  }

  async commitRecord(value: OfflineDraftAndOperationCommit) {
    const input = offlineDraftAndOperationCommitSchema.parse(value);
    const envelope = this.readEnvelope();
    const duplicate = envelope.outbox.find((item) => item.idempotencyKey === input.operation.idempotencyKey);
    if (duplicate) {
      if (canonicalOperationValue(duplicate) !== canonicalOperationValue(input.operation)) {
        throw new Error("An idempotency key already belongs to a different preview operation.");
      }
      return "duplicate" as const;
    }

    const currentDraft = envelope.drafts.find((item) => item.draftId === input.draft.draftId);
    const currentRevision = currentDraft?.localRevision ?? 0;
    if (currentRevision !== input.expectedLocalRevision) {
      throw new Error("The preview record changed before it could be queued.");
    }

    this.writeEnvelope({
      drafts: [input.draft, ...envelope.drafts.filter((item) => item.draftId !== input.draft.draftId)],
      outbox: [input.operation, ...envelope.outbox],
      formDrafts: envelope.formDrafts,
    });
    return "committed" as const;
  }

  async saveFormDraft(value: FormDraftEnvelope) {
    const input = parseFormDraft(value);
    const envelope = this.readEnvelope();
    this.writeEnvelope({
      ...envelope,
      formDrafts: [input, ...envelope.formDrafts.filter((item) => item.kind !== input.kind)],
    });
  }

  async clearFormDraft(kind: LocalRecordKind) {
    const parsedKind = localRecordKindSchema.parse(kind);
    const envelope = this.readEnvelope();
    this.writeEnvelope({
      ...envelope,
      formDrafts: envelope.formDrafts.filter((item) => item.kind !== parsedKind),
    });
  }
}

let repositoryPromise: Promise<OfflineOfficeRepository> | null = null;

export function createOfflineOfficeRepository() {
  repositoryPromise ??= "__TAURI_INTERNALS__" in window
    ? Database.load("sqlite:abdullah-office.db").then((database) => new SqliteOfficeRepository(database))
    : Promise.resolve(new BrowserPreviewRepository());
  return repositoryPromise;
}
