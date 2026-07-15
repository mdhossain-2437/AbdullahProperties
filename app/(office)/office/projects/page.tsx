import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Plus, Search } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeProjectForm, type OfficeSelectOption } from "@/components/office/relationship-forms";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeDate, formatOfficeMoney, formatOfficePercent, humanizeOfficeValue } from "@/features/office/presentation";
import { isOfficeDatabaseAvailable, listOfficeContactOptions, listOfficeLandParcelOptions, listOfficeProjects, listOfficeTeamMemberOptions } from "@/features/office/repository";
import type { OfficeProjectStatus } from "@/features/office/types";

export const metadata: Metadata = { title: "Projects | Office OS" };

const projectStatuses = ["feasibility", "secured", "design", "approval", "delivery", "inspection", "handover", "defect_follow_up", "closed", "on_hold", "cancelled"] as const satisfies readonly OfficeProjectStatus[];
const riskLevels = ["low", "medium", "high", "critical"] as const;
type ProjectsSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function asChoice<const T extends readonly string[]>(value: string | undefined, choices: T): T[number] | undefined { return value && choices.includes(value as T[number]) ? value as T[number] : undefined; }

export default async function OfficeProjectsPage({ searchParams }: { searchParams: ProjectsSearchParams }) {
  const actor = await requireOfficePermission("projects.read", "/office/projects");
  if (!(await isOfficeDatabaseAvailable())) return <OfficeAccessState kind="storage" />;

  const params = await searchParams;
  const query = first(params.q)?.trim().slice(0, 120) || undefined;
  const status = asChoice(first(params.status), projectStatuses);
  const riskLevel = asChoice(first(params.riskLevel), riskLevels);
  const canWrite = hasOfficePermission(actor.role, "projects.write");
  const canAssign = hasOfficePermission(actor.role, "projects.manage");
  const [projects, landParcels, contacts, team] = await Promise.all([
    listOfficeProjects({ query, status, riskLevel, limit: 100 }),
    canWrite ? listOfficeLandParcelOptions({ limit: 200 }) : Promise.resolve([]),
    canWrite ? listOfficeContactOptions({ status: "active", limit: 200 }) : Promise.resolve([]),
    canAssign ? listOfficeTeamMemberOptions({ status: "active", limit: 200 }) : Promise.resolve([]),
  ]);
  const landOptions: OfficeSelectOption[] = landParcels.map((land) => ({ value: land.id, label: land.label, detail: land.detail }));
  const contactOptions: OfficeSelectOption[] = contacts.map((contact) => ({ value: contact.id, label: contact.label, detail: humanizeOfficeValue(contact.detail) }));
  const teamOptions: OfficeSelectOption[] = team.map((member) => ({ value: member.id, label: member.label, detail: humanizeOfficeValue(member.detail) }));
  const filtered = Boolean(query || status || riskLevel);

  return (
    <>
      <OfficePageHeader
        eyebrow="Delivery / Project portfolio"
        title="Delivery needs a visible pulse."
        description="A project register for scope, risk, ownership, budget context, and time windows. Progress stays separate from status so a label cannot conceal stalled work."
        meta={<span className="office-record-count">{projects.length}{projects.length === 100 ? "+" : ""} shown</span>}
        action={canWrite ? <a className="office-button office-button--accent" href="#new-project"><Plus aria-hidden="true" /> Add project</a> : undefined}
      />

      <form className="office-filter-bar" method="get" aria-label="Filter projects">
        <label><span>Search</span><input type="search" name="q" defaultValue={query} maxLength={120} placeholder="Code, project, address…" /></label>
        <label><span>Status</span><select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{projectStatuses.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <label><span>Risk</span><select name="riskLevel" defaultValue={riskLevel ?? ""}><option value="">All risk levels</option>{riskLevels.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <div className="office-filter-bar__actions"><button className="office-button" type="submit"><Search aria-hidden="true" /> Apply</button><Link className="office-button office-button--ghost" href="/office/projects">Clear</Link></div>
      </form>

      <section className="office-records" aria-labelledby="project-register-title">
        <div className="office-records__head"><div><span className="office-eyebrow">Delivery portfolio</span><h2 id="project-register-title">Project register</h2></div><span className="office-record-count">Critical risk surfaces first</span></div>
        {projects.length > 0 ? (
          <div className="office-table-wrap" role="region" aria-label="Project register table. Scroll horizontally on small screens." tabIndex={0}>
            <table className="office-table">
              <thead><tr><th>Project</th><th>Status</th><th>Progress</th><th>Risk</th><th>Manager</th><th>Target</th><th>Budget</th></tr></thead>
              <tbody>{projects.map((project) => (
                <tr key={project.id}>
                  <td className="office-record-primary"><strong>{project.name}</strong><small>{project.code} · {humanizeOfficeValue(project.projectType)} · {project.address}</small></td>
                  <td><OfficeStatusBadge status={project.status} /></td>
                  <td><strong>{formatOfficePercent(project.progressBps)}</strong><div className="office-progress" aria-label={`${formatOfficePercent(project.progressBps)} complete`}><span style={{ width: `${project.progressBps / 100}%` }} /></div></td>
                  <td><OfficeStatusBadge status={project.riskLevel} /></td>
                  <td>{project.managerName ?? "Unassigned"}</td>
                  <td>{formatOfficeDate(project.targetEndAt)}</td>
                  <td>{project.budgetMinor === null ? "Not budgeted" : formatOfficeMoney(project.budgetMinor, project.currency)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <OfficeEmptyState
            icon={Building2}
            title={filtered ? "No projects match these filters." : "Create the first delivery record."}
            description={filtered ? "Clear or adjust the filters to restore the portfolio view." : "Create a project after scope, ownership, address, and risk context are clear enough to manage."}
            action={filtered ? <Link className="office-button" href="/office/projects">Clear filters</Link> : canWrite ? <a className="office-button" href="#new-project">Add the first project</a> : undefined}
          />
        )}
      </section>

      {canWrite ? <OfficeProjectForm landParcels={landOptions} contacts={contactOptions} canAssign={canAssign} teamMembers={teamOptions} /> : <div className="office-alert office-alert--warning"><div><strong>Read-only project access</strong><p>Your current role can review delivery records but cannot create projects.</p></div></div>}
    </>
  );
}
