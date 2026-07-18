"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedOfficeActor } from "@/features/office/auth";
import type { OfficeActionState } from "@/features/office/actions";
import { hasOfficePermission, type OfficePermission } from "@/features/office/permissions";
import {
  parseEmployeeCompensationForm,
  parsePayrollRunForm,
  parsePayrollRunTransitionForm,
} from "@/features/office/payroll/forms";
import {
  createPayrollEmployee,
  createPayrollRun,
  transitionPayrollRun,
} from "@/features/office/payroll/repository";
import { OfficeRepositoryError } from "@/features/office/repository";

type ParsedFailure = {
  success: false;
  error: { issues: ReadonlyArray<{ path: PropertyKey[]; message: string }> };
};

function validationFailure(parsed: ParsedFailure): OfficeActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] ?? "form");
    fieldErrors[field] ??= issue.message;
  }
  return {
    status: "error",
    message: parsed.error.issues.slice(0, 3).map((issue) => issue.message).join(" ") || "Review the payroll form.",
    fieldErrors,
  };
}

async function authorize(permission: OfficePermission) {
  const actor = await getAuthorizedOfficeActor();
  return actor && hasOfficePermission(actor.role, permission) ? actor : null;
}

function mutationFailure(error: unknown): OfficeActionState {
  if (error instanceof OfficeRepositoryError || error instanceof TypeError || error instanceof RangeError) {
    return { status: "error", message: error.message };
  }
  if (error instanceof Error && /UNIQUE constraint|_unique\b/i.test(error.message)) {
    return {
      status: "error",
      message: "This employee code or payroll period is already active. Review the existing record first.",
    };
  }
  return {
    status: "error",
    message: "The payroll operation could not be committed. No partial success was confirmed.",
  };
}

function revalidatePayroll() {
  revalidatePath("/office");
  revalidatePath("/office/payroll");
  revalidatePath("/office/audit");
}

export async function createPayrollEmployeeAction(
  _previous: OfficeActionState,
  formData: FormData,
): Promise<OfficeActionState> {
  const actor = await authorize("payroll.write");
  if (!actor) return { status: "error", message: "Your current role cannot change payroll records." };
  const parsed = parseEmployeeCompensationForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const employee = await createPayrollEmployee(parsed.data, actor);
    revalidatePayroll();
    return {
      status: "success",
      message: "Employee and effective compensation profile saved with a protected audit event.",
      createdId: employee.id,
    };
  } catch (error) {
    return mutationFailure(error);
  }
}

export async function createPayrollRunAction(
  _previous: OfficeActionState,
  formData: FormData,
): Promise<OfficeActionState> {
  const actor = await authorize("payroll.write");
  if (!actor) return { status: "error", message: "Your current role cannot prepare payroll runs." };
  const parsed = parsePayrollRunForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const run = await createPayrollRun(parsed.data, actor);
    revalidatePayroll();
    return {
      status: "success",
      message: `Draft ${run.number} calculated for ${run.employeeCount} employee${run.employeeCount === 1 ? "" : "s"}.`,
      createdId: run.id,
    };
  } catch (error) {
    return mutationFailure(error);
  }
}

async function transitionAction(
  formData: FormData,
  permission: OfficePermission,
  nextStatus: "pending_approval" | "approved" | "posted",
): Promise<OfficeActionState> {
  const actor = await authorize(permission);
  if (!actor) return { status: "error", message: "Your current role cannot perform this payroll transition." };
  const parsed = parsePayrollRunTransitionForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const run = await transitionPayrollRun(
      { runId: parsed.data.runId, expectedVersion: parsed.data.version, nextStatus },
      actor,
    );
    revalidatePayroll();
    return {
      status: "success",
      message: `${run.number} moved to ${nextStatus.replaceAll("_", " ")}.`,
      createdId: run.id,
    };
  } catch (error) {
    return mutationFailure(error);
  }
}

export async function submitPayrollRunAction(
  _previous: OfficeActionState,
  formData: FormData,
): Promise<OfficeActionState> {
  return transitionAction(formData, "payroll.write", "pending_approval");
}

export async function approvePayrollRunAction(
  _previous: OfficeActionState,
  formData: FormData,
): Promise<OfficeActionState> {
  return transitionAction(formData, "payroll.approve", "approved");
}

export async function postPayrollRunAction(
  _previous: OfficeActionState,
  formData: FormData,
): Promise<OfficeActionState> {
  return transitionAction(formData, "payroll.post", "posted");
}
