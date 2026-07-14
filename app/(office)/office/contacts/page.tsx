import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, UsersRound } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeContactForm, type OfficeSelectOption } from "@/components/office/relationship-forms";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeDate, humanizeOfficeValue } from "@/features/office/presentation";
import { getOfficeDatabaseHealth, listOfficeContacts, listOfficeTeamMembers } from "@/features/office/repository";
import type { OfficeContactKind } from "@/features/office/types";

export const metadata: Metadata = { title: "Contacts | Office OS" };

const contactKinds = ["customer", "landowner", "buyer", "seller", "vendor", "partner", "other"] as const satisfies readonly OfficeContactKind[];
const contactStatuses = ["active", "archived"] as const;

type ContactsSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asChoice<const T extends readonly string[]>(value: string | undefined, choices: T): T[number] | undefined {
  return value && choices.includes(value as T[number]) ? value as T[number] : undefined;
}

export default async function OfficeContactsPage({ searchParams }: { searchParams: ContactsSearchParams }) {
  const actor = await requireOfficePermission("crm.read", "/office/contacts");
  const health = await getOfficeDatabaseHealth();
  if (!health.healthy) return <OfficeAccessState kind="storage" />;

  const params = await searchParams;
  const query = first(params.q)?.trim().slice(0, 120) || undefined;
  const kind = asChoice(first(params.kind), contactKinds);
  const status = asChoice(first(params.status), contactStatuses) ?? "active";
  const canWrite = hasOfficePermission(actor.role, "crm.write");
  const canAssign = hasOfficePermission(actor.role, "crm.assign");
  const [contacts, team] = await Promise.all([
    listOfficeContacts({ query, kind, status, limit: 100 }),
    canAssign ? listOfficeTeamMembers({ status: "active", limit: 200 }) : Promise.resolve([]),
  ]);
  const teamOptions: OfficeSelectOption[] = team.map((member) => ({ value: member.id, label: member.displayName, detail: humanizeOfficeValue(member.role) }));
  const filtered = Boolean(query || kind || status === "archived");

  return (
    <>
      <OfficePageHeader
        eyebrow="Relationships / Contact register"
        title="Know who the work is for."
        description="A protected relationship register for clients, buyers, landowners, vendors, and partners. Searchable contact context reduces duplicate conversations without turning the office into an unnecessary data warehouse."
        meta={<span className="office-record-count">{contacts.length}{contacts.length === 100 ? "+" : ""} shown</span>}
        action={canWrite ? <a className="office-button office-button--accent" href="#new-contact"><Plus aria-hidden="true" /> Add contact</a> : undefined}
      />

      <form className="office-filter-bar" method="get" aria-label="Filter contacts">
        <label><span>Search</span><input type="search" name="q" defaultValue={query} maxLength={120} placeholder="Name, phone, email…" /></label>
        <label><span>Relationship</span><select name="kind" defaultValue={kind ?? ""}><option value="">All relationships</option>{contactKinds.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <label><span>Record state</span><select name="status" defaultValue={status}>{contactStatuses.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <div className="office-filter-bar__actions"><button className="office-button" type="submit"><Search aria-hidden="true" /> Apply</button><Link className="office-button office-button--ghost" href="/office/contacts">Clear</Link></div>
      </form>

      <section className="office-records" aria-labelledby="contacts-register-title">
        <div className="office-records__head"><div><span className="office-eyebrow">Protected register</span><h2 id="contacts-register-title">Relationship records</h2></div><span className="office-record-count">Bounded to 100 results</span></div>
        {contacts.length > 0 ? (
          <div className="office-table-wrap" role="region" aria-label="Contacts table. Scroll horizontally on small screens." tabIndex={0}>
            <table className="office-table">
              <thead><tr><th>Contact</th><th>Type</th><th>Reach</th><th>Owner</th><th>Updated</th><th>Status</th></tr></thead>
              <tbody>{contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="office-record-primary"><strong>{contact.displayName}</strong><small>{contact.organizationName ?? contact.address ?? "No organization or address recorded"}</small></td>
                  <td>{humanizeOfficeValue(contact.kind)}</td>
                  <td className="office-record-secondary">{contact.phone ?? "No phone"}<small>{contact.email ?? "No email"}</small></td>
                  <td>{contact.assignedMemberName ?? "Unassigned"}</td>
                  <td>{formatOfficeDate(contact.updatedAt)}</td>
                  <td><OfficeStatusBadge status={contact.status} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <OfficeEmptyState
            icon={UsersRound}
            title={filtered ? "No contacts match these filters." : "Create the first relationship record."}
            description={filtered ? "Clear or adjust the filter without changing any protected records." : "Start with the client, landowner, buyer, or partner behind an active conversation."}
            action={filtered ? <Link className="office-button" href="/office/contacts">Clear filters</Link> : canWrite ? <a className="office-button" href="#new-contact">Add the first contact</a> : undefined}
          />
        )}
      </section>

      {canWrite ? <OfficeContactForm canAssign={canAssign} teamMembers={teamOptions} /> : <div className="office-alert office-alert--warning"><div><strong>Read-only relationship access</strong><p>Your current role can review contacts but cannot create new records.</p></div></div>}
    </>
  );
}
