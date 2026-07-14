import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Sparkles } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeLeadForm, type OfficeSelectOption } from "@/components/office/relationship-forms";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeDate, formatOfficeMoney, humanizeOfficeValue } from "@/features/office/presentation";
import { getOfficeDatabaseHealth, listOfficeContacts, listOfficeLeads, listOfficeTeamMembers } from "@/features/office/repository";
import type { OfficeLeadStage } from "@/features/office/types";

export const metadata: Metadata = { title: "Leads | Office OS" };

const leadStages = ["new", "qualified", "site_visit", "proposal", "negotiation", "won", "lost"] as const satisfies readonly OfficeLeadStage[];
const priorities = ["low", "normal", "high", "urgent"] as const;
type LeadsSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function asChoice<const T extends readonly string[]>(value: string | undefined, choices: T): T[number] | undefined { return value && choices.includes(value as T[number]) ? value as T[number] : undefined; }

export default async function OfficeLeadsPage({ searchParams }: { searchParams: LeadsSearchParams }) {
  const actor = await requireOfficePermission("crm.read", "/office/leads");
  const health = await getOfficeDatabaseHealth();
  if (!health.healthy) return <OfficeAccessState kind="storage" />;

  const params = await searchParams;
  const query = first(params.q)?.trim().slice(0, 120) || undefined;
  const stage = asChoice(first(params.stage), leadStages);
  const priority = asChoice(first(params.priority), priorities);
  const canWrite = hasOfficePermission(actor.role, "crm.write");
  const canAssign = hasOfficePermission(actor.role, "crm.assign");
  const [leads, contacts, team] = await Promise.all([
    listOfficeLeads({ query, stage, priority, limit: 100 }),
    canWrite ? listOfficeContacts({ status: "active", limit: 200 }) : Promise.resolve([]),
    canAssign ? listOfficeTeamMembers({ status: "active", limit: 200 }) : Promise.resolve([]),
  ]);
  const contactOptions: OfficeSelectOption[] = contacts.map((contact) => ({ value: contact.id, label: contact.displayName, detail: humanizeOfficeValue(contact.kind) }));
  const teamOptions: OfficeSelectOption[] = team.map((member) => ({ value: member.id, label: member.displayName, detail: humanizeOfficeValue(member.role) }));
  const filtered = Boolean(query || stage || priority);

  return (
    <>
      <OfficePageHeader
        eyebrow="Relationships / Opportunity pipeline"
        title="Every lead needs a next move."
        description="A bounded pipeline for property enquiries, development conversations, and service opportunities. Priority helps order attention; the next-action date makes ownership visible."
        meta={<span className="office-record-count">{leads.length}{leads.length === 100 ? "+" : ""} shown</span>}
        action={canWrite ? <a className="office-button office-button--accent" href="#new-lead"><Plus aria-hidden="true" /> Add lead</a> : undefined}
      />

      <form className="office-filter-bar" method="get" aria-label="Filter leads">
        <label><span>Search</span><input type="search" name="q" defaultValue={query} maxLength={120} placeholder="Opportunity, source, contact…" /></label>
        <label><span>Stage</span><select name="stage" defaultValue={stage ?? ""}><option value="">All stages</option>{leadStages.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <label><span>Priority</span><select name="priority" defaultValue={priority ?? ""}><option value="">All priorities</option>{priorities.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <div className="office-filter-bar__actions"><button className="office-button" type="submit"><Search aria-hidden="true" /> Apply</button><Link className="office-button office-button--ghost" href="/office/leads">Clear</Link></div>
      </form>

      <section className="office-records" aria-labelledby="lead-pipeline-title">
        <div className="office-records__head"><div><span className="office-eyebrow">Active pipeline</span><h2 id="lead-pipeline-title">Opportunity register</h2></div><span className="office-record-count">Urgent and high priority first</span></div>
        {leads.length > 0 ? (
          <div className="office-table-wrap" role="region" aria-label="Lead pipeline table. Scroll horizontally on small screens." tabIndex={0}>
            <table className="office-table">
              <thead><tr><th>Opportunity</th><th>Stage</th><th>Priority</th><th>Owner</th><th>Next action</th><th>Estimated value</th></tr></thead>
              <tbody>{leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="office-record-primary"><strong>{lead.title}</strong><small>{lead.contactName} · {humanizeOfficeValue(lead.serviceType)}{lead.source ? ` · ${lead.source}` : ""}</small></td>
                  <td><OfficeStatusBadge status={lead.stage} /></td>
                  <td><OfficeStatusBadge status={lead.priority} /></td>
                  <td>{lead.assigneeMemberName ?? "Unassigned"}</td>
                  <td>{formatOfficeDate(lead.nextActionAt)}</td>
                  <td>{lead.estimatedValueMinor === null ? "Not estimated" : formatOfficeMoney(lead.estimatedValueMinor, lead.currency)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <OfficeEmptyState
            icon={Sparkles}
            title={filtered ? "No opportunities match these filters." : "The active pipeline is ready for its first lead."}
            description={filtered ? "Clear or adjust the filter to restore the wider pipeline view." : "Capture the conversation, connect the right contact, then assign one dated next action."}
            action={filtered ? <Link className="office-button" href="/office/leads">Clear filters</Link> : canWrite ? <a className="office-button" href="#new-lead">Add the first lead</a> : undefined}
          />
        )}
      </section>

      {canWrite ? <OfficeLeadForm contacts={contactOptions} canAssign={canAssign} teamMembers={teamOptions} /> : <div className="office-alert office-alert--warning"><div><strong>Read-only pipeline access</strong><p>Your current role can review opportunities but cannot create new leads.</p></div></div>}
    </>
  );
}
