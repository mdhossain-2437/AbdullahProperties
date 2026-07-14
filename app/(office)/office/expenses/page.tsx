import Link from "next/link";
import { CircleDollarSign, FileClock, Plus, Receipt } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficeExpenseForm, OfficeSubmitExpenseForm } from "@/components/office/finance-forms";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeDate, formatOfficeMoney, getOfficeLocalDate } from "@/features/office/presentation";
import { getOfficeDatabaseHealth, listOfficeContacts, listOfficeExpenses, listOfficeProjects } from "@/features/office/repository";
import { officeExpenseStatusSchema } from "@/features/office/types";

type ExpensePageProps = { searchParams: Promise<{ status?: string }> };

export default async function OfficeExpensesPage({ searchParams }: ExpensePageProps) {
  const actor = await requireOfficePermission("expenses.read", "/office/expenses");
  const health = await getOfficeDatabaseHealth();
  if (!health.healthy) return <OfficeAccessState kind="storage" />;
  const query = await searchParams;
  const parsedStatus = officeExpenseStatusSchema.safeParse(query.status);
  const status = parsedStatus.success ? parsedStatus.data : undefined;
  const [expenses, projects, vendors] = await Promise.all([
    listOfficeExpenses({ limit: 100, status }),
    listOfficeProjects({ limit: 200 }),
    listOfficeContacts({ limit: 200, status: "active", kind: "vendor" }),
  ]);
  const canWrite = hasOfficePermission(actor.role, "expenses.write");
  const pending = expenses.filter((expense) => expense.status === "submitted");
  const pendingMinor = pending.reduce((sum, expense) => sum + expense.amountMinor, 0);

  return (
    <>
      <OfficePageHeader
        eyebrow="Money / Expenses"
        title="Prepare, submit, then decide."
        description="Expense preparation and approval remain separate. Drafts can be corrected; submissions enter a maker-checker queue; a submitter cannot approve their own expense."
        meta={<span className="office-eyebrow">{pending.length} awaiting decision · {formatOfficeMoney(pendingMinor)}</span>}
        action={canWrite ? <a className="office-button office-button--accent" href="#new-expense"><Plus aria-hidden="true" /> Add expense</a> : undefined}
      />

      <form className="office-filter-bar" method="get"><label><span>Status</span><select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{officeExpenseStatusSchema.options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select></label><button className="office-button office-button--ghost" type="submit">Apply filter</button>{status ? <Link className="office-button office-button--ghost" href="/office/expenses">Clear</Link> : null}</form>

      {expenses.length > 0 ? <div className="office-table-wrap" tabIndex={0} aria-label="Expense register"><table className="office-table"><thead><tr><th>Expense</th><th>Context</th><th>Date</th><th>Status</th><th>Prepared by</th><th>Amount</th><th>Control</th></tr></thead><tbody>{expenses.map((expense) => <tr key={expense.id}><td><strong>{expense.number ?? `Draft ${expense.id.slice(0, 8)}`}</strong><small>{expense.category}</small></td><td><strong>{expense.description}</strong><small>{expense.projectName ?? expense.vendorName ?? "General office"}</small></td><td>{formatOfficeDate(expense.incurredAt)}</td><td><OfficeStatusBadge status={expense.status} /></td><td>{expense.submittedByMemberName ?? expense.createdByEmail}</td><td><strong>{formatOfficeMoney(expense.amountMinor, expense.currency)}</strong></td><td>{canWrite && expense.status === "draft" ? <OfficeSubmitExpenseForm expenseId={expense.id} version={expense.version} /> : expense.status === "rejected" ? <small>{expense.rejectionReason}</small> : "—"}</td></tr>)}</tbody></table></div> : <OfficeEmptyState icon={Receipt} title={status ? "No expenses match this status." : "The expense register is ready."} description={status ? "Clear or change the filter. No expense record has been deleted." : "Capture the business reason, date, amount, project or vendor context, then submit it into the approval queue."} action={status ? <Link className="office-button" href="/office/expenses">Clear filter</Link> : canWrite ? <a className="office-button" href="#new-expense">Add first expense</a> : undefined} />}

      <section className="office-grid office-record-composer"><article className="office-panel office-panel--four"><div className="office-panel__head"><div><span className="office-eyebrow">Maker-checker</span><h2>Why two steps?</h2></div></div><div className="office-alert office-alert--warning"><FileClock aria-hidden="true" /><div><strong>Draft is not approval</strong><p>Submission records who prepared the request. Approval requires another authorized member and an explicit reason.</p></div></div></article><article className="office-panel office-panel--eight"><div className="office-panel__head"><div><span className="office-eyebrow">Control boundary</span><h2>Not a general ledger.</h2></div></div><div className="office-alert"><CircleDollarSign aria-hidden="true" /><div><strong>Operational expense control</strong><p>This first release coordinates evidence and decisions. It does not claim statutory accounting, bank reconciliation, depreciation, withholding, or tax return functionality.</p></div></div></article></section>

      {canWrite ? <section className="office-panel office-panel--wide office-record-composer" id="new-expense"><div className="office-panel__head"><div><span className="office-eyebrow">New expense</span><h2>Capture the evidence once.</h2></div></div><OfficeExpenseForm projects={projects.map((project) => ({ id: project.id, label: `${project.code} · ${project.name}` }))} vendors={vendors.map((vendor) => ({ id: vendor.id, label: vendor.displayName }))} incurredAt={getOfficeLocalDate()} /></section> : null}
    </>
  );
}
