import Database from "@tauri-apps/plugin-sql";
import { z } from "zod";
import {
  draftEntityTypes,
  draftStatuses,
  outboxStates,
  type LocalOfficeDraft,
  type SyncOutboxCommand,
} from "./model";

export type OfflineWorkspaceSnapshot = {
  readonly drafts: readonly LocalOfficeDraft[];
  readonly outbox: readonly SyncOutboxCommand[];
  readonly storage: "sqlite" | "browser-preview";
};

export interface OfflineOfficeRepository {
  load(): Promise<OfflineWorkspaceSnapshot>;
  saveDraftAndQueue(draft: LocalOfficeDraft, command: SyncOutboxCommand): Promise<void>;
}

const invoicePayloadSchema = z.object({
  customerName: z.string(),
  purpose: z.string(),
  amountMinor: z.number().int().positive(),
  notes: z.string(),
  currency: z.literal("BDT"),
  locale: z.enum(["en-BD", "bn-BD"]),
});

const draftSchema = z.object({
  id: z.string().uuid(),
  entityType: z.literal("invoice"),
  status: z.enum(draftStatuses),
  localRevision: z.number().int().positive(),
  payload: invoicePayloadSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const outboxSchema = z.object({
  id: z.string().uuid(),
  draftId: z.string().uuid(),
  idempotencyKey: z.string().min(1),
  commandType: z.literal("office.invoice.draft.upsert"),
  payload: draftSchema,
  state: z.enum(outboxStates),
  attemptCount: z.number().int().nonnegative(),
  nextAttemptAt: z.string().nullable(),
  leaseUntil: z.string().nullable(),
  lastErrorCode: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const browserEnvelopeSchema = z.object({
  drafts: z.array(draftSchema),
  outbox: z.array(outboxSchema),
});

type SqlDraftRow = {
  readonly id: string;
  readonly entity_type: (typeof draftEntityTypes)[number];
  readonly status: (typeof draftStatuses)[number];
  readonly local_revision: number;
  readonly payload_json: string;
  readonly created_at: string;
  readonly updated_at: string;
};

type SqlOutboxRow = {
  readonly id: string;
  readonly draft_id: string;
  readonly idempotency_key: string;
  readonly command_type: string;
  readonly payload_json: string;
  readonly state: (typeof outboxStates)[number];
  readonly attempt_count: number;
  readonly next_attempt_at: string | null;
  readonly lease_until: string | null;
  readonly last_error_code: string | null;
  readonly created_at: string;
  readonly updated_at: string;
};

function parseJson(input: string): unknown {
  return JSON.parse(input) as unknown;
}

class SqliteOfficeRepository implements OfflineOfficeRepository {
  constructor(private readonly database: Database) {}

  async load(): Promise<OfflineWorkspaceSnapshot> {
    const [draftRows, outboxRows] = await Promise.all([
      this.database.select<SqlDraftRow[]>(
        "SELECT id, entity_type, status, local_revision, payload_json, created_at, updated_at FROM local_drafts ORDER BY updated_at DESC LIMIT 100",
      ),
      this.database.select<SqlOutboxRow[]>(
        "SELECT id, draft_id, idempotency_key, command_type, payload_json, state, attempt_count, next_attempt_at, lease_until, last_error_code, created_at, updated_at FROM sync_outbox ORDER BY created_at DESC LIMIT 200",
      ),
    ]);

    const drafts = draftRows.map((row) => draftSchema.parse({
      id: row.id,
      entityType: row.entity_type,
      status: row.status,
      localRevision: row.local_revision,
      payload: parseJson(row.payload_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    const outbox = outboxRows.map((row) => outboxSchema.parse({
      id: row.id,
      draftId: row.draft_id,
      idempotencyKey: row.idempotency_key,
      commandType: row.command_type,
      payload: parseJson(row.payload_json),
      state: row.state,
      attemptCount: row.attempt_count,
      nextAttemptAt: row.next_attempt_at,
      leaseUntil: row.lease_until,
      lastErrorCode: row.last_error_code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    return { drafts, outbox, storage: "sqlite" };
  }

  async saveDraftAndQueue(draft: LocalOfficeDraft, command: SyncOutboxCommand) {
    await this.database.execute("BEGIN IMMEDIATE");
    try {
      await this.database.execute(
        `INSERT INTO local_drafts (id, entity_type, status, local_revision, payload_json, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT(id) DO UPDATE SET status = excluded.status, local_revision = excluded.local_revision,
           payload_json = excluded.payload_json, updated_at = excluded.updated_at`,
        [draft.id, draft.entityType, draft.status, draft.localRevision, JSON.stringify(draft.payload), draft.createdAt, draft.updatedAt],
      );
      await this.database.execute(
        `INSERT INTO sync_outbox (id, draft_id, idempotency_key, command_type, payload_json, state, attempt_count,
           next_attempt_at, lease_until, last_error_code, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT(idempotency_key) DO NOTHING`,
        [command.id, command.draftId, command.idempotencyKey, command.commandType, JSON.stringify(command.payload), command.state,
          command.attemptCount, command.nextAttemptAt, command.leaseUntil, command.lastErrorCode, command.createdAt, command.updatedAt],
      );
      await this.database.execute("COMMIT");
    } catch (error) {
      await this.database.execute("ROLLBACK");
      throw error;
    }
  }
}

const BROWSER_STORE_KEY = "abdullah-properties-office-preview-v1";

class BrowserPreviewRepository implements OfflineOfficeRepository {
  private readEnvelope() {
    const stored = window.localStorage.getItem(BROWSER_STORE_KEY);
    if (!stored) return { drafts: [], outbox: [] };
    const result = browserEnvelopeSchema.safeParse(parseJson(stored));
    return result.success ? result.data : { drafts: [], outbox: [] };
  }

  async load(): Promise<OfflineWorkspaceSnapshot> {
    const envelope = this.readEnvelope();
    return { drafts: envelope.drafts, outbox: envelope.outbox, storage: "browser-preview" };
  }

  async saveDraftAndQueue(draft: LocalOfficeDraft, command: SyncOutboxCommand) {
    const envelope = this.readEnvelope();
    const drafts = [draft, ...envelope.drafts.filter((item) => item.id !== draft.id)];
    const outbox = envelope.outbox.some((item) => item.idempotencyKey === command.idempotencyKey)
      ? envelope.outbox
      : [command, ...envelope.outbox];
    window.localStorage.setItem(BROWSER_STORE_KEY, JSON.stringify({ drafts, outbox }));
  }
}

let repositoryPromise: Promise<OfflineOfficeRepository> | null = null;

export function createOfflineOfficeRepository() {
  repositoryPromise ??= "__TAURI_INTERNALS__" in window
    ? Database.load("sqlite:abdullah-office.db").then((database) => new SqliteOfficeRepository(database))
    : Promise.resolve(new BrowserPreviewRepository());
  return repositoryPromise;
}
