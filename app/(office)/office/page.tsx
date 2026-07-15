import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  ClipboardCheck,
  Clock3,
  Plus,
  UsersRound,
} from "lucide-react";
import { OfficeAccessState } from "@/components/office/access-state";
import { OfficeEmptyState } from "@/components/office/empty-state";
import { OfficeMetricCard } from "@/components/office/metric-card";
import { OfficePageHeader } from "@/components/office/page-header";
import { OfficeStatusBadge } from "@/components/office/status-badge";
import { requireOfficePermission } from "@/features/office/auth";
import { formatOfficeDate, formatOfficeMoney } from "@/features/office/presentation";
import {
  getOfficeDashboard,
  isOfficeDatabaseAvailable,
  listOfficeLeads,
  listOfficeProjects,
  listOfficeTasks,
} from "@/features/office/repository";

export default async function OfficeOverviewPage() {
  await requireOfficePermission("dashboard.read", "/office");
  if (!(await isOfficeDatabaseAvailable())) return <OfficeAccessState kind="storage" />;

  const [dashboard, leads, tasks, projects] = await Promise.all([
    getOfficeDashboard(),
    listOfficeLeads({ limit: 5 }),
    listOfficeTasks({ limit: 5 }),
    listOfficeProjects({ limit: 4 }),
  ]);

  return (
    <>
      <OfficePageHeader
        eyebrow="Today / Operating signals"
        title="The next decision, visible."
        description="A live operating view of relationships, delivery, collections, and approvals. Values come from the protected office database—not from browser state or sample metrics."
        meta={<span className="office-eyebrow">Joypurhat office</span>}
        action={<Link className="office-button office-button--accent" href="/office/leads#new-lead"><Plus aria-hidden="true" /> Add lead</Link>}
      />

      <section className="office-metrics" aria-label="Office performance summary">
        <OfficeMetricCard label="Active leads" value={String(dashboard.activeLeads)} note="Open relationship opportunities requiring a next action." icon={UsersRound} tone="accent" />
        <OfficeMetricCard label="Overdue tasks" value={String(dashboard.overdueTasks)} note={`${dashboard.openTasks} total tasks remain open across the office.`} icon={Clock3} tone={dashboard.overdueTasks > 0 ? "warning" : "positive"} />
        <OfficeMetricCard label="Active projects" value={String(dashboard.activeProjects)} note={`${dashboard.criticalProjects} currently carry critical risk.`} icon={BriefcaseBusiness} />
        <OfficeMetricCard label="Receivable" value={formatOfficeMoney(dashboard.outstandingInvoiceMinor)} note={`${formatOfficeMoney(dashboard.overdueInvoiceMinor)} is currently overdue.`} icon={Banknote} tone={dashboard.overdueInvoiceMinor > 0 ? "warning" : "default"} />
      </section>

      <div className="office-grid">
        <section className="office-panel office-panel--eight">
          <div className="office-panel__head">
            <div><span className="office-eyebrow">Relationship pipeline</span><h2>Next conversations</h2></div>
            <Link href="/office/leads">View leads <ArrowUpRight aria-hidden="true" /></Link>
          </div>
          {leads.length > 0 ? (
            <div className="office-table-wrap">
              <table className="office-table">
                <thead><tr><th>Opportunity</th><th>Stage</th><th>Owner</th><th>Next action</th></tr></thead>
                <tbody>{leads.map((lead) => (
                  <tr key={lead.id}>
                    <td><strong>{lead.title}</strong><small>{lead.contactName} · {lead.serviceType.replaceAll("_", " ")}</small></td>
                    <td><OfficeStatusBadge status={lead.stage} /></td>
                    <td>{lead.assigneeMemberName ?? "Unassigned"}</td>
                    <td>{formatOfficeDate(lead.nextActionAt)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : (
            <OfficeEmptyState icon={UsersRound} title="Start with the first qualified conversation." description="Add an enquiry or landowner opportunity, assign a clear next action, and keep the evidence trail in one protected place." action={<Link className="office-button" href="/office/leads#new-lead">Add the first lead</Link>} />
          )}
        </section>

        <aside className="office-panel office-panel--four">
          <div className="office-panel__head"><div><span className="office-eyebrow">Control queue</span><h2>Needs attention</h2></div></div>
          <ul className="office-timeline">
            <li><div><strong>{dashboard.pendingApprovals} approvals waiting</strong><p>Decisions remain separated from record preparation.</p><Link href="/office/approvals">Open approval queue</Link></div></li>
            <li><div><strong>{dashboard.pendingExpenses} expenses in review</strong><p>{formatOfficeMoney(dashboard.pendingExpenseMinor)} awaits an authorized decision.</p><Link href="/office/expenses">Review expenses</Link></div></li>
            <li><div><strong>{dashboard.activeLandParcels} land files in motion</strong><p>Review status never represents automatic title or legal approval.</p><Link href="/office/land">Open land pipeline</Link></div></li>
          </ul>
        </aside>

        <section className="office-panel office-panel--wide">
          <div className="office-panel__head">
            <div><span className="office-eyebrow">Delivery radar</span><h2>Work and project risk</h2></div>
            <Link href="/office/tasks">Open task board <ArrowUpRight aria-hidden="true" /></Link>
          </div>
          <div className="office-grid">
            <div className="office-panel office-panel--eight">
              {tasks.length > 0 ? <ul className="office-timeline">{tasks.map((task) => (
                <li key={task.id}><div><strong>{task.title}</strong><p>{task.projectName ?? task.contactName ?? "General office task"} · {task.assigneeMemberName ?? "Unassigned"}</p><time>{formatOfficeDate(task.dueAt)}</time></div></li>
              ))}</ul> : <OfficeEmptyState icon={ClipboardCheck} title="No open work is waiting." description="Create tasks from a lead, land review, or project so ownership and due dates stay explicit." action={<Link className="office-button" href="/office/tasks#new-task">Create a task</Link>} />}
            </div>
            <div className="office-panel office-panel--four">
              <ul className="office-timeline">{projects.map((project) => (
                <li key={project.id}><div><strong>{project.name}</strong><p>{project.progressBps / 100}% complete · {project.riskLevel} risk</p><OfficeStatusBadge status={project.status} /></div></li>
              ))}</ul>
              {projects.length === 0 ? <div className="office-alert office-alert--warning"><AlertTriangle aria-hidden="true" /><div><strong>No active project record</strong><p>Create a project only after its scope and ownership are clear.</p></div></div> : null}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
