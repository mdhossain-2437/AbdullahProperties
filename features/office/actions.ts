"use server";

import { revalidatePath } from "next/cache";
import { company } from "@/lib/company-data";
import { getAuthorizedOfficeActor, type AuthorizedOfficeActor } from "@/features/office/auth";
import {
  parseOfficeApprovalDecisionForm,
  parseOfficeContactForm,
  parseOfficeExpenseForm,
  parseOfficeInvoiceForm,
  parseOfficeIssueInvoiceForm,
  parseOfficeLandForm,
  parseOfficeLeadForm,
  parseOfficeMemberForm,
  parseOfficePaymentForm,
  parseOfficeProjectForm,
  parseOfficeTaskForm,
} from "@/features/office/forms";
import { hasOfficePermission, type OfficePermission } from "@/features/office/permissions";
import {
  addOfficeTeamMember,
  createOfficeContact,
  createOfficeExpense,
  createOfficeInvoice,
  createOfficeLandParcel,
  createOfficeLead,
  createOfficeProject,
  createOfficeTask,
  decideOfficeApproval,
  listOfficeContacts,
  issueOfficeInvoice,
  recordOfficePayment,
  submitOfficeExpense,
  OfficeRepositoryError,
} from "@/features/office/repository";

export type OfficeActionState = {
  status: "idle" | "error" | "success";
  message: string;
  createdId?: string;
  fieldErrors?: Readonly<Record<string, string>>;
};

export const initialOfficeActionState: OfficeActionState = { status: "idle", message: "" };

type ParsedFailure = { success: false; error: { issues: ReadonlyArray<{ path: PropertyKey[]; message: string }> } };

function validationFailure(parsed: ParsedFailure): OfficeActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] ?? "form");
    fieldErrors[field] ??= issue.message;
  }
  return {
    status: "error",
    message: parsed.error.issues.slice(0, 3).map((issue) => issue.message).join(" ") || "Review the highlighted fields.",
    fieldErrors,
  };
}

async function authorize(permission: OfficePermission): Promise<AuthorizedOfficeActor | null> {
  const actor = await getAuthorizedOfficeActor();
  return actor && hasOfficePermission(actor.role, permission) ? actor : null;
}

function authorizationFailure(): OfficeActionState {
  return { status: "error", message: "Your current office role cannot perform this operation." };
}

function mutationFailure(error: unknown): OfficeActionState {
  if (error instanceof OfficeRepositoryError) return { status: "error", message: error.message };
  if (error instanceof TypeError || error instanceof RangeError) return { status: "error", message: error.message };
  if (error instanceof Error && /UNIQUE constraint|_unique\b/i.test(error.message)) {
    return { status: "error", message: "A record already uses that unique reference. Review the identifier and try again." };
  }
  return { status: "error", message: "The record could not be saved. No partial operation was accepted." };
}

function success(message: string, createdId?: string): OfficeActionState {
  return { status: "success", message, createdId };
}

function revalidateOffice(...paths: string[]) {
  revalidatePath("/office");
  for (const path of paths) revalidatePath(path);
}

function splitReferences(value: string | null) {
  return value ? value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean) : [];
}

export async function createOfficeContactAction(_previous: OfficeActionState, formData: FormData): Promise<OfficeActionState> {
  const actor = await authorize("crm.write");
  if (!actor) return authorizationFailure();
  const parsed = parseOfficeContactForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const record = await createOfficeContact(parsed.data, actor);
    revalidateOffice("/office/contacts");
    return success("Contact created and added to the protected relationship register.", record.id);
  } catch (error) { return mutationFailure(error); }
}

export async function createOfficeLeadAction(_previous: OfficeActionState, formData: FormData): Promise<OfficeActionState> {
  const actor = await authorize("crm.write");
  if (!actor) return authorizationFailure();
  const parsed = parseOfficeLeadForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const { estimatedValue, ...input } = parsed.data;
    const record = await createOfficeLead({ ...input, estimatedValueMinor: estimatedValue }, actor);
    revalidateOffice("/office/leads");
    return success("Lead created with a visible stage and next-action trail.", record.id);
  } catch (error) { return mutationFailure(error); }
}

