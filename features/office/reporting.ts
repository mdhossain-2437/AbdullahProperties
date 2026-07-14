import type {
  OfficeExpenseView,
  OfficeInvoiceSummary,
  OfficeLandParcelView,
  OfficeLeadView,
  OfficePaymentView,
  OfficeProjectView,
  OfficeTaskView,
} from "@/features/office/repository";

export const OFFICE_OPERATIONAL_REPORT_LIMIT = 200;

type ReportLead = Pick<OfficeLeadView, "stage" | "estimatedValueMinor">;
type ReportLand = Pick<OfficeLandParcelView, "stage" | "reviewStatus">;
type ReportProject = Pick<OfficeProjectView, "status" | "riskLevel" | "progressBps">;
type ReportTask = Pick<OfficeTaskView, "status" | "dueAt">;
type ReportInvoice = Pick<OfficeInvoiceSummary, "status" | "balanceMinor">;
type ReportPayment = Pick<OfficePaymentView, "status" | "amountMinor">;
type ReportExpense = Pick<OfficeExpenseView, "status" | "amountMinor">;

export type OfficeOperationalReportInput = Readonly<{
  asOf: string;
  leads: readonly ReportLead[];
  landParcels: readonly ReportLand[];
  projects: readonly ReportProject[];
  tasks: readonly ReportTask[];
  invoices: readonly ReportInvoice[];
  payments: readonly ReportPayment[];
  expenses: readonly ReportExpense[];
}>;

function validTimestamp(value: string | null): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function buildOfficeOperationalReport(input: OfficeOperationalReportInput) {
  const asOf = validTimestamp(input.asOf);
  if (asOf === null) throw new TypeError("The operational report needs a valid as-of timestamp.");

  const openTasks = input.tasks.filter((task) => !["done", "cancelled"].includes(task.status));
  const activeProjects = input.projects.filter((project) => !["closed", "cancelled"].includes(project.status));
  const openLand = input.landParcels.filter((parcel) => !["closed", "rejected"].includes(parcel.stage));
  const activeLeads = input.leads.filter((lead) => !["won", "lost"].includes(lead.stage));

  return {
    relationships: {
      activeLeads: activeLeads.length,
      estimatedPipelineMinor: activeLeads.reduce((total, lead) => total + (lead.estimatedValueMinor ?? 0), 0),
      proposalOrLater: activeLeads.filter((lead) => ["proposal", "negotiation"].includes(lead.stage)).length,
    },
    land: {
      openFiles: openLand.length,
      reviewedFiles: openLand.filter((parcel) => parcel.reviewStatus === "reviewed").length,
      needsInformation: openLand.filter((parcel) => parcel.reviewStatus === "needs_information").length,
    },
    delivery: {
      activeProjects: activeProjects.length,
      criticalProjects: activeProjects.filter((project) => project.riskLevel === "critical").length,
      averageProgressBps: activeProjects.length === 0 ? 0 : Math.round(activeProjects.reduce((total, project) => total + project.progressBps, 0) / activeProjects.length),
      openTasks: openTasks.length,
      overdueTasks: openTasks.filter((task) => {
        const dueAt = validTimestamp(task.dueAt);
        return dueAt !== null && dueAt < asOf;
      }).length,
    },
    finance: {
      outstandingInvoiceMinor: input.invoices.filter((invoice) => ["issued", "partially_paid", "overdue"].includes(invoice.status)).reduce((total, invoice) => total + invoice.balanceMinor, 0),
      overdueInvoiceMinor: input.invoices.filter((invoice) => invoice.status === "overdue").reduce((total, invoice) => total + invoice.balanceMinor, 0),
      postedPaymentMinor: input.payments.filter((payment) => payment.status === "posted").reduce((total, payment) => total + payment.amountMinor, 0),
      submittedExpenseMinor: input.expenses.filter((expense) => expense.status === "submitted").reduce((total, expense) => total + expense.amountMinor, 0),
    },
    sample: {
      leads: input.leads.length,
      landParcels: input.landParcels.length,
      projects: input.projects.length,
      tasks: input.tasks.length,
      invoices: input.invoices.length,
      payments: input.payments.length,
      expenses: input.expenses.length,
      mayBeTruncated: [input.leads, input.landParcels, input.projects, input.tasks, input.invoices, input.payments, input.expenses].some((records) => records.length === OFFICE_OPERATIONAL_REPORT_LIMIT),
    },
  } as const;
}
