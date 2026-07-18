import { LoaderCircle, Save } from "lucide-react";
import type { FormEvent } from "react";
import type { LocalRecordInput } from "../offline/model";

type RecordEditorProps = {
  readonly value: LocalRecordInput;
  readonly onChange: (value: LocalRecordInput) => void;
  readonly onSubmit: (value: LocalRecordInput) => void;
  readonly isSaving: boolean;
  readonly error: string | null;
  readonly autosaveLabel: string;
};

export function RecordEditor({
  value,
  onChange,
  onSubmit,
  isSaving,
  error,
  autosaveLabel,
}: RecordEditorProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
  }

  return (
    <form className="draft-form record-editor" onSubmit={handleSubmit} noValidate data-testid="record-editor">
      {value.kind === "lead" ? (
        <>
          <label>Customer name<input data-testid="lead-name" autoFocus value={value.input.customerName} onChange={(event) => onChange({ ...value, input: { ...value.input, customerName: event.currentTarget.value } })} /></label>
          <label>Phone<input inputMode="tel" value={value.input.phone} onChange={(event) => onChange({ ...value, input: { ...value.input, phone: event.currentTarget.value } })} placeholder="+880 17…" /></label>
          <label>Property interest<input value={value.input.interest} onChange={(event) => onChange({ ...value, input: { ...value.input, interest: event.currentTarget.value } })} placeholder="Apartment, land or joint venture" /></label>
          <label>Preferred location<input value={value.input.location} onChange={(event) => onChange({ ...value, input: { ...value.input, location: event.currentTarget.value } })} /></label>
          <label>Next follow-up<input type="date" value={value.input.followUpDate} onChange={(event) => onChange({ ...value, input: { ...value.input, followUpDate: event.currentTarget.value } })} /></label>
          <label>Priority<select value={value.input.priority} onChange={(event) => onChange({ ...value, input: { ...value.input, priority: event.currentTarget.value === "high" ? "high" : "normal" } })}><option value="normal">Normal</option><option value="high">High</option></select></label>
          <label className="form-wide">Conversation notes<textarea rows={4} value={value.input.notes} onChange={(event) => onChange({ ...value, input: { ...value.input, notes: event.currentTarget.value } })} /></label>
        </>
      ) : null}

      {value.kind === "invoice_draft" ? (
        <>
          <label>Customer name<input data-testid="invoice-name" autoFocus value={value.input.customerName} onChange={(event) => onChange({ ...value, input: { ...value.input, customerName: event.currentTarget.value } })} /></label>
          <label>Phone<input inputMode="tel" value={value.input.phone} onChange={(event) => onChange({ ...value, input: { ...value.input, phone: event.currentTarget.value } })} /></label>
          <label>Email<input type="email" value={value.input.email} onChange={(event) => onChange({ ...value, input: { ...value.input, email: event.currentTarget.value } })} /></label>
          <label>Purpose<input value={value.input.purpose} onChange={(event) => onChange({ ...value, input: { ...value.input, purpose: event.currentTarget.value } })} /></label>
          <label>Amount (BDT)<input inputMode="decimal" value={value.input.amount} onChange={(event) => onChange({ ...value, input: { ...value.input, amount: event.currentTarget.value } })} placeholder="0.00" /></label>
          <label>Language<select value={value.input.locale} onChange={(event) => onChange({ ...value, input: { ...value.input, locale: event.currentTarget.value === "bn" ? "bn" : "en" } })}><option value="bn">বাংলা</option><option value="en">English</option></select></label>
          <label>Issue date<input type="date" value={value.input.issueDate} onChange={(event) => onChange({ ...value, input: { ...value.input, issueDate: event.currentTarget.value } })} /></label>
          <label>Due date<input type="date" value={value.input.dueDate} onChange={(event) => onChange({ ...value, input: { ...value.input, dueDate: event.currentTarget.value } })} /></label>
          <label className="form-wide">Internal note<textarea rows={3} value={value.input.notes} onChange={(event) => onChange({ ...value, input: { ...value.input, notes: event.currentTarget.value } })} /></label>
        </>
      ) : null}

      {value.kind === "payment_acknowledgement" ? (
        <>
          <div className="form-caution form-wide" role="note">This creates a provisional local acknowledgement. It does not post money, allocate an invoice, send SMS/email, or assign an official receipt number.</div>
          <label>Customer name<input data-testid="payment-name" autoFocus value={value.input.customerName} onChange={(event) => onChange({ ...value, input: { ...value.input, customerName: event.currentTarget.value } })} /></label>
          <label>Phone<input inputMode="tel" value={value.input.phone} onChange={(event) => onChange({ ...value, input: { ...value.input, phone: event.currentTarget.value } })} /></label>
          <label>Email<input type="email" value={value.input.email} onChange={(event) => onChange({ ...value, input: { ...value.input, email: event.currentTarget.value } })} /></label>
          <label>Amount (BDT)<input inputMode="decimal" value={value.input.amount} onChange={(event) => onChange({ ...value, input: { ...value.input, amount: event.currentTarget.value } })} placeholder="0.00" /></label>
          <label>Method<select value={value.input.method} onChange={(event) => onChange({ ...value, input: { ...value.input, method: event.currentTarget.value === "bank_transfer" || event.currentTarget.value === "mobile_financial_service" || event.currentTarget.value === "cheque" ? event.currentTarget.value : "cash" } })}><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="mobile_financial_service">Mobile financial service</option><option value="cheque">Cheque</option></select></label>
          <label>Paid date<input type="date" value={value.input.paidAt} onChange={(event) => onChange({ ...value, input: { ...value.input, paidAt: event.currentTarget.value } })} /></label>
          <label>Invoice reference<input value={value.input.invoiceReference} onChange={(event) => onChange({ ...value, input: { ...value.input, invoiceReference: event.currentTarget.value } })} /></label>
          <label>Transaction reference<input value={value.input.reference} onChange={(event) => onChange({ ...value, input: { ...value.input, reference: event.currentTarget.value } })} /></label>
          <label>Language<select value={value.input.locale} onChange={(event) => onChange({ ...value, input: { ...value.input, locale: event.currentTarget.value === "bn" ? "bn" : "en" } })}><option value="bn">বাংলা</option><option value="en">English</option></select></label>
          <label className="form-wide">Internal note<textarea rows={3} value={value.input.notes} onChange={(event) => onChange({ ...value, input: { ...value.input, notes: event.currentTarget.value } })} /></label>
        </>
      ) : null}

      {value.kind === "notice_draft" ? (
        <>
          <label>Recipient name<input data-testid="notice-name" autoFocus value={value.input.recipientName} onChange={(event) => onChange({ ...value, input: { ...value.input, recipientName: event.currentTarget.value } })} /></label>
          <label>Phone<input inputMode="tel" value={value.input.phone} onChange={(event) => onChange({ ...value, input: { ...value.input, phone: event.currentTarget.value } })} /></label>
          <label>Email<input type="email" value={value.input.email} onChange={(event) => onChange({ ...value, input: { ...value.input, email: event.currentTarget.value } })} /></label>
          <label>Effective date<input type="date" value={value.input.effectiveDate} onChange={(event) => onChange({ ...value, input: { ...value.input, effectiveDate: event.currentTarget.value } })} /></label>
          <label className="form-wide">Subject<input value={value.input.subject} onChange={(event) => onChange({ ...value, input: { ...value.input, subject: event.currentTarget.value } })} /></label>
          <label className="form-wide">Notice content<textarea rows={9} value={value.input.body} onChange={(event) => onChange({ ...value, input: { ...value.input, body: event.currentTarget.value } })} /></label>
          <label>Language<select value={value.input.locale} onChange={(event) => onChange({ ...value, input: { ...value.input, locale: event.currentTarget.value === "bn" ? "bn" : "en" } })}><option value="bn">বাংলা</option><option value="en">English</option></select></label>
        </>
      ) : null}

      {error ? <p className="form-error form-wide" role="alert">{error}</p> : null}
      <div className="form-actions form-wide">
        <span aria-live="polite">{autosaveLabel}</span>
        <button className="primary-button" type="submit" disabled={isSaving}>
          {isSaving ? <LoaderCircle className="button-spinner" aria-hidden="true" /> : <Save aria-hidden="true" />}
          Save & queue locally
        </button>
      </div>
    </form>
  );
}
