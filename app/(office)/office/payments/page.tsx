import Link from "next/link";
import { Banknote, CircleDollarSign, Plus } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficePaymentForm } from "@/components/office/finance-forms";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeDate, formatOfficeMoney, getOfficeLocalDate } from "@/features/office/presentation";
import { isOfficeDatabaseAvailable, listOfficeInvoices, listOfficePayments } from "@/features/office/repository";

export default async function OfficePaymentsPage() {
  const actor = await requireOfficePermission("finance.read", "/office/payments");
  if (!(await isOfficeDatabaseAvailable())) return <OfficeAccessState kind="storage" />;
  const [payments, invoices] = await Promise.all([listOfficePayments({ limit: 100 }), listOfficeInvoices({ limit: 200 })]);
  const canRecord = hasOfficePermission(actor.role, "payments.record");
  const outstanding = invoices.filter((invoice) => invoice.balanceMinor > 0 && ["issued", "partially_paid", "overdue"].includes(invoice.status));
  const collectedMinor = payments.filter((payment) => payment.status === "posted").reduce((sum, payment) => sum + payment.amountMinor, 0);

  return (
    <>
      <OfficePageHeader
        eyebrow="Money / Collections"
        title="Every receipt has somewhere to land."
        description="Record a collection against one issued invoice, allocate it without exceeding the outstanding balance, and preserve the received-by identity and receipt sequence."
        meta={<span className="office-eyebrow">{formatOfficeMoney(collectedMinor)} recorded</span>}
        action={canRecord && outstanding.length > 0 ? <a className="office-button office-button--accent" href="#record-payment"><Plus aria-hidden="true" /> Record payment</a> : undefined}
      />

      <section className="office-metrics office-metrics--two" aria-label="Payment summary">
        <article className="office-metric" data-tone="accent"><div><span>Recorded payments</span><Banknote aria-hidden="true" /></div><strong>{payments.length}</strong><p>Bounded to the latest 100 records in this operational view.</p></article>
        <article className="office-metric"><div><span>Outstanding invoices</span><CircleDollarSign aria-hidden="true" /></div><strong>{outstanding.length}</strong><p>Issued records with a remaining collectible balance.</p></article>
      </section>

      {payments.length > 0 ? <div className="office-table-wrap"><table className="office-table"><thead><tr><th>Receipt</th><th>Customer</th><th>Invoice</th><th>Date</th><th>Method</th><th>Status</th><th>Amount</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td><strong>{payment.invoiceId ? <Link href={`/office/print/payments/${payment.id}`}>{payment.receiptNumber ?? `Pending ${payment.id.slice(0, 8)}`}</Link> : payment.receiptNumber ?? `Pending ${payment.id.slice(0, 8)}`}</strong><small>{payment.reference ?? "No external reference"}</small></td><td>{payment.contactName}</td><td>{payment.invoiceId ? <Link href={`/office/invoices/${payment.invoiceId}`}>{payment.invoiceNumber ?? payment.invoiceId.slice(0, 8)}</Link> : "Unallocated"}</td><td>{formatOfficeDate(payment.paidAt)}</td><td>{payment.method.replaceAll("_", " ")}</td><td><OfficeStatusBadge status={payment.status} /></td><td><strong>{formatOfficeMoney(payment.amountMinor, payment.currency)}</strong></td></tr>)}</tbody></table></div> : <OfficeEmptyState icon={Banknote} title="No collections have been recorded." description="Issue a reviewed invoice first. The payment register will then enforce currency and outstanding-balance boundaries before creating a receipt." action={<Link className="office-button" href="/office/invoices">Review invoices</Link>} />}

      {canRecord ? <section className="office-panel office-panel--wide office-record-composer" id="record-payment"><div className="office-panel__head"><div><span className="office-eyebrow">New collection</span><h2>Allocate once. Audit always.</h2></div></div>{outstanding.length > 0 ? <OfficePaymentForm invoices={outstanding.map((invoice) => ({ id: invoice.id, label: `${invoice.number ?? invoice.id.slice(0, 8)} · ${invoice.contactName}`, meta: `${formatOfficeMoney(invoice.balanceMinor, invoice.currency)} due` }))} paidAt={getOfficeLocalDate()} /> : <div className="office-alert office-alert--warning"><CircleDollarSign aria-hidden="true" /><div><strong>No collectible invoice is available</strong><p>Create, review, and issue an invoice before recording a payment. Draft invoices cannot accept money.</p></div></div>}</section> : null}
    </>
  );
}
