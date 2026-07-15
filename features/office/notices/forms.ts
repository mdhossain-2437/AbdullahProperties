import { z } from "zod";
import {
  officeLocaleSchema,
  officeNoticeKindSchema,
} from "@/features/office/types";

const uuidSchema = z.string().uuid();
const localDateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "Use a date in YYYY-MM-DD format.",
);

const optionalUuid = z.preprocess(
  (value) => typeof value === "string" && value.trim() ? value.trim() : null,
  uuidSchema.nullable(),
);

const optionalDate = z.preprocess(
  (value) => typeof value === "string" && value.trim() ? value.trim() : null,
  localDateSchema.nullable(),
);

export const officeNoticeFormSchema = z
  .strictObject({
    kind: officeNoticeKindSchema,
    title: z.string().trim().min(3, "Add a clear notice title.").max(180),
    body: z
      .string()
      .trim()
      .min(10, "Write at least 10 characters of notice content.")
      .max(12_000),
    locale: officeLocaleSchema.default("bn"),
    contactId: optionalUuid,
    projectId: optionalUuid,
    issueDate: optionalDate,
    effectiveDate: optionalDate,
    expiresAt: optionalDate,
  })
  .superRefine((value, context) => {
    if (value.kind === "payment_reminder" && !value.contactId) {
      context.addIssue({
        code: "custom",
        path: ["contactId"],
        message: "A payment reminder needs a named recipient.",
      });
    }
    if (value.issueDate && value.effectiveDate && value.effectiveDate < value.issueDate) {
      context.addIssue({
        code: "custom",
        path: ["effectiveDate"],
        message: "The effective date cannot be earlier than the issue date.",
      });
    }
    const validityStart = value.effectiveDate ?? value.issueDate;
    if (validityStart && value.expiresAt && value.expiresAt < validityStart) {
      context.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "The expiry date cannot be earlier than the notice date.",
      });
    }
  });

export const officeIssueNoticeFormSchema = z.strictObject({
  noticeId: uuidSchema,
  version: z.coerce.number().int().positive(),
  fiscalYear: z.string().trim().regex(/^\d{4}$/, "Use a four-digit fiscal year."),
  branchCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,8}$/, "Use a 2–8 character branch code."),
});

export function parseOfficeNoticeForm(formData: FormData) {
  return officeNoticeFormSchema.safeParse(Object.fromEntries(formData));
}

export function parseOfficeIssueNoticeForm(formData: FormData) {
  return officeIssueNoticeFormSchema.safeParse(Object.fromEntries(formData));
}
