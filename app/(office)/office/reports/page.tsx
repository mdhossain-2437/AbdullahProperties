import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, BriefcaseBusiness, ChartNoAxesCombined, Clock3, FileSearch, Landmark, UsersRound } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficeMetricCard } from "@/components/office/metric-card";
import { OfficePageHeader } from "@/components/office/page-header";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeMoney, formatOfficePercent } from "@/features/office/presentation";
import {
  getOfficeDatabaseHealth,
  listOfficeExpenses,
  listOfficeInvoices,
  listOfficeLandParcels,
  listOfficeLeads,
  listOfficePayments,
  listOfficeProjects,
  listOfficeTasks,
} from "@/features/office/repository";
import { buildOfficeOperationalReport, OFFICE_OPERATIONAL_REPORT_LIMIT } from "@/features/office/reporting";

export const metadata: Metadata = { title: "Operational reports | Office OS" };

export default async function OfficeReportsPage() {
  const actor = await requireOfficePermission("reports.read", "/office/reports");
  const health = await getOfficeDatabaseHealth();
  if (!health.healthy) return <OfficeAccessState kind="storage" />;

  const canReadCrm = hasOfficePermission(actor.role, "crm.read");
  const canReadLand = hasOfficePermission(actor.role, "land.read");
  const canReadProjects = hasOfficePermission(actor.role, "projects.read");
  const canReadTasks = hasOfficePermission(actor.role, "tasks.read");
  const canReadFinance = hasOfficePermission(actor.role, "finance.read");
  const canReadExpenses = hasOfficePermission(actor.role, "expenses.read");

  const [leads, landParcels, projects, tasks, invoices, payments, expenses] = await Promise.all([
    canReadCrm ? listOfficeLeads({ limit: OFFICE_OPERATIONAL_REPORT_LIMIT }) : Promise.resolve([]),
    canReadLand ? listOfficeLandParcels({ limit: OFFICE_OPERATIONAL_REPORT_LIMIT }) : Promise.resolve([]),
    canReadProjects ? listOfficeProjects({ limit: OFFICE_OPERATIONAL_REPORT_LIMIT }) : Promise.resolve([]),
    canReadTasks ? listOfficeTasks({ limit: OFFICE_OPERATIONAL_REPORT_LIMIT }) : Promise.resolve([]),
    canReadFinance ? listOfficeInvoices({ limit: OFFICE_OPERATIONAL_REPORT_LIMIT }) : Promise.resolve([]),
    canReadFinance ? listOfficePayments({ limit: OFFICE_OPERATIONAL_REPORT_LIMIT }) : Promise.resolve([]),
    canReadExpenses ? listOfficeExpenses({ limit: OFFICE_OPERATIONAL_REPORT_LIMIT }) : Promise.resolve([]),
  ]);
  const report = buildOfficeOperationalReport({
    asOf: new Date().toISOString(),
    leads,
    landParcels,
    projects,
    tasks,
    invoices,
    payments,
    expenses,
  });
  const hasAnyVisibleData = Object.values(report.sample).some((value) => typeof value === "number" && value > 0);

  return (
    <>
      <OfficePageHeader
        eyebrow="Control / Operating snapshot"
        title="Signals for the next meeting."
        description="A permission-aware snapshot derived from at most 200 records per visible register. It supports operational review; it is not a general ledger, audited financial statement, tax report, or business-intelligence warehouse."
        meta={<span className="office-record-count">Live protected data</span>}
      />

      <div className="office-alert office-alert--warning" role="note">
        <ChartNoAxesCombined aria-hidden="true" />
        <div><strong>Operational, bounded, and role-scoped</strong><p>{report.sample.mayBeTruncated ? "At least one register reached the 200-record cap; use a governed export or analytics store before drawing trend conclusions." : "No visible register reached the 200-record cap, but these values still represent current operations rather than accounting or BI certification."}</p></div>
      </div>

      <section className="office-metrics" aria-label="Operational report summary">
        <OfficeMetricCard label="Active leads" value={canReadCrm ? String(report.relationships.activeLeads) : "Restricted"} note={canReadCrm ? `${formatOfficeMoney(report.relationships.estimatedPipelineMinor)} estimated pipeline; not booked revenue.` : "CRM visibility is outside your current role."} icon={UsersRound} tone="accent" />
        <OfficeMetricCard label="Open projects" value={canReadProjects ? String(report.delivery.activeProjects) : "Restricted"} note={canReadProjects ? `${report.delivery.criticalProjects} active projects carry critical risk.` : "Project visibility is outside your current role."} icon={BriefcaseBusiness} />
        <OfficeMetricCard label="Overdue work" value={canReadTasks ? String(report.delivery.overdueTasks) : "Restricted"} note={canReadTasks ? `${report.delivery.openTasks} tasks remain open in the bounded register.` : "Task visibility is outside your current role."} icon={Clock3} tone={report.delivery.overdueTasks > 0 ? "warning" : "positive"} />
        <OfficeMetricCard label="Receivable" value={canReadFinance ? formatOfficeMoney(report.finance.outstandingInvoiceMinor) : "Restricted"} note={canReadFinance ? `${formatOfficeMoney(report.finance.overdueInvoiceMinor)} is marked overdue; reconcile before reliance.` : "Finance visibility is outside your current role."} icon={Banknote} />
      </section>

      {hasAnyVisibleData ? (
        <div className="office-grid">
          {canReadCrm ? (
            <section className="office-panel office-panel--four">
              <div className="office-panel__head"><div><span className="office-eyebrow">Relationships</span><h2>Pipeline</h2></div><Link href="/office/leads">Open leads</Link></div>
              <ul className="office-timeline">
                <li><div><strong>{report.relationships.activeLeads} active leads</strong><p>Won and lost opportunities are excluded from the active count.</p></div></li>
                <li><div><strong>{report.relationships.proposalOrLater} at proposal or negotiation</strong><p>Stage is an operating signal, not a revenue forecast.</p></div></li>
                <li><div><strong>{formatOfficeMoney(report.relationships.estimatedPipelineMinor)} estimated value</strong><p>User-entered estimates only; no probability weighting or accounting recognition.</p></div></li>
              </ul>
            </section>
          ) : null}

          {canReadLand ? (
            <section className="office-panel office-panel--four">
              <div className="office-panel__head"><div><span className="office-eyebrow">Land & JV</span><h2>Review load</h2></div><Link href="/office/land">Open land files</Link></div>
              <ul className="office-timeline">
                <li><div><strong>{report.land.openFiles} open land files</strong><p>Closed and rejected files are excluded.</p></div></li>
                <li><div><strong>{report.land.reviewedFiles} marked reviewed</strong><p>A workflow state never replaces legal or government verification.</p></div></li>
                <li><div><strong>{report.land.needsInformation} need information</strong><p>Resolve missing source evidence before the next gate.</p></div></li>
              </ul>
            </section>
          ) : null}

          {canReadProjects || canReadTasks ? (
            <section className="office-panel office-panel--four">
              <div className="office-panel__head"><div><span className="office-eyebrow">Delivery</span><h2>Execution</h2></div><Link href="/office/projects">Open projects</Link></div>
              <ul className="office-timeline">
                <li><div><strong>{report.delivery.activeProjects} active projects</strong><p>{report.delivery.criticalProjects} carry critical risk.</p></div></li>
                <li><div><strong>{formatOfficePercent(report.delivery.averageProgressBps)} average progress</strong><p>Simple mean across visible active projects; not value-weighted.</p></div></li>
                <li><div><strong>{report.delivery.overdueTasks} overdue tasks</strong><p>Compared with the current server timestamp.</p></div></li>
              </ul>
            </section>
          ) : null}

          {canReadFinance ? (
            <section className="office-panel office-panel--eight">
              <div className="office-panel__head"><div><span className="office-eyebrow">Commercial operations</span><h2>Invoices and collections</h2></div><Link href="/office/invoices">Open invoices</Link></div>
              <div className="office-table-wrap" role="region" aria-label="Operational finance summary" tabIndex={0}>
                <table className="office-table"><thead><tr><th>Signal</th><th>Bounded amount</th><th>Interpretation</th></tr></thead><tbody>
                  <tr><td><strong>Outstanding issued invoices</strong></td><td>{formatOfficeMoney(report.finance.outstandingInvoiceMinor)}</td><td>Issued, part-paid, and overdue balances only.</td></tr>
                  <tr><td><strong>Marked overdue</strong></td><td>{formatOfficeMoney(report.finance.overdueInvoiceMinor)}</td><td>Operational aging status; reconcile against source documents.</td></tr>
                  <tr><td><strong>Posted collections</strong></td><td>{formatOfficeMoney(report.finance.postedPaymentMinor)}</td><td>Posted payment records in the bounded register, not bank reconciliation.</td></tr>
                </tbody></table>
              </div>
            </section>
          ) : null}

          {canReadExpenses ? (
            <section className="office-panel office-panel--four">
              <div className="office-panel__head"><div><span className="office-eyebrow">Expense controls</span><h2>Review exposure</h2></div><Link href="/office/expenses">Open expenses</Link></div>
              <ul className="office-timeline"><li><div><strong>{formatOfficeMoney(report.finance.submittedExpenseMinor)} submitted</strong><p>Expenses awaiting decision in the bounded register. Not an accounts-payable balance.</p></div></li></ul>
            </section>
          ) : null}
        </div>
      ) : (
        <OfficeEmptyState icon={FileSearch} title="No operational records are available yet." description="Create real leads, land files, projects, tasks, invoices, payments, or expenses. Reports never invent sample metrics when the protected registers are empty." />
      )}

      <section className="office-panel office-panel--wide" aria-labelledby="report-coverage-title">
        <div className="office-panel__head"><div><span className="office-eyebrow">Scope disclosure</span><h2 id="report-coverage-title">Records read for this view</h2></div><Landmark aria-hidden="true" /></div>
        <div className="office-table-wrap" role="region" aria-label="Operational report source coverage" tabIndex={0}>
          <table className="office-table"><thead><tr><th>Register</th><th>Records read</th><th>Role access</th></tr></thead><tbody>
            <tr><td>Leads</td><td>{report.sample.leads}</td><td>{canReadCrm ? "Included" : "Restricted"}</td></tr>
            <tr><td>Land files</td><td>{report.sample.landParcels}</td><td>{canReadLand ? "Included" : "Restricted"}</td></tr>
            <tr><td>Projects</td><td>{report.sample.projects}</td><td>{canReadProjects ? "Included" : "Restricted"}</td></tr>
            <tr><td>Tasks</td><td>{report.sample.tasks}</td><td>{canReadTasks ? "Included" : "Restricted"}</td></tr>
            <tr><td>Invoices / payments</td><td>{report.sample.invoices} / {report.sample.payments}</td><td>{canReadFinance ? "Included" : "Restricted"}</td></tr>
            <tr><td>Expenses</td><td>{report.sample.expenses}</td><td>{canReadExpenses ? "Included" : "Restricted"}</td></tr>
          </tbody></table>
        </div>
      </section>
    </>
  );
}
