import { z } from "zod";
import { parseMoneyToMinorUnits } from "@/features/office/types";
import {
  officeEmployeeCompensationInputSchema,
  officePayrollRunInputSchema,
} from "@/features/office/payroll/types";

const optionalUuidFormSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length > 0 ? value.trim() : null),
  z.string().uuid().nullable(),
);

function moneyFormSchema(label: string) {
  return z.string().trim().transform((value, context) => {
    try {
      return parseMoneyToMinorUnits(value || "0");
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : `Enter a valid ${label}.`,
      });
      return z.NEVER;
    }
  });
}

const employeeCompensationFormSchema = z
  .strictObject({
    employeeCode: z.string(),
    memberId: optionalUuidFormSchema,
    displayName: z.string(),
    designation: z.string(),
    department: z.string(),
    employmentType: z.string(),
    joinDate: z.string(),
    baseSalary: moneyFormSchema("base salary"),
    currency: z.string(),
    allowanceName: z.string().trim().max(120),
    allowanceAmount: moneyFormSchema("allowance"),
    deductionName: z.string().trim().max(120),
    deductionAmount: moneyFormSchema("deduction"),
  })
  .transform((value, context) => {
    const parsed = officeEmployeeCompensationInputSchema.safeParse({
      employeeCode: value.employeeCode,
      memberId: value.memberId,
      displayName: value.displayName,
      designation: value.designation,
      department: value.department,
      employmentType: value.employmentType,
      joinDate: value.joinDate,
      baseSalaryMinor: value.baseSalary,
      currency: value.currency,
      components: [
        ...(value.allowanceAmount > 0
          ? [{
              name: value.allowanceName || "Contractual allowance",
              kind: "allowance" as const,
              calculationType: "fixed_minor" as const,
              value: value.allowanceAmount,
              status: "active" as const,
            }]
          : []),
        ...(value.deductionAmount > 0
          ? [{
              name: value.deductionName || "Authorized deduction",
              kind: "deduction" as const,
              calculationType: "fixed_minor" as const,
              value: value.deductionAmount,
              status: "active" as const,
            }]
          : []),
      ],
    });
    if (parsed.success) return parsed.data;
    for (const issue of parsed.error.issues) {
      context.addIssue({ code: "custom", path: issue.path, message: issue.message });
    }
    return z.NEVER;
  });

const payrollRunFormSchema = z
  .strictObject({
    periodStart: z.string(),
    periodEnd: z.string(),
    currency: z.string(),
    note: z.preprocess(
      (value) => (typeof value === "string" && value.trim().length > 0 ? value.trim() : null),
      z.string().max(1_000).nullable(),
    ),
  })
  .transform((value, context) => {
    const parsed = officePayrollRunInputSchema.safeParse(value);
    if (parsed.success) return parsed.data;
    for (const issue of parsed.error.issues) {
      context.addIssue({ code: "custom", path: issue.path, message: issue.message });
    }
    return z.NEVER;
  });

const payrollRunTransitionFormSchema = z.strictObject({
  runId: z.string().uuid(),
  version: z.coerce.number().int().positive(),
});

export function parseEmployeeCompensationForm(formData: FormData) {
  return employeeCompensationFormSchema.safeParse(Object.fromEntries(formData));
}

export function parsePayrollRunForm(formData: FormData) {
  return payrollRunFormSchema.safeParse(Object.fromEntries(formData));
}

export function parsePayrollRunTransitionForm(formData: FormData) {
  return payrollRunTransitionFormSchema.safeParse(Object.fromEntries(formData));
}
