import type { Metadata } from "next";
import { Banknote, Calculator, CircleAlert, ShieldCheck, UsersRound } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficeMetricCard } from "@/components/office/metric-card";
import { OfficePageHeader } from "@/components/office/page-header";
import {
  PayrollEmployeeForm,
  PayrollRunControl,
  PayrollRunForm,
} from "@/components/office/payroll-forms";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import {
  listPayrollEmployees,
  listPayrollRuns,
} from "@/features/office/payroll/repository";
import {
  formatOfficeDate,
  formatOfficeMoney,
  getOfficeLocalDate,
  humanizeOfficeValue,
} from "@/features/office/presentation";
import { isOfficeDatabaseAvailable, listOfficeTeamMembers } from "@/features/office/repository";

export const metadata: Metadata = { title: "Payroll | Office OS" };

function currentMonthRange(localDate: string) {
  const [year, month] = localDate.split("-").map(Number);
  if (!year || !month) return { periodStart: localDate, periodEnd: localDate };
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    periodStart: `${year}-${String(month).padStart(2, "0")}-01`,
    periodEnd: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

export default async function OfficePayrollPage() {
  const actor = await requireOfficePermission("payroll.read", "/office/payroll");
  if (!(await isOfficeDatabaseAvailable())) return <OfficeAccessState kind="storage" />;

  const canWrite = hasOfficePermission(actor.role, "payroll.write");
  const canApprove = hasOfficePermission(actor.role, "payroll.approve");
  const canPost = hasOfficePermission(actor.role, "payroll.post");
  const canReadTeam = hasOfficePermission(actor.role, "team.read");
  const [employees, runs, members] = await Promise.all([
    listPayrollEmployees({ limit: 100 }),
    listPayrollRuns({ limit: 50 }),
    canReadTeam ? listOfficeTeamMembers({ status: "active", limit: 200 }) : Promise.resolve([]),
  ]);
  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const monthlyBaseMinor = activeEmployees.reduce(
    (sum, employee) => sum + (employee.calculation?.baseSalaryMinor ?? 0),
    0,
  );
  const monthlyNetMinor = activeEmployees.reduce(
    (sum, employee) => sum + (employee.calculation?.netMinor ?? 0),
    0,
  );
  const reviewCount = runs.filter((run) => run.status === "pending_approval").length;
  const localDate = getOfficeLocalDate();
  const month = currentMonthRange(localDate);

  return (
    <>
      <OfficePageHeader
        eyebrow="People / Payroll control"
        title="Calculate once. Review independently. Post deliberately."
        description="A protected employee register and effective-dated compensation snapshot now feed versioned payroll drafts. Preparation, approval, and posting remain separate, auditable steps."
        meta={<span className="office-record-count">Contractual calculation engine · v1</span>}
        action={canWrite ? <a className="office-button office-button--accent" href="#new-payroll-run"><Calculator aria-hidden="true" /> Calculate payroll</a> : undefined}
      />

      <section className="office-metrics" aria-label="Payroll operating summary">
        <OfficeMetricCard label="Active employees" value={String(activeEmployees.length)} note="Employees eligible for a matching effective compensation profile." icon={UsersRound} tone="positive" />
        <OfficeMetricCard label="Configured base" value={formatOfficeMoney(monthlyBaseMinor)} note="Current monthly base salary preview across active employees." icon={Banknote} />
        <OfficeMetricCard label="Configured net" value={formatOfficeMoney(monthlyNetMinor)} note="Base plus active allowances minus active deductions; before unconfigured statutory rules." icon={Calculator} tone="accent" />
        <OfficeMetricCard label="Awaiting approval" value={String(reviewCount)} note="Payroll runs waiting for an independent authorized reviewer." icon={ShieldCheck} tone={reviewCount > 0 ? "warning" : "default"} />
      </section>

      <div className="office-alert office-alert--warning" role="note">
        <CircleAlert aria-hidden="true" />
        <div>
          <strong>Statutory rules are configuration, not assumptions.</strong>
          <p>
            This release does not invent Bangladesh income-tax, provident-fund, overtime,
            gratuity, leave, or attendance rates. Add only amounts approved by Abdullah
            Properties and reviewed against current law and employment terms.
          </p>
        </div>
      </div>

      <section className="office-records" aria-labelledby="employee-register-title">
        <div className="office-records__head">
          <div><span className="office-eyebrow">Effective compensation preview</span><h2 id="employee-register-title">Employee register</h2></div>
          <span className="office-record-count">{employees.length} shown</span>
        </div>
        {employees.length > 0 ? (
          <div className="office-table-wrap" role="region" aria-label="Payroll employee register. Scroll horizontally on small screens." tabIndex={0}>
            <table className="office-table payroll-table">
              <thead><tr><th>Employee</th><th>Employment</th><th>Effective</th><th>Base</th><th>Allowances</th><th>Deductions</th><th>Preview net</th><th>Status</th></tr></thead>
              <tbody>{employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="office-record-primary"><strong>{employee.displayName}</strong><small>{employee.employeeCode} · {employee.department}</small></td>
                  <td><strong>{employee.designation}</strong><small>{humanizeOfficeValue(employee.employmentType)}</small></td>
                  <td>{formatOfficeDate(employee.effectiveFrom)}<small>Joined {formatOfficeDate(employee.joinDate)}</small></td>
                  <td>{employee.calculation ? formatOfficeMoney(employee.calculation.baseSalaryMinor, employee.currency ?? "BDT") : "Not configured"}</td>
                  <td>{employee.calculation ? formatOfficeMoney(employee.calculation.allowanceMinor, employee.currency ?? "BDT") : "—"}</td>
                  <td>{employee.calculation ? formatOfficeMoney(employee.calculation.deductionMinor, employee.currency ?? "BDT") : "—"}</td>
                  <td><strong>{employee.calculation ? formatOfficeMoney(employee.calculation.netMinor, employee.currency ?? "BDT") : "—"}</strong></td>
                  <td><OfficeStatusBadge status={employee.status} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <OfficeEmptyState
            icon={UsersRound}
            title="The payroll register is ready for its first employee."
            description="Create one employment identity with an effective compensation profile. Login membership remains optional and separate."
            action={canWrite ? <a className="office-button" href="#new-employee">Create employee</a> : undefined}
          />
        )}
      </section>

      <section className="office-records" aria-labelledby="payroll-run-title">
        <div className="office-records__head">
          <div><span className="office-eyebrow">Maker-checker register</span><h2 id="payroll-run-title">Payroll runs</h2></div>
          <span className="office-record-count">{runs.length} recent runs</span>
        </div>
        {runs.length > 0 ? (
          <div className="office-table-wrap" role="region" aria-label="Payroll run register. Scroll horizontally on small screens." tabIndex={0}>
            <table className="office-table payroll-table">
              <thead><tr><th>Run</th><th>Period</th><th>Employees</th><th>Gross</th><th>Deductions</th><th>Net</th><th>Status</th><th>Control</th></tr></thead>
              <tbody>{runs.map((run) => (
                <tr key={run.id}>
                  <td className="office-record-primary"><strong>{run.number}</strong><small>Prepared by {run.createdByName ?? "Durable member"}</small></td>
                  <td>{formatOfficeDate(run.periodStart)}<small>to {formatOfficeDate(run.periodEnd)}</small></td>
                  <td>{run.employeeCount}</td>
                  <td>{formatOfficeMoney(run.grossMinor, run.currency)}</td>
                  <td>{formatOfficeMoney(run.deductionMinor, run.currency)}</td>
                  <td><strong>{formatOfficeMoney(run.netMinor, run.currency)}</strong></td>
                  <td><OfficeStatusBadge status={run.status} /></td>
                  <td className="payroll-control-cell"><PayrollRunControl runId={run.id} version={run.version} status={run.status} canWrite={canWrite} canApprove={canApprove} canPost={canPost} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <OfficeEmptyState
            icon={Calculator}
            title="No payroll run has been calculated yet."
            description="After at least one active employee has a profile effective for the complete calendar month, calculate a draft that snapshots the exact components used. Mid-month proration is intentionally not assumed."
            action={canWrite && activeEmployees.length > 0 ? <a className="office-button" href="#new-payroll-run">Calculate first run</a> : undefined}
          />
        )}
      </section>

      {canWrite ? (
        <section id="new-payroll-run" className="office-create-panel" aria-labelledby="new-payroll-run-title">
          <div className="office-form-intro"><span className="office-eyebrow">Server-authoritative calculation</span><h2 id="new-payroll-run-title">Prepare a reviewable payroll snapshot.</h2><p>Only active employees eligible for the complete calendar month, with a profile already effective on the first day, are included. Mid-month proration is not invented. The draft cannot pay anyone; approval and posting are later controls.</p></div>
          <PayrollRunForm periodStart={month.periodStart} periodEnd={month.periodEnd} />
        </section>
      ) : null}

      {canWrite ? (
        <section id="new-employee" className="office-create-panel" aria-labelledby="new-employee-title">
          <div className="office-form-intro"><span className="office-eyebrow">Employee onboarding</span><h2 id="new-employee-title">Create one durable employment identity.</h2><p>Use approved contractual values. A future effective-dated policy replaces a profile; historical payroll entries retain their original snapshots.</p></div>
          <PayrollEmployeeForm
            joinDate={localDate}
            members={members.map((member) => ({ id: member.id, label: `${member.displayName} · ${member.email}` }))}
          />
        </section>
      ) : (
        <div className="office-alert office-alert--warning"><ShieldCheck aria-hidden="true" /><div><strong>Read-only payroll access</strong><p>Your role may inspect approved operating totals but cannot prepare employee profiles or payroll runs.</p></div></div>
      )}
    </>
  );
}
