import { z } from "zod";

const uuidSchema = z.string().uuid();
function isRealLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

const localDateSchema = z
  .string()
  .refine(isRealLocalDate, "Use a real ISO date in YYYY-MM-DD format.");
const currencySchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, "Currency must be a three-letter ISO 4217 code.")
  .transform((value) => value.toUpperCase());

export const officeEmployeeStatusSchema = z.enum([
  "active",
  "suspended",
  "separated",
]);
export const officeEmploymentTypeSchema = z.enum([
  "permanent",
  "probation",
  "contract",
  "part_time",
]);
export const officeCompensationComponentKindSchema = z.enum(["allowance", "deduction"]);
export const officeCompensationCalculationTypeSchema = z.enum([
  "fixed_minor",
  "basis_points_of_base",
]);
export const officeCompensationComponentStatusSchema = z.enum(["active", "inactive"]);
export const officePayrollRunStatusSchema = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "posted",
  "cancelled",
]);

export type OfficeEmployeeStatus = z.infer<typeof officeEmployeeStatusSchema>;
export type OfficeEmploymentType = z.infer<typeof officeEmploymentTypeSchema>;
export type OfficeCompensationComponentKind = z.infer<
  typeof officeCompensationComponentKindSchema
>;
export type OfficeCompensationCalculationType = z.infer<
  typeof officeCompensationCalculationTypeSchema
>;
export type OfficeCompensationComponentStatus = z.infer<
  typeof officeCompensationComponentStatusSchema
>;
export type OfficePayrollRunStatus = z.infer<typeof officePayrollRunStatusSchema>;

const safeMinorUnitsSchema = z
  .number()
  .int("Money must use integer minor units.")
  .nonnegative()
  .safe("Money exceeds the safe integer range.");

export const officeCompensationComponentInputSchema = z
  .strictObject({
    name: z.string().trim().min(2).max(120),
    kind: officeCompensationComponentKindSchema,
    calculationType: officeCompensationCalculationTypeSchema,
    value: z.number().int().nonnegative().safe(),
    status: officeCompensationComponentStatusSchema.default("active"),
  })
  .superRefine((value, context) => {
    if (value.calculationType === "basis_points_of_base" && value.value > 10_000) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "A base-percentage component cannot exceed 100%.",
      });
    }
  });

export const officeEmployeeCompensationInputSchema = z
  .strictObject({
    employeeCode: z
      .string()
      .trim()
      .min(2)
      .max(32)
      .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens only.")
      .transform((value) => value.toUpperCase()),
    memberId: uuidSchema.nullable(),
    displayName: z.string().trim().min(2).max(120),
    designation: z.string().trim().min(2).max(120),
    department: z.string().trim().min(2).max(120),
    employmentType: officeEmploymentTypeSchema,
    joinDate: localDateSchema,
    baseSalaryMinor: safeMinorUnitsSchema,
    currency: currencySchema,
    components: z.array(officeCompensationComponentInputSchema).max(24),
  })
  .superRefine((value, context) => {
    const activeNames = new Set<string>();
    for (const [index, component] of value.components.entries()) {
      if (component.status === "active") {
        const normalizedName = component.name.toLocaleLowerCase("en");
        if (activeNames.has(normalizedName)) {
          context.addIssue({
            code: "custom",
            path: ["components", index, "name"],
            message: "Active compensation component names must be unique for one profile.",
          });
        }
        activeNames.add(normalizedName);
      }
    }
  });

