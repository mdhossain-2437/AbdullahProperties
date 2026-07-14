import type { Metadata } from "next";
import Link from "next/link";
import { FileWarning, MapPinned, Plus, Search } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeLandForm, type OfficeSelectOption } from "@/components/office/relationship-forms";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeDate, humanizeOfficeValue } from "@/features/office/presentation";
import { getOfficeDatabaseHealth, listOfficeContacts, listOfficeLandParcels, listOfficeTeamMembers } from "@/features/office/repository";
import type { OfficeLandStage } from "@/features/office/types";

export const metadata: Metadata = { title: "Land & Joint Venture | Office OS" };

const landStages = ["lead", "document_intake", "due_diligence", "survey_feasibility", "proposal", "negotiation", "legal_owner_approval", "agreement", "project_gates", "handover", "closed", "rejected"] as const satisfies readonly OfficeLandStage[];
const reviewStatuses = ["not_started", "in_review", "needs_information", "reviewed", "rejected"] as const;
type LandSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function asChoice<const T extends readonly string[]>(value: string | undefined, choices: T): T[number] | undefined { return value && choices.includes(value as T[number]) ? value as T[number] : undefined; }

export default async function OfficeLandPage({ searchParams }: { searchParams: LandSearchParams }) {
  const actor = await requireOfficePermission("land.read", "/office/land");
  const health = await getOfficeDatabaseHealth();
  if (!health.healthy) return <OfficeAccessState kind="storage" />;

  const params = await searchParams;
  const query = first(params.q)?.trim().slice(0, 120) || undefined;
  const stage = asChoice(first(params.stage), landStages);
  const reviewStatus = asChoice(first(params.reviewStatus), reviewStatuses);
  const canWrite = hasOfficePermission(actor.role, "land.write");
  const canAssign = hasOfficePermission(actor.role, "land.review");
  const [landParcels, contacts, team] = await Promise.all([
    listOfficeLandParcels({ query, stage, reviewStatus, limit: 100 }),
    canWrite ? listOfficeContacts({ status: "active", limit: 200 }) : Promise.resolve([]),
    canAssign ? listOfficeTeamMembers({ status: "active", limit: 200 }) : Promise.resolve([]),
  ]);
  const contactOptions: OfficeSelectOption[] = contacts.map((contact) => ({ value: contact.id, label: contact.displayName, detail: humanizeOfficeValue(contact.kind) }));
  const teamOptions: OfficeSelectOption[] = team.map((member) => ({ value: member.id, label: member.displayName, detail: humanizeOfficeValue(member.role) }));
  const filtered = Boolean(query || stage || reviewStatus);

  return (
    <>
      <OfficePageHeader
        eyebrow="Relationships / Land and JV"
        title="Evidence before agreement."
        description="A stage-gated land and joint-venture pipeline for collecting, reviewing, and resolving property evidence. Review status is operational context—not legal certification or an ownership conclusion."
        meta={<span className="office-record-count">{landParcels.length}{landParcels.length === 100 ? "+" : ""} shown</span>}
        action={canWrite ? <a className="office-button office-button--accent" href="#new-land"><Plus aria-hidden="true" /> Add land file</a> : undefined}
      />

      <div className="office-alert office-alert--warning" role="note"><FileWarning aria-hidden="true" /><div><strong>Operational review, not legal assurance</strong><p>Mutation, tax, khatian, dag, possession, survey, and ownership notes must retain their source and reviewer. A “reviewed” status never replaces qualified legal or government verification.</p></div></div>

      <form className="office-filter-bar" method="get" aria-label="Filter land files">
        <label><span>Search</span><input type="search" name="q" defaultValue={query} maxLength={120} placeholder="Reference, address, mouza…" /></label>
        <label><span>Pipeline stage</span><select name="stage" defaultValue={stage ?? ""}><option value="">All stages</option>{landStages.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <label><span>Review state</span><select name="reviewStatus" defaultValue={reviewStatus ?? ""}><option value="">All review states</option>{reviewStatuses.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <div className="office-filter-bar__actions"><button className="office-button" type="submit"><Search aria-hidden="true" /> Apply</button><Link className="office-button office-button--ghost" href="/office/land">Clear</Link></div>
      </form>

      <section className="office-records" aria-labelledby="land-register-title">
        <div className="office-records__head"><div><span className="office-eyebrow">Due-diligence pipeline</span><h2 id="land-register-title">Land review files</h2></div><span className="office-record-count">Most recently updated first</span></div>
        {landParcels.length > 0 ? (
          <div className="office-table-wrap" role="region" aria-label="Land review table. Scroll horizontally on small screens." tabIndex={0}>
            <table className="office-table">
              <thead><tr><th>Land file</th><th>Location</th><th>Landowner</th><th>Stage</th><th>Review</th><th>Owner</th><th>Updated</th></tr></thead>
              <tbody>{landParcels.map((land) => (
                <tr key={land.id}>
                  <td className="office-record-primary"><strong>{land.title}</strong><small>{land.referenceCode}{land.areaDecimal ? ` · ${land.areaDecimal} decimal` : land.areaSquareFeet ? ` · ${land.areaSquareFeet.toLocaleString("en-BD")} sq ft` : ""}</small></td>
                  <td>{land.address}<small>{[land.mouza, land.upazila, land.district].filter(Boolean).join(" · ")}</small></td>
                  <td>{land.primaryLandownerName ?? "Not linked"}</td>
                  <td><OfficeStatusBadge status={land.stage} /></td>
                  <td><OfficeStatusBadge status={land.reviewStatus} /></td>
                  <td>{land.assigneeMemberName ?? "Unassigned"}</td>
                  <td>{formatOfficeDate(land.updatedAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <OfficeEmptyState
            icon={MapPinned}
            title={filtered ? "No land files match these filters." : "Open the first land review file."}
            description={filtered ? "Clear or adjust the filter without changing review evidence." : "Start only when there is a real property conversation and a named person responsible for evidence intake."}
            action={filtered ? <Link className="office-button" href="/office/land">Clear filters</Link> : canWrite ? <a className="office-button" href="#new-land">Add the first land file</a> : undefined}
          />
        )}
      </section>

      {canWrite ? <OfficeLandForm contacts={contactOptions} canAssign={canAssign} teamMembers={teamOptions} /> : <div className="office-alert office-alert--warning"><div><strong>Read-only land access</strong><p>Your current role can review the pipeline but cannot open a new land record.</p></div></div>}
    </>
  );
}
