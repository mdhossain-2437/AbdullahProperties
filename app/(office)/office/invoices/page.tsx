import Link from "next/link";
import { ArrowUpRight, FilePlus2, ReceiptText } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficeInvoiceBuilder } from "@/components/office/finance-forms";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { addOfficeLocalDays, formatOfficeDate, formatOfficeMoney, getOfficeLocalDate } from "@/features/office/presentation";
import { getOfficeDatabaseHealth, listOfficeContacts, listOfficeInvoices, listOfficeProjects } from "@/features/office/repository";
import { officeInvoiceStatusSchema } from "@/features/office/types";

type InvoicePageProps = { searchParams: Promise<{ status?: string }> };

export default async function OfficeInvoicesPage({ searchParams }: InvoicePageProps) {
  const actor = await requireOfficePermission("finance.read", "/office/invoices");
  const health = await getOfficeDatabaseHealth();
  if (!health.healthy) return <OfficeAccessState kind="storage" />;
  const query = await searchParams;
  const parsedStatus = officeInvoiceStatusSchema.safeParse(query.status);
  const status = parsedStatus.success ? parsedStatus.data : undefined;
  const [invoices, contacts, projects] = await Promise.all([
    listOfficeInvoices({ limit: 100, status }),
    listOfficeContacts({ limit: 200, status: "active" }),
    listOfficeProjects({ limit: 200 }),
  ]);
  const canWrite = hasOfficePermission(actor.role, "finance.write");
  const issueDate = getOfficeLocalDate();

  return (
    <>
      <OfficePageHeader
        eyebrow="Money / Commercial records"
        title="Invoices that keep their history."
        description="Create server-calculated commercial drafts, review immutable customer and company snapshots, issue a controlled number, and allocate collections without rewriting posted records."
        action={canWrite ? <a className="office-button office-button--accent" href="#new-invoice"><FilePlus2 aria-hidden="true" /> Create invoice</a> : undefined}
        meta={<span className="office-eyebrow">{invoices.length} visible record{invoices.length === 1 ? "" : "s"}</span>}
      />

      <form className="office-filter-bar" method="get">
        <label><span>Status</span><select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{officeInvoiceStatusSchema.options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select></label>
        <button className="office-button office-button--ghost" type="submit">Apply filter</button>
        {status ? <Link className="office-button office-button--ghost" href="/office/invoices">Clear</Link> : null}
      </form>

      {invoices.length > 0 ? (
        <div className="office-table-wrap">
          <table className="office-table">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Status</th><th>Due</th><th>Total</th><th>Balance</th></tr></thead>
            <tbody>{invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td><Link href={`/office/invoices/${invoice.id}`}>{invoice.number ?? `Draft ${invoice.id.slice(0, 8)}`} <ArrowUpRight aria-hidden="true" /></Link><small>Created {formatOfficeDate(invoice.createdAt)}</small></td>
                <td><strong>{invoice.contactName}</strong><small>{invoice.projectName ?? "No linked project"}</small></td>
                <td><OfficeStatusBadge status={invoice.status} /></td>
                <td>{formatOfficeDate(invoice.dueDate)}</td>
                <td>{formatOfficeMoney(invoice.totalMinor, invoice.currency)}</td>
                <td><strong>{formatOfficeMoney(invoice.balanceMinor, invoice.currency)}</strong></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <OfficeEmptyState icon={ReceiptText} title={status ? "No invoices match this status." : "Create the first controlled commercial draft."} description={status ? "Clear the filter or choose another status. No record has been removed." : "A draft snapshots the customer, company, line items, terms, and server-owned totals before any controlled number is issued."} action={status ? <Link className="office-button" href="/office/invoices">Clear filter</Link> : canWrite ? <a className="office-button" href="#new-invoice">Create invoice</a> : undefined} />
      )}

      {canWrite ? (
        <section className="office-panel office-panel--wide office-record-composer" id="new-invoice">
          <div className="office-panel__head"><div><span className="office-eyebrow">New commercial draft</span><h2>Build the evidence before issuing.</h2></div></div>
          <OfficeInvoiceBuilder
            contacts={contacts.map((contact) => ({ id: contact.id, label: contact.displayName, meta: contact.address ? undefined : "billing address needed" }))}
            projects={projects.map((project) => ({ id: project.id, label: `${project.code} · ${project.name}` }))}
            issueDate={issueDate}
            dueDate={addOfficeLocalDays(issueDate, 14)}
          />
        </section>
      ) : null}
    </>
  );
}
