import { z } from "zod";
import {
  buildQueuedOfflineOperation,
  completeOfflineDraftAutosave,
  createClientOperationIdentity,
  createOfflineDraft,
  offlineDraftAndOperationCommitSchema,
  offlineDraftSchema,
  offlineOutboxOperationSchema,
  type JsonObject,
  type OfflineDraft,
  type OfflineDraftAndOperationCommit,
  type OfflineOutboxOperation,
} from "../../../../features/office/offline-core.ts";

export const localRecordKinds = [
  "lead",
  "invoice_draft",
  "payment_acknowledgement",
  "notice_draft",
] as const;

export type LocalRecordKind = (typeof localRecordKinds)[number];
export type OfficeLocale = "en" | "bn";

export type LeadDraftInput = {
  readonly customerName: string;
  readonly phone: string;
  readonly interest: string;
  readonly location: string;
  readonly followUpDate: string;
  readonly priority: "normal" | "high";
  readonly notes: string;
};

export type InvoiceDraftInput = {
  readonly customerName: string;
  readonly phone: string;
  readonly email: string;
  readonly purpose: string;
  readonly amount: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly locale: OfficeLocale;
  readonly notes: string;
};

export type PaymentDraftInput = {
  readonly customerName: string;
  readonly phone: string;
  readonly email: string;
  readonly amount: string;
  readonly method: "cash" | "bank_transfer" | "mobile_financial_service" | "cheque";
  readonly reference: string;
  readonly paidAt: string;
  readonly invoiceReference: string;
  readonly locale: OfficeLocale;
  readonly notes: string;
};

export type NoticeDraftInput = {
  readonly recipientName: string;
  readonly phone: string;
  readonly email: string;
  readonly subject: string;
  readonly body: string;
  readonly effectiveDate: string;
  readonly locale: OfficeLocale;
};

export type LocalRecordInput =
  | Readonly<{ kind: "lead"; input: LeadDraftInput }>
  | Readonly<{ kind: "invoice_draft"; input: InvoiceDraftInput }>
  | Readonly<{ kind: "payment_acknowledgement"; input: PaymentDraftInput }>
  | Readonly<{ kind: "notice_draft"; input: NoticeDraftInput }>;

const leadFormSchema = z.strictObject({
  customerName: z.string(),
  phone: z.string(),
  interest: z.string(),
  location: z.string(),
  followUpDate: z.string(),
  priority: z.enum(["normal", "high"]),
  notes: z.string(),
});
const invoiceFormSchema = z.strictObject({
  customerName: z.string(),
  phone: z.string(),
  email: z.string(),
  purpose: z.string(),
  amount: z.string(),
  issueDate: z.string(),
  dueDate: z.string(),
  locale: z.enum(["en", "bn"]),
  notes: z.string(),
});
const paymentFormSchema = z.strictObject({
  customerName: z.string(),
  phone: z.string(),
  email: z.string(),
  amount: z.string(),
  method: z.enum(["cash", "bank_transfer", "mobile_financial_service", "cheque"]),
  reference: z.string(),
  paidAt: z.string(),
  invoiceReference: z.string(),
  locale: z.enum(["en", "bn"]),
  notes: z.string(),
});
const noticeFormSchema = z.strictObject({
  recipientName: z.string(),
  phone: z.string(),
  email: z.string(),
  subject: z.string(),
  body: z.string(),
  effectiveDate: z.string(),
  locale: z.enum(["en", "bn"]),
});

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid calendar date.");
const optionalEmailSchema = z.union([z.literal(""), z.string().email().max(160)]);
const optionalPhoneSchema = z
  .string()
  .max(32)
  .refine((value) => value === "" || /^\+?[0-9][0-9\s-]{7,30}$/.test(value), "Enter a valid phone number.");

function normalizeText(value: string, maximumLength: number) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function normalizeMultilineText(value: string, maximumLength: number) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[\u0001-\u0009\u000b-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim())
    .join("\n")
    .trim()
    .slice(0, maximumLength);
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

