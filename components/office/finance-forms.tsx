"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { FileCheck2, Plus, Printer, Send, Trash2 } from "lucide-react";
import { OfficeActionFeedback } from "@/components/office/action-feedback";
import {
  activateBootstrapOwnerAction,
  addOfficeTeamMemberAction,
  createOfficeExpenseAction,
  createOfficeInvoiceAction,
  decideOfficeApprovalAction,
  initialOfficeActionState,
  issueOfficeInvoiceAction,
  recordOfficePaymentAction,
  submitOfficeExpenseAction,
} from "@/features/office/actions";

type SelectOption = { id: string; label: string; meta?: string };

function FieldError({ message }: { message?: string }) {
  return message ? <span className="office-field-error">{message}</span> : null;
}

type InvoiceLineValues = {
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  taxRate: string;
};

type InvoiceBuilderValues = {
  contactId: string;
  projectId: string;
  issueDate: string;
  dueDate: string;
  terms: string;
  notes: string;
  items: InvoiceLineValues[];
};

export function OfficeInvoiceBuilder({ contacts, projects, issueDate, dueDate }: { contacts: readonly SelectOption[]; projects: readonly SelectOption[]; issueDate: string; dueDate: string }) {
  const [state, formAction, pending] = useActionState(createOfficeInvoiceAction, initialOfficeActionState);
  const [, startTransition] = useTransition();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const { register, control, handleSubmit, formState: { errors } } = useForm<InvoiceBuilderValues>({
    defaultValues: {
      contactId: "",
      projectId: "",
      issueDate,
      dueDate,
      terms: "Payment is due by the stated date. Scope, exclusions, and any tax treatment must match the signed commercial record.",
      notes: "",
      items: [{ description: "", quantity: "1", unitPrice: "0", discount: "0", taxRate: "0" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" });

  useEffect(() => {
    if (state.status !== "idle") feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state.status]);

  const submit = handleSubmit((values) => {
    const payload = new FormData();
    payload.set("contactId", values.contactId);
    payload.set("projectId", values.projectId);
    payload.set("issueDate", values.issueDate);
    payload.set("dueDate", values.dueDate);
    payload.set("currency", "BDT");
    payload.set("terms", values.terms);
    payload.set("notes", values.notes);
    payload.set("items", JSON.stringify(values.items));
    startTransition(() => formAction(payload));
  });

  return (
    <form className="office-form" onSubmit={submit} noValidate>
      <div ref={feedbackRef}><OfficeActionFeedback state={state} /></div>
      {state.createdId ? <Link className="office-button office-button--accent" href={`/office/invoices/${state.createdId}`}>Review created invoice <FileCheck2 aria-hidden="true" /></Link> : null}
      <fieldset className="office-form-section">
        <legend>Commercial context</legend>
        <div className="office-form-grid">
          <label><span>Billing contact</span><select {...register("contactId", { required: "Choose a billing contact." })}><option value="">Choose contact</option>{contacts.map((option) => <option key={option.id} value={option.id}>{option.label}{option.meta ? ` · ${option.meta}` : ""}</option>)}</select><FieldError message={errors.contactId?.message ?? state.fieldErrors?.contactId} /></label>
          <label><span>Project <small>optional</small></span><select {...register("projectId")}><option value="">No linked project</option>{projects.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
          <label><span>Issue date</span><input type="date" {...register("issueDate", { required: "Choose an issue date." })} /><FieldError message={errors.issueDate?.message ?? state.fieldErrors?.issueDate} /></label>
          <label><span>Due date</span><input type="date" {...register("dueDate", { required: "Choose a due date." })} /><FieldError message={errors.dueDate?.message ?? state.fieldErrors?.dueDate} /></label>
        </div>
      </fieldset>

      <fieldset className="office-form-section">
        <legend>Invoice lines</legend>
        <div className="invoice-builder__lines">
          {fields.map((field, index) => (
            <div className="invoice-builder__line" key={field.id}>
              <strong>Line {index + 1}</strong>
              <label className="office-field--wide"><span>Description</span><input {...register(`items.${index}.description`, { required: "Add a line description." })} /><FieldError message={errors.items?.[index]?.description?.message} /></label>
              <label><span>Quantity</span><input inputMode="decimal" {...register(`items.${index}.quantity`, { required: true })} /></label>
              <label><span>Unit price (BDT)</span><input inputMode="decimal" {...register(`items.${index}.unitPrice`, { required: true })} /></label>
              <label><span>Discount (BDT)</span><input inputMode="decimal" {...register(`items.${index}.discount`)} /></label>
              <input type="hidden" {...register(`items.${index}.taxRate`)} />
              <button className="office-icon-button" type="button" onClick={() => remove(index)} disabled={fields.length === 1} aria-label={`Remove invoice line ${index + 1}`}><Trash2 aria-hidden="true" /></button>
            </div>
          ))}
        </div>
        <button className="office-button office-button--ghost" type="button" onClick={() => append({ description: "", quantity: "1", unitPrice: "0", discount: "0", taxRate: "0" })} disabled={fields.length >= 20}><Plus aria-hidden="true" /> Add line</button>
        <p className="office-form-note">{watchedItems?.length ?? 0} line(s). Tax is fixed at zero until verified entity/BIN/tax configuration and accountant approval exist.</p>
      </fieldset>

      <fieldset className="office-form-section">
        <legend>Terms and internal context</legend>
        <div className="office-form-grid">
          <label className="office-field--wide"><span>Commercial terms</span><textarea {...register("terms", { required: "Add clear commercial terms.", minLength: { value: 10, message: "Add at least 10 characters." } })} /><FieldError message={errors.terms?.message ?? state.fieldErrors?.terms} /></label>
          <label className="office-field--wide"><span>Notes <small>optional</small></span><textarea {...register("notes")} /></label>
        </div>
      </fieldset>
      <div className="office-form-actions"><span className="office-form-note">Server totals override every client calculation.</span><button className="office-button office-button--accent" type="submit" disabled={pending}>{pending ? "Creating…" : "Create invoice draft"}</button></div>
    </form>
  );
}

export function OfficeIssueInvoiceForm({ invoiceId, version, fiscalYear }: { invoiceId: string; version: number; fiscalYear: string }) {
  const [state, action, pending] = useActionState(issueOfficeInvoiceAction, initialOfficeActionState);
  return <form className="office-inline-form office-print-hide" action={action}><input type="hidden" name="invoiceId" value={invoiceId} /><input type="hidden" name="version" value={version} /><input type="hidden" name="fiscalYear" value={fiscalYear} /><OfficeActionFeedback state={state} /><p>Issuing locks the commercial snapshot and allocates the next controlled invoice number. This first-release direct-post path is limited to elevated finance roles.</p><button className="office-button office-button--accent" type="submit" disabled={pending}><Send aria-hidden="true" /> {pending ? "Issuing…" : "Issue invoice"}</button></form>;
}

export function OfficePaymentForm({ invoices, paidAt }: { invoices: readonly SelectOption[]; paidAt: string }) {
  const [state, action, pending] = useActionState(recordOfficePaymentAction, initialOfficeActionState);
  return <form className="office-form" action={action} noValidate><OfficeActionFeedback state={state} /><fieldset className="office-form-section"><legend>Record collection</legend><div className="office-form-grid">
    <label className="office-field--wide"><span>Issued invoice</span><select name="invoiceId" required defaultValue=""><option value="">Choose an outstanding invoice</option>{invoices.map((option) => <option key={option.id} value={option.id}>{option.label}{option.meta ? ` · ${option.meta}` : ""}</option>)}</select><FieldError message={state.fieldErrors?.invoiceId} /></label>
    <label><span>Amount (BDT)</span><input name="amount" inputMode="decimal" required placeholder="0.00" /><FieldError message={state.fieldErrors?.amount} /></label>
    <label><span>Payment method</span><select name="method" defaultValue="bank_transfer"><option value="bank_transfer">Bank transfer</option><option value="mobile_financial_service">Mobile financial service</option><option value="cheque">Cheque</option><option value="cash">Cash</option><option value="card">Card</option><option value="other">Other</option></select></label>
    <label><span>Paid date</span><input name="paidAt" type="date" defaultValue={paidAt} required /></label>
    <label><span>Reference <small>optional</small></span><input name="reference" /></label>
    <label className="office-field--wide"><span>Note <small>optional</small></span><textarea name="note" /></label>
    <input type="hidden" name="currency" value="BDT" />
  </div></fieldset><div className="office-form-actions"><button className="office-button office-button--accent" type="submit" disabled={pending}>{pending ? "Recording…" : "Record and allocate payment"}</button></div></form>;
}

export function OfficeExpenseForm({ projects, vendors, incurredAt }: { projects: readonly SelectOption[]; vendors: readonly SelectOption[]; incurredAt: string }) {
  const [state, action, pending] = useActionState(createOfficeExpenseAction, initialOfficeActionState);
  return <form className="office-form" action={action} noValidate><OfficeActionFeedback state={state} /><fieldset className="office-form-section"><legend>Expense evidence</legend><div className="office-form-grid">
    <label><span>Category</span><input name="category" required placeholder="Site visit, office, consultant…" /><FieldError message={state.fieldErrors?.category} /></label>
    <label><span>Amount (BDT)</span><input name="amount" inputMode="decimal" required placeholder="0.00" /><FieldError message={state.fieldErrors?.amount} /></label>
    <label><span>Project <small>optional</small></span><select name="projectId" defaultValue=""><option value="">General office expense</option>{projects.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
    <label><span>Vendor <small>optional</small></span><select name="vendorContactId" defaultValue=""><option value="">No vendor selected</option>{vendors.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
    <label><span>Incurred date</span><input name="incurredAt" type="date" defaultValue={incurredAt} required /></label>
    <label className="office-field--wide"><span>Description</span><textarea name="description" required /><FieldError message={state.fieldErrors?.description} /></label>
    <label className="office-checkbox"><input type="checkbox" name="submitNow" value="true" /><span>Submit immediately for independent approval</span></label>
    <input type="hidden" name="currency" value="BDT" />
  </div></fieldset><div className="office-form-actions"><button className="office-button office-button--accent" type="submit" disabled={pending}>{pending ? "Saving…" : "Save expense"}</button></div></form>;
}

export function OfficeSubmitExpenseForm({ expenseId, version }: { expenseId: string; version: number }) {
  const [state, action, pending] = useActionState(submitOfficeExpenseAction, initialOfficeActionState);
  return <form className="office-inline-form" action={action}><input type="hidden" name="expenseId" value={expenseId} /><input type="hidden" name="version" value={version} /><button className="office-button office-button--ghost" type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit for approval"}</button><OfficeActionFeedback state={state} /></form>;
}

export function OfficeApprovalDecisionForm({ approvalId, version }: { approvalId: string; version: number }) {
  const [state, action, pending] = useActionState(decideOfficeApprovalAction, initialOfficeActionState);
  return <form className="office-inline-form" action={action}><input type="hidden" name="approvalId" value={approvalId} /><input type="hidden" name="version" value={version} /><label><span>Decision</span><select name="decision" defaultValue="approved"><option value="approved">Approve</option><option value="rejected">Reject</option></select></label><label><span>Reason</span><input name="reason" required minLength={4} placeholder="Record the decision basis" /></label><button className="office-button office-button--accent" type="submit" disabled={pending}>{pending ? "Recording…" : "Record decision"}</button><OfficeActionFeedback state={state} /></form>;
}

export function OfficeTeamMemberForm() {
  const [state, action, pending] = useActionState(addOfficeTeamMemberAction, initialOfficeActionState);
  return <form className="office-form" action={action} noValidate><OfficeActionFeedback state={state} /><fieldset className="office-form-section"><legend>Least-privilege membership</legend><div className="office-form-grid"><label><span>Name</span><input name="displayName" required /></label><label><span>Work email</span><input name="email" type="email" required /></label><label><span>Role</span><select name="role" defaultValue="viewer"><option value="admin">Administrator</option><option value="manager">Operations manager</option><option value="sales">Sales</option><option value="projects">Projects</option><option value="accounts">Accounts</option><option value="viewer">Read-only viewer</option></select></label></div></fieldset><div className="office-form-actions"><button className="office-button office-button--accent" type="submit" disabled={pending}>{pending ? "Activating…" : "Activate member"}</button></div></form>;
}

export function OfficeBootstrapOwnerForm() {
  const [state, action, pending] = useActionState(activateBootstrapOwnerAction, initialOfficeActionState);
  return <form className="office-inline-form" action={action}><OfficeActionFeedback state={state} /><p>Activate a durable owner membership so approvals carry a member identity instead of the bootstrap fallback.</p><button className="office-button office-button--accent" type="submit" disabled={pending}>{pending ? "Activating…" : "Activate owner membership"}</button></form>;
}

export function PrintInvoiceButton() {
  return <button className="office-button office-button--ghost office-print-hide" type="button" onClick={() => window.print()}><Printer aria-hidden="true" /> Print / save PDF</button>;
}