export async function createOfficeLandAction(_previous: OfficeActionState, formData: FormData): Promise<OfficeActionState> {
  const actor = await authorize("land.write");
  if (!actor) return authorizationFailure();
  const parsed = parseOfficeLandForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const { dagNumbers, khatianNumbers, ...input } = parsed.data;
    const record = await createOfficeLandParcel({
      ...input,
      dagNumbers: splitReferences(dagNumbers),
      khatianNumbers: splitReferences(khatianNumbers),
    }, actor);
    revalidateOffice("/office/land");
    return success("Land file created as a review record—not as title certification.", record.id);
  } catch (error) { return mutationFailure(error); }
}

export async function createOfficeProjectAction(_previous: OfficeActionState, formData: FormData): Promise<OfficeActionState> {
  const actor = await authorize("projects.write");
  if (!actor) return authorizationFailure();
  const parsed = parseOfficeProjectForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const { budget, ...input } = parsed.data;
    const record = await createOfficeProject({ ...input, budgetMinor: budget }, actor);
    revalidateOffice("/office/projects");
    return success("Project created with scope, risk, and ownership context.", record.id);
  } catch (error) { return mutationFailure(error); }
}

export async function createOfficeTaskAction(_previous: OfficeActionState, formData: FormData): Promise<OfficeActionState> {
  const actor = await authorize("tasks.write");
  if (!actor) return authorizationFailure();
  const parsed = parseOfficeTaskForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const record = await createOfficeTask({ ...parsed.data, reporterMemberId: actor.memberId }, actor);
    revalidateOffice("/office/tasks");
    return success("Task created with explicit ownership and due-date context.", record.id);
  } catch (error) { return mutationFailure(error); }
}

export async function createOfficeInvoiceAction(_previous: OfficeActionState, formData: FormData): Promise<OfficeActionState> {
  const actor = await authorize("finance.write");
  if (!actor) return authorizationFailure();
  const parsed = parseOfficeInvoiceForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const contact = (await listOfficeContacts({ limit: 200 })).find((candidate) => candidate.id === parsed.data.contactId);
    if (!contact) return { status: "error", message: "Choose an available billing contact.", fieldErrors: { contactId: "The selected contact is unavailable." } };
    if (!contact.address) return { status: "error", message: "Add a billing address to this contact before creating the invoice.", fieldErrors: { contactId: "The billing contact needs an address." } };

    const record = await createOfficeInvoice({
      ...parsed.data,
      customer: {
        name: contact.displayName,
        address: contact.address,
        email: contact.email,
        phone: contact.phone,
        taxIdentifier: null,
      },
      company: {
        name: company.name,
        address: `${company.address.line1}, ${company.address.line2}, ${company.address.country}`,
        email: company.email,
        phone: company.phones[0].display,
        taxIdentifier: null,
      },
    }, actor);
    revalidateOffice("/office/invoices", `/office/invoices/${record.id}`);
    return success("Commercial invoice draft created. Review it before issuing or representing any tax treatment.", record.id);
  } catch (error) { return mutationFailure(error); }
}

export async function issueOfficeInvoiceAction(_previous: OfficeActionState, formData: FormData): Promise<OfficeActionState> {
  const actor = await authorize("finance.post");
  if (!actor) return authorizationFailure();
  const parsed = parseOfficeIssueInvoiceForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const invoice = await issueOfficeInvoice({
      invoiceId: parsed.data.invoiceId,
      expectedVersion: parsed.data.version,
      fiscalYear: parsed.data.fiscalYear,
    }, actor);
    revalidateOffice("/office/invoices", `/office/invoices/${invoice.id}`, "/office/payments");
    return success(`Invoice ${invoice.number ?? ""} issued and locked for collection.`, invoice.id);
  } catch (error) { return mutationFailure(error); }
}