const leadPayloadSchema = z.strictObject({
  customerName: z.string().min(2).max(100),
  phone: optionalPhoneSchema,
  interest: z.string().min(3).max(160),
  location: z.string().max(120),
  followUpDate: z.union([z.literal(""), isoDateSchema]),
  priority: z.enum(["normal", "high"]),
  notes: z.string().max(1_000),
});

const invoicePayloadSchema = z.strictObject({
  customerName: z.string().min(2).max(100),
  phone: optionalPhoneSchema,
  email: optionalEmailSchema,
  purpose: z.string().min(3).max(160),
  amountMinor: z.number().int().positive().safe(),
  currency: z.literal("BDT"),
  issueDate: isoDateSchema,
  dueDate: isoDateSchema,
  locale: z.enum(["en", "bn"]),
  notes: z.string().max(1_000),
});

const paymentPayloadSchema = z.strictObject({
  customerName: z.string().min(2).max(100),
  phone: optionalPhoneSchema,
  email: optionalEmailSchema,
  amountMinor: z.number().int().positive().safe(),
  currency: z.literal("BDT"),
  method: z.enum(["cash", "bank_transfer", "mobile_financial_service", "cheque"]),
  reference: z.string().max(120),
  paidAt: isoDateSchema,
  invoiceReference: z.string().max(120),
  locale: z.enum(["en", "bn"]),
  notes: z.string().max(1_000),
});

const noticePayloadSchema = z.strictObject({
  recipientName: z.string().min(2).max(100),
  phone: optionalPhoneSchema,
  email: optionalEmailSchema,
  subject: z.string().min(3).max(180),
  body: z.string().min(10).max(4_000),
  effectiveDate: isoDateSchema,
  locale: z.enum(["en", "bn"]),
});

export type LeadDraftPayload = z.infer<typeof leadPayloadSchema>;
export type InvoiceDraftPayload = z.infer<typeof invoicePayloadSchema>;
export type PaymentDraftPayload = z.infer<typeof paymentPayloadSchema>;
export type NoticeDraftPayload = z.infer<typeof noticePayloadSchema>;
export type LocalRecordPayload =
  | LeadDraftPayload
  | InvoiceDraftPayload
  | PaymentDraftPayload
  | NoticeDraftPayload;

export type LocalOfficeRecord =
  | Readonly<{ kind: "lead"; draft: OfflineDraft; payload: LeadDraftPayload }>
  | Readonly<{ kind: "invoice_draft"; draft: OfflineDraft; payload: InvoiceDraftPayload }>
  | Readonly<{ kind: "payment_acknowledgement"; draft: OfflineDraft; payload: PaymentDraftPayload }>
  | Readonly<{ kind: "notice_draft"; draft: OfflineDraft; payload: NoticeDraftPayload }>;

export type FormDraftEnvelope = Readonly<{
  kind: LocalRecordKind;
  payload: Readonly<Record<string, string>>;
  updatedAt: string;
}>;

export type LocalRecordValidationResult =
  | Readonly<{ ok: false; message: string }>
  | Readonly<{
      ok: true;
      draft: OfflineDraft;
      operation: OfflineOutboxOperation;
      commit: OfflineDraftAndOperationCommit;
    }>;

type ModelContext = {
  readonly now?: () => Date;
  readonly createId?: () => string;
};

function validationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Review the highlighted record details.";
}

function parseLeadInput(input: LeadDraftInput): LeadDraftPayload {
  return leadPayloadSchema.parse({
    customerName: normalizeText(input.customerName, 100),
    phone: normalizeText(input.phone, 32),
    interest: normalizeText(input.interest, 160),
    location: normalizeText(input.location, 120),
    followUpDate: input.followUpDate.trim(),
    priority: input.priority,
    notes: normalizeMultilineText(input.notes, 1_000),
  });
}

