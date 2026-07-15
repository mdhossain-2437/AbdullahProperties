export const draftEntityTypes = ["lead", "invoice", "payment", "notice"] as const;
export const draftStatuses = ["local_draft", "queued", "syncing", "synced", "conflict", "failed"] as const;
export const outboxStates = ["pending", "in_flight", "acknowledged", "dead_letter"] as const;

export type DraftEntityType = (typeof draftEntityTypes)[number];
export type DraftStatus = (typeof draftStatuses)[number];
export type OutboxState = (typeof outboxStates)[number];

export type InvoiceDraftPayload = {
  readonly customerName: string;
  readonly purpose: string;
  readonly amountMinor: number;
  readonly notes: string;
  readonly currency: "BDT";
  readonly locale: "en-BD" | "bn-BD";
};

export type LocalOfficeDraft = {
  readonly id: string;
  readonly entityType: "invoice";
  readonly status: DraftStatus;
  readonly localRevision: number;
  readonly payload: InvoiceDraftPayload;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type SyncOutboxCommand = {
  readonly id: string;
  readonly draftId: string;
  readonly idempotencyKey: string;
  readonly commandType: "office.invoice.draft.upsert";
  readonly payload: LocalOfficeDraft;
  readonly state: OutboxState;
  readonly attemptCount: number;
  readonly nextAttemptAt: string | null;
  readonly leaseUntil: string | null;
  readonly lastErrorCode: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type DraftInput = {
  readonly customerName: string;
  readonly purpose: string;
  readonly amount: string;
  readonly notes: string;
  readonly locale: "en-BD" | "bn-BD";
};

type ModelContext = {
  readonly now?: () => Date;
  readonly createId?: () => string;
};

export type DraftValidationResult =
  | { readonly ok: true; readonly value: InvoiceDraftPayload }
  | { readonly ok: false; readonly message: string };

function normalizeText(value: string, maximumLength: number) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maximumLength);
}

export function parseBdtToMinorUnits(input: string): number | null {
  const normalized = input.trim().replaceAll(",", "");
  const match = /^(0|[1-9]\d{0,10})(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return null;

  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? "").padEnd(2, "0"));
  const minor = whole * 100n + fraction;
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(minor);
}

export function validateDraftInput(input: DraftInput): DraftValidationResult {
  const customerName = normalizeText(input.customerName, 100);
  const purpose = normalizeText(input.purpose, 140);
  const notes = normalizeText(input.notes, 500);
  const amountMinor = parseBdtToMinorUnits(input.amount);

  if (customerName.length < 2) return { ok: false, message: "Enter a customer or account name." };
  if (purpose.length < 3) return { ok: false, message: "Describe what this draft is for." };
  if (amountMinor === null || amountMinor <= 0) return { ok: false, message: "Enter a valid BDT amount greater than zero." };

  return {
    ok: true,
    value: {
      customerName,
      purpose,
      amountMinor,
      notes,
      currency: "BDT",
      locale: input.locale,
    },
  };
}

export function createLocalInvoiceDraft(input: DraftInput, context: ModelContext = {}): DraftValidationResult & { readonly draft?: LocalOfficeDraft } {
  const validation = validateDraftInput(input);
  if (!validation.ok) return validation;

  const now = (context.now ?? (() => new Date()))().toISOString();
  const id = (context.createId ?? (() => crypto.randomUUID()))();
  return {
    ok: true,
    value: validation.value,
    draft: {
      id,
      entityType: "invoice",
      status: "queued",
      localRevision: 1,
      payload: validation.value,
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function createDraftUpsertCommand(draft: LocalOfficeDraft, context: ModelContext = {}): SyncOutboxCommand {
  const now = (context.now ?? (() => new Date()))().toISOString();
  const id = (context.createId ?? (() => crypto.randomUUID()))();
  return {
    id,
    draftId: draft.id,
    idempotencyKey: `desktop:${draft.id}:revision:${draft.localRevision}:invoice-draft-upsert:v1`,
    commandType: "office.invoice.draft.upsert",
    payload: draft,
    state: "pending",
    attemptCount: 0,
    nextAttemptAt: null,
    leaseUntil: null,
    lastErrorCode: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function provisionalInvoiceNumber(draft: LocalOfficeDraft) {
  const day = draft.createdAt.slice(0, 10).replaceAll("-", "");
  return `LOCAL-${day}-${draft.id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

export function formatBdt(amountMinor: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}
