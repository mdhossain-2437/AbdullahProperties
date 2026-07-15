import type { Metadata } from "next";
import Link from "next/link";
import { CheckCheck, Clock3, Scale, Search, ShieldCheck } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficeApprovalDecisionForm } from "@/components/office/finance-forms";
import { OfficeMetricCard } from "@/components/office/metric-card";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeDateTime, humanizeOfficeValue } from "@/features/office/presentation";
import {
  isOfficeDatabaseAvailable,
  listOfficeApprovals,
  type OfficeApprovalEntityType,
} from "@/features/office/repository";
import type { OfficeApprovalStatus } from "@/features/office/types";

export const metadata: Metadata = { title: "Approvals | Office OS" };

const statuses = ["pending", "approved", "rejected", "cancelled"] as const satisfies readonly OfficeApprovalStatus[];
const entityTypes = ["invoice", "payment", "expense", "document", "project", "land_parcel"] as const satisfies readonly OfficeApprovalEntityType[];

type ApprovalSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asChoice<const T extends readonly string[]>(value: string | undefined, choices: T): T[number] | undefined {
  return value && choices.includes(value as T[number]) ? value as T[number] : undefined;
}

export default async function OfficeApprovalsPage({ searchParams }: { searchParams: ApprovalSearchParams }) {
  const actor = await requireOfficePermission("approvals.read", "/office/approvals");
  if (!(await isOfficeDatabaseAvailable())) return <OfficeAccessState kind="storage" />;

  const params = await searchParams;
  const status = asChoice(first(params.status), statuses);
  const entityType = asChoice(first(params.entityType), entityTypes);
  const approvals = await listOfficeApprovals({ entityType, limit: 200 });
  const visibleApprovals = status ? approvals.filter((approval) => approval.status === status) : approvals;
  const canDecide = hasOfficePermission(actor.role, "approvals.decide");
  const counts = Object.fromEntries(statuses.map((value) => [value, approvals.filter((approval) => approval.status === value).length])) as Record<OfficeApprovalStatus, number>;
  const filtered = Boolean(status || entityType);

  return (
    <>
      <OfficePageHeader
        eyebrow="Control / Independent decisions"
        title="Decisions need a named owner."
        description="A bounded queue for commercial, expense, project, land, and document decisions. Optimistic locking prevents a stale review from silently overwriting a newer one."
        meta={<span className="office-record-count">{visibleApprovals.length}{approvals.length === 200 ? "+" : ""} shown</span>}
      />

      <section className="office-metrics" aria-label="Approval queue summary">
        <OfficeMetricCard label="Pending" value={String(counts.pending)} note="Requests that still need an authorized, attributable decision." icon={Clock3} tone={counts.pending > 0 ? "warning" : "positive"} />
        <OfficeMetricCard label="Approved" value={String(counts.approved)} note="Approved within this bounded 200-record operating view." icon={CheckCheck} tone="positive" />
        <OfficeMetricCard label="Rejected" value={String(counts.rejected)} note="Rejected requests retain the decision reason and audit history." icon={Scale} />
        <OfficeMetricCard label="Separation" value={canDecide ? "On" : "View"} note={canDecide ? "Your role may decide requests it did not originate." : "Your role can inspect decisions but cannot make them."} icon={ShieldCheck} tone="accent" />
      </section>

      <form className="office-filter-bar" method="get" aria-label="Filter approvals">
        <label><span>Decision state</span><select name="status" defaultValue={status ?? ""}><option value="">All states</option>{statuses.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <label><span>Record type</span><select name="entityType" defaultValue={entityType ?? ""}><option value="">All record types</option>{entityTypes.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <div className="office-filter-bar__actions"><button className="office-button" type="submit"><Search aria-hidden="true" /> Apply</button><Link className="office-button office-button--ghost" href="/office/approvals">Clear</Link></div>
      </form>

      <section className="office-records" aria-labelledby="approval-queue-title">
        <div className="office-records__head"><div><span className="office-eyebrow">Bounded decision queue</span><h2 id="approval-queue-title">Approval register</h2></div><span className="office-record-count">Newest pending requests first</span></div>
        {visibleApprovals.length > 0 ? (
          <div className="office-table-wrap" role="region" aria-label="Approval register. Scroll horizontally on small screens." tabIndex={0}>
            <table className="office-table">
              <thead><tr><th>Request</th><th>Requested by</th><th>Assigned to</th><th>Requested</th><th>Status</th><th>Decision control</th></tr></thead>
              <tbody>{visibleApprovals.map((approval) => {
                const isOwnRequest = Boolean(actor.memberId && approval.requestedByMemberId === actor.memberId);
                return (
                  <tr key={approval.id}>
                    <td className="office-record-primary"><strong>{humanizeOfficeValue(approval.kind)}</strong><small>{humanizeOfficeValue(approval.entityType)} · {approval.entityId.slice(0, 8)}…{approval.requestNote ? ` · ${approval.requestNote}` : ""}</small></td>
                    <td>{approval.requestedByMemberName ?? "System or bootstrap actor"}</td>
                    <td>{approval.assignedToMemberName ?? "Any authorized reviewer"}</td>
                    <td>{formatOfficeDateTime(approval.requestedAt)}</td>
                    <td><OfficeStatusBadge status={approval.status} />{approval.decisionReason ? <small>{approval.decisionReason}</small> : null}</td>
                    <td>
                      {approval.status === "pending" && canDecide && !isOwnRequest ? <OfficeApprovalDecisionForm approvalId={approval.id} version={approval.version} /> : approval.status === "pending" && isOwnRequest ? <small>Another member must decide this request.</small> : approval.status === "pending" ? <small>Decision permission required.</small> : <small>Decision recorded {formatOfficeDateTime(approval.decidedAt)}.</small>}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : (
          <OfficeEmptyState
            icon={ShieldCheck}
            title={filtered ? "No approvals match these filters." : "The approval queue is clear."}
            description={filtered ? "Clear or adjust the filters without changing any decision record." : "New requests appear here only when an office workflow explicitly requires an independent decision."}
            action={filtered ? <Link className="office-button" href="/office/approvals">Clear filters</Link> : undefined}
          />
        )}
      </section>
    </>
  );
}
