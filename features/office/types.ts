import { z } from "zod";

export const officeRoleSchema = z.enum([
  "owner",
  "admin",
  "manager",
  "sales",
  "projects",
  "accounts",
  "viewer",
]);
export const officeMemberStatusSchema = z.enum(["invited", "active", "suspended", "archived"]);
export const officeContactKindSchema = z.enum([
  "customer",
  "landowner",
  "buyer",
  "seller",
  "vendor",
  "partner",
  "other",
]);
export const officeLeadStageSchema = z.enum([
  "new",
  "qualified",
  "site_visit",
  "proposal",
  "negotiation",
  "won",
  "lost",
]);
export const officeLandStageSchema = z.enum([
  "lead",
  "document_intake",
  "due_diligence",
  "survey_feasibility",
  "proposal",
  "negotiation",
  "legal_owner_approval",
  "agreement",
  "project_gates",
  "handover",
  "closed",
  "rejected",
]);
export const officeProjectStatusSchema = z.enum([
  "feasibility",
  "secured",
  "design",
  "approval",
  "delivery",
  "inspection",
  "handover",
  "defect_follow_up",
  "closed",
  "on_hold",
  "cancelled",
]);
export const officeTaskStatusSchema = z.enum(["open", "in_progress", "blocked", "done", "cancelled"]);
export const officeInvoiceStatusSchema = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "void",
]);
export const officePaymentStatusSchema = z.enum(["draft", "posted", "void", "refunded"]);
export const officeLocaleSchema = z.enum(["en", "bn"]);
export const officeInvoiceKindSchema = z.enum([
  "service",
  "consultation",
  "booking",
  "installment",
  "construction",
  "other",
]);
export const officeNoticeKindSchema = z.enum([
  "general",
  "payment_reminder",
  "project_update",
  "appointment",
  "handover",
  "other",
]);
export const officeNoticeStatusSchema = z.enum(["draft", "issued", "archived"]);
export const officeNotificationStatusSchema = z.enum([
  "pending",
  "processing",
  "sent",
  "failed",
  "dead",
  "cancelled",
]);
export const officeExpenseStatusSchema = z.enum([
  "draft",
  "submitted",
  "approved",
  "rejected",
  "paid",
  "cancelled",
]);
export const officeApprovalStatusSchema = z.enum(["pending", "approved", "rejected", "cancelled"]);

export type OfficeRole = z.infer<typeof officeRoleSchema>;
export type OfficeMemberStatus = z.infer<typeof officeMemberStatusSchema>;
export type OfficeContactKind = z.infer<typeof officeContactKindSchema>;
export type OfficeLeadStage = z.infer<typeof officeLeadStageSchema>;
export type OfficeLandStage = z.infer<typeof officeLandStageSchema>;
export type OfficeProjectStatus = z.infer<typeof officeProjectStatusSchema>;
export type OfficeTaskStatus = z.infer<typeof officeTaskStatusSchema>;
export type OfficeInvoiceStatus = z.infer<typeof officeInvoiceStatusSchema>;
export type OfficePaymentStatus = z.infer<typeof officePaymentStatusSchema>;
export type OfficeLocale = z.infer<typeof officeLocaleSchema>;
export type OfficeInvoiceKind = z.infer<typeof officeInvoiceKindSchema>;
export type OfficeNoticeKind = z.infer<typeof officeNoticeKindSchema>;
export type OfficeNoticeStatus = z.infer<typeof officeNoticeStatusSchema>;
export type OfficeNotificationStatus = z.infer<typeof officeNotificationStatusSchema>;
export type OfficeExpenseStatus = z.infer<typeof officeExpenseStatusSchema>;
export type OfficeApprovalStatus = z.infer<typeof officeApprovalStatusSchema>;

const uuidSchema = z.string().uuid();
const isoTimestampSchema = z.string().datetime({ offset: true });
const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO date in YYYY-MM-DD format.");
const currencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/, "Currency must be a three-letter ISO 4217 code.");

