"use server";

import { revalidatePath } from "next/cache";
import { company } from "@/lib/company-data";
import { getAuthorizedOfficeActor } from "@/features/office/auth";
import type { OfficeActionState } from "@/features/office/actions";
import {
  parseOfficeIssueNoticeForm,
  parseOfficeNoticeForm,
} from "@/features/office/notices/forms";
import {
  createOfficeNotice,
  getOfficeNoticeContactSnapshot,
  issueOfficeNotice,
} from "@/features/office/notices/repository";
import { hasOfficePermission, type OfficePermission } from "@/features/office/permissions";
import { OfficeRepositoryError } from "@/features/office/repository";

type ParsedFailure = Readonly<{
  success: false;
  error: { issues: ReadonlyArray<{ path: PropertyKey[]; message: string }> };
}>;

function validationFailure(parsed: ParsedFailure): OfficeActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] ?? "form");
    fieldErrors[field] ??= issue.message;
  }
  return {
    status: "error",
    message:
      parsed.error.issues.slice(0, 3).map((issue) => issue.message).join(" ") ||
      "Review the highlighted fields.",
    fieldErrors,
  };
}

async function authorize(permission: OfficePermission) {
  const actor = await getAuthorizedOfficeActor();
  return actor && hasOfficePermission(actor.role, permission) ? actor : null;
}

function mutationFailure(error: unknown): OfficeActionState {
  if (
    error instanceof OfficeRepositoryError ||
    error instanceof TypeError ||
    error instanceof RangeError
  ) {
    return { status: "error", message: error.message };
  }
  return {
    status: "error",
    message: "The notice could not be saved. No partial operation was accepted.",
  };
}

function companySnapshot() {
  return {
    name: company.name,
    address: `${company.address.line1}, ${company.address.line2}, ${company.address.country}`,
    email: company.email,
    phone: company.phones[0].display,
    taxIdentifier: null,
  };
}

export async function createOfficeNoticeAction(
  _previous: OfficeActionState,
  formData: FormData,
): Promise<OfficeActionState> {
  const actor = await authorize("documents.write");
  if (!actor) {
    return { status: "error", message: "Your current office role cannot create notices." };
  }

  const parsed = parseOfficeNoticeForm(formData);
  if (!parsed.success) return validationFailure(parsed);

  try {
    const recipient = parsed.data.contactId
      ? await getOfficeNoticeContactSnapshot(parsed.data.contactId)
      : null;
    if (parsed.data.contactId && !recipient) {
      return {
        status: "error",
        message: "Choose an active notice recipient.",
        fieldErrors: { contactId: "The selected contact is unavailable." },
      };
    }

    const notice = await createOfficeNotice(
      {
        ...parsed.data,
        company: companySnapshot(),
        recipient,
      },
      actor,
    );
    revalidatePath("/office");
    revalidatePath("/office/notices");
    revalidatePath(`/office/notices/${notice.id}`);
    return {
      status: "success",
      message: "Notice draft created. Review it before issuing or sharing it.",
      createdId: notice.id,
    };
  } catch (error) {
    return mutationFailure(error);
  }
}

export async function issueOfficeNoticeAction(
  _previous: OfficeActionState,
  formData: FormData,
): Promise<OfficeActionState> {
  const actor = await authorize("documents.review");
  if (!actor) {
    return { status: "error", message: "Your current office role cannot issue notices." };
  }

  const parsed = parseOfficeIssueNoticeForm(formData);
  if (!parsed.success) return validationFailure(parsed);

  try {
    const notice = await issueOfficeNotice(
      {
        noticeId: parsed.data.noticeId,
        expectedVersion: parsed.data.version,
        fiscalYear: parsed.data.fiscalYear,
        branchCode: parsed.data.branchCode,
      },
      actor,
    );
    revalidatePath("/office");
    revalidatePath("/office/notices");
    revalidatePath(`/office/notices/${notice.id}`);
    revalidatePath(`/office/print/notices/${notice.id}`);
    return {
      status: "success",
      message: `Notice ${notice.number ?? ""} issued with public verification. No email or SMS was sent automatically.`,
      createdId: notice.id,
    };
  } catch (error) {
    return mutationFailure(error);
  }
}
