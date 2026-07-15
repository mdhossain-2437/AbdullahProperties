import { z } from "zod";
import {
  officeContactKindSchema,
  officeInvoiceKindSchema,
  officeInvoiceLineInputSchema,
  officeLocaleSchema,
  officeLeadStageSchema,
  officeLandStageSchema,
  officeProjectStatusSchema,
  officeRoleSchema,
  officeTaskStatusSchema,
  parseMoneyToMinorUnits,
} from "@/features/office/types";

const uuidSchema = z.string().uuid();
const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date in YYYY-MM-DD format.");
const optionalText = (maximum: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim().length > 0 ? value.trim() : null,
  z.string().max(maximum).nullable(),
);
const optionalUuid = z.preprocess(
  (value) => typeof value === "string" && value.trim().length > 0 ? value.trim() : null,
  uuidSchema.nullable(),
);
const optionalEmail = z.preprocess(
  (value) => typeof value === "string" && value.trim().length > 0 ? value.trim() : null,
  z.string().email("Enter a valid email address.").max(320).nullable(),
);
const optionalDate = z.preprocess(
  (value) => typeof value === "string" && value.trim().length > 0 ? value.trim() : null,
  localDateSchema.nullable(),
);

function decimalToScaledInteger(value: string, scale: number, maximumWholeDigits: number, label: string) {
  const normalized = value.trim();
  const pattern = new RegExp(`^(?:0|[1-9]\\d{0,${maximumWholeDigits - 1}})(?:\\.\\d{1,${String(scale).length - 1}})?$`);
  if (!pattern.test(normalized)) throw new TypeError(`${label} must be a positive decimal.`);
  const decimalPlaces = String(scale).length - 1;
  const [whole, fraction = ""] = normalized.split(".");
  const scaled = BigInt(whole) * BigInt(scale) + BigInt(fraction.padEnd(decimalPlaces, "0"));
  if (scaled > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError(`${label} exceeds the supported range.`);
  return Number(scaled);
}

export function parseQuantityToMillis(value: string) {
  const quantity = decimalToScaledInteger(value, 1_000, 9, "Quantity");
  if (quantity < 1) throw new TypeError("Quantity must be greater than zero.");
  return quantity;
}

export function parseTaxRateToBps(value: string) {
  const rate = decimalToScaledInteger(value, 100, 3, "Tax rate");
  if (rate > 10_000) throw new RangeError("Tax rate cannot exceed 100%.");
  return rate;
}

export const officeContactFormSchema = z.strictObject({
  kind: officeContactKindSchema,
  displayName: z.string().trim().min(2, "Enter a contact name.").max(160),
  email: optionalEmail,
  phone: optionalText(40),
  organizationName: optionalText(160),
  address: optionalText(600),
  notes: optionalText(2_000),
  assignedMemberId: optionalUuid,
}).superRefine((value, context) => {
  if (!value.email && !value.phone) context.addIssue({ code: "custom", path: ["phone"], message: "Add a phone number or email address." });
});

export const officeLeadFormSchema = z.strictObject({
  contactId: uuidSchema,
  title: z.string().trim().min(4, "Add a useful lead title.").max(180),
  source: optionalText(120),
  serviceType: z.enum(["buy", "sell", "rent", "land_development", "construction", "consultation", "other"]),
  stage: officeLeadStageSchema.default("new"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  assigneeMemberId: optionalUuid,
  estimatedValue: z.preprocess(
    (value) => typeof value === "string" && value.trim().length > 0 ? value.trim() : null,
    z.string().nullable().transform((value, context) => {
      if (value === null) return null;
      try { return parseMoneyToMinorUnits(value); } catch (error) {
        context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Enter a valid amount." });
        return z.NEVER;
      }
    }),
  ),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("BDT"),
  nextActionAt: optionalDate,
});

export const officeLandFormSchema = z.strictObject({
  referenceCode: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens only."),
  title: z.string().trim().min(4).max(180),
  primaryLandownerContactId: optionalUuid,
  stage: officeLandStageSchema.default("lead"),
  reviewStatus: z.enum(["not_started", "in_review", "needs_information", "reviewed", "rejected"]).default("not_started"),
  address: z.string().trim().min(5).max(600),
  district: z.string().trim().min(2).max(100).default("Joypurhat"),
  upazila: optionalText(100),
  unionOrWard: optionalText(100),
  mouza: optionalText(120),
  jlNumber: optionalText(80),
  dagNumbers: optionalText(500),
  khatianNumbers: optionalText(500),
  areaSquareFeet: z.preprocess(
    (value) => typeof value === "string" && value.trim().length > 0 ? value.trim() : null,
    z.coerce.number().int().positive().max(2_000_000_000).nullable(),
  ),
  areaDecimal: optionalText(50),
  mutationStatus: optionalText(160),
  landTaxStatus: optionalText(160),
  possessionStatus: optionalText(160),
  verificationNotes: optionalText(3_000),
  assigneeMemberId: optionalUuid,
});

export const officeProjectFormSchema = z.strictObject({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens only."),
  name: z.string().trim().min(4).max(180),
  projectType: z.enum(["residential", "commercial", "mixed_use", "land_development", "construction", "other"]),
  status: officeProjectStatusSchema.default("feasibility"),
  landParcelId: optionalUuid,
  customerContactId: optionalUuid,
  managerMemberId: optionalUuid,
  address: z.string().trim().min(5).max(600),
  district: z.string().trim().min(2).max(100).default("Joypurhat"),
  upazila: optionalText(100),
  summary: optionalText(2_000),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).default("low"),
  budget: z.preprocess(
    (value) => typeof value === "string" && value.trim().length > 0 ? value.trim() : null,
    z.string().nullable().transform((value, context) => {
      if (value === null) return null;
      try { return parseMoneyToMinorUnits(value); } catch (error) {
        context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Enter a valid budget." });
        return z.NEVER;
      }
    }),
  ),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("BDT"),
  startAt: optionalDate,
  targetEndAt: optionalDate,
});

export const officeTaskFormSchema = z.strictObject({
  title: z.string().trim().min(4).max(180),
  description: optionalText(2_000),
  status: officeTaskStatusSchema.default("open"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  assigneeMemberId: optionalUuid,
  contactId: optionalUuid,
  leadId: optionalUuid,
  landParcelId: optionalUuid,
  projectId: optionalUuid,
  dueAt: optionalDate,
});

const invoiceBuilderLineSchema = z.strictObject({
  description: z.string().trim().min(2).max(500),
  quantity: z.string().transform((value, context) => {
    try { return parseQuantityToMillis(value); } catch (error) {
      context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Enter a valid quantity." });
      return z.NEVER;
    }
  }),
  unitPrice: z.string().transform((value, context) => {
    try { return parseMoneyToMinorUnits(value); } catch (error) {
      context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Enter a valid unit price." });
      return z.NEVER;
    }
  }),
  discount: z.string().default("0").transform((value, context) => {
    try { return parseMoneyToMinorUnits(value || "0"); } catch (error) {
      context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Enter a valid discount." });
      return z.NEVER;
    }
  }),
  taxRate: z.string().default("0").transform((value, context) => {
    try { return parseTaxRateToBps(value || "0"); } catch (error) {
      context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Enter a valid tax rate." });
      return z.NEVER;
    }
  }),
}).transform((line) => officeInvoiceLineInputSchema.parse({
  description: line.description,
  quantityMillis: line.quantity,
  unitPriceMinor: line.unitPrice,
  discountMinor: line.discount,
  taxRateBps: line.taxRate,
}));

export const officeInvoiceFormSchema = z.strictObject({
  contactId: uuidSchema,
  projectId: optionalUuid,
  kind: officeInvoiceKindSchema.default("service"),
  purpose: z.string().trim().min(3).max(240),
  locale: officeLocaleSchema.default("en"),
  issueDate: localDateSchema,
  dueDate: localDateSchema,
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("BDT"),
  terms: z.string().trim().min(10).max(2_000),
  notes: optionalText(2_000),
  items: z.array(invoiceBuilderLineSchema).min(1).max(20),
}).superRefine((value, context) => {
  if (value.dueDate < value.issueDate) context.addIssue({ code: "custom", path: ["dueDate"], message: "Due date cannot be earlier than the issue date." });
});

export const officePaymentFormSchema = z.strictObject({
  invoiceId: uuidSchema,
  clientOperationId: z.preprocess(
    (value) => typeof value === "string" && value.trim().length > 0 ? value.trim() : null,
    z.string().regex(/^[A-Za-z0-9:_-]{8,160}$/).nullable(),
  ),
  locale: officeLocaleSchema.default("bn"),
  method: z.enum(["cash", "bank_transfer", "card", "mobile_financial_service", "cheque", "other"]),
  amount: z.string().transform((value, context) => {
    try {
      const amount = parseMoneyToMinorUnits(value);
      if (amount <= 0) throw new TypeError("Payment amount must be greater than zero.");
      return amount;
    } catch (error) {
      context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Enter a valid payment." });
      return z.NEVER;
    }
  }),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("BDT"),
  paidAt: localDateSchema,
  reference: optionalText(160),
  note: optionalText(1_000),
});

export const officeExpenseFormSchema = z.strictObject({
  category: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(1_000),
  projectId: optionalUuid,
  vendorContactId: optionalUuid,
  amount: z.string().transform((value, context) => {
    try {
      const amount = parseMoneyToMinorUnits(value);
      if (amount <= 0) throw new TypeError("Expense amount must be greater than zero.");
      return amount;
    } catch (error) {
      context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Enter a valid expense." });
      return z.NEVER;
    }
  }),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("BDT"),
  incurredAt: localDateSchema,
  submitNow: z.coerce.boolean().default(false),
});

export const officeMemberFormSchema = z.strictObject({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(2).max(120),
  role: officeRoleSchema.exclude(["owner"]),
});

export const officeApprovalDecisionSchema = z.strictObject({
  approvalId: uuidSchema,
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().trim().min(4).max(1_000),
  version: z.coerce.number().int().positive(),
});

export const officeIssueInvoiceSchema = z.strictObject({
  invoiceId: uuidSchema,
  version: z.coerce.number().int().positive(),
  fiscalYear: z.string().trim().regex(/^\d{4}$/, "Use a four-digit fiscal year."),
});

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseInvoiceItems(formData: FormData) {
  const raw = fieldValue(formData, "items");
  try { return JSON.parse(raw) as unknown; } catch { return null; }
}

export function parseOfficeContactForm(formData: FormData) {
  return officeContactFormSchema.safeParse(Object.fromEntries(formData));
}
export function parseOfficeLeadForm(formData: FormData) {
  return officeLeadFormSchema.safeParse(Object.fromEntries(formData));
}
export function parseOfficeLandForm(formData: FormData) {
  return officeLandFormSchema.safeParse(Object.fromEntries(formData));
}
export function parseOfficeProjectForm(formData: FormData) {
  return officeProjectFormSchema.safeParse(Object.fromEntries(formData));
}
export function parseOfficeTaskForm(formData: FormData) {
  return officeTaskFormSchema.safeParse(Object.fromEntries(formData));
}
export function parseOfficeInvoiceForm(formData: FormData) {
  return officeInvoiceFormSchema.safeParse({ ...Object.fromEntries(formData), items: parseInvoiceItems(formData) });
}
export function parseOfficePaymentForm(formData: FormData) {
  return officePaymentFormSchema.safeParse(Object.fromEntries(formData));
}
export function parseOfficeExpenseForm(formData: FormData) {
  return officeExpenseFormSchema.safeParse({ ...Object.fromEntries(formData), submitNow: fieldValue(formData, "submitNow") === "true" });
}
export function parseOfficeMemberForm(formData: FormData) {
  return officeMemberFormSchema.safeParse(Object.fromEntries(formData));
}
export function parseOfficeApprovalDecisionForm(formData: FormData) {
  return officeApprovalDecisionSchema.safeParse(Object.fromEntries(formData));
}
export function parseOfficeIssueInvoiceForm(formData: FormData) {
  return officeIssueInvoiceSchema.safeParse(Object.fromEntries(formData));
}