export const officeMembershipSchema = z.strictObject({
  id: uuidSchema,
  email: z.string().trim().email().max(320),
  normalizedEmail: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(1).max(120),
  role: officeRoleSchema,
  status: officeMemberStatusSchema,
  version: z.number().int().positive(),
  lastSeenAt: isoTimestampSchema.nullable(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

export type OfficeMembership = z.infer<typeof officeMembershipSchema>;

export const minorUnitsSchema = z
  .number()
  .int("Money must use integer minor units.")
  .nonnegative()
  .safe("Money exceeds the safe integer range.");

export const positiveMinorUnitsSchema = minorUnitsSchema.positive();
export const quantityMillisSchema = z
  .number()
  .int("Quantity must use thousandths of one unit.")
  .min(1)
  .max(1_000_000_000);
export const taxRateBpsSchema = z.number().int().min(0).max(10_000);

export const officeInvoiceLineInputSchema = z.strictObject({
  description: z.string().trim().min(2).max(500),
  quantityMillis: quantityMillisSchema,
  unitPriceMinor: minorUnitsSchema,
  discountMinor: minorUnitsSchema.default(0),
  taxRateBps: taxRateBpsSchema.default(0),
});

export const officeInvoicePartySnapshotSchema = z.strictObject({
  name: z.string().trim().min(1).max(160),
  address: z.string().trim().min(1).max(600),
  email: z.string().trim().email().max(320).nullable().default(null),
  phone: z.string().trim().min(5).max(40).nullable().default(null),
  taxIdentifier: z.string().trim().min(1).max(80).nullable().default(null),
});

export const officeInvoiceDraftInputSchema = z
  .strictObject({
    contactId: uuidSchema,
    projectId: uuidSchema.nullable().default(null),
    kind: officeInvoiceKindSchema.default("service"),
    purpose: z.string().trim().min(3).max(240).default("Property services"),
    locale: officeLocaleSchema.default("en"),
    issueDate: localDateSchema,
    dueDate: localDateSchema,
    currency: currencySchema.default("BDT"),
    customer: officeInvoicePartySnapshotSchema,
    company: officeInvoicePartySnapshotSchema,
    terms: z.string().trim().min(1).max(2_000),
    notes: z.string().trim().max(2_000).nullable().default(null),
    items: z.array(officeInvoiceLineInputSchema).min(1).max(100),
  })
  .superRefine((input, context) => {
    if (input.dueDate < input.issueDate) {
      context.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date cannot be earlier than the issue date.",
      });
    }
  });

export type OfficeInvoiceLineInput = z.infer<typeof officeInvoiceLineInputSchema>;
export type OfficeInvoiceDraftInput = z.infer<typeof officeInvoiceDraftInputSchema>;

export type OfficeCalculatedInvoiceLine = OfficeInvoiceLineInput & {
  position: number;
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
};

export type OfficeInvoiceCalculation = {
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  lines: readonly OfficeCalculatedInvoiceLine[];
};

const DECIMAL_MONEY_PATTERN = /^(?:0|[1-9]\d{0,12})(?:\.\d{1,2})?$/;
const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

function safeIntegerFromBigInt(value: bigint, label: string): number {
  if (value < BigInt(0) || value > MAX_SAFE_INTEGER_BIGINT) {
    throw new RangeError(`${label} exceeds the supported monetary range.`);
  }
  return Number(value);
}

function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (numerator < BigInt(0) || denominator <= BigInt(0)) {
    throw new RangeError("Monetary rounding requires a non-negative numerator and positive denominator.");
  }
  return (numerator + denominator / BigInt(2)) / denominator;
}

export function parseMoneyToMinorUnits(value: string): number {
  const normalized = value.trim();
  if (!DECIMAL_MONEY_PATTERN.test(normalized)) {
    throw new TypeError("Money must be a non-negative decimal with no more than two fractional digits.");
  }

  const [major, fraction = ""] = normalized.split(".");
  const minor = BigInt(major) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  return safeIntegerFromBigInt(minor, "Money");
}

export function formatMinorUnits(value: number): string {
  const parsed = minorUnitsSchema.parse(value);
  const major = Math.floor(parsed / 100);
  const fraction = String(parsed % 100).padStart(2, "0");
  return `${major}.${fraction}`;
}

export function addMinorUnits(values: readonly number[]): number {
  const total = values.reduce(
    (sum, value) => sum + BigInt(minorUnitsSchema.parse(value)),
    BigInt(0),
  );
  return safeIntegerFromBigInt(total, "Money total");
}