function parseInvoiceInput(input: InvoiceDraftInput): InvoiceDraftPayload {
  const amountMinor = parseBdtToMinorUnits(input.amount);
  if (amountMinor === null || amountMinor <= 0) throw new Error("Enter a valid BDT amount greater than zero.");
  if (input.dueDate < input.issueDate) throw new Error("Due date cannot be before the issue date.");

  return invoicePayloadSchema.parse({
    customerName: normalizeText(input.customerName, 100),
    phone: normalizeText(input.phone, 32),
    email: normalizeText(input.email, 160).toLowerCase(),
    purpose: normalizeText(input.purpose, 160),
    amountMinor,
    currency: "BDT",
    issueDate: input.issueDate.trim(),
    dueDate: input.dueDate.trim(),
    locale: input.locale,
    notes: normalizeMultilineText(input.notes, 1_000),
  });
}

function parsePaymentInput(input: PaymentDraftInput): PaymentDraftPayload {
  const amountMinor = parseBdtToMinorUnits(input.amount);
  if (amountMinor === null || amountMinor <= 0) throw new Error("Enter a valid BDT amount greater than zero.");

  return paymentPayloadSchema.parse({
    customerName: normalizeText(input.customerName, 100),
    phone: normalizeText(input.phone, 32),
    email: normalizeText(input.email, 160).toLowerCase(),
    amountMinor,
    currency: "BDT",
    method: input.method,
    reference: normalizeText(input.reference, 120),
    paidAt: input.paidAt.trim(),
    invoiceReference: normalizeText(input.invoiceReference, 120),
    locale: input.locale,
    notes: normalizeMultilineText(input.notes, 1_000),
  });
}

function parseNoticeInput(input: NoticeDraftInput): NoticeDraftPayload {
  return noticePayloadSchema.parse({
    recipientName: normalizeText(input.recipientName, 100),
    phone: normalizeText(input.phone, 32),
    email: normalizeText(input.email, 160).toLowerCase(),
    subject: normalizeText(input.subject, 180),
    body: normalizeMultilineText(input.body, 4_000),
    effectiveDate: input.effectiveDate.trim(),
    locale: input.locale,
  });
}

function payloadForInput(record: LocalRecordInput): Readonly<{ payload: JsonObject; kind: LocalRecordKind }> {
  switch (record.kind) {
    case "lead":
      return { kind: record.kind, payload: parseLeadInput(record.input) };
    case "invoice_draft":
      return { kind: record.kind, payload: parseInvoiceInput(record.input) };
    case "payment_acknowledgement":
      return { kind: record.kind, payload: parsePaymentInput(record.input) };
    case "notice_draft":
      return { kind: record.kind, payload: parseNoticeInput(record.input) };
  }
}

export function createQueuedLocalRecord(
  record: LocalRecordInput,
  context: ModelContext = {},
): LocalRecordValidationResult {
  try {
    const now = (context.now ?? (() => new Date()))().toISOString();
    const createId = context.createId ?? (() => crypto.randomUUID());
    const { kind, payload } = payloadForInput(record);
    const editingDraft = createOfflineDraft({
      draftId: createId(),
      aggregateType: kind,
      aggregateId: createId(),
      payload,
      now,
    });
    const savedDraft = completeOfflineDraftAutosave(editingDraft, now);
    const identity = createClientOperationIdentity(createId);
    const operation = buildQueuedOfflineOperation({
      ...identity,
      draft: savedDraft,
      command: "create",
      now,
    });
    const commit = offlineDraftAndOperationCommitSchema.parse({
      draft: savedDraft,
      operation,
      expectedLocalRevision: 0,
    });
    return { ok: true, draft: savedDraft, operation, commit };
  } catch (error) {
    if (error instanceof z.ZodError) return { ok: false, message: validationMessage(error) };
    return { ok: false, message: error instanceof Error ? error.message : "The local record could not be prepared." };
  }
}