export async function recordOfficePaymentAction(_previous: OfficeActionState, formData: FormData): Promise<OfficeActionState> {
  const actor = await authorize("payments.record");
  if (!actor) return authorizationFailure();
  const parsed = parseOfficePaymentForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const record = await recordOfficePayment({
      invoiceId: parsed.data.invoiceId,
      method: parsed.data.method,
      amountMinor: parsed.data.amount,
      paidAt: parsed.data.paidAt,
      clientOperationId: parsed.data.clientOperationId,
      locale: parsed.data.locale,
      reference: parsed.data.reference,
      note: parsed.data.note,
      fiscalYear: parsed.data.paidAt.slice(0, 4),
      receivedByMemberId: actor.memberId,
    }, actor);
    revalidateOffice("/office/payments", "/office/invoices", `/office/invoices/${parsed.data.invoiceId}`);
    return success("Payment recorded, allocated, and preserved with a receipt sequence.", record.id);
  } catch (error) { return mutationFailure(error); }
}

export async function createOfficeExpenseAction(_previous: OfficeActionState, formData: FormData): Promise<OfficeActionState> {
  const actor = await authorize("expenses.write");
  if (!actor) return authorizationFailure();
  const parsed = parseOfficeExpenseForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const { submitNow, amount, ...input } = parsed.data;
    let record = await createOfficeExpense({ ...input, amountMinor: amount }, actor);
    if (submitNow) {
      if (!actor.memberId) return success("Expense draft created. Activate your owner membership before submitting it for maker-checker review.", record.id);
      record = await submitOfficeExpense({ expenseId: record.id, expectedVersion: record.version }, actor);
    }
    revalidateOffice("/office/expenses", "/office/approvals");
    return success(submitNow ? "Expense submitted into the independent approval queue." : "Expense saved as a draft.", record.id);
  } catch (error) { return mutationFailure(error); }
}

export async function submitOfficeExpenseAction(_previous: OfficeActionState, formData: FormData): Promise<OfficeActionState> {
  const actor = await authorize("expenses.write");
  if (!actor) return authorizationFailure();
  const expenseId = formData.get("expenseId");
  const expectedVersion = Number(formData.get("version"));
  if (typeof expenseId !== "string" || !Number.isInteger(expectedVersion) || expectedVersion < 1) return { status: "error", message: "The expense version is invalid. Reload before submitting." };
  try {
    await submitOfficeExpense({ expenseId, expectedVersion }, actor);
    revalidateOffice("/office/expenses", "/office/approvals");
    return success("Expense submitted for independent approval.", expenseId);
  } catch (error) { return mutationFailure(error); }
}

export async function decideOfficeApprovalAction(_previous: OfficeActionState, formData: FormData): Promise<OfficeActionState> {
  const actor = await authorize("approvals.decide");
  if (!actor) return authorizationFailure();
  const parsed = parseOfficeApprovalDecisionForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const { approvalId, decision, reason, version } = parsed.data;
    await decideOfficeApproval({ approvalId, decision, reason, expectedVersion: version }, actor);
    revalidateOffice("/office/approvals", "/office/expenses");
    return success(`Approval ${decision}.`, approvalId);
  } catch (error) { return mutationFailure(error); }
}

export async function addOfficeTeamMemberAction(_previous: OfficeActionState, formData: FormData): Promise<OfficeActionState> {
  const actor = await authorize("team.manage");
  if (!actor) return authorizationFailure();
  const parsed = parseOfficeMemberForm(formData);
  if (!parsed.success) return validationFailure(parsed);
  try {
    const record = await addOfficeTeamMember({ ...parsed.data, status: "active" }, actor);
    revalidateOffice("/office/team");
    return success("Team member activated with a least-privilege office role.", record.id);
  } catch (error) { return mutationFailure(error); }
}

export async function activateBootstrapOwnerAction(_previous: OfficeActionState): Promise<OfficeActionState> {
  void _previous;
  const actor = await authorize("team.manage");
  if (!actor) return authorizationFailure();
  if (actor.source !== "cms_owner_bootstrap") return { status: "error", message: "This account already has an office membership." };
  try {
    const record = await addOfficeTeamMember({ email: actor.email, displayName: actor.displayName, role: "owner", status: "active" }, actor);
    revalidateOffice("/office/team");
    return success("Owner membership activated. Reload once to use member-attributed approvals.", record.id);
  } catch (error) { return mutationFailure(error); }
}
