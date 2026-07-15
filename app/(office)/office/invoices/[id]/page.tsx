import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleAlert, Printer } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeIssueInvoiceForm } from "@/components/office/finance-forms";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeDate, formatOfficeMoney, formatOfficePercent, getOfficeLocalDate } from "@/features/office/presentation";
import { getOfficeInvoice, isOfficeDatabaseAvailable } from "@/features/office/repository";

type InvoiceDetailPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: InvoiceDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Invoice ${id.slice(0, 8)} | Office OS`, robots: { index: false, follow: false } };
}

function Party({ label, party }: { label: string; party: { name: string; address: string; email: string | null; phone: string | null; taxIdentifier: string | null } }) {
  return <div><h2>{label}</h2><strong>{party.name}</strong><p>{party.address}</p>{party.email ? <p>{party.email}</p> : null}{party.phone ? <p>{party.phone}</p> : null}{party.taxIdentifier ? <p>Tax ID: {party.taxIdentifier}</p> : null}</div>;
}

export default async function OfficeInvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;
  const actor = await requireOfficePermission("finance.read", `/office/invoices/${id}`);
  if (!(await isOfficeDatabaseAvailable())) return <OfficeAccessState kind="storage" />;
  const invoice = await getOfficeInvoice(id);
  if (!invoice) notFound();
  const canIssue = invoice.status === "draft" && hasOfficePermission(actor.role, "finance.post");

  return (
    <>
      <OfficePageHeader
        eyebrow="Invoice / Immutable snapshot"
        title={invoice.number ?? "Commercial draft"}
        description="This view prints from the persisted customer, company, lines, terms, totals, and payment allocations. Posted history is never recomputed from a changed profile."
        meta={<OfficeStatusBadge status={invoice.status} />}
        action={<div className="office-page-actions"><Link className="office-button office-button--ghost" href="/office/invoices"><ArrowLeft aria-hidden="true" /> Invoices</Link><Link className="office-button office-button--accent" href={`/office/print/invoices/${invoice.id}`}><Printer aria-hidden="true" /> Print / PDF</Link></div>}
      />

      {canIssue ? <section className="office-record-composer"><OfficeIssueInvoiceForm invoiceId={invoice.id} version={invoice.version} fiscalYear={(invoice.issueDate ?? getOfficeLocalDate()).slice(0, 4)} /></section> : null}

      <div className="invoice-sheet">
        <header className="invoice-sheet__brand">
          <div><span className="office-eyebrow">Abdullah Properties</span><h1>Invoice</h1></div>
          <div><strong>{invoice.number ?? "DRAFT — NOT ISSUED"}</strong><p>Issue date: {formatOfficeDate(invoice.issueDate)}</p><p>Due date: {formatOfficeDate(invoice.dueDate)}</p><p>Status: {invoice.status.replaceAll("_", " ")}</p></div>
        </header>
        <section className="invoice-sheet__parties"><Party label="From" party={invoice.companySnapshot} /><Party label="Bill to" party={invoice.customerSnapshot} /></section>
        <div className="office-table-wrap">
          <table className="office-table">
            <thead><tr><th>#</th><th>Description</th><th>Quantity</th><th>Unit price</th><th>Discount</th><th>Tax</th><th>Total</th></tr></thead>
            <tbody>{invoice.items.map((item) => <tr key={item.id}><td>{item.position}</td><td><strong>{item.description}</strong></td><td>{(item.quantityMillis / 1_000).toLocaleString("en-BD", { maximumFractionDigits: 3 })}</td><td>{formatOfficeMoney(item.unitPriceMinor, invoice.currency)}</td><td>{formatOfficeMoney(item.discountMinor, invoice.currency)}</td><td>{formatOfficePercent(item.taxRateBps)}</td><td><strong>{formatOfficeMoney(item.totalMinor, invoice.currency)}</strong></td></tr>)}</tbody>
          </table>
        </div>
        <section className="invoice-sheet__totals"><div><p><span>Subtotal</span><strong>{formatOfficeMoney(invoice.subtotalMinor, invoice.currency)}</strong></p><p><span>Discount</span><strong>− {formatOfficeMoney(invoice.discountMinor, invoice.currency)}</strong></p><p><span>Tax</span><strong>{formatOfficeMoney(invoice.taxMinor, invoice.currency)}</strong></p><p><span>Total</span><strong>{formatOfficeMoney(invoice.totalMinor, invoice.currency)}</strong></p><p><span>Paid</span><strong>{formatOfficeMoney(invoice.paidMinor, invoice.currency)}</strong></p><p><span>Balance due</span><strong>{formatOfficeMoney(invoice.balanceMinor, invoice.currency)}</strong></p></div></section>
        <footer className="invoice-sheet__footer"><div><h2>Terms</h2><p>{invoice.termsSnapshot}</p></div><div><h2>Notes</h2><p>{invoice.notes ?? "No additional note."}</p></div></footer>
      </div>

      <section className="office-panel office-panel--wide office-record-composer office-print-hide">
        <div className="office-panel__head"><div><span className="office-eyebrow">Collections trail</span><h2>Allocated payments</h2></div></div>
        {invoice.payments.length > 0 ? <div className="office-table-wrap"><table className="office-table"><thead><tr><th>Receipt</th><th>Date</th><th>Method</th><th>Status</th><th>Allocated</th></tr></thead><tbody>{invoice.payments.map((payment) => <tr key={payment.allocationId}><td><Link href={`/office/print/payments/${payment.paymentId}`}>{payment.receiptNumber ?? payment.paymentId.slice(0, 8)}</Link></td><td>{formatOfficeDate(payment.paidAt)}</td><td>{payment.method.replaceAll("_", " ")}</td><td><OfficeStatusBadge status={payment.status} /></td><td>{formatOfficeMoney(payment.amountMinor, invoice.currency)}</td></tr>)}</tbody></table></div> : <div className="office-alert office-alert--warning"><CircleAlert aria-hidden="true" /><div><strong>No collection allocated</strong><p>Issued invoices become available in the payment register. Drafts cannot accept collections.</p></div></div>}
        <div className="office-alert office-alert--warning"><CircleAlert aria-hidden="true" /><div><strong>Commercial invoice boundary</strong><p>This record is not represented as an NBR VAT invoice. Tax-specific fields remain disabled until verified legal entity, BIN, place-of-supply, fiscal configuration, and accountant approval are supplied.</p></div></div>
      </section>
    </>
  );
}
