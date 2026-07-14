import type { OfficePermission } from "@/features/office/permissions";

export type OfficeNavigationItem = {
  href: string;
  label: string;
  description: string;
  permission: OfficePermission;
  icon: "overview" | "people" | "land" | "projects" | "tasks" | "invoices" | "payments" | "expenses" | "approvals" | "documents" | "reports" | "team" | "audit";
};

export type OfficeNavigationGroup = {
  label: string;
  items: readonly OfficeNavigationItem[];
};

export const officeNavigation: readonly OfficeNavigationGroup[] = [
  {
    label: "Today",
    items: [
      { href: "/office", label: "Overview", description: "Priorities and operating signals", permission: "dashboard.read", icon: "overview" },
      { href: "/office/tasks", label: "Tasks", description: "Due work and ownership", permission: "tasks.read", icon: "tasks" },
      { href: "/office/approvals", label: "Approvals", description: "Decisions waiting for review", permission: "approvals.read", icon: "approvals" },
    ],
  },
  {
    label: "Relationships",
    items: [
      { href: "/office/leads", label: "Leads", description: "Pipeline and next actions", permission: "crm.read", icon: "people" },
      { href: "/office/contacts", label: "Contacts", description: "Clients, landowners, and partners", permission: "crm.read", icon: "people" },
      { href: "/office/land", label: "Land & JV", description: "Parcels and due diligence", permission: "land.read", icon: "land" },
    ],
  },
  {
    label: "Delivery",
    items: [
      { href: "/office/projects", label: "Projects", description: "Milestones, risks, and progress", permission: "projects.read", icon: "projects" },
      { href: "/office/documents", label: "Documents", description: "Controlled project evidence", permission: "documents.read", icon: "documents" },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/office/invoices", label: "Invoices", description: "Commercial documents and aging", permission: "finance.read", icon: "invoices" },
      { href: "/office/payments", label: "Payments", description: "Collections and allocations", permission: "finance.read", icon: "payments" },
      { href: "/office/expenses", label: "Expenses", description: "Submission and approval", permission: "expenses.read", icon: "expenses" },
    ],
  },
  {
    label: "Control",
    items: [
      { href: "/office/reports", label: "Reports", description: "Pipeline, delivery, and finance", permission: "reports.read", icon: "reports" },
      { href: "/office/team", label: "Team", description: "Membership and roles", permission: "team.read", icon: "team" },
      { href: "/office/audit", label: "Audit", description: "Immutable activity history", permission: "audit.read", icon: "audit" },
    ],
  },
] as const;
