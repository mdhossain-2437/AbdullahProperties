import type { Metadata } from "next";
import Link from "next/link";
import { CheckSquare2, ClockAlert, Plus, Search } from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeTaskForm, type OfficeSelectOption } from "@/components/office/relationship-forms";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { hasOfficePermission } from "@/features/office/permissions";
import { formatOfficeDate, humanizeOfficeValue } from "@/features/office/presentation";
import { getOfficeDatabaseHealth, listOfficeContacts, listOfficeLandParcels, listOfficeLeads, listOfficeProjects, listOfficeTasks, listOfficeTeamMembers } from "@/features/office/repository";
import type { OfficeTaskStatus } from "@/features/office/types";

export const metadata: Metadata = { title: "Tasks | Office OS" };

const taskStatuses = ["open", "in_progress", "blocked", "done", "cancelled"] as const satisfies readonly OfficeTaskStatus[];
const priorities = ["low", "normal", "high", "urgent"] as const;
type TasksSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function asChoice<const T extends readonly string[]>(value: string | undefined, choices: T): T[number] | undefined { return value && choices.includes(value as T[number]) ? value as T[number] : undefined; }

export default async function OfficeTasksPage({ searchParams }: { searchParams: TasksSearchParams }) {
  const actor = await requireOfficePermission("tasks.read", "/office/tasks");
  const health = await getOfficeDatabaseHealth();
  if (!health.healthy) return <OfficeAccessState kind="storage" />;

  const params = await searchParams;
  const query = first(params.q)?.trim().slice(0, 120) || undefined;
  const status = asChoice(first(params.status), taskStatuses);
  const priority = asChoice(first(params.priority), priorities);
  const overdueOnly = first(params.overdue) === "1";
  const canWrite = hasOfficePermission(actor.role, "tasks.write");
  const canAssign = hasOfficePermission(actor.role, "tasks.assign");
  const [tasks, contacts, leads, landParcels, projects, team] = await Promise.all([
    listOfficeTasks({ query, status, priority, overdueOnly, limit: 100 }),
    canWrite ? listOfficeContacts({ status: "active", limit: 200 }) : Promise.resolve([]),
    canWrite ? listOfficeLeads({ limit: 200 }) : Promise.resolve([]),
    canWrite ? listOfficeLandParcels({ limit: 200 }) : Promise.resolve([]),
    canWrite ? listOfficeProjects({ limit: 200 }) : Promise.resolve([]),
    canAssign ? listOfficeTeamMembers({ status: "active", limit: 200 }) : Promise.resolve([]),
  ]);
  const contactOptions: OfficeSelectOption[] = contacts.map((contact) => ({ value: contact.id, label: contact.displayName, detail: humanizeOfficeValue(contact.kind) }));
  const leadOptions: OfficeSelectOption[] = leads.map((lead) => ({ value: lead.id, label: lead.title, detail: lead.contactName }));
  const landOptions: OfficeSelectOption[] = landParcels.map((land) => ({ value: land.id, label: land.title, detail: land.referenceCode }));
  const projectOptions: OfficeSelectOption[] = projects.map((project) => ({ value: project.id, label: project.name, detail: project.code }));
  const teamOptions: OfficeSelectOption[] = team.map((member) => ({ value: member.id, label: member.displayName, detail: humanizeOfficeValue(member.role) }));
  const filtered = Boolean(query || status || priority || overdueOnly);

  return (
    <>
      <OfficePageHeader
        eyebrow="Today / Work ownership"
        title="Work belongs to someone."
        description="An accountable task register with one owner, a visible priority, a due date, and optional links back to the relationship or delivery record that created the work."
        meta={<span className="office-record-count">{tasks.length}{tasks.length === 100 ? "+" : ""} shown</span>}
        action={canWrite ? <a className="office-button office-button--accent" href="#new-task"><Plus aria-hidden="true" /> Add task</a> : undefined}
      />

      <form className="office-filter-bar" method="get" aria-label="Filter tasks">
        <label><span>Search</span><input type="search" name="q" defaultValue={query} maxLength={120} placeholder="Task or description…" /></label>
        <label><span>Status</span><select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{taskStatuses.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <label><span>Priority</span><select name="priority" defaultValue={priority ?? ""}><option value="">All priorities</option>{priorities.map((value) => <option key={value} value={value}>{humanizeOfficeValue(value)}</option>)}</select></label>
        <label><span>Due state</span><select name="overdue" defaultValue={overdueOnly ? "1" : "0"}><option value="0">Any due state</option><option value="1">Overdue only</option></select></label>
        <div className="office-filter-bar__actions"><button className="office-button" type="submit"><Search aria-hidden="true" /> Apply</button><Link className="office-button office-button--ghost" href="/office/tasks">Clear</Link></div>
      </form>

      <section className="office-records" aria-labelledby="task-register-title">
        <div className="office-records__head"><div><span className="office-eyebrow">Execution queue</span><h2 id="task-register-title">Task register</h2></div><span className="office-record-count">Urgent work and nearest due dates first</span></div>
        {tasks.length > 0 ? (
          <div className="office-table-wrap" role="region" aria-label="Task table. Scroll horizontally on small screens." tabIndex={0}>
            <table className="office-table">
              <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Owner</th><th>Related record</th><th>Due</th></tr></thead>
              <tbody>{tasks.map((task) => {
                const context = task.projectName ?? task.landParcelTitle ?? task.leadTitle ?? task.contactName ?? "General office work";
                return (
                  <tr key={task.id}>
                    <td className="office-record-primary"><strong>{task.title}</strong><small>{task.description ?? `Reported by ${task.reporterMemberName ?? "office member"}`}</small></td>
                    <td><OfficeStatusBadge status={task.status} /></td>
                    <td><OfficeStatusBadge status={task.priority} /></td>
                    <td>{task.assigneeMemberName ?? "Unassigned"}</td>
                    <td>{context}</td>
                    <td>{formatOfficeDate(task.dueAt)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : (
          <OfficeEmptyState
            icon={overdueOnly ? ClockAlert : CheckSquare2}
            title={filtered ? "No tasks match these filters." : "No work is waiting in the task register."}
            description={filtered ? "Clear or adjust the filters to return to the full execution queue." : "Create work from an actual relationship, land review, project, or internal operating need."}
            action={filtered ? <Link className="office-button" href="/office/tasks">Clear filters</Link> : canWrite ? <a className="office-button" href="#new-task">Add the first task</a> : undefined}
          />
        )}
      </section>

      {canWrite ? <OfficeTaskForm contacts={contactOptions} leads={leadOptions} landParcels={landOptions} projects={projectOptions} canAssign={canAssign} teamMembers={teamOptions} /> : <div className="office-alert office-alert--warning"><div><strong>Read-only task access</strong><p>Your current role can review work but cannot create tasks.</p></div></div>}
    </>
  );
}