export const officePayrollRunInputSchema = z
  .strictObject({
    periodStart: localDateSchema,
    periodEnd: localDateSchema,
    currency: currencySchema,
    note: z.string().trim().max(1_000).nullable(),
  })
  .superRefine((value, context) => {
    if (value.periodEnd < value.periodStart) {
      context.addIssue({
        code: "custom",
        path: ["periodEnd"],
        message: "Payroll period end cannot be earlier than the start date.",
      });
    }
    if (value.periodStart.slice(0, 7) !== value.periodEnd.slice(0, 7)) {
      context.addIssue({
        code: "custom",
        path: ["periodEnd"],
        message: "A v1 payroll run must stay within one calendar month.",
      });
      return;
    }
    const [year, month] = value.periodStart.split("-").map(Number);
    const expectedStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const expectedEnd = `${year}-${String(month).padStart(2, "0")}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
    if (value.periodStart !== expectedStart || value.periodEnd !== expectedEnd) {
      context.addIssue({
        code: "custom",
        path: ["periodStart"],
        message: `Monthly payroll must cover the complete calendar month (${expectedStart} to ${expectedEnd}).`,
      });
    }
  });

export type OfficeCompensationComponentInput = z.infer<
  typeof officeCompensationComponentInputSchema
>;
export type OfficeEmployeeCompensationInput = z.infer<
  typeof officeEmployeeCompensationInputSchema
>;
export type OfficePayrollRunInput = z.infer<typeof officePayrollRunInputSchema>;

export type PayrollCalculationComponent = Readonly<{
  name: string;
  kind: OfficeCompensationComponentKind;
  calculationType: OfficeCompensationCalculationType;
  configuredValue: number;
  amountMinor: number;
}>;

export type PayrollCalculation = Readonly<{
  engineVersion: "ap-payroll-v1";
  baseSalaryMinor: number;
  allowanceMinor: number;
  deductionMinor: number;
  grossMinor: number;
  netMinor: number;
  components: readonly PayrollCalculationComponent[];
}>;

function checkedSafeInteger(value: bigint, label: string): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`${label} exceeds the supported safe integer range.`);
  }
  return Number(value);
}

function calculateComponentAmount(
  baseSalaryMinor: number,
  component: OfficeCompensationComponentInput,
): number {
  if (component.calculationType === "fixed_minor") return safeMinorUnitsSchema.parse(component.value);
  const numerator = BigInt(baseSalaryMinor) * BigInt(component.value);
  return checkedSafeInteger(
    (numerator + BigInt(5_000)) / BigInt(10_000),
    "Compensation component",
  );
}

/**
 * Computes contractual payroll only. It deliberately has no built-in tax, provident-fund,
 * overtime, or statutory rates: those values require an approved, effective-dated policy.
 */
export function calculatePayroll(input: {
  baseSalaryMinor: number;
  components: readonly OfficeCompensationComponentInput[];
}): PayrollCalculation {
  const baseSalaryMinor = safeMinorUnitsSchema.parse(input.baseSalaryMinor);
  const components = z.array(officeCompensationComponentInputSchema).max(24).parse(input.components);
  const calculated = components
    .filter((component) => component.status === "active")
    .map((component) => ({
      name: component.name,
      kind: component.kind,
      calculationType: component.calculationType,
      configuredValue: component.value,
      amountMinor: calculateComponentAmount(baseSalaryMinor, component),
    } satisfies PayrollCalculationComponent));

  let allowance = BigInt(0);
  let deduction = BigInt(0);
  for (const component of calculated) {
    if (component.kind === "allowance") allowance += BigInt(component.amountMinor);
    else deduction += BigInt(component.amountMinor);
  }
  const gross = BigInt(baseSalaryMinor) + allowance;
  if (deduction > gross) {
    throw new RangeError("Configured deductions cannot exceed gross contractual pay.");
  }

  return {
    engineVersion: "ap-payroll-v1",
    baseSalaryMinor,
    allowanceMinor: checkedSafeInteger(allowance, "Total allowance"),
    deductionMinor: checkedSafeInteger(deduction, "Total deduction"),
    grossMinor: checkedSafeInteger(gross, "Gross pay"),
    netMinor: checkedSafeInteger(gross - deduction, "Net pay"),
    components: calculated,
  };
}

const payrollTransitions: Readonly<Record<OfficePayrollRunStatus, readonly OfficePayrollRunStatus[]>> = {
  draft: ["pending_approval", "cancelled"],
  pending_approval: ["approved", "cancelled"],
  approved: ["posted", "cancelled"],
  posted: [],
  cancelled: [],
};

export function validatePayrollRunTransition(
  current: OfficePayrollRunStatus,
  next: OfficePayrollRunStatus,
): string | null {
  return payrollTransitions[current].includes(next)
    ? null
    : `Payroll run cannot move from ${current} to ${next}.`;
}

export function validatePayrollMakerChecker(
  createdByMemberId: string,
  approvingMemberId: string,
): string | null {
  return createdByMemberId === approvingMemberId
    ? "The payroll run creator cannot approve the same run."
    : null;
}