export function calculateInvoiceTotals(value: unknown): OfficeInvoiceCalculation {
  const input = officeInvoiceDraftInputSchema.parse(value);
  const lines = input.items.map((item, index): OfficeCalculatedInvoiceLine => {
    const subtotal = divideRoundHalfUp(
      BigInt(item.quantityMillis) * BigInt(item.unitPriceMinor),
      BigInt(1_000),
    );
    const discount = BigInt(item.discountMinor);
    if (discount > subtotal) {
      throw new RangeError(`Invoice line ${index + 1} discount cannot exceed its subtotal.`);
    }

    const taxable = subtotal - discount;
    const tax = divideRoundHalfUp(taxable * BigInt(item.taxRateBps), BigInt(10_000));
    const total = taxable + tax;

    return {
      ...item,
      position: index + 1,
      subtotalMinor: safeIntegerFromBigInt(subtotal, `Invoice line ${index + 1} subtotal`),
      taxMinor: safeIntegerFromBigInt(tax, `Invoice line ${index + 1} tax`),
      totalMinor: safeIntegerFromBigInt(total, `Invoice line ${index + 1} total`),
    };
  });

  const subtotalMinor = addMinorUnits(lines.map((line) => line.subtotalMinor));
  const discountMinor = addMinorUnits(lines.map((line) => line.discountMinor));
  const taxMinor = addMinorUnits(lines.map((line) => line.taxMinor));
  const totalMinor = safeIntegerFromBigInt(
    BigInt(subtotalMinor) - BigInt(discountMinor) + BigInt(taxMinor),
    "Invoice total",
  );

  return {
    currency: input.currency,
    subtotalMinor,
    discountMinor,
    taxMinor,
    totalMinor,
    lines,
  };
}

export function parseOfficeInvoiceDraft(value: unknown) {
  return officeInvoiceDraftInputSchema.safeParse(value);
}

export type OfficeWorkflowError = {
  code:
    | "invalid_transition"
    | "posted_record_immutable"
    | "self_approval"
    | "allocation_exceeds_invoice"
    | "allocation_exceeds_payment"
    | "currency_mismatch";
  message: string;
};

const leadTransitions: Record<OfficeLeadStage, readonly OfficeLeadStage[]> = {
  new: ["qualified", "lost"],
  qualified: ["site_visit", "proposal", "lost"],
  site_visit: ["proposal", "qualified", "lost"],
  proposal: ["negotiation", "won", "lost"],
  negotiation: ["proposal", "won", "lost"],
  won: [],
  lost: ["new"],
};

const invoiceTransitions: Record<OfficeInvoiceStatus, readonly OfficeInvoiceStatus[]> = {
  draft: ["pending_approval"],
  pending_approval: ["draft", "approved"],
  approved: ["issued"],
  issued: ["partially_paid", "paid", "overdue", "void"],
  partially_paid: ["paid", "overdue", "void"],
  paid: [],
  overdue: ["partially_paid", "paid", "void"],
  void: [],
};

export function validateOfficeLeadTransition(
  current: OfficeLeadStage,
  next: OfficeLeadStage,
): OfficeWorkflowError | null {
  if (leadTransitions[current].includes(next)) return null;
  return {
    code: "invalid_transition",
    message: `A lead cannot move directly from ${current} to ${next}.`,
  };
}

export function validateOfficeInvoiceTransition(
  current: OfficeInvoiceStatus,
  next: OfficeInvoiceStatus,
): OfficeWorkflowError | null {
  if (invoiceTransitions[current].includes(next)) return null;
  return {
    code: "invalid_transition",
    message: `An invoice cannot move directly from ${current} to ${next}.`,
  };
}

export function validateInvoiceRecordMutation(
  status: OfficeInvoiceStatus,
  operation: "edit" | "delete",
): OfficeWorkflowError | null {
  if (["draft", "pending_approval", "approved"].includes(status)) return null;
  return {
    code: "posted_record_immutable",
    message: `A ${status} invoice cannot be ${operation === "edit" ? "edited" : "deleted"}; use an approved adjustment workflow.`,
  };
}

export function validateExpenseApproval(
  submittedByMemberId: string,
  approverMemberId: string,
): OfficeWorkflowError | null {
  if (submittedByMemberId !== approverMemberId) return null;
  return {
    code: "self_approval",
    message: "A staff member cannot approve their own expense.",
  };
}

export const officePaymentAllocationInputSchema = z.strictObject({
  amountMinor: positiveMinorUnitsSchema,
  invoiceOutstandingMinor: minorUnitsSchema,
  paymentAvailableMinor: minorUnitsSchema,
  invoiceCurrency: currencySchema,
  paymentCurrency: currencySchema,
});

export function validatePaymentAllocation(value: unknown): OfficeWorkflowError | null {
  const input = officePaymentAllocationInputSchema.parse(value);
  if (input.invoiceCurrency !== input.paymentCurrency) {
    return { code: "currency_mismatch", message: "Payment and invoice currencies must match." };
  }
  if (input.amountMinor > input.invoiceOutstandingMinor) {
    return {
      code: "allocation_exceeds_invoice",
      message: "Payment allocation cannot exceed the invoice outstanding balance.",
    };
  }
  if (input.amountMinor > input.paymentAvailableMinor) {
    return {
      code: "allocation_exceeds_payment",
      message: "Payment allocation cannot exceed the unallocated payment balance.",
    };
  }
  return null;
}