export function parseLocalOfficeRecord(value: unknown): LocalOfficeRecord {
  const draft = offlineDraftSchema.parse(value);
  switch (draft.aggregateType) {
    case "lead":
      return { kind: draft.aggregateType, draft, payload: leadPayloadSchema.parse(draft.payload) };
    case "invoice_draft":
      return { kind: draft.aggregateType, draft, payload: invoicePayloadSchema.parse(draft.payload) };
    case "payment_acknowledgement":
      return { kind: draft.aggregateType, draft, payload: paymentPayloadSchema.parse(draft.payload) };
    case "notice_draft":
      return { kind: draft.aggregateType, draft, payload: noticePayloadSchema.parse(draft.payload) };
    case "contact":
      throw new Error("Contact drafts are not displayed by this desktop release.");
  }
}

export function parseOfflineOperation(value: unknown) {
  return offlineOutboxOperationSchema.parse(value);
}

export function provisionalDocumentNumber(record: LocalOfficeRecord) {
  const prefixByKind: Readonly<Record<LocalRecordKind, string>> = {
    lead: "LEAD",
    invoice_draft: "INV",
    payment_acknowledgement: "RCT",
    notice_draft: "NTC",
  };
  const day = record.draft.createdAt.slice(0, 10).replaceAll("-", "");
  return `LOCAL-${prefixByKind[record.kind]}-${day}-${record.draft.draftId.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

export function recordDisplayName(record: LocalOfficeRecord) {
  return record.kind === "notice_draft" ? record.payload.recipientName : record.payload.customerName;
}

export function recordSummary(record: LocalOfficeRecord) {
  switch (record.kind) {
    case "lead":
      return record.payload.interest;
    case "invoice_draft":
      return record.payload.purpose;
    case "payment_acknowledgement":
      return record.payload.invoiceReference || "Payment acknowledgement";
    case "notice_draft":
      return record.payload.subject;
  }
}

export function recordAmountMinor(record: LocalOfficeRecord) {
  return record.kind === "invoice_draft" || record.kind === "payment_acknowledgement"
    ? record.payload.amountMinor
    : 0;
}

export function formatBdt(amountMinor: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function localRecordKindLabel(kind: LocalRecordKind) {
  const labels: Readonly<Record<LocalRecordKind, string>> = {
    lead: "Lead",
    invoice_draft: "Invoice",
    payment_acknowledgement: "Payment",
    notice_draft: "Notice",
  };
  return labels[kind];
}

export function formPayloadForRecord(input: LocalRecordInput): Readonly<Record<string, string>> {
  return { ...input.input };
}

export function restoreRecordInput(kind: LocalRecordKind, value: unknown): LocalRecordInput | null {
  switch (kind) {
    case "lead": {
      const result = leadFormSchema.safeParse(value);
      return result.success ? { kind, input: result.data } : null;
    }
    case "invoice_draft": {
      const result = invoiceFormSchema.safeParse(value);
      return result.success ? { kind, input: result.data } : null;
    }
    case "payment_acknowledgement": {
      const result = paymentFormSchema.safeParse(value);
      return result.success ? { kind, input: result.data } : null;
    }
    case "notice_draft": {
      const result = noticeFormSchema.safeParse(value);
      return result.success ? { kind, input: result.data } : null;
    }
  }
}

export function formHasUserContent(input: LocalRecordInput) {
  switch (input.kind) {
    case "lead":
      return [input.input.customerName, input.input.phone, input.input.interest, input.input.location, input.input.notes]
        .some((value) => value.trim().length > 0);
    case "invoice_draft":
      return [input.input.customerName, input.input.phone, input.input.email, input.input.amount, input.input.notes]
        .some((value) => value.trim().length > 0);
    case "payment_acknowledgement":
      return [input.input.customerName, input.input.phone, input.input.email, input.input.amount, input.input.reference, input.input.invoiceReference, input.input.notes]
        .some((value) => value.trim().length > 0);
    case "notice_draft":
      return [input.input.recipientName, input.input.phone, input.input.email, input.input.subject, input.input.body]
        .some((value) => value.trim().length > 0);
  }
}
