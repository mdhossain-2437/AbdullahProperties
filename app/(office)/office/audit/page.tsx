import type { Metadata } from "next";
import Link from "next/link";
import { Activity, FileClock, Fingerprint, Search, UsersRound } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficeMetricCard } from "@/components/office/metric-card";
import { OfficePageHeader } from "@/components/office/page-header";
import { requireOfficePermission } from "@/features/office/auth";
import { formatOfficeDateTime, humanizeOfficeValue } from "@/features/office/presentation";
import { getOfficeDatabaseHealth, listOfficeAuditEvents } from "@/features/office/repository";

export const metadata: Metadata = { title: "Audit history | Office OS" };

type AuditSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function boundedFilter(value: string | undefined) {
  return value?.trim().slice(0, 120) || undefined;
}

function auditContext(metadata: Readonly<Record<string, unknown>>) {
  const keys = Object.keys(metadata);
  if (keys.length === 0) return "No additional context";
  return `${keys.slice(0, 3).map(humanizeOfficeValue).join(", ")}${keys.length > 3 ? ` +${keys.length - 3}` : ""}`;
}

export default async function OfficeAuditPage({ searchParams }: { searchParams: AuditSearchParams }) {
  await requireOfficePermission("audit.read", "/office/audit");
  const health = await getOfficeDatabaseHealth();
  if (!health.healthy) return <OfficeAccessState kind="storage" />;

  const params = await searchParams;
  const action = boundedFilter(first(params.action));
  const entityType = boundedFilter(first(params.entityType));
  const entityId = boundedFilter(first(params.entityId));
  const events = await listOfficeAuditEvents({ action, entityType, entityId, limit: 100 });
  const actorCount = new Set(events.map((event) => event.actorMemberId ?? event.actorEmail)).size;
  const entityCount = new Set(events.map((event) => `${event.entityType}:${event.entityId}`)).size;
  const actionCount = new Set(events.map((event) => event.action)).size;
  const filtered = Boolean(action || entityType || entityId);

  return (
    <>
      <OfficePageHeader
        eyebrow="Control / Append-only history"
        title="Every important change leaves a trail."
        description="The newest 100 application audit events, attributed to a member or authenticated bootstrap identity. This surface is an operational evidence trail—not a replacement for infrastructure logs or statutory record retention."
        meta={<span className="office-record-count">{events.length}{events.length === 100 ? "+" : ""} shown</span>}
      />

      <section className="office-metrics" aria-label="Audit history summary">
        <OfficeMetricCard label="Events" value={String(events.length)} note="Newest events in this bounded view." icon={Activity} tone="accent" />
        <OfficeMetricCard label="Actors" value={String(actorCount)} note="Distinct member or authenticated bootstrap identities." icon={UsersRound} />
        <OfficeMetricCard label="Records" value={String(entityCount)} note="Distinct entity records represented in this view." icon={Fingerprint} />
        <OfficeMetricCard label="Action types" value={String(actionCount)} note="Distinct operation names represented in this view." icon={FileClock} />
      </section>

      <form className="office-filter-bar" method="get" aria-label="Filter audit history">
        <label><span>Exact action</span><input name="action" defaultValue={action} maxLength={120} placeholder="expense.approved" /></label>
        <label><span>Exact record type</span><input name="entityType" defaultValue={entityType} maxLength={120} placeholder="expense" /></label>
        <label><span>Exact record ID</span><input name="entityId" defaultValue={entityId} maxLength={120} placeholder="UUID" /></label>
        <div className="office-filter-bar__actions"><button className="office-button" type="submit"><Search aria-hidden="true" /> Apply</button><Link className="office-button office-button--ghost" href="/office/audit">Clear</Link></div>
      </form>

      <section className="office-records" aria-labelledby="audit-register-title">
        <div className="office-records__head"><div><span className="office-eyebrow">Operational evidence</span><h2 id="audit-register-title">Activity history</h2></div><span className="office-record-count">Newest first · 100 maximum</span></div>
        {events.length > 0 ? (
          <div className="office-table-wrap" role="region" aria-label="Audit history table. Scroll horizontally on small screens." tabIndex={0}>
            <table className="office-table">
              <thead><tr><th>Action</th><th>Record</th><th>Actor</th><th>Context fields</th><th>Occurred</th></tr></thead>
              <tbody>{events.map((event) => (
                <tr key={event.id}>
                  <td className="office-record-primary"><strong>{event.action.replaceAll(".", " / ")}</strong><small>Event {event.id.slice(0, 8)}…</small></td>
                  <td>{humanizeOfficeValue(event.entityType)}<small>{event.entityId}</small></td>
                  <td>{event.actorName ?? event.actorEmail}<small>{event.actorName ? event.actorEmail : event.actorMemberId ? "Named member" : "Authenticated bootstrap"}</small></td>
                  <td className="office-record-secondary">{auditContext(event.metadata)}</td>
                  <td>{formatOfficeDateTime(event.createdAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <OfficeEmptyState
            icon={FileClock}
            title={filtered ? "No audit events match these exact filters." : "No office activity has been recorded yet."}
            description={filtered ? "Clear or revise the exact action, entity type, or entity ID. Filters never modify the history." : "Audited office mutations will appear here after the first protected workflow completes successfully."}
            action={filtered ? <Link className="office-button" href="/office/audit">Clear filters</Link> : undefined}
          />
        )}
      </section>
    </>
  );
}
