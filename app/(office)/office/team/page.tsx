import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, ShieldCheck, UserCheck, UserRoundCog, UsersRound } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficeBootstrapOwnerForm, OfficeTeamMemberForm } from "@/components/office/finance-forms";
import { OfficeMetricCard } from "@/components/office/metric-card";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeDateTime, humanizeOfficeValue } from "@/features/office/presentation";
import { getOfficeDatabaseHealth, listOfficeTeamMembers } from "@/features/office/repository";
import type { OfficeMemberStatus, OfficeRole } from "@/features/office/types";

export const metadata: Metadata = { title: "Team | Office OS" };

const roles = ["owner", "admin", "manager", "sales", "projects", "accounts", "viewer"] as const satisfies readonly OfficeRole[];
const statuses = ["invited", "active", "suspended", "archived"] as const satisfies readonly OfficeMemberStatus[];

type TeamSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asChoice<const T extends readonly string[]>(value: string | undefined, choices: T): T[number] | undefined {
  return value && choices.includes(value as T[number]) ? value as T[number] : undefined;
}

export default async function OfficeTeamPage({ searchParams }: { searchParams: TeamSearchParams }) {
  const actor = await requireOfficePermission("team.read", "/office/team");
  const health = await getOfficeDatabaseHealth();
  if (!health.healthy) return <OfficeAccessState kind="storage" />;

  const params = await searchParams;
  const query = first(params.q)?.trim().slice(0, 120) || undefined;
  const role = asChoice(first(params.role), roles);
  const status = asChoice(first(params.status), statuses);
  const members = await listOfficeTeamMembers({ query, role, status, limit: 100 });
  const canManage = hasOfficePermission(actor.role, "team.manage");
  const filtered = Boolean(query || role || status);
  const activeCount = members.filter((member) => member.status === "active").length;
  const elevatedCount = members.filter((member) => ["owner", "admin", "manager"].includes(member.role)).length;
  const seenCount = members.filter((member) => member.lastSeenAt).length;

  return (
    <>
      <OfficePageHeader
        eyebrow="Control / Membership"
        title="Access belongs to people, not shared passwords."
        description="SIWC establishes identity; this protected register determines Abdullah Properties office membership and least-privilege role. Every protected action still re-checks authorization on the server."
        meta={<span className="office-record-count">{members.length}{members.length === 100 ? "+" : ""} shown</span>}
        action={canManage ? <a className="office-button office-button--accent" href="#new-member"><Plus aria-hidden="true" /> Add member</a> : undefined}
      />

      <section className="office-metrics" aria-label="Team access summary">
        <OfficeMetricCard label="Active members" value={String(activeCount)} note="Active identities in the current bounded register view." icon={UserCheck} tone="positive" />
        <OfficeMetricCard label="Elevated roles" value={String(elevatedCount)} note="Owners, administrators, and managers visible in this view." icon={ShieldCheck} tone={elevatedCount > 0 ? "warning" : "default"} />
        <OfficeMetricCard label="Seen identities" value={String(seenCount)} note="Members with a recorded office activity timestamp." icon={UsersRound} />
        <OfficeMetricCard label="Your role" value={humanizeOfficeValue(actor.role)} note={canManage ? "May activate least-privilege memberships." : "Read-only membership visibility."} icon={UserRoundCog} tone="accent" />
      </section>

      {actor.source === "cms_owner_bootstrap" && canManage ? (
        <section className="office-panel office-panel--wide" aria-labelledby="owner-bootstrap-title">
          <div className="office-panel__head"><div><span className="office-eyebrow">One-time hardening</span><h2 id="owner-bootstrap-title">Activate the durable owner identity</h2></div></div>
          <OfficeBootstrapOwnerForm />
        </section>
      ) : null}

      <form className="office-filter-bar" method="get" aria-label="Filter office members">
        <label><span>Search</span><input type="search" name="q" defaultValue={query} maxLength={120} placeholder="Name or work email…" /></label>
        <label><span>Role</span><select name="role" defaultValue={role ?? ""}><option value="">All roles</option>{roles.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <label><span>Membership state</span><select name="status" defaultValue={status ?? ""}><option value="">All states</option>{statuses.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <div className="office-filter-bar__actions"><button className="office-button" type="submit"><Search aria-hidden="true" /> Apply</button><Link className="office-button office-button--ghost" href="/office/team">Clear</Link></div>
      </form>

      <section className="office-records" aria-labelledby="team-register-title">
        <div className="office-records__head"><div><span className="office-eyebrow">Protected access register</span><h2 id="team-register-title">Office members</h2></div><span className="office-record-count">Bounded to 100 results</span></div>
        {members.length > 0 ? (
          <div className="office-table-wrap" role="region" aria-label="Office membership table. Scroll horizontally on small screens." tabIndex={0}>
            <table className="office-table">
              <thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Activated by</th><th>Last seen</th><th>Updated</th></tr></thead>
              <tbody>{members.map((member) => (
                <tr key={member.id}>
                  <td className="office-record-primary"><strong>{member.displayName}</strong><small>{member.email}</small></td>
                  <td>{humanizeOfficeValue(member.role)}</td>
                  <td><OfficeStatusBadge status={member.status} /></td>
                  <td>{member.invitedByMemberName ?? "Owner bootstrap"}</td>
                  <td>{formatOfficeDateTime(member.lastSeenAt)}</td>
                  <td>{formatOfficeDateTime(member.updatedAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <OfficeEmptyState
            icon={UsersRound}
            title={filtered ? "No members match these filters." : "Activate the first durable office member."}
            description={filtered ? "Clear or adjust the filters without changing access." : "Begin with the authorized owner, then add each colleague under the narrowest role that supports their work."}
            action={filtered ? <Link className="office-button" href="/office/team">Clear filters</Link> : canManage ? <a className="office-button" href="#new-member">Add a member</a> : undefined}
          />
        )}
      </section>

      {canManage ? (
        <section id="new-member" className="office-create-panel" aria-labelledby="new-member-title">
          <div className="office-form-intro"><span className="office-eyebrow">Membership control</span><h2 id="new-member-title">Activate a named colleague.</h2><p>Use the colleague’s real SIWC email and the narrowest role that covers their duties. Never share an owner or administrator identity.</p></div>
          <OfficeTeamMemberForm />
        </section>
      ) : (
        <div className="office-alert office-alert--warning"><ShieldCheck aria-hidden="true" /><div><strong>Read-only membership access</strong><p>Your role may inspect the team register but cannot activate identities or assign roles.</p></div></div>
      )}
    </>
  );
}
