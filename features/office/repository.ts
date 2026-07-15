import { getD1, getOptionalD1 } from "@/db";
import { normalizeBangladeshPhone } from "@/features/office/notifications";
import { createTrackingCode, trackingUrl } from "@/features/office/tracking";
import {
  calculateInvoiceTotals,
  minorUnitsSchema,
  officeInvoiceDraftInputSchema,
  officeInvoicePartySnapshotSchema,
  positiveMinorUnitsSchema,
  validateExpenseApproval,
  validatePaymentAllocation,
  type OfficeApprovalStatus,
  type OfficeContactKind,
  type OfficeExpenseStatus,
  type OfficeInvoiceDraftInput,
  type OfficeInvoiceKind,
  type OfficeInvoiceStatus,
  type OfficeLandStage,
  type OfficeLeadStage,
  type OfficeMemberStatus,
  type OfficeLocale,
  type OfficeNoticeKind,
  type OfficeNoticeStatus,
  type OfficeNotificationStatus,
  type OfficePaymentStatus,
  type OfficeProjectStatus,
  type OfficeRole,
  type OfficeTaskStatus,
} from "@/features/office/types";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;
const MAX_LIST_OFFSET = 100_000;
const DEFAULT_BRANCH_CODE = "JOY";
const DOCUMENT_NUMBER_WIDTH = 6;

const REQUIRED_OFFICE_TABLES = [
  "office_members",
  "office_contacts",
  "office_leads",
  "office_activities",
  "office_land_parcels",
  "office_projects",
  "office_milestones",
  "office_tasks",
  "office_invoices",
  "office_invoice_items",
  "office_payments",
  "office_payment_allocations",
  "office_expenses",
  "office_approvals",
  "office_documents",
  "office_sequences",
  "office_notices",
  "office_notice_revisions",
  "office_notification_outbox",
  "office_notification_attempts",
  "office_contact_preferences",
  "office_audit_events",
] as const;

export type OfficePriority = "low" | "normal" | "high" | "urgent";
export type OfficeContactStatus = "active" | "archived";
export type OfficeLeadServiceType =
  | "buy"
  | "sell"
  | "rent"
  | "land_development"
  | "construction"
  | "consultation"
  | "other";
export type OfficeLandReviewStatus =
  | "not_started"
  | "in_review"
  | "needs_information"
  | "reviewed"
  | "rejected";
export type OfficeProjectType =
  | "residential"
  | "commercial"
  | "mixed_use"
  | "land_development"
  | "construction"
  | "other";
export type OfficeRiskLevel = "low" | "medium" | "high" | "critical";
export type OfficePaymentMethod =
  | "cash"
  | "bank_transfer"
  | "card"
  | "mobile_financial_service"
  | "cheque"
  | "other";
export type OfficeApprovalEntityType =
  | "invoice"
  | "payment"
  | "expense"
  | "document"
  | "project"
  | "land_parcel";
export type OfficeApprovalKind =
  | "posting"
  | "expense"
  | "adjustment"
  | "document_review"
  | "project_gate"
  | "land_review";
export type OfficeDocumentType = "invoice" | "receipt" | "expense" | "notice";
export type OfficeApprovalDecision = "approved" | "rejected";

export type OfficeRepositoryActor = Readonly<{
  memberId: string | null;
  email: string;
  requestId?: string | null;
  ipHash?: string | null;
}>;

export type OfficeListOptions = Readonly<{
  limit?: number;
  offset?: number;
}>;

export type OfficeReferenceOption = Readonly<{
  id: string;
  label: string;
  detail: string;
}>;

export type OfficeContactReferenceOption = OfficeReferenceOption &
  Readonly<{
    hasBillingAddress: boolean;
  }>;

export type OfficeDatabaseHealth = Readonly<{
  available: boolean;
  healthy: boolean;
  checkedAt: string;
  missingTables: readonly string[];
  error: "binding_unavailable" | "schema_incomplete" | "health_check_failed" | null;
}>;

export type OfficeDashboardAggregate = Readonly<{
  activeContacts: number;
  activeLeads: number;
  overdueTasks: number;
  openTasks: number;
  activeLandParcels: number;
  activeProjects: number;
  criticalProjects: number;
  outstandingInvoiceMinor: number;
  overdueInvoiceMinor: number;
  pendingExpenses: number;
  pendingExpenseMinor: number;
  pendingApprovals: number;
}>;

export type OfficeContactView = Readonly<{
  id: string;
  kind: OfficeContactKind;
  displayName: string;
  email: string | null;
  phone: string | null;
  organizationName: string | null;
  address: string | null;
  notes: string | null;
  status: OfficeContactStatus;
  assignedMemberId: string | null;
  assignedMemberName: string | null;
  version: number;
  createdByEmail: string;
  updatedByEmail: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}>;

export type OfficeLeadView = Readonly<{
  id: string;
  contactId: string;
  contactName: string;
  title: string;
  source: string | null;
  serviceType: OfficeLeadServiceType;
  stage: OfficeLeadStage;
  priority: OfficePriority;
  assigneeMemberId: string | null;
  assigneeMemberName: string | null;
  estimatedValueMinor: number | null;
  currency: string;
  nextActionAt: string | null;
  wonAt: string | null;
  closedAt: string | null;
  lostReason: string | null;
  version: number;
  createdByEmail: string;
  updatedByEmail: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}>;

export type OfficeLandParcelView = Readonly<{
  id: string;
  referenceCode: string;
  title: string;
  primaryLandownerContactId: string | null;
  primaryLandownerName: string | null;
  stage: OfficeLandStage;
  reviewStatus: OfficeLandReviewStatus;
  address: string;
  district: string;
  upazila: string | null;
  unionOrWard: string | null;
  mouza: string | null;
  jlNumber: string | null;
  dagNumbers: readonly string[];
  khatianNumbers: readonly string[];
  areaSquareFeet: number | null;
  areaDecimal: string | null;
  ownershipShareBps: number | null;
  mutationStatus: string | null;
  landTaxStatus: string | null;
  possessionStatus: string | null;
  verificationNotes: string | null;
  assigneeMemberId: string | null;
  assigneeMemberName: string | null;
  version: number;
  createdByEmail: string;
  updatedByEmail: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}>;

export type OfficeProjectView = Readonly<{
  id: string;
  code: string;
  name: string;
  projectType: OfficeProjectType;
  status: OfficeProjectStatus;
  landParcelId: string | null;
  landParcelTitle: string | null;
  customerContactId: string | null;
  customerName: string | null;
  managerMemberId: string | null;
  managerName: string | null;
  address: string;
  district: string;
  upazila: string | null;
  summary: string | null;
  riskLevel: OfficeRiskLevel;
  progressBps: number;
  budgetMinor: number | null;
  currency: string;
  startAt: string | null;
  targetEndAt: string | null;
  actualEndAt: string | null;
  version: number;
  createdByEmail: string;
  updatedByEmail: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}>;

export type OfficeTaskView = Readonly<{
  id: string;
  title: string;
  description: string | null;
  status: OfficeTaskStatus;
  priority: OfficePriority;
  assigneeMemberId: string | null;
  assigneeMemberName: string | null;
  reporterMemberId: string | null;
  reporterMemberName: string | null;
  contactId: string | null;
  contactName: string | null;
  leadId: string | null;
  leadTitle: string | null;
  landParcelId: string | null;
  landParcelTitle: string | null;
  projectId: string | null;
  projectName: string | null;
  dueAt: string | null;
  completedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}>;

export type OfficeInvoicePartySnapshot = ReturnType<
  typeof officeInvoicePartySnapshotSchema.parse
>;

export type OfficeInvoiceSummary = Readonly<{
  id: string;
  number: string | null;
  branchCode: string;
  fiscalYear: string | null;
  sequenceValue: number | null;
  contactId: string;
  contactName: string;
  projectId: string | null;
  projectName: string | null;
  kind: OfficeInvoiceKind;
  purpose: string;
  locale: OfficeLocale;
  status: OfficeInvoiceStatus;
  issueDate: string | null;
  dueDate: string | null;
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  paidMinor: number;
  balanceMinor: number;
  trackingCode: string | null;
  trackingIssuedAt: string | null;
  publicAccessRevokedAt: string | null;
  templateVersion: string;
  version: number;
  createdByEmail: string;
  updatedByEmail: string;
  createdAt: string;
  updatedAt: string;
}>;

export type OfficeInvoiceItemView = Readonly<{
  id: string;
  invoiceId: string;
  position: number;
  description: string;
  quantityMillis: number;
  unitPriceMinor: number;
  discountMinor: number;
  taxRateBps: number;
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  metadata: Readonly<Record<string, unknown>>;
  createdAt: string;
}>;

export type OfficeInvoicePaymentView = Readonly<{
  allocationId: string;
  paymentId: string;
  receiptNumber: string | null;
  amountMinor: number;
  method: OfficePaymentMethod;
  paidAt: string;
  status: OfficePaymentStatus;
}>;

export type OfficeInvoiceDetail = OfficeInvoiceSummary &
  Readonly<{
    customerSnapshot: OfficeInvoicePartySnapshot;
    companySnapshot: OfficeInvoicePartySnapshot;
    taxSnapshot: Readonly<Record<string, unknown>> | null;
    termsSnapshot: string;
    notes: string | null;
    approvedByMemberId: string | null;
    approvedAt: string | null;
    postedByMemberId: string | null;
    postedAt: string | null;
    items: readonly OfficeInvoiceItemView[];
    payments: readonly OfficeInvoicePaymentView[];
  }>;

export type OfficePaymentView = Readonly<{
  id: string;
  receiptNumber: string | null;
  branchCode: string;
  fiscalYear: string | null;
  sequenceValue: number | null;
  contactId: string;
  contactName: string;
  projectId: string | null;
  projectName: string | null;
  clientOperationId: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  allocatedMinor: number | null;
  status: OfficePaymentStatus;
  method: OfficePaymentMethod;
  amountMinor: number;
  currency: string;
  paidAt: string;
  reference: string | null;
  note: string | null;
  locale: OfficeLocale;
  trackingCode: string | null;
  trackingIssuedAt: string | null;
  publicAccessRevokedAt: string | null;
  templateVersion: string;
  receivedByMemberId: string | null;
  receivedByMemberName: string | null;
  postedByMemberId: string | null;
  postedAt: string | null;
  version: number;
  createdByEmail: string;
  createdAt: string;
  updatedAt: string;
}>;

export type OfficeNoticeView = Readonly<{
  id: string;
  number: string | null;
  branchCode: string;
  fiscalYear: string | null;
  sequenceValue: number | null;
  kind: OfficeNoticeKind;
  title: string;
  body: string;
  locale: OfficeLocale;
  contactId: string | null;
  contactName: string | null;
  projectId: string | null;
  projectName: string | null;
  status: OfficeNoticeStatus;
  recipientSnapshot: OfficeInvoicePartySnapshot | null;
  companySnapshot: OfficeInvoicePartySnapshot;
  issueDate: string | null;
  effectiveDate: string | null;
  expiresAt: string | null;
  trackingCode: string | null;
  trackingIssuedAt: string | null;
  publicAccessRevokedAt: string | null;
  templateVersion: string;
  issuedByMemberId: string | null;
  issuedAt: string | null;
  version: number;
  createdByEmail: string;
  updatedByEmail: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}>;

export type OfficeNotificationOutboxView = Readonly<{
  id: string;
  eventType: string;
  entityType: "invoice" | "payment" | "notice";
  entityId: string;
  channel: "email" | "sms";
  recipientMasked: string;
  template: string;
  locale: OfficeLocale;
  status: OfficeNotificationStatus;
  attemptCount: number;
  maxAttempts: number;
  availableAt: string;
  errorCode: string | null;
  errorSummary: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type OfficeExpenseView = Readonly<{
  id: string;
  number: string | null;
  status: OfficeExpenseStatus;
  category: string;
  description: string;
  projectId: string | null;
  projectName: string | null;
  vendorContactId: string | null;
  vendorName: string | null;
  amountMinor: number;
  currency: string;
  incurredAt: string;
  receiptDocumentId: string | null;
  submittedByMemberId: string | null;
  submittedByMemberName: string | null;
  submittedAt: string | null;
  approvedByMemberId: string | null;
  approvedByMemberName: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  rejectionReason: string | null;
  version: number;
  createdByEmail: string;
  updatedByEmail: string;
  createdAt: string;
  updatedAt: string;
}>;

export type OfficeApprovalView = Readonly<{
  id: string;
  entityType: OfficeApprovalEntityType;
  entityId: string;
  kind: OfficeApprovalKind;
  status: OfficeApprovalStatus;
  requestedByMemberId: string | null;
  requestedByMemberName: string | null;
  assignedToMemberId: string | null;
  assignedToMemberName: string | null;
  decidedByMemberId: string | null;
  decidedByMemberName: string | null;
  requestNote: string | null;
  decisionReason: string | null;
  requestedAt: string;
  decidedAt: string | null;
  version: number;
}>;

export type OfficeTeamMemberView = Readonly<{
  id: string;
  email: string;
  displayName: string;
  role: OfficeRole;
  status: OfficeMemberStatus;
  invitedByMemberId: string | null;
  invitedByMemberName: string | null;
  lastSeenAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}>;

export type OfficeAuditEventView = Readonly<{
  id: string;
  actorMemberId: string | null;
  actorName: string | null;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Readonly<Record<string, unknown>>;
  requestId: string | null;
  ipHash: string | null;
  createdAt: string;
}>;

export type CreateOfficeContactInput = Readonly<{
  kind: OfficeContactKind;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  organizationName?: string | null;
  address?: string | null;
  notes?: string | null;
  assignedMemberId?: string | null;
}>;

export type CreateOfficeLeadInput = Readonly<{
  contactId: string;
  title: string;
  source?: string | null;
  serviceType: OfficeLeadServiceType;
  stage?: OfficeLeadStage;
  priority?: OfficePriority;
  assigneeMemberId?: string | null;
  estimatedValueMinor?: number | null;
  currency?: string;
  nextActionAt?: string | null;
}>;

export type CreateOfficeLandParcelInput = Readonly<{
  referenceCode: string;
  title: string;
  primaryLandownerContactId?: string | null;
  stage?: OfficeLandStage;
  reviewStatus?: OfficeLandReviewStatus;
  address: string;
  district?: string;
  upazila?: string | null;
  unionOrWard?: string | null;
  mouza?: string | null;
  jlNumber?: string | null;
  dagNumbers?: readonly string[];
  khatianNumbers?: readonly string[];
  areaSquareFeet?: number | null;
  areaDecimal?: string | null;
  ownershipShareBps?: number | null;
  mutationStatus?: string | null;
  landTaxStatus?: string | null;
  possessionStatus?: string | null;
  verificationNotes?: string | null;
  assigneeMemberId?: string | null;
}>;

export type CreateOfficeProjectInput = Readonly<{
  code: string;
  name: string;
  projectType: OfficeProjectType;
  status?: OfficeProjectStatus;
  landParcelId?: string | null;
  customerContactId?: string | null;
  managerMemberId?: string | null;
  address: string;
  district?: string;
  upazila?: string | null;
  summary?: string | null;
  riskLevel?: OfficeRiskLevel;
  progressBps?: number;
  budgetMinor?: number | null;
  currency?: string;
  startAt?: string | null;
  targetEndAt?: string | null;
}>;

export type CreateOfficeTaskInput = Readonly<{
  title: string;
  description?: string | null;
  status?: OfficeTaskStatus;
  priority?: OfficePriority;
  assigneeMemberId?: string | null;
  reporterMemberId?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  landParcelId?: string | null;
  projectId?: string | null;
  dueAt?: string | null;
}>;

export type CreateOfficeInvoiceInput = OfficeInvoiceDraftInput &
  Readonly<{
    taxSnapshot?: Readonly<Record<string, unknown>> | null;
  }>;

export type IssueOfficeInvoiceInput = Readonly<{
  invoiceId: string;
  expectedVersion: number;
  fiscalYear: string;
  branchCode?: string;
}>;

export type AllocateOfficeDocumentSequenceInput = Readonly<{
  branchCode?: string;
  fiscalYear: string;
  documentType: OfficeDocumentType;
}>;

export type OfficeDocumentSequence = Readonly<{
  branchCode: string;
  fiscalYear: string;
  documentType: OfficeDocumentType;
  value: number;
  number: string;
  version: number;
}>;

export type RecordOfficePaymentInput = Readonly<{
  invoiceId: string;
  amountMinor: number;
  method: OfficePaymentMethod;
  paidAt: string;
  fiscalYear: string;
  branchCode?: string;
  clientOperationId?: string | null;
  locale?: OfficeLocale;
  reference?: string | null;
  note?: string | null;
  receivedByMemberId?: string | null;
}>;

export type CreateOfficeNoticeInput = Readonly<{
  kind: OfficeNoticeKind;
  title: string;
  body: string;
  locale: OfficeLocale;
  contactId?: string | null;
  projectId?: string | null;
  issueDate?: string | null;
  effectiveDate?: string | null;
  expiresAt?: string | null;
  company: OfficeInvoicePartySnapshot;
  recipient?: OfficeInvoicePartySnapshot | null;
}>;

export type IssueOfficeNoticeInput = Readonly<{
  noticeId: string;
  expectedVersion: number;
  fiscalYear: string;
  branchCode?: string;
}>;

export type CreateOfficeExpenseInput = Readonly<{
  category: string;
  description: string;
  projectId?: string | null;
  vendorContactId?: string | null;
  amountMinor: number;
  currency?: string;
  incurredAt: string;
  receiptDocumentId?: string | null;
}>;

export type SubmitOfficeExpenseInput = Readonly<{
  expenseId: string;
  expectedVersion: number;
  assignedToMemberId?: string | null;
  requestNote?: string | null;
}>;

export type DecideOfficeExpenseInput = Readonly<{
  expenseId: string;
  expectedVersion: number;
  decision: OfficeApprovalDecision;
  reason?: string | null;
}>;

export type DecideOfficeApprovalInput = Readonly<{
  approvalId: string;
  expectedVersion: number;
  decision: OfficeApprovalDecision;
  reason?: string | null;
}>;

export type AddOfficeTeamMemberInput = Readonly<{
  email: string;
  displayName: string;
  role: OfficeRole;
  status?: Extract<OfficeMemberStatus, "invited" | "active">;
}>;

export type OfficeAuditEventInput = Readonly<{
  actor: OfficeRepositoryActor;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Readonly<Record<string, unknown>>;
  createdAt?: string;
  id?: string;
}>;

export type OfficeAuditEventWrite = Readonly<{
  id: string;
  actorMemberId: string | null;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: string;
  requestId: string | null;
  ipHash: string | null;
  createdAt: string;
}>;

export type OfficeRepositoryErrorCode =
  | "not_found"
  | "invalid_state"
  | "optimistic_conflict"
  | "self_approval"
  | "allocation_invalid";

export class OfficeRepositoryError extends Error {
  readonly code: OfficeRepositoryErrorCode;

  constructor(code: OfficeRepositoryErrorCode, message: string) {
    super(message);
    this.name = "OfficeRepositoryError";
    this.code = code;
  }
}

type ContactRow = {
  id: string;
  kind: OfficeContactKind;
  display_name: string;
  email: string | null;
  phone: string | null;
  organization_name: string | null;
  address: string | null;
  notes: string | null;
  status: OfficeContactStatus;
  assigned_member_id: string | null;
  assigned_member_name: string | null;
  version: number;
  created_by_email: string;
  updated_by_email: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type LeadRow = {
  id: string;
  contact_id: string;
  contact_name: string;
  title: string;
  source: string | null;
  service_type: OfficeLeadServiceType;
  stage: OfficeLeadStage;
  priority: OfficePriority;
  assignee_member_id: string | null;
  assignee_member_name: string | null;
  estimated_value_minor: number | null;
  currency: string;
  next_action_at: string | null;
  won_at: string | null;
  closed_at: string | null;
  lost_reason: string | null;
  version: number;
  created_by_email: string;
  updated_by_email: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type LandParcelRow = {
  id: string;
  reference_code: string;
  title: string;
  primary_landowner_contact_id: string | null;
  primary_landowner_name: string | null;
  stage: OfficeLandStage;
  review_status: OfficeLandReviewStatus;
  address: string;
  district: string;
  upazila: string | null;
  union_or_ward: string | null;
  mouza: string | null;
  jl_number: string | null;
  dag_numbers: string;
  khatian_numbers: string;
  area_square_feet: number | null;
  area_decimal: string | null;
  ownership_share_bps: number | null;
  mutation_status: string | null;
  land_tax_status: string | null;
  possession_status: string | null;
  verification_notes: string | null;
  assignee_member_id: string | null;
  assignee_member_name: string | null;
  version: number;
  created_by_email: string;
  updated_by_email: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type ProjectRow = {
  id: string;
  code: string;
  name: string;
  project_type: OfficeProjectType;
  status: OfficeProjectStatus;
  land_parcel_id: string | null;
  land_parcel_title: string | null;
  customer_contact_id: string | null;
  customer_name: string | null;
  manager_member_id: string | null;
  manager_name: string | null;
  address: string;
  district: string;
  upazila: string | null;
  summary: string | null;
  risk_level: OfficeRiskLevel;
  progress_bps: number;
  budget_minor: number | null;
  currency: string;
  start_at: string | null;
  target_end_at: string | null;
  actual_end_at: string | null;
  version: number;
  created_by_email: string;
  updated_by_email: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: OfficeTaskStatus;
  priority: OfficePriority;
  assignee_member_id: string | null;
  assignee_member_name: string | null;
  reporter_member_id: string | null;
  reporter_member_name: string | null;
  contact_id: string | null;
  contact_name: string | null;
  lead_id: string | null;
  lead_title: string | null;
  land_parcel_id: string | null;
  land_parcel_title: string | null;
  project_id: string | null;
  project_name: string | null;
  due_at: string | null;
  completed_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type InvoiceRow = {
  id: string;
  number: string | null;
  branch_code: string;
  fiscal_year: string | null;
  sequence_value: number | null;
  contact_id: string;
  contact_name: string;
  project_id: string | null;
  project_name: string | null;
  kind: OfficeInvoiceKind;
  purpose: string;
  locale: OfficeLocale;
  status: OfficeInvoiceStatus;
  issue_date: string | null;
  due_date: string | null;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  tax_minor: number;
  total_minor: number;
  paid_minor: number;
  balance_minor: number;
  tracking_code: string | null;
  tracking_issued_at: string | null;
  public_access_revoked_at: string | null;
  template_version: string;
  customer_snapshot: string;
  company_snapshot: string;
  tax_snapshot: string | null;
  terms_snapshot: string;
  notes: string | null;
  approved_by_member_id: string | null;
  approved_at: string | null;
  posted_by_member_id: string | null;
  posted_at: string | null;
  version: number;
  created_by_email: string;
  updated_by_email: string;
  created_at: string;
  updated_at: string;
};

type InvoiceSummaryRow = Omit<
  InvoiceRow,
  | "customer_snapshot"
  | "company_snapshot"
  | "tax_snapshot"
  | "terms_snapshot"
  | "notes"
  | "approved_by_member_id"
  | "approved_at"
  | "posted_by_member_id"
  | "posted_at"
>;

type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  position: number;
  description: string;
  quantity_millis: number;
  unit_price_minor: number;
  discount_minor: number;
  tax_rate_bps: number;
  subtotal_minor: number;
  tax_minor: number;
  total_minor: number;
  metadata: string;
  created_at: string;
};

type InvoicePaymentRow = {
  allocation_id: string;
  payment_id: string;
  receipt_number: string | null;
  amount_minor: number;
  method: OfficePaymentMethod;
  paid_at: string;
  status: OfficePaymentStatus;
};

type PaymentRow = {
  id: string;
  receipt_number: string | null;
  branch_code: string;
  fiscal_year: string | null;
  sequence_value: number | null;
  contact_id: string;
  contact_name: string;
  project_id: string | null;
  project_name: string | null;
  client_operation_id: string | null;
  invoice_id: string | null;
  invoice_number: string | null;
  allocated_minor: number | null;
  status: OfficePaymentStatus;
  method: OfficePaymentMethod;
  amount_minor: number;
  currency: string;
  paid_at: string;
  reference: string | null;
  note: string | null;
  locale: OfficeLocale;
  tracking_code: string | null;
  tracking_issued_at: string | null;
  public_access_revoked_at: string | null;
  template_version: string;
  received_by_member_id: string | null;
  received_by_member_name: string | null;
  posted_by_member_id: string | null;
  posted_at: string | null;
  version: number;
  created_by_email: string;
  created_at: string;
  updated_at: string;
};

type ExpenseRow = {
  id: string;
  number: string | null;
  status: OfficeExpenseStatus;
  category: string;
  description: string;
  project_id: string | null;
  project_name: string | null;
  vendor_contact_id: string | null;
  vendor_name: string | null;
  amount_minor: number;
  currency: string;
  incurred_at: string;
  receipt_document_id: string | null;
  submitted_by_member_id: string | null;
  submitted_by_member_name: string | null;
  submitted_at: string | null;
  approved_by_member_id: string | null;
  approved_by_member_name: string | null;
  approved_at: string | null;
  paid_at: string | null;
  rejection_reason: string | null;
  version: number;
  created_by_email: string;
  updated_by_email: string;
  created_at: string;
  updated_at: string;
};

type ApprovalRow = {
  id: string;
  entity_type: OfficeApprovalEntityType;
  entity_id: string;
  kind: OfficeApprovalKind;
  status: OfficeApprovalStatus;
  requested_by_member_id: string | null;
  requested_by_member_name: string | null;
  assigned_to_member_id: string | null;
  assigned_to_member_name: string | null;
  decided_by_member_id: string | null;
  decided_by_member_name: string | null;
  request_note: string | null;
  decision_reason: string | null;
  requested_at: string;
  decided_at: string | null;
  version: number;
};

type TeamMemberRow = {
  id: string;
  email: string;
  display_name: string;
  role: OfficeRole;
  status: OfficeMemberStatus;
  invited_by_member_id: string | null;
  invited_by_member_name: string | null;
  last_seen_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type AuditEventRow = {
  id: string;
  actor_member_id: string | null;
  actor_name: string | null;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: string;
  request_id: string | null;
  ip_hash: string | null;
  created_at: string;
};

type SequenceRow = {
  current_value: number;
  version: number;
};

type InvoiceAllocationGuardRow = {
  id: string;
  number: string;
  contact_id: string;
  contact_email: string | null;
  contact_phone: string | null;
  project_id: string | null;
  status: OfficeInvoiceStatus;
  currency: string;
  balance_minor: number;
  locale: OfficeLocale;
  preferred_locale: OfficeLocale | null;
  transactional_email_enabled: number | null;
  transactional_sms_enabled: number | null;
};

type DashboardRow = {
  active_contacts: number;
  active_leads: number;
  overdue_tasks: number;
  open_tasks: number;
  active_land_parcels: number;
  active_projects: number;
  critical_projects: number;
  outstanding_invoice_minor: number;
  overdue_invoice_minor: number;
  pending_expenses: number;
  pending_expense_minor: number;
  pending_approvals: number;
};

function boundedLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_LIST_LIMIT;
  if (!Number.isInteger(limit)) throw new TypeError("List limit must be an integer.");
  return Math.min(Math.max(limit, 1), MAX_LIST_LIMIT);
}

function boundedOffset(offset: number | undefined): number {
  if (offset === undefined) return 0;
  if (!Number.isInteger(offset)) throw new TypeError("List offset must be an integer.");
  return Math.min(Math.max(offset, 0), MAX_LIST_OFFSET);
}

function prepareBoundedList(
  database: D1Database,
  selectSql: string,
  conditions: readonly string[],
  bindings: readonly unknown[],
  orderBySql: string,
  options: OfficeListOptions,
): D1PreparedStatement {
  const whereSql = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  return database
    .prepare(`${selectSql}${whereSql} ${orderBySql} LIMIT ? OFFSET ?`)
    .bind(...bindings, boundedLimit(options.limit), boundedOffset(options.offset));
}

function requireText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required.`);
  return normalized;
}

function optionalText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeEmail(value: string): string {
  return requireText(value, "Email").toLowerCase();
}

function normalizePhone(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

function normalizeCurrency(value: string | undefined): string {
  const currency = (value ?? "BDT").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new TypeError("Currency must be a three-letter ISO 4217 code.");
  }
  return currency;
}

function normalizeBranchCode(value: string | undefined): string {
  const branchCode = (value ?? DEFAULT_BRANCH_CODE).trim().toUpperCase();
  if (!/^[A-Z0-9]{2,12}$/.test(branchCode)) {
    throw new TypeError("Branch code must contain 2 to 12 uppercase letters or digits.");
  }
  return branchCode;
}

function normalizeFiscalYear(value: string): string {
  const fiscalYear = requireText(value, "Fiscal year");
  if (!/^[0-9]{4}(?:-[0-9]{2,4})?$/.test(fiscalYear)) {
    throw new TypeError("Fiscal year must use YYYY, YYYY-YY, or YYYY-YYYY format.");
  }
  return fiscalYear;
}

function normalizeStringList(values: readonly string[] | undefined): readonly string[] {
  if (!values) return [];
  return values.map((value) => requireText(value, "List value"));
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function searchPattern(value: string): string {
  return `%${escapeLike(normalizeSearchText(value))}%`;
}

function serializeJson(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new TypeError("Value cannot be serialized as JSON.");
  return serialized;
}

function parseJsonRecord(value: string): Readonly<Record<string, unknown>> {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new TypeError("Stored JSON must be an object.");
  }
  return parsed as Readonly<Record<string, unknown>>;
}

function parseJsonStringList(value: string): readonly string[] {
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new TypeError("Stored JSON must be an array of strings.");
  }
  return parsed;
}

function requireActorMemberId(actor: OfficeRepositoryActor): string {
  if (actor.memberId) return actor.memberId;
  throw new OfficeRepositoryError(
    "invalid_state",
    "An active office member record is required for this workflow.",
  );
}

function requireChanged(result: D1Result, message: string): void {
  if (result.meta.changes === 1) return;
  throw new OfficeRepositoryError("optimistic_conflict", message);
}

function mapContact(row: ContactRow): OfficeContactView {
  return {
    id: row.id,
    kind: row.kind,
    displayName: row.display_name,
    email: row.email,
    phone: row.phone,
    organizationName: row.organization_name,
    address: row.address,
    notes: row.notes,
    status: row.status,
    assignedMemberId: row.assigned_member_id,
    assignedMemberName: row.assigned_member_name,
    version: row.version,
    createdByEmail: row.created_by_email,
    updatedByEmail: row.updated_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapLead(row: LeadRow): OfficeLeadView {
  return {
    id: row.id,
    contactId: row.contact_id,
    contactName: row.contact_name,
    title: row.title,
    source: row.source,
    serviceType: row.service_type,
    stage: row.stage,
    priority: row.priority,
    assigneeMemberId: row.assignee_member_id,
    assigneeMemberName: row.assignee_member_name,
    estimatedValueMinor: row.estimated_value_minor,
    currency: row.currency,
    nextActionAt: row.next_action_at,
    wonAt: row.won_at,
    closedAt: row.closed_at,
    lostReason: row.lost_reason,
    version: row.version,
    createdByEmail: row.created_by_email,
    updatedByEmail: row.updated_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapLandParcel(row: LandParcelRow): OfficeLandParcelView {
  return {
    id: row.id,
    referenceCode: row.reference_code,
    title: row.title,
    primaryLandownerContactId: row.primary_landowner_contact_id,
    primaryLandownerName: row.primary_landowner_name,
    stage: row.stage,
    reviewStatus: row.review_status,
    address: row.address,
    district: row.district,
    upazila: row.upazila,
    unionOrWard: row.union_or_ward,
    mouza: row.mouza,
    jlNumber: row.jl_number,
    dagNumbers: parseJsonStringList(row.dag_numbers),
    khatianNumbers: parseJsonStringList(row.khatian_numbers),
    areaSquareFeet: row.area_square_feet,
    areaDecimal: row.area_decimal,
    ownershipShareBps: row.ownership_share_bps,
    mutationStatus: row.mutation_status,
    landTaxStatus: row.land_tax_status,
    possessionStatus: row.possession_status,
    verificationNotes: row.verification_notes,
    assigneeMemberId: row.assignee_member_id,
    assigneeMemberName: row.assignee_member_name,
    version: row.version,
    createdByEmail: row.created_by_email,
    updatedByEmail: row.updated_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapProject(row: ProjectRow): OfficeProjectView {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    projectType: row.project_type,
    status: row.status,
    landParcelId: row.land_parcel_id,
    landParcelTitle: row.land_parcel_title,
    customerContactId: row.customer_contact_id,
    customerName: row.customer_name,
    managerMemberId: row.manager_member_id,
    managerName: row.manager_name,
    address: row.address,
    district: row.district,
    upazila: row.upazila,
    summary: row.summary,
    riskLevel: row.risk_level,
    progressBps: row.progress_bps,
    budgetMinor: row.budget_minor,
    currency: row.currency,
    startAt: row.start_at,
    targetEndAt: row.target_end_at,
    actualEndAt: row.actual_end_at,
    version: row.version,
    createdByEmail: row.created_by_email,
    updatedByEmail: row.updated_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapTask(row: TaskRow): OfficeTaskView {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigneeMemberId: row.assignee_member_id,
    assigneeMemberName: row.assignee_member_name,
    reporterMemberId: row.reporter_member_id,
    reporterMemberName: row.reporter_member_name,
    contactId: row.contact_id,
    contactName: row.contact_name,
    leadId: row.lead_id,
    leadTitle: row.lead_title,
    landParcelId: row.land_parcel_id,
    landParcelTitle: row.land_parcel_title,
    projectId: row.project_id,
    projectName: row.project_name,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapInvoiceSummary(row: InvoiceSummaryRow): OfficeInvoiceSummary {
  return {
    id: row.id,
    number: row.number,
    branchCode: row.branch_code,
    fiscalYear: row.fiscal_year,
    sequenceValue: row.sequence_value,
    contactId: row.contact_id,
    contactName: row.contact_name,
    projectId: row.project_id,
    projectName: row.project_name,
    kind: row.kind,
    purpose: row.purpose,
    locale: row.locale,
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    currency: row.currency,
    subtotalMinor: row.subtotal_minor,
    discountMinor: row.discount_minor,
    taxMinor: row.tax_minor,
    totalMinor: row.total_minor,
    paidMinor: row.paid_minor,
    balanceMinor: row.balance_minor,
    trackingCode: row.tracking_code,
    trackingIssuedAt: row.tracking_issued_at,
    publicAccessRevokedAt: row.public_access_revoked_at,
    templateVersion: row.template_version,
    version: row.version,
    createdByEmail: row.created_by_email,
    updatedByEmail: row.updated_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvoiceItem(row: InvoiceItemRow): OfficeInvoiceItemView {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    position: row.position,
    description: row.description,
    quantityMillis: row.quantity_millis,
    unitPriceMinor: row.unit_price_minor,
    discountMinor: row.discount_minor,
    taxRateBps: row.tax_rate_bps,
    subtotalMinor: row.subtotal_minor,
    taxMinor: row.tax_minor,
    totalMinor: row.total_minor,
    metadata: parseJsonRecord(row.metadata),
    createdAt: row.created_at,
  };
}

function mapInvoicePayment(row: InvoicePaymentRow): OfficeInvoicePaymentView {
  return {
    allocationId: row.allocation_id,
    paymentId: row.payment_id,
    receiptNumber: row.receipt_number,
    amountMinor: row.amount_minor,
    method: row.method,
    paidAt: row.paid_at,
    status: row.status,
  };
}

function mapPayment(row: PaymentRow): OfficePaymentView {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    branchCode: row.branch_code,
    fiscalYear: row.fiscal_year,
    sequenceValue: row.sequence_value,
    contactId: row.contact_id,
    contactName: row.contact_name,
    projectId: row.project_id,
    projectName: row.project_name,
    clientOperationId: row.client_operation_id,
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    allocatedMinor: row.allocated_minor,
    status: row.status,
    method: row.method,
    amountMinor: row.amount_minor,
    currency: row.currency,
    paidAt: row.paid_at,
    reference: row.reference,
    note: row.note,
    locale: row.locale,
    trackingCode: row.tracking_code,
    trackingIssuedAt: row.tracking_issued_at,
    publicAccessRevokedAt: row.public_access_revoked_at,
    templateVersion: row.template_version,
    receivedByMemberId: row.received_by_member_id,
    receivedByMemberName: row.received_by_member_name,
    postedByMemberId: row.posted_by_member_id,
    postedAt: row.posted_at,
    version: row.version,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExpense(row: ExpenseRow): OfficeExpenseView {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    category: row.category,
    description: row.description,
    projectId: row.project_id,
    projectName: row.project_name,
    vendorContactId: row.vendor_contact_id,
    vendorName: row.vendor_name,
    amountMinor: row.amount_minor,
    currency: row.currency,
    incurredAt: row.incurred_at,
    receiptDocumentId: row.receipt_document_id,
    submittedByMemberId: row.submitted_by_member_id,
    submittedByMemberName: row.submitted_by_member_name,
    submittedAt: row.submitted_at,
    approvedByMemberId: row.approved_by_member_id,
    approvedByMemberName: row.approved_by_member_name,
    approvedAt: row.approved_at,
    paidAt: row.paid_at,
    rejectionReason: row.rejection_reason,
    version: row.version,
    createdByEmail: row.created_by_email,
    updatedByEmail: row.updated_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapApproval(row: ApprovalRow): OfficeApprovalView {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    kind: row.kind,
    status: row.status,
    requestedByMemberId: row.requested_by_member_id,
    requestedByMemberName: row.requested_by_member_name,
    assignedToMemberId: row.assigned_to_member_id,
    assignedToMemberName: row.assigned_to_member_name,
    decidedByMemberId: row.decided_by_member_id,
    decidedByMemberName: row.decided_by_member_name,
    requestNote: row.request_note,
    decisionReason: row.decision_reason,
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
    version: row.version,
  };
}

function mapTeamMember(row: TeamMemberRow): OfficeTeamMemberView {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    status: row.status,
    invitedByMemberId: row.invited_by_member_id,
    invitedByMemberName: row.invited_by_member_name,
    lastSeenAt: row.last_seen_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapAuditEvent(row: AuditEventRow): OfficeAuditEventView {
  return {
    id: row.id,
    actorMemberId: row.actor_member_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: parseJsonRecord(row.metadata),
    requestId: row.request_id,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
  };
}

export function createOfficeAuditEvent(input: OfficeAuditEventInput): OfficeAuditEventWrite {
  return {
    id: input.id ?? crypto.randomUUID(),
    actorMemberId: input.actor.memberId,
    actorEmail: normalizeEmail(input.actor.email),
    action: requireText(input.action, "Audit action"),
    entityType: requireText(input.entityType, "Audit entity type"),
    entityId: requireText(input.entityId, "Audit entity id"),
    metadata: serializeJson(input.metadata ?? {}),
    requestId: optionalText(input.actor.requestId),
    ipHash: optionalText(input.actor.ipHash),
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function prepareOfficeAuditInsert(
  database: D1Database,
  event: OfficeAuditEventWrite,
): D1PreparedStatement {
  return database
    .prepare(
      "INSERT INTO office_audit_events (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata, request_id, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      event.id,
      event.actorMemberId,
      event.actorEmail,
      event.action,
      event.entityType,
      event.entityId,
      event.metadata,
      event.requestId,
      event.ipHash,
      event.createdAt,
    );
}

export async function recordOfficeAuditEvent(
  input: OfficeAuditEventInput,
): Promise<OfficeAuditEventWrite> {
  const database = await getD1();
  const event = createOfficeAuditEvent(input);
  await prepareOfficeAuditInsert(database, event).run();
  return event;
}

export async function isOfficeDatabaseAvailable(): Promise<boolean> {
  return (await getOptionalD1()) !== null;
}

export async function getOfficeDatabaseHealth(): Promise<OfficeDatabaseHealth> {
  const checkedAt = new Date().toISOString();
  const database = await getOptionalD1();
  if (!database) {
    return {
      available: false,
      healthy: false,
      checkedAt,
      missingTables: REQUIRED_OFFICE_TABLES,
      error: "binding_unavailable",
    };
  }

  try {
    const result = await database
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${REQUIRED_OFFICE_TABLES.map(() => "?").join(", ")})`,
      )
      .bind(...REQUIRED_OFFICE_TABLES)
      .all<{ name: string }>();
    const present = new Set(result.results.map((row) => row.name));
    const missingTables = REQUIRED_OFFICE_TABLES.filter((table) => !present.has(table));
    return {
      available: true,
      healthy: missingTables.length === 0,
      checkedAt,
      missingTables,
      error: missingTables.length === 0 ? null : "schema_incomplete",
    };
  } catch (error) {
    console.error("Office database health check failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      available: true,
      healthy: false,
      checkedAt,
      missingTables: [],
      error: "health_check_failed",
    };
  }
}

export async function getOfficeDashboard(): Promise<OfficeDashboardAggregate> {
  const database = await getD1();
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const row = await database
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM office_contacts WHERE status = 'active') AS active_contacts,
        (SELECT COUNT(*) FROM office_leads WHERE archived_at IS NULL AND stage NOT IN ('won', 'lost')) AS active_leads,
        (SELECT COUNT(*) FROM office_tasks WHERE archived_at IS NULL AND status IN ('open', 'in_progress', 'blocked') AND due_at IS NOT NULL AND due_at < ?) AS overdue_tasks,
        (SELECT COUNT(*) FROM office_tasks WHERE archived_at IS NULL AND status IN ('open', 'in_progress', 'blocked')) AS open_tasks,
        (SELECT COUNT(*) FROM office_land_parcels WHERE archived_at IS NULL AND stage NOT IN ('closed', 'rejected')) AS active_land_parcels,
        (SELECT COUNT(*) FROM office_projects WHERE archived_at IS NULL AND status NOT IN ('closed', 'cancelled')) AS active_projects,
        (SELECT COUNT(*) FROM office_projects WHERE archived_at IS NULL AND risk_level = 'critical' AND status NOT IN ('closed', 'cancelled')) AS critical_projects,
        (SELECT COALESCE(SUM(balance_minor), 0) FROM office_invoices WHERE status IN ('issued', 'partially_paid', 'overdue')) AS outstanding_invoice_minor,
        (SELECT COALESCE(SUM(balance_minor), 0) FROM office_invoices WHERE status IN ('issued', 'partially_paid', 'overdue') AND due_date IS NOT NULL AND due_date < ?) AS overdue_invoice_minor,
        (SELECT COUNT(*) FROM office_expenses WHERE status = 'submitted') AS pending_expenses,
        (SELECT COALESCE(SUM(amount_minor), 0) FROM office_expenses WHERE status = 'submitted') AS pending_expense_minor,
        (SELECT COUNT(*) FROM office_approvals WHERE status = 'pending') AS pending_approvals`,
    )
    .bind(now, today)
    .first<DashboardRow>();

  if (!row) {
    throw new OfficeRepositoryError("not_found", "Office dashboard aggregate was not returned.");
  }
  return {
    activeContacts: row.active_contacts,
    activeLeads: row.active_leads,
    overdueTasks: row.overdue_tasks,
    openTasks: row.open_tasks,
    activeLandParcels: row.active_land_parcels,
    activeProjects: row.active_projects,
    criticalProjects: row.critical_projects,
    outstandingInvoiceMinor: row.outstanding_invoice_minor,
    overdueInvoiceMinor: row.overdue_invoice_minor,
    pendingExpenses: row.pending_expenses,
    pendingExpenseMinor: row.pending_expense_minor,
    pendingApprovals: row.pending_approvals,
  };
}

type OfficeReferenceOptionRow = {
  id: string;
  label: string;
  detail: string;
};

type OfficeContactReferenceOptionRow = OfficeReferenceOptionRow & {
  has_billing_address: number;
};

function mapReferenceOption(row: OfficeReferenceOptionRow): OfficeReferenceOption {
  return { id: row.id, label: row.label, detail: row.detail };
}

/**
 * Composer selectors deliberately use narrow projections instead of loading full register views.
 * They remain bounded because large datasets should move to searchable combobox endpoints rather
 * than ever-expanding HTML select payloads.
 */
export async function listOfficeContactOptions(
  options: OfficeListOptions &
    Readonly<{ kind?: OfficeContactKind; status?: OfficeContactStatus }> = {},
): Promise<OfficeContactReferenceOption[]> {
  const database = await getD1();
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (options.kind) {
    conditions.push("contact.kind = ?");
    bindings.push(options.kind);
  }
  if (options.status) {
    conditions.push("contact.status = ?");
    bindings.push(options.status);
  }

  const result = await prepareBoundedList(
    database,
    `SELECT contact.id, contact.display_name AS label, contact.kind AS detail,
      CASE WHEN contact.address IS NOT NULL AND TRIM(contact.address) <> '' THEN 1 ELSE 0 END AS has_billing_address
     FROM office_contacts contact`,
    conditions,
    bindings,
    "ORDER BY contact.normalized_name ASC, contact.id ASC",
    options,
  ).all<OfficeContactReferenceOptionRow>();

  return result.results.map((row) => ({
    ...mapReferenceOption(row),
    hasBillingAddress: row.has_billing_address === 1,
  }));
}

export async function listOfficeLeadOptions(
  options: OfficeListOptions = {},
): Promise<OfficeReferenceOption[]> {
  const database = await getD1();
  const result = await prepareBoundedList(
    database,
    `SELECT lead.id, lead.title AS label, contact.display_name AS detail
     FROM office_leads lead
     INNER JOIN office_contacts contact ON contact.id = lead.contact_id`,
    ["lead.archived_at IS NULL"],
    [],
    "ORDER BY lead.title ASC, lead.id ASC",
    options,
  ).all<OfficeReferenceOptionRow>();
  return result.results.map(mapReferenceOption);
}

export async function listOfficeLandParcelOptions(
  options: OfficeListOptions = {},
): Promise<OfficeReferenceOption[]> {
  const database = await getD1();
  const result = await prepareBoundedList(
    database,
    "SELECT land.id, land.title AS label, land.reference_code AS detail FROM office_land_parcels land",
    ["land.archived_at IS NULL"],
    [],
    "ORDER BY land.title ASC, land.id ASC",
    options,
  ).all<OfficeReferenceOptionRow>();
  return result.results.map(mapReferenceOption);
}

export async function listOfficeProjectOptions(
  options: OfficeListOptions = {},
): Promise<OfficeReferenceOption[]> {
  const database = await getD1();
  const result = await prepareBoundedList(
    database,
    "SELECT project.id, project.name AS label, project.code AS detail FROM office_projects project",
    ["project.archived_at IS NULL"],
    [],
    "ORDER BY project.name ASC, project.id ASC",
    options,
  ).all<OfficeReferenceOptionRow>();
  return result.results.map(mapReferenceOption);
}

export async function listOfficeTeamMemberOptions(
  options: OfficeListOptions & Readonly<{ status?: OfficeMemberStatus }> = {},
): Promise<OfficeReferenceOption[]> {
  const database = await getD1();
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (options.status) {
    conditions.push("member.status = ?");
    bindings.push(options.status);
  }
  const result = await prepareBoundedList(
    database,
    "SELECT member.id, member.display_name AS label, member.role AS detail FROM office_members member",
    conditions,
    bindings,
    "ORDER BY member.display_name ASC, member.id ASC",
    options,
  ).all<OfficeReferenceOptionRow>();
  return result.results.map(mapReferenceOption);
}

export async function listOfficeInvoiceOptions(
  options: OfficeListOptions = {},
): Promise<OfficeReferenceOption[]> {
  const database = await getD1();
  const result = await prepareBoundedList(
    database,
    `SELECT invoice.id,
      COALESCE(invoice.number, 'Draft ' || SUBSTR(invoice.id, 1, 8)) AS label,
      contact.display_name AS detail
     FROM office_invoices invoice
     INNER JOIN office_contacts contact ON contact.id = invoice.contact_id`,
    [],
    [],
    "ORDER BY COALESCE(invoice.issue_date, invoice.created_at) DESC, invoice.id DESC",
    options,
  ).all<OfficeReferenceOptionRow>();
  return result.results.map(mapReferenceOption);
}

export async function listOfficePaymentOptions(
  options: OfficeListOptions = {},
): Promise<OfficeReferenceOption[]> {
  const database = await getD1();
  const result = await prepareBoundedList(
    database,
    `SELECT payment.id,
      COALESCE(payment.receipt_number, 'Pending ' || SUBSTR(payment.id, 1, 8)) AS label,
      contact.display_name AS detail
     FROM office_payments payment
     INNER JOIN office_contacts contact ON contact.id = payment.contact_id`,
    [],
    [],
    "ORDER BY payment.paid_at DESC, payment.id DESC",
    options,
  ).all<OfficeReferenceOptionRow>();
  return result.results.map(mapReferenceOption);
}

export async function listOfficeExpenseOptions(
  options: OfficeListOptions = {},
): Promise<OfficeReferenceOption[]> {
  const database = await getD1();
  const result = await prepareBoundedList(
    database,
    `SELECT expense.id, COALESCE(expense.number, expense.category) AS label,
      COALESCE(project.name, vendor.display_name, 'General office') AS detail
     FROM office_expenses expense
     LEFT JOIN office_projects project ON project.id = expense.project_id
     LEFT JOIN office_contacts vendor ON vendor.id = expense.vendor_contact_id`,
    [],
    [],
    "ORDER BY expense.incurred_at DESC, expense.id DESC",
    options,
  ).all<OfficeReferenceOptionRow>();
  return result.results.map(mapReferenceOption);
}

export async function listOfficeApprovalOptions(
  options: OfficeListOptions = {},
): Promise<OfficeReferenceOption[]> {
  const database = await getD1();
  const result = await prepareBoundedList(
    database,
    "SELECT approval.id, approval.kind AS label, approval.entity_type AS detail FROM office_approvals approval",
    [],
    [],
    "ORDER BY approval.requested_at DESC, approval.id DESC",
    options,
  ).all<OfficeReferenceOptionRow>();
  return result.results.map(mapReferenceOption);
}

const CONTACT_SELECT = `SELECT
  c.id, c.kind, c.display_name, c.email, c.phone, c.organization_name, c.address, c.notes,
  c.status, c.assigned_member_id, assigned.display_name AS assigned_member_name, c.version,
  c.created_by_email, c.updated_by_email, c.created_at, c.updated_at, c.archived_at
FROM office_contacts c
LEFT JOIN office_members assigned ON assigned.id = c.assigned_member_id`;

export type ListOfficeContactsOptions = OfficeListOptions &
  Readonly<{
    kind?: OfficeContactKind;
    status?: OfficeContactStatus;
    assignedMemberId?: string;
    query?: string;
  }>;

async function getOfficeContactById(
  database: D1Database,
  id: string,
): Promise<OfficeContactView | null> {
  const row = await database
    .prepare(`${CONTACT_SELECT} WHERE c.id = ? LIMIT 1`)
    .bind(id)
    .first<ContactRow>();
  return row ? mapContact(row) : null;
}

export async function listOfficeContacts(
  options: ListOfficeContactsOptions = {},
): Promise<OfficeContactView[]> {
  const database = await getD1();
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (options.kind) {
    conditions.push("c.kind = ?");
    bindings.push(options.kind);
  }
  if (options.status) {
    conditions.push("c.status = ?");
    bindings.push(options.status);
  }
  if (options.assignedMemberId) {
    conditions.push("c.assigned_member_id = ?");
    bindings.push(options.assignedMemberId);
  }
  if (options.query?.trim()) {
    conditions.push(
      "(c.normalized_name LIKE ? ESCAPE '\\' OR c.normalized_email LIKE ? ESCAPE '\\' OR c.normalized_phone LIKE ? ESCAPE '\\' OR LOWER(COALESCE(c.organization_name, '')) LIKE ? ESCAPE '\\')",
    );
    const pattern = searchPattern(options.query);
    bindings.push(pattern, pattern, pattern, pattern);
  }

  const result = await prepareBoundedList(
    database,
    CONTACT_SELECT,
    conditions,
    bindings,
    "ORDER BY c.updated_at DESC, c.id DESC",
    options,
  ).all<ContactRow>();
  return result.results.map(mapContact);
}

export async function createOfficeContact(
  input: CreateOfficeContactInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeContactView> {
  const database = await getD1();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const displayName = requireText(input.displayName, "Contact name");
  const email = optionalText(input.email);
  const phone = optionalText(input.phone);
  const event = createOfficeAuditEvent({
    actor,
    action: "contact.created",
    entityType: "contact",
    entityId: id,
    metadata: { kind: input.kind, assignedMemberId: input.assignedMemberId ?? null },
    createdAt: now,
  });

  await database.batch([
    database
      .prepare(
        "INSERT INTO office_contacts (id, kind, display_name, normalized_name, email, normalized_email, phone, normalized_phone, organization_name, address, notes, status, assigned_member_id, version, created_by_email, updated_by_email, created_at, updated_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 1, ?, ?, ?, ?, NULL)",
      )
      .bind(
        id,
        input.kind,
        displayName,
        normalizeSearchText(displayName),
        email,
        email ? normalizeEmail(email) : null,
        phone,
        normalizePhone(phone),
        optionalText(input.organizationName),
        optionalText(input.address),
        optionalText(input.notes),
        input.assignedMemberId ?? null,
        normalizeEmail(actor.email),
        normalizeEmail(actor.email),
        now,
        now,
      ),
    prepareOfficeAuditInsert(database, event),
  ]);

  const contact = await getOfficeContactById(database, id);
  if (!contact) throw new OfficeRepositoryError("not_found", "Created contact could not be read.");
  return contact;
}

const LEAD_SELECT = `SELECT
  l.id, l.contact_id, contact.display_name AS contact_name, l.title, l.source, l.service_type,
  l.stage, l.priority, l.assignee_member_id, assigned.display_name AS assignee_member_name,
  l.estimated_value_minor, l.currency, l.next_action_at, l.won_at, l.closed_at, l.lost_reason,
  l.version, l.created_by_email, l.updated_by_email, l.created_at, l.updated_at, l.archived_at
FROM office_leads l
INNER JOIN office_contacts contact ON contact.id = l.contact_id
LEFT JOIN office_members assigned ON assigned.id = l.assignee_member_id`;

export type ListOfficeLeadsOptions = OfficeListOptions &
  Readonly<{
    stage?: OfficeLeadStage;
    priority?: OfficePriority;
    assigneeMemberId?: string;
    contactId?: string;
    query?: string;
  }>;

async function getOfficeLeadById(
  database: D1Database,
  id: string,
): Promise<OfficeLeadView | null> {
  const row = await database
    .prepare(`${LEAD_SELECT} WHERE l.id = ? LIMIT 1`)
    .bind(id)
    .first<LeadRow>();
  return row ? mapLead(row) : null;
}

export async function listOfficeLeads(
  options: ListOfficeLeadsOptions = {},
): Promise<OfficeLeadView[]> {
  const database = await getD1();
  const conditions = ["l.archived_at IS NULL"];
  const bindings: unknown[] = [];
  if (options.stage) {
    conditions.push("l.stage = ?");
    bindings.push(options.stage);
  }
  if (options.priority) {
    conditions.push("l.priority = ?");
    bindings.push(options.priority);
  }
  if (options.assigneeMemberId) {
    conditions.push("l.assignee_member_id = ?");
    bindings.push(options.assigneeMemberId);
  }
  if (options.contactId) {
    conditions.push("l.contact_id = ?");
    bindings.push(options.contactId);
  }
  if (options.query?.trim()) {
    conditions.push(
      "(LOWER(l.title) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(l.source, '')) LIKE ? ESCAPE '\\' OR contact.normalized_name LIKE ? ESCAPE '\\')",
    );
    const pattern = searchPattern(options.query);
    bindings.push(pattern, pattern, pattern);
  }
  const result = await prepareBoundedList(
    database,
    LEAD_SELECT,
    conditions,
    bindings,
    "ORDER BY CASE l.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, COALESCE(l.next_action_at, '9999-12-31') ASC, l.updated_at DESC",
    options,
  ).all<LeadRow>();
  return result.results.map(mapLead);
}

export async function createOfficeLead(
  input: CreateOfficeLeadInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeLeadView> {
  const database = await getD1();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const stage = input.stage ?? "new";
  const priority = input.priority ?? "normal";
  const estimatedValueMinor =
    input.estimatedValueMinor === null || input.estimatedValueMinor === undefined
      ? null
      : minorUnitsSchema.parse(input.estimatedValueMinor);
  const currency = normalizeCurrency(input.currency);
  const event = createOfficeAuditEvent({
    actor,
    action: "lead.created",
    entityType: "lead",
    entityId: id,
    metadata: {
      contactId: input.contactId,
      stage,
      priority,
      assigneeMemberId: input.assigneeMemberId ?? null,
    },
    createdAt: now,
  });

  await database.batch([
    database
      .prepare(
        "INSERT INTO office_leads (id, contact_id, title, source, service_type, stage, priority, assignee_member_id, estimated_value_minor, currency, next_action_at, won_at, closed_at, lost_reason, version, created_by_email, updated_by_email, created_at, updated_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, 1, ?, ?, ?, ?, NULL)",
      )
      .bind(
        id,
        input.contactId,
        requireText(input.title, "Lead title"),
        optionalText(input.source),
        input.serviceType,
        stage,
        priority,
        input.assigneeMemberId ?? null,
        estimatedValueMinor,
        currency,
        input.nextActionAt ?? null,
        normalizeEmail(actor.email),
        normalizeEmail(actor.email),
        now,
        now,
      ),
    prepareOfficeAuditInsert(database, event),
  ]);

  const lead = await getOfficeLeadById(database, id);
  if (!lead) throw new OfficeRepositoryError("not_found", "Created lead could not be read.");
  return lead;
}

const LAND_PARCEL_SELECT = `SELECT
  land.id, land.reference_code, land.title, land.primary_landowner_contact_id,
  owner.display_name AS primary_landowner_name, land.stage, land.review_status, land.address,
  land.district, land.upazila, land.union_or_ward, land.mouza, land.jl_number, land.dag_numbers,
  land.khatian_numbers, land.area_square_feet, land.area_decimal, land.ownership_share_bps,
  land.mutation_status, land.land_tax_status, land.possession_status, land.verification_notes,
  land.assignee_member_id, assigned.display_name AS assignee_member_name, land.version,
  land.created_by_email, land.updated_by_email, land.created_at, land.updated_at, land.archived_at
FROM office_land_parcels land
LEFT JOIN office_contacts owner ON owner.id = land.primary_landowner_contact_id
LEFT JOIN office_members assigned ON assigned.id = land.assignee_member_id`;

export type ListOfficeLandParcelsOptions = OfficeListOptions &
  Readonly<{
    stage?: OfficeLandStage;
    reviewStatus?: OfficeLandReviewStatus;
    assigneeMemberId?: string;
    query?: string;
  }>;

async function getOfficeLandParcelById(
  database: D1Database,
  id: string,
): Promise<OfficeLandParcelView | null> {
  const row = await database
    .prepare(`${LAND_PARCEL_SELECT} WHERE land.id = ? LIMIT 1`)
    .bind(id)
    .first<LandParcelRow>();
  return row ? mapLandParcel(row) : null;
}

export async function listOfficeLandParcels(
  options: ListOfficeLandParcelsOptions = {},
): Promise<OfficeLandParcelView[]> {
  const database = await getD1();
  const conditions = ["land.archived_at IS NULL"];
  const bindings: unknown[] = [];
  if (options.stage) {
    conditions.push("land.stage = ?");
    bindings.push(options.stage);
  }
  if (options.reviewStatus) {
    conditions.push("land.review_status = ?");
    bindings.push(options.reviewStatus);
  }
  if (options.assigneeMemberId) {
    conditions.push("land.assignee_member_id = ?");
    bindings.push(options.assigneeMemberId);
  }
  if (options.query?.trim()) {
    conditions.push(
      "(LOWER(land.reference_code) LIKE ? ESCAPE '\\' OR LOWER(land.title) LIKE ? ESCAPE '\\' OR LOWER(land.address) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(land.mouza, '')) LIKE ? ESCAPE '\\')",
    );
    const pattern = searchPattern(options.query);
    bindings.push(pattern, pattern, pattern, pattern);
  }
  const result = await prepareBoundedList(
    database,
    LAND_PARCEL_SELECT,
    conditions,
    bindings,
    "ORDER BY land.updated_at DESC, land.id DESC",
    options,
  ).all<LandParcelRow>();
  return result.results.map(mapLandParcel);
}

export async function createOfficeLandParcel(
  input: CreateOfficeLandParcelInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeLandParcelView> {
  const database = await getD1();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const stage = input.stage ?? "lead";
  const reviewStatus = input.reviewStatus ?? "not_started";
  if (
    input.areaSquareFeet !== null &&
    input.areaSquareFeet !== undefined &&
    (!Number.isSafeInteger(input.areaSquareFeet) || input.areaSquareFeet < 0)
  ) {
    throw new TypeError("Land area in square feet must be a non-negative safe integer.");
  }
  if (
    input.ownershipShareBps !== null &&
    input.ownershipShareBps !== undefined &&
    (!Number.isInteger(input.ownershipShareBps) ||
      input.ownershipShareBps < 0 ||
      input.ownershipShareBps > 10_000)
  ) {
    throw new TypeError("Ownership share must be between 0 and 10,000 basis points.");
  }
  const event = createOfficeAuditEvent({
    actor,
    action: "land_parcel.created",
    entityType: "land_parcel",
    entityId: id,
    metadata: { referenceCode: input.referenceCode, stage, reviewStatus },
    createdAt: now,
  });

  await database.batch([
    database
      .prepare(
        "INSERT INTO office_land_parcels (id, reference_code, title, primary_landowner_contact_id, stage, review_status, address, district, upazila, union_or_ward, mouza, jl_number, dag_numbers, khatian_numbers, area_square_feet, area_decimal, ownership_share_bps, mutation_status, land_tax_status, possession_status, verification_notes, assignee_member_id, version, created_by_email, updated_by_email, created_at, updated_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, NULL)",
      )
      .bind(
        id,
        requireText(input.referenceCode, "Land reference code").toUpperCase(),
        requireText(input.title, "Land parcel title"),
        input.primaryLandownerContactId ?? null,
        stage,
        reviewStatus,
        requireText(input.address, "Land parcel address"),
        requireText(input.district ?? "Joypurhat", "District"),
        optionalText(input.upazila),
        optionalText(input.unionOrWard),
        optionalText(input.mouza),
        optionalText(input.jlNumber),
        serializeJson(normalizeStringList(input.dagNumbers)),
        serializeJson(normalizeStringList(input.khatianNumbers)),
        input.areaSquareFeet ?? null,
        optionalText(input.areaDecimal),
        input.ownershipShareBps ?? null,
        optionalText(input.mutationStatus),
        optionalText(input.landTaxStatus),
        optionalText(input.possessionStatus),
        optionalText(input.verificationNotes),
        input.assigneeMemberId ?? null,
        normalizeEmail(actor.email),
        normalizeEmail(actor.email),
        now,
        now,
      ),
    prepareOfficeAuditInsert(database, event),
  ]);

  const landParcel = await getOfficeLandParcelById(database, id);
  if (!landParcel) {
    throw new OfficeRepositoryError("not_found", "Created land parcel could not be read.");
  }
  return landParcel;
}

const PROJECT_SELECT = `SELECT
  project.id, project.code, project.name, project.project_type, project.status,
  project.land_parcel_id, land.title AS land_parcel_title, project.customer_contact_id,
  customer.display_name AS customer_name, project.manager_member_id,
  manager.display_name AS manager_name, project.address, project.district, project.upazila,
  project.summary, project.risk_level, project.progress_bps, project.budget_minor, project.currency,
  project.start_at, project.target_end_at, project.actual_end_at, project.version,
  project.created_by_email, project.updated_by_email, project.created_at, project.updated_at,
  project.archived_at
FROM office_projects project
LEFT JOIN office_land_parcels land ON land.id = project.land_parcel_id
LEFT JOIN office_contacts customer ON customer.id = project.customer_contact_id
LEFT JOIN office_members manager ON manager.id = project.manager_member_id`;

export type ListOfficeProjectsOptions = OfficeListOptions &
  Readonly<{
    status?: OfficeProjectStatus;
    riskLevel?: OfficeRiskLevel;
    managerMemberId?: string;
    query?: string;
  }>;

async function getOfficeProjectById(
  database: D1Database,
  id: string,
): Promise<OfficeProjectView | null> {
  const row = await database
    .prepare(`${PROJECT_SELECT} WHERE project.id = ? LIMIT 1`)
    .bind(id)
    .first<ProjectRow>();
  return row ? mapProject(row) : null;
}

export async function listOfficeProjects(
  options: ListOfficeProjectsOptions = {},
): Promise<OfficeProjectView[]> {
  const database = await getD1();
  const conditions = ["project.archived_at IS NULL"];
  const bindings: unknown[] = [];
  if (options.status) {
    conditions.push("project.status = ?");
    bindings.push(options.status);
  }
  if (options.riskLevel) {
    conditions.push("project.risk_level = ?");
    bindings.push(options.riskLevel);
  }
  if (options.managerMemberId) {
    conditions.push("project.manager_member_id = ?");
    bindings.push(options.managerMemberId);
  }
  if (options.query?.trim()) {
    conditions.push(
      "(LOWER(project.code) LIKE ? ESCAPE '\\' OR LOWER(project.name) LIKE ? ESCAPE '\\' OR LOWER(project.address) LIKE ? ESCAPE '\\')",
    );
    const pattern = searchPattern(options.query);
    bindings.push(pattern, pattern, pattern);
  }
  const result = await prepareBoundedList(
    database,
    PROJECT_SELECT,
    conditions,
    bindings,
    "ORDER BY CASE project.risk_level WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, project.updated_at DESC",
    options,
  ).all<ProjectRow>();
  return result.results.map(mapProject);
}

export async function createOfficeProject(
  input: CreateOfficeProjectInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeProjectView> {
  const database = await getD1();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const status = input.status ?? "feasibility";
  const riskLevel = input.riskLevel ?? "low";
  const progressBps = input.progressBps ?? 0;
  if (!Number.isInteger(progressBps) || progressBps < 0 || progressBps > 10_000) {
    throw new TypeError("Project progress must be between 0 and 10,000 basis points.");
  }
  const budgetMinor =
    input.budgetMinor === null || input.budgetMinor === undefined
      ? null
      : minorUnitsSchema.parse(input.budgetMinor);
  const event = createOfficeAuditEvent({
    actor,
    action: "project.created",
    entityType: "project",
    entityId: id,
    metadata: { code: input.code, status, riskLevel },
    createdAt: now,
  });

  await database.batch([
    database
      .prepare(
        "INSERT INTO office_projects (id, code, name, project_type, status, land_parcel_id, customer_contact_id, manager_member_id, address, district, upazila, summary, risk_level, progress_bps, budget_minor, currency, start_at, target_end_at, actual_end_at, version, created_by_email, updated_by_email, created_at, updated_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 1, ?, ?, ?, ?, NULL)",
      )
      .bind(
        id,
        requireText(input.code, "Project code").toUpperCase(),
        requireText(input.name, "Project name"),
        input.projectType,
        status,
        input.landParcelId ?? null,
        input.customerContactId ?? null,
        input.managerMemberId ?? null,
        requireText(input.address, "Project address"),
        requireText(input.district ?? "Joypurhat", "District"),
        optionalText(input.upazila),
        optionalText(input.summary),
        riskLevel,
        progressBps,
        budgetMinor,
        normalizeCurrency(input.currency),
        input.startAt ?? null,
        input.targetEndAt ?? null,
        normalizeEmail(actor.email),
        normalizeEmail(actor.email),
        now,
        now,
      ),
    prepareOfficeAuditInsert(database, event),
  ]);

  const project = await getOfficeProjectById(database, id);
  if (!project) throw new OfficeRepositoryError("not_found", "Created project could not be read.");
  return project;
}

const TASK_SELECT = `SELECT
  task.id, task.title, task.description, task.status, task.priority, task.assignee_member_id,
  assignee.display_name AS assignee_member_name, task.reporter_member_id,
  reporter.display_name AS reporter_member_name, task.contact_id, contact.display_name AS contact_name,
  task.lead_id, lead.title AS lead_title, task.land_parcel_id, land.title AS land_parcel_title,
  task.project_id, project.name AS project_name, task.due_at, task.completed_at, task.version,
  task.created_at, task.updated_at, task.archived_at
FROM office_tasks task
LEFT JOIN office_members assignee ON assignee.id = task.assignee_member_id
LEFT JOIN office_members reporter ON reporter.id = task.reporter_member_id
LEFT JOIN office_contacts contact ON contact.id = task.contact_id
LEFT JOIN office_leads lead ON lead.id = task.lead_id
LEFT JOIN office_land_parcels land ON land.id = task.land_parcel_id
LEFT JOIN office_projects project ON project.id = task.project_id`;

export type ListOfficeTasksOptions = OfficeListOptions &
  Readonly<{
    status?: OfficeTaskStatus;
    priority?: OfficePriority;
    assigneeMemberId?: string;
    projectId?: string;
    leadId?: string;
    landParcelId?: string;
    overdueOnly?: boolean;
    query?: string;
  }>;

async function getOfficeTaskById(
  database: D1Database,
  id: string,
): Promise<OfficeTaskView | null> {
  const row = await database
    .prepare(`${TASK_SELECT} WHERE task.id = ? LIMIT 1`)
    .bind(id)
    .first<TaskRow>();
  return row ? mapTask(row) : null;
}

export async function listOfficeTasks(
  options: ListOfficeTasksOptions = {},
): Promise<OfficeTaskView[]> {
  const database = await getD1();
  const conditions = ["task.archived_at IS NULL"];
  const bindings: unknown[] = [];
  if (options.status) {
    conditions.push("task.status = ?");
    bindings.push(options.status);
  }
  if (options.priority) {
    conditions.push("task.priority = ?");
    bindings.push(options.priority);
  }
  if (options.assigneeMemberId) {
    conditions.push("task.assignee_member_id = ?");
    bindings.push(options.assigneeMemberId);
  }
  if (options.projectId) {
    conditions.push("task.project_id = ?");
    bindings.push(options.projectId);
  }
  if (options.leadId) {
    conditions.push("task.lead_id = ?");
    bindings.push(options.leadId);
  }
  if (options.landParcelId) {
    conditions.push("task.land_parcel_id = ?");
    bindings.push(options.landParcelId);
  }
  if (options.overdueOnly) {
    conditions.push(
      "task.status IN ('open', 'in_progress', 'blocked') AND task.due_at IS NOT NULL AND task.due_at < ?",
    );
    bindings.push(new Date().toISOString());
  }
  if (options.query?.trim()) {
    conditions.push(
      "(LOWER(task.title) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(task.description, '')) LIKE ? ESCAPE '\\')",
    );
    const pattern = searchPattern(options.query);
    bindings.push(pattern, pattern);
  }
  const result = await prepareBoundedList(
    database,
    TASK_SELECT,
    conditions,
    bindings,
    "ORDER BY CASE task.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, COALESCE(task.due_at, '9999-12-31') ASC, task.updated_at DESC",
    options,
  ).all<TaskRow>();
  return result.results.map(mapTask);
}

export async function createOfficeTask(
  input: CreateOfficeTaskInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeTaskView> {
  const database = await getD1();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const status = input.status ?? "open";
  const priority = input.priority ?? "normal";
  const event = createOfficeAuditEvent({
    actor,
    action: "task.created",
    entityType: "task",
    entityId: id,
    metadata: {
      status,
      priority,
      assigneeMemberId: input.assigneeMemberId ?? null,
      projectId: input.projectId ?? null,
    },
    createdAt: now,
  });

  await database.batch([
    database
      .prepare(
        "INSERT INTO office_tasks (id, title, description, status, priority, assignee_member_id, reporter_member_id, contact_id, lead_id, land_parcel_id, project_id, due_at, completed_at, version, created_at, updated_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 1, ?, ?, NULL)",
      )
      .bind(
        id,
        requireText(input.title, "Task title"),
        optionalText(input.description),
        status,
        priority,
        input.assigneeMemberId ?? null,
        input.reporterMemberId ?? actor.memberId,
        input.contactId ?? null,
        input.leadId ?? null,
        input.landParcelId ?? null,
        input.projectId ?? null,
        input.dueAt ?? null,
        now,
        now,
      ),
    prepareOfficeAuditInsert(database, event),
  ]);

  const task = await getOfficeTaskById(database, id);
  if (!task) throw new OfficeRepositoryError("not_found", "Created task could not be read.");
  return task;
}

const INVOICE_SUMMARY_SELECT = `SELECT
  invoice.id, invoice.number, invoice.branch_code, invoice.fiscal_year, invoice.sequence_value,
  invoice.contact_id, contact.display_name AS contact_name, invoice.project_id,
  project.name AS project_name, invoice.kind, invoice.purpose, invoice.locale,
  invoice.status, invoice.issue_date, invoice.due_date,
  invoice.currency, invoice.subtotal_minor, invoice.discount_minor, invoice.tax_minor,
  invoice.total_minor, invoice.paid_minor, invoice.balance_minor, invoice.tracking_code,
  invoice.tracking_issued_at, invoice.public_access_revoked_at, invoice.template_version, invoice.version,
  invoice.created_by_email, invoice.updated_by_email, invoice.created_at, invoice.updated_at
FROM office_invoices invoice
INNER JOIN office_contacts contact ON contact.id = invoice.contact_id
LEFT JOIN office_projects project ON project.id = invoice.project_id`;

const INVOICE_DETAIL_SELECT = `SELECT
  invoice.id, invoice.number, invoice.branch_code, invoice.fiscal_year, invoice.sequence_value,
  invoice.contact_id, contact.display_name AS contact_name, invoice.project_id,
  project.name AS project_name, invoice.kind, invoice.purpose, invoice.locale,
  invoice.status, invoice.issue_date, invoice.due_date,
  invoice.currency, invoice.subtotal_minor, invoice.discount_minor, invoice.tax_minor,
  invoice.total_minor, invoice.paid_minor, invoice.balance_minor, invoice.tracking_code,
  invoice.tracking_issued_at, invoice.public_access_revoked_at, invoice.template_version,
  invoice.customer_snapshot,
  invoice.company_snapshot, invoice.tax_snapshot, invoice.terms_snapshot, invoice.notes,
  invoice.approved_by_member_id, invoice.approved_at, invoice.posted_by_member_id,
  invoice.posted_at, invoice.version, invoice.created_by_email, invoice.updated_by_email,
  invoice.created_at, invoice.updated_at
FROM office_invoices invoice
INNER JOIN office_contacts contact ON contact.id = invoice.contact_id
LEFT JOIN office_projects project ON project.id = invoice.project_id`;

export type ListOfficeInvoicesOptions = OfficeListOptions &
  Readonly<{
    status?: OfficeInvoiceStatus;
    contactId?: string;
    projectId?: string;
    outstandingOnly?: boolean;
    query?: string;
  }>;

export async function listOfficeInvoices(
  options: ListOfficeInvoicesOptions = {},
): Promise<OfficeInvoiceSummary[]> {
  const database = await getD1();
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (options.status) {
    conditions.push("invoice.status = ?");
    bindings.push(options.status);
  }
  if (options.contactId) {
    conditions.push("invoice.contact_id = ?");
    bindings.push(options.contactId);
  }
  if (options.projectId) {
    conditions.push("invoice.project_id = ?");
    bindings.push(options.projectId);
  }
  if (options.outstandingOnly) {
    conditions.push(
      "invoice.status IN ('issued', 'partially_paid', 'overdue') AND invoice.balance_minor > 0",
    );
  }
  if (options.query?.trim()) {
    conditions.push(
      "(LOWER(COALESCE(invoice.number, '')) LIKE ? ESCAPE '\\' OR contact.normalized_name LIKE ? ESCAPE '\\')",
    );
    const pattern = searchPattern(options.query);
    bindings.push(pattern, pattern);
  }
  const result = await prepareBoundedList(
    database,
    INVOICE_SUMMARY_SELECT,
    conditions,
    bindings,
    "ORDER BY COALESCE(invoice.issue_date, invoice.created_at) DESC, invoice.id DESC",
    options,
  ).all<InvoiceSummaryRow>();
  return result.results.map(mapInvoiceSummary);
}

async function getOfficeInvoiceWithDatabase(
  database: D1Database,
  id: string,
): Promise<OfficeInvoiceDetail | null> {
  const row = await database
    .prepare(`${INVOICE_DETAIL_SELECT} WHERE invoice.id = ? LIMIT 1`)
    .bind(id)
    .first<InvoiceRow>();
  if (!row) return null;

  const [itemsResult, paymentResult] = await Promise.all([
    database
      .prepare(
        "SELECT id, invoice_id, position, description, quantity_millis, unit_price_minor, discount_minor, tax_rate_bps, subtotal_minor, tax_minor, total_minor, metadata, created_at FROM office_invoice_items WHERE invoice_id = ? ORDER BY position ASC",
      )
      .bind(id)
      .all<InvoiceItemRow>(),
    database
      .prepare(
        "SELECT allocation.id AS allocation_id, payment.id AS payment_id, payment.receipt_number, allocation.amount_minor, payment.method, payment.paid_at, payment.status FROM office_payment_allocations allocation INNER JOIN office_payments payment ON payment.id = allocation.payment_id WHERE allocation.invoice_id = ? ORDER BY payment.paid_at DESC, payment.id DESC",
      )
      .bind(id)
      .all<InvoicePaymentRow>(),
  ]);

  return {
    ...mapInvoiceSummary(row),
    customerSnapshot: officeInvoicePartySnapshotSchema.parse(JSON.parse(row.customer_snapshot)),
    companySnapshot: officeInvoicePartySnapshotSchema.parse(JSON.parse(row.company_snapshot)),
    taxSnapshot: row.tax_snapshot ? parseJsonRecord(row.tax_snapshot) : null,
    termsSnapshot: row.terms_snapshot,
    notes: row.notes,
    approvedByMemberId: row.approved_by_member_id,
    approvedAt: row.approved_at,
    postedByMemberId: row.posted_by_member_id,
    postedAt: row.posted_at,
    items: itemsResult.results.map(mapInvoiceItem),
    payments: paymentResult.results.map(mapInvoicePayment),
  };
}

export async function getOfficeInvoice(id: string): Promise<OfficeInvoiceDetail | null> {
  return getOfficeInvoiceWithDatabase(await getD1(), id);
}

export async function createOfficeInvoice(
  input: CreateOfficeInvoiceInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeInvoiceDetail> {
  const database = await getD1();
  const { taxSnapshot = null, ...draftCandidate } = input;
  const draft = officeInvoiceDraftInputSchema.parse(draftCandidate);
  const totals = calculateInvoiceTotals(draft);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const actorEmail = normalizeEmail(actor.email);
  const lineRows = totals.lines.map((line) => ({
    id: crypto.randomUUID(),
    invoiceId: id,
    position: line.position,
    description: line.description,
    quantityMillis: line.quantityMillis,
    unitPriceMinor: line.unitPriceMinor,
    discountMinor: line.discountMinor,
    taxRateBps: line.taxRateBps,
    subtotalMinor: line.subtotalMinor,
    taxMinor: line.taxMinor,
    totalMinor: line.totalMinor,
    metadata: {},
    createdAt: now,
  }));
  const event = createOfficeAuditEvent({
    actor,
    action: "invoice.created",
    entityType: "invoice",
    entityId: id,
    metadata: {
      contactId: draft.contactId,
      projectId: draft.projectId,
      kind: draft.kind,
      purpose: draft.purpose,
      locale: draft.locale,
      currency: draft.currency,
      totalMinor: totals.totalMinor,
      itemCount: totals.lines.length,
      status: "draft",
    },
    createdAt: now,
  });

  await database.batch([
    database
      .prepare(
        `INSERT INTO office_invoices
          (id, number, branch_code, fiscal_year, sequence_value, contact_id, project_id,
           kind, purpose, locale, status, issue_date, due_date, currency, subtotal_minor,
           discount_minor, tax_minor, total_minor, paid_minor, balance_minor, customer_snapshot,
           company_snapshot, tax_snapshot, terms_snapshot, notes, tracking_code,
           tracking_issued_at, public_access_revoked_at, template_version,
           approved_by_member_id, approved_at, posted_by_member_id, posted_at, version,
           created_by_email, updated_by_email, created_at, updated_at)
         VALUES (?, NULL, ?, NULL, NULL, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, 0, ?,
                 ?, ?, ?, ?, ?, NULL, NULL, NULL, 'ap-invoice-v1', NULL, NULL, NULL, NULL, 1,
                 ?, ?, ?, ?)`,
      )
      .bind(
        id,
        DEFAULT_BRANCH_CODE,
        draft.contactId,
        draft.projectId,
        draft.kind,
        draft.purpose,
        draft.locale,
        draft.issueDate,
        draft.dueDate,
        draft.currency,
        totals.subtotalMinor,
        totals.discountMinor,
        totals.taxMinor,
        totals.totalMinor,
        totals.totalMinor,
        serializeJson(draft.customer),
        serializeJson(draft.company),
        taxSnapshot ? serializeJson(taxSnapshot) : null,
        draft.terms,
        draft.notes,
        actorEmail,
        actorEmail,
        now,
        now,
      ),
    database
      .prepare(
        `INSERT INTO office_invoice_items
          (id, invoice_id, position, description, quantity_millis, unit_price_minor, discount_minor, tax_rate_bps, subtotal_minor, tax_minor, total_minor, metadata, created_at)
        SELECT
          json_extract(value, '$.id'), json_extract(value, '$.invoiceId'),
          json_extract(value, '$.position'), json_extract(value, '$.description'),
          json_extract(value, '$.quantityMillis'), json_extract(value, '$.unitPriceMinor'),
          json_extract(value, '$.discountMinor'), json_extract(value, '$.taxRateBps'),
          json_extract(value, '$.subtotalMinor'), json_extract(value, '$.taxMinor'),
          json_extract(value, '$.totalMinor'), json_extract(value, '$.metadata'),
          json_extract(value, '$.createdAt')
        FROM json_each(?)`,
      )
      .bind(serializeJson(lineRows)),
    prepareOfficeAuditInsert(database, event),
  ]);

  const invoice = await getOfficeInvoiceWithDatabase(database, id);
  if (!invoice) throw new OfficeRepositoryError("not_found", "Created invoice could not be read.");
  return invoice;
}

const DOCUMENT_PREFIX: Readonly<Record<OfficeDocumentType, string>> = {
  invoice: "INV",
  receipt: "RCT",
  expense: "EXP",
  notice: "NTC",
};

const OFFICE_SEQUENCE_UPSERT_SQL = `INSERT INTO office_sequences
  (id, branch_code, fiscal_year, document_type, current_value, version, updated_at)
VALUES (?, ?, ?, ?, 1, 1, ?)
ON CONFLICT(branch_code, fiscal_year, document_type)
DO UPDATE SET current_value = current_value + 1, version = version + 1, updated_at = excluded.updated_at`;

/**
 * Direct-posts a draft invoice for the first office release. Authorization for this deliberately
 * narrow draft-to-issued transition belongs in the Server Action (`finance.post`). Sequence
 * increment, optimistic invoice update, and guarded audit insertion share one transactional D1
 * batch. The NOT NULL audit guard rolls the sequence increment back when the optimistic update
 * loses a race, so an update conflict does not leak or reuse an invoice number.
 */
export async function issueOfficeInvoice(
  input: IssueOfficeInvoiceInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeInvoiceDetail> {
  const database = await getD1();
  const current = await getOfficeInvoiceWithDatabase(database, input.invoiceId);
  if (!current) throw new OfficeRepositoryError("not_found", "Invoice was not found.");
  if (current.status !== "draft") {
    throw new OfficeRepositoryError("invalid_state", "Only a draft invoice can be issued.");
  }
  if (current.version !== input.expectedVersion) {
    throw new OfficeRepositoryError("optimistic_conflict", "Invoice changed before issuing.");
  }
  if (
    current.number !== null ||
    current.sequenceValue !== null ||
    current.postedAt !== null ||
    current.trackingCode !== null
  ) {
    throw new OfficeRepositoryError(
      "invalid_state",
      "A draft invoice with an existing posting identity cannot be issued again.",
    );
  }

  const branchCode = normalizeBranchCode(input.branchCode);
  const fiscalYear = normalizeFiscalYear(input.fiscalYear);
  const now = new Date().toISOString();
  const trackingCode = createTrackingCode("inv");
  const nextVersion = current.version + 1;
  const actorEmail = normalizeEmail(actor.email);
  const audit = createOfficeAuditEvent({
    actor,
    action: "invoice.issued",
    entityType: "invoice",
    entityId: current.id,
    metadata: {},
    createdAt: now,
  });

  let results: D1Result[];
  try {
    results = await database.batch([
      database
        .prepare(OFFICE_SEQUENCE_UPSERT_SQL)
        .bind(crypto.randomUUID(), branchCode, fiscalYear, "invoice", now),
      database
        .prepare(
          `UPDATE office_invoices
           SET number = ? || '-INV-' || ? || '-' || printf('%06d',
                 (SELECT current_value FROM office_sequences
                  WHERE branch_code = ? AND fiscal_year = ? AND document_type = 'invoice')),
               branch_code = ?, fiscal_year = ?,
               sequence_value = (SELECT current_value FROM office_sequences
                 WHERE branch_code = ? AND fiscal_year = ? AND document_type = 'invoice'),
               status = 'issued', tracking_code = ?, tracking_issued_at = ?,
               posted_by_member_id = ?, posted_at = ?, version = ?,
               updated_by_email = ?, updated_at = ?
           WHERE id = ? AND status = 'draft' AND version = ?
             AND number IS NULL AND sequence_value IS NULL AND posted_at IS NULL
             AND tracking_code IS NULL`,
        )
        .bind(
          branchCode,
          fiscalYear,
          branchCode,
          fiscalYear,
          branchCode,
          fiscalYear,
          branchCode,
          fiscalYear,
          trackingCode,
          now,
          actor.memberId,
          now,
          nextVersion,
          actorEmail,
          now,
          current.id,
          current.version,
        ),
      database
        .prepare(
          `INSERT INTO office_audit_events
            (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata, request_id, ip_hash, created_at)
           VALUES (
             ?, ?, ?, 'invoice.issued', 'invoice', ?,
             (SELECT json_object(
                'number', number,
                'branchCode', branch_code,
                'fiscalYear', fiscal_year,
                'sequenceValue', sequence_value,
                'fromStatus', 'draft',
                'toStatus', 'issued',
                'version', version
              )
              FROM office_invoices
              WHERE id = ? AND status = 'issued' AND version = ? AND updated_at = ?
                AND number IS NOT NULL AND sequence_value IS NOT NULL),
             ?, ?, ?
           )`,
        )
        .bind(
          audit.id,
          audit.actorMemberId,
          audit.actorEmail,
          current.id,
          current.id,
          nextVersion,
          now,
          audit.requestId,
          audit.ipHash,
          audit.createdAt,
        ),
    ]);
  } catch (error) {
    if (
      error instanceof Error &&
      /NOT NULL constraint failed:\s*office_audit_events\.metadata/i.test(error.message)
    ) {
      throw new OfficeRepositoryError(
        "optimistic_conflict",
        "Invoice changed before its number could be assigned.",
      );
    }
    throw error;
  }
  requireChanged(results[1], "Invoice changed before issuing completed.");

  const invoice = await getOfficeInvoiceWithDatabase(database, current.id);
  if (!invoice) throw new OfficeRepositoryError("not_found", "Issued invoice could not be read.");
  return invoice;
}

export function formatOfficeDocumentNumber(
  input: Readonly<{
    branchCode: string;
    fiscalYear: string;
    documentType: OfficeDocumentType;
    value: number;
  }>,
): string {
  if (!Number.isSafeInteger(input.value) || input.value < 1) {
    throw new TypeError("Document sequence value must be a positive safe integer.");
  }
  return `${normalizeBranchCode(input.branchCode)}-${DOCUMENT_PREFIX[input.documentType]}-${normalizeFiscalYear(input.fiscalYear)}-${String(input.value).padStart(DOCUMENT_NUMBER_WIDTH, "0")}`;
}

export async function allocateOfficeDocumentSequence(
  input: AllocateOfficeDocumentSequenceInput,
): Promise<OfficeDocumentSequence> {
  const database = await getD1();
  const branchCode = normalizeBranchCode(input.branchCode);
  const fiscalYear = normalizeFiscalYear(input.fiscalYear);
  const now = new Date().toISOString();
  const row = await database
    .prepare(`${OFFICE_SEQUENCE_UPSERT_SQL} RETURNING current_value, version`)
    .bind(crypto.randomUUID(), branchCode, fiscalYear, input.documentType, now)
    .first<SequenceRow>();
  if (!row) {
    throw new OfficeRepositoryError(
      "invalid_state",
      "Document sequence allocation did not return a value.",
    );
  }
  return {
    branchCode,
    fiscalYear,
    documentType: input.documentType,
    value: row.current_value,
    number: formatOfficeDocumentNumber({
      branchCode,
      fiscalYear,
      documentType: input.documentType,
      value: row.current_value,
    }),
    version: row.version,
  };
}

const PAYMENT_SELECT = `SELECT
  payment.id, payment.receipt_number, payment.branch_code, payment.fiscal_year,
  payment.sequence_value, payment.contact_id, contact.display_name AS contact_name,
  payment.project_id, project.name AS project_name, payment.client_operation_id,
  allocation.invoice_id, invoice.number AS invoice_number,
  allocation.amount_minor AS allocated_minor, payment.status, payment.method, payment.amount_minor,
  payment.currency, payment.paid_at, payment.reference, payment.note, payment.locale,
  payment.tracking_code, payment.tracking_issued_at, payment.public_access_revoked_at,
  payment.template_version, payment.received_by_member_id,
  receiver.display_name AS received_by_member_name, payment.posted_by_member_id, payment.posted_at,
  payment.version, payment.created_by_email, payment.created_at, payment.updated_at
FROM office_payments payment
INNER JOIN office_contacts contact ON contact.id = payment.contact_id
LEFT JOIN office_projects project ON project.id = payment.project_id
LEFT JOIN office_payment_allocations allocation ON allocation.payment_id = payment.id
LEFT JOIN office_invoices invoice ON invoice.id = allocation.invoice_id
LEFT JOIN office_members receiver ON receiver.id = payment.received_by_member_id`;

export type ListOfficePaymentsOptions = OfficeListOptions &
  Readonly<{
    status?: OfficePaymentStatus;
    contactId?: string;
    projectId?: string;
    invoiceId?: string;
    query?: string;
  }>;

async function getOfficePaymentById(
  database: D1Database,
  id: string,
): Promise<OfficePaymentView | null> {
  const row = await database
    .prepare(`${PAYMENT_SELECT} WHERE payment.id = ? LIMIT 1`)
    .bind(id)
    .first<PaymentRow>();
  return row ? mapPayment(row) : null;
}

export async function getOfficePayment(id: string): Promise<OfficePaymentView | null> {
  return getOfficePaymentById(await getD1(), id);
}

export async function listOfficePayments(
  options: ListOfficePaymentsOptions = {},
): Promise<OfficePaymentView[]> {
  const database = await getD1();
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (options.status) {
    conditions.push("payment.status = ?");
    bindings.push(options.status);
  }
  if (options.contactId) {
    conditions.push("payment.contact_id = ?");
    bindings.push(options.contactId);
  }
  if (options.projectId) {
    conditions.push("payment.project_id = ?");
    bindings.push(options.projectId);
  }
  if (options.invoiceId) {
    conditions.push("allocation.invoice_id = ?");
    bindings.push(options.invoiceId);
  }
  if (options.query?.trim()) {
    conditions.push(
      "(LOWER(COALESCE(payment.receipt_number, '')) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(payment.reference, '')) LIKE ? ESCAPE '\\' OR contact.normalized_name LIKE ? ESCAPE '\\')",
    );
    const pattern = searchPattern(options.query);
    bindings.push(pattern, pattern, pattern);
  }
  const result = await prepareBoundedList(
    database,
    PAYMENT_SELECT,
    conditions,
    bindings,
    "ORDER BY payment.paid_at DESC, payment.id DESC",
    options,
  ).all<PaymentRow>();
  return result.results.map(mapPayment);
}

export async function recordOfficePayment(
  input: RecordOfficePaymentInput,
  actor: OfficeRepositoryActor,
): Promise<OfficePaymentView> {
  const database = await getD1();
  const amountMinor = positiveMinorUnitsSchema.parse(input.amountMinor);
  const clientOperationId = input.clientOperationId?.trim() || crypto.randomUUID();
  if (!/^[A-Za-z0-9:_-]{8,160}$/.test(clientOperationId)) {
    throw new TypeError("Payment operation ID must be 8–160 URL-safe characters.");
  }

  const existingPayment = await database
    .prepare(`${PAYMENT_SELECT} WHERE payment.client_operation_id = ? LIMIT 1`)
    .bind(clientOperationId)
    .first<PaymentRow>();
  if (existingPayment) return mapPayment(existingPayment);

  const invoice = await database
    .prepare(
      `SELECT invoice.id, invoice.number, invoice.contact_id, contact.email AS contact_email,
              contact.phone AS contact_phone, invoice.project_id, invoice.status, invoice.currency,
              invoice.balance_minor, invoice.locale, preference.preferred_locale,
              preference.transactional_email_enabled, preference.transactional_sms_enabled
       FROM office_invoices invoice
       INNER JOIN office_contacts contact ON contact.id = invoice.contact_id
       LEFT JOIN office_contact_preferences preference ON preference.contact_id = contact.id
       WHERE invoice.id = ? LIMIT 1`,
    )
    .bind(input.invoiceId)
    .first<InvoiceAllocationGuardRow>();
  if (!invoice) throw new OfficeRepositoryError("not_found", "Invoice was not found.");
  if (
    invoice.status !== "issued" &&
    invoice.status !== "partially_paid" &&
    invoice.status !== "overdue"
  ) {
    throw new OfficeRepositoryError(
      "invalid_state",
      `Payments cannot be allocated to a ${invoice.status} invoice.`,
    );
  }
  const allocationError = validatePaymentAllocation({
    amountMinor,
    invoiceOutstandingMinor: invoice.balance_minor,
    paymentAvailableMinor: amountMinor,
    invoiceCurrency: invoice.currency,
    paymentCurrency: invoice.currency,
  });
  if (allocationError) {
    throw new OfficeRepositoryError("allocation_invalid", allocationError.message);
  }

  const branchCode = normalizeBranchCode(input.branchCode);
  const fiscalYear = normalizeFiscalYear(input.fiscalYear);
  const id = crypto.randomUUID();
  const allocationId = crypto.randomUUID();
  const now = new Date().toISOString();
  const actorEmail = normalizeEmail(actor.email);
  const balanceAfter = invoice.balance_minor - amountMinor;
  const trackingCode = createTrackingCode("rct");
  const locale = input.locale ?? invoice.preferred_locale ?? invoice.locale;
  const publicTrackingUrl = trackingUrl(trackingCode);
  const paymentEvent = createOfficeAuditEvent({
    actor,
    action: "payment.recorded",
    entityType: "payment",
    entityId: id,
    metadata: {
      invoiceId: invoice.id,
      amountMinor,
      currency: invoice.currency,
      method: input.method,
    },
    createdAt: now,
  });
  const invoiceEvent = createOfficeAuditEvent({
    actor,
    action: "invoice.payment_allocated",
    entityType: "invoice",
    entityId: invoice.id,
    metadata: {
      paymentId: id,
      allocationId,
      amountMinor,
      balanceBeforeMinor: invoice.balance_minor,
      balanceAfterMinor: balanceAfter,
    },
    createdAt: now,
  });

  const notificationStatements: D1PreparedStatement[] = [];
  const emailRecipient = invoice.contact_email?.trim().toLowerCase() || null;
  const phoneRecipient = invoice.contact_phone
    ? normalizeBangladeshPhone(invoice.contact_phone)
    : null;
  const notificationTargets = [
    invoice.transactional_email_enabled !== 0 && emailRecipient
      ? { channel: "email" as const, recipient: emailRecipient }
      : null,
    invoice.transactional_sms_enabled !== 0 && phoneRecipient
      ? { channel: "sms" as const, recipient: phoneRecipient }
      : null,
  ].filter((target): target is { channel: "email" | "sms"; recipient: string } => target !== null);

  for (const target of notificationTargets) {
    notificationStatements.push(
      database
        .prepare(
          `INSERT INTO office_notification_outbox
            (id, event_type, entity_type, entity_id, channel, recipient, template, locale,
             payload, status, idempotency_key, attempt_count, max_attempts, available_at,
             claimed_at, claim_token, provider_reference, error_code, error_summary, sent_at,
             created_at, updated_at)
           VALUES (
             ?, 'payment.receipt.created', 'payment', ?, ?, ?, 'payment-receipt-v1', ?,
             (SELECT json_object(
                'receiptNumber', receipt_number,
                'invoiceNumber', ?,
                'amountMinor', ?,
                'balanceMinor', ?,
                'trackingUrl', ?
              ) FROM office_payments WHERE id = ?),
             'pending', ?, 0, 5, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?
           )`,
        )
        .bind(
          crypto.randomUUID(),
          id,
          target.channel,
          target.recipient,
          locale,
          invoice.number,
          amountMinor,
          balanceAfter,
          publicTrackingUrl,
          id,
          `payment:${id}:receipt:${target.channel}:v1`,
          now,
          now,
          now,
        ),
    );
  }

  let results: D1Result[];
  try {
    results = await database.batch([
      database
      .prepare(OFFICE_SEQUENCE_UPSERT_SQL)
      .bind(crypto.randomUUID(), branchCode, fiscalYear, "receipt", now),
      database
      .prepare(
        `INSERT INTO office_payments
          (id, receipt_number, branch_code, fiscal_year, sequence_value, contact_id, project_id,
           client_operation_id, status, method, amount_minor, currency, paid_at, reference, note,
           locale, tracking_code, tracking_issued_at, public_access_revoked_at, template_version,
           received_by_member_id, posted_by_member_id, posted_at, version, created_by_email,
           created_at, updated_at)
         SELECT
           ?, ? || '-RCT-' || ? || '-' || printf('%06d',
                (SELECT current_value FROM office_sequences
                 WHERE branch_code = ? AND fiscal_year = ? AND document_type = 'receipt')),
           ?, ?,
           (SELECT current_value FROM office_sequences
            WHERE branch_code = ? AND fiscal_year = ? AND document_type = 'receipt'),
           guarded.contact_id, guarded.project_id, ?, 'posted', ?, ?, guarded.currency, ?, ?, ?,
           ?, ?, ?, NULL, 'ap-receipt-v1', ?, ?, ?, 1, ?, ?, ?
         FROM office_invoices guarded
         WHERE guarded.id = ?
           AND guarded.status IN ('issued', 'partially_paid', 'overdue')
           AND guarded.balance_minor >= ?`,
      )
      .bind(
        id,
        branchCode,
        fiscalYear,
        branchCode,
        fiscalYear,
        branchCode,
        fiscalYear,
        branchCode,
        fiscalYear,
        clientOperationId,
        input.method,
        amountMinor,
        input.paidAt,
        optionalText(input.reference),
        optionalText(input.note),
        locale,
        trackingCode,
        now,
        input.receivedByMemberId ?? actor.memberId,
        actor.memberId,
        now,
        actorEmail,
        now,
        now,
        invoice.id,
        amountMinor,
      ),
      database
      .prepare(
        `INSERT INTO office_payment_allocations
          (id, payment_id, invoice_id, amount_minor, created_by_email, created_at)
        VALUES (
          ?, ?,
          (SELECT id FROM office_invoices
           WHERE id = ? AND contact_id = ? AND currency = ?
             AND status IN ('issued', 'partially_paid', 'overdue') AND balance_minor >= ?
           LIMIT 1),
          ?, ?, ?
        )`,
      )
      .bind(
        allocationId,
        id,
        invoice.id,
        invoice.contact_id,
        invoice.currency,
        amountMinor,
        amountMinor,
        actorEmail,
        now,
      ),
      database
      .prepare(
        `UPDATE office_invoices
         SET paid_minor = paid_minor + ?, balance_minor = balance_minor - ?,
             status = CASE WHEN balance_minor - ? = 0 THEN 'paid' ELSE 'partially_paid' END,
             version = version + 1, updated_by_email = ?, updated_at = ?
         WHERE id = ?
           AND EXISTS (SELECT 1 FROM office_payment_allocations WHERE id = ? AND invoice_id = ?)`,
      )
      .bind(
        amountMinor,
        amountMinor,
        amountMinor,
        actorEmail,
        now,
        invoice.id,
        allocationId,
        invoice.id,
      ),
      ...notificationStatements,
      database
      .prepare(
        `INSERT INTO office_audit_events
          (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata,
           request_id, ip_hash, created_at)
         VALUES (
           ?, ?, ?, ?, 'payment', ?,
           (SELECT json_object(
              'receiptNumber', receipt_number,
              'invoiceId', ?,
              'amountMinor', ?,
              'currency', currency,
              'method', method,
              'notificationCount', ?
            ) FROM office_payments WHERE id = ?),
           ?, ?, ?
         )`,
      )
      .bind(
        paymentEvent.id,
        paymentEvent.actorMemberId,
        paymentEvent.actorEmail,
        paymentEvent.action,
        id,
        invoice.id,
        amountMinor,
        notificationStatements.length,
        id,
        paymentEvent.requestId,
        paymentEvent.ipHash,
        paymentEvent.createdAt,
      ),
      prepareOfficeAuditInsert(database, invoiceEvent),
    ]);
  } catch (error) {
    if (
      error instanceof Error &&
      /office_payments_client_operation_unique|office_payments\.client_operation_id|UNIQUE constraint failed:\s*office_payments\.client_operation_id/i.test(
        error.message,
      )
    ) {
      const existing = await database
        .prepare(`${PAYMENT_SELECT} WHERE payment.client_operation_id = ? LIMIT 1`)
        .bind(clientOperationId)
        .first<PaymentRow>();
      if (existing) return mapPayment(existing);
    }
    throw error;
  }
  requireChanged(results[1], "Invoice balance changed before payment record creation.");
  requireChanged(results[3], "Invoice balance changed before payment allocation completed.");

  const payment = await getOfficePaymentById(database, id);
  if (!payment) throw new OfficeRepositoryError("not_found", "Recorded payment could not be read.");
  return payment;
}

const EXPENSE_SELECT = `SELECT
  expense.id, expense.number, expense.status, expense.category, expense.description,
  expense.project_id, project.name AS project_name, expense.vendor_contact_id,
  vendor.display_name AS vendor_name, expense.amount_minor, expense.currency, expense.incurred_at,
  expense.receipt_document_id, expense.submitted_by_member_id,
  submitter.display_name AS submitted_by_member_name, expense.submitted_at,
  expense.approved_by_member_id, approver.display_name AS approved_by_member_name,
  expense.approved_at, expense.paid_at, expense.rejection_reason, expense.version,
  expense.created_by_email, expense.updated_by_email, expense.created_at, expense.updated_at
FROM office_expenses expense
LEFT JOIN office_projects project ON project.id = expense.project_id
LEFT JOIN office_contacts vendor ON vendor.id = expense.vendor_contact_id
LEFT JOIN office_members submitter ON submitter.id = expense.submitted_by_member_id
LEFT JOIN office_members approver ON approver.id = expense.approved_by_member_id`;

export type ListOfficeExpensesOptions = OfficeListOptions &
  Readonly<{
    status?: OfficeExpenseStatus;
    projectId?: string;
    submittedByMemberId?: string;
    query?: string;
  }>;

async function getOfficeExpenseById(
  database: D1Database,
  id: string,
): Promise<OfficeExpenseView | null> {
  const row = await database
    .prepare(`${EXPENSE_SELECT} WHERE expense.id = ? LIMIT 1`)
    .bind(id)
    .first<ExpenseRow>();
  return row ? mapExpense(row) : null;
}

export async function listOfficeExpenses(
  options: ListOfficeExpensesOptions = {},
): Promise<OfficeExpenseView[]> {
  const database = await getD1();
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (options.status) {
    conditions.push("expense.status = ?");
    bindings.push(options.status);
  }
  if (options.projectId) {
    conditions.push("expense.project_id = ?");
    bindings.push(options.projectId);
  }
  if (options.submittedByMemberId) {
    conditions.push("expense.submitted_by_member_id = ?");
    bindings.push(options.submittedByMemberId);
  }
  if (options.query?.trim()) {
    conditions.push(
      "(LOWER(expense.category) LIKE ? ESCAPE '\\' OR LOWER(expense.description) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(expense.number, '')) LIKE ? ESCAPE '\\')",
    );
    const pattern = searchPattern(options.query);
    bindings.push(pattern, pattern, pattern);
  }
  const result = await prepareBoundedList(
    database,
    EXPENSE_SELECT,
    conditions,
    bindings,
    "ORDER BY expense.incurred_at DESC, expense.id DESC",
    options,
  ).all<ExpenseRow>();
  return result.results.map(mapExpense);
}

export async function createOfficeExpense(
  input: CreateOfficeExpenseInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeExpenseView> {
  const database = await getD1();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const amountMinor = positiveMinorUnitsSchema.parse(input.amountMinor);
  const currency = normalizeCurrency(input.currency);
  const event = createOfficeAuditEvent({
    actor,
    action: "expense.created",
    entityType: "expense",
    entityId: id,
    metadata: {
      category: input.category,
      projectId: input.projectId ?? null,
      amountMinor,
      currency,
      status: "draft",
    },
    createdAt: now,
  });

  await database.batch([
    database
      .prepare(
        "INSERT INTO office_expenses (id, number, status, category, description, project_id, vendor_contact_id, amount_minor, currency, incurred_at, receipt_document_id, submitted_by_member_id, submitted_at, approved_by_member_id, approved_at, paid_at, rejection_reason, version, created_by_email, updated_by_email, created_at, updated_at) VALUES (?, NULL, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, 1, ?, ?, ?, ?)",
      )
      .bind(
        id,
        requireText(input.category, "Expense category"),
        requireText(input.description, "Expense description"),
        input.projectId ?? null,
        input.vendorContactId ?? null,
        amountMinor,
        currency,
        input.incurredAt,
        input.receiptDocumentId ?? null,
        normalizeEmail(actor.email),
        normalizeEmail(actor.email),
        now,
        now,
      ),
    prepareOfficeAuditInsert(database, event),
  ]);

  const expense = await getOfficeExpenseById(database, id);
  if (!expense) throw new OfficeRepositoryError("not_found", "Created expense could not be read.");
  return expense;
}

export async function submitOfficeExpense(
  input: SubmitOfficeExpenseInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeExpenseView> {
  const database = await getD1();
  const memberId = requireActorMemberId(actor);
  const current = await getOfficeExpenseById(database, input.expenseId);
  if (!current) throw new OfficeRepositoryError("not_found", "Expense was not found.");
  if (current.status !== "draft") {
    throw new OfficeRepositoryError("invalid_state", "Only a draft expense can be submitted.");
  }
  if (current.version !== input.expectedVersion) {
    throw new OfficeRepositoryError("optimistic_conflict", "Expense changed before submission.");
  }

  const now = new Date().toISOString();
  const nextVersion = current.version + 1;
  const approvalId = crypto.randomUUID();
  const event = createOfficeAuditEvent({
    actor,
    action: "expense.submitted",
    entityType: "expense",
    entityId: current.id,
    metadata: { approvalId, fromStatus: current.status, toStatus: "submitted", nextVersion },
    createdAt: now,
  });
  const results = await database.batch([
    database
      .prepare(
        "UPDATE office_expenses SET status = 'submitted', submitted_by_member_id = ?, submitted_at = ?, rejection_reason = NULL, version = ?, updated_by_email = ?, updated_at = ? WHERE id = ? AND status = 'draft' AND version = ?",
      )
      .bind(
        memberId,
        now,
        nextVersion,
        normalizeEmail(actor.email),
        now,
        current.id,
        current.version,
      ),
    database
      .prepare(
        "INSERT INTO office_approvals (id, entity_type, entity_id, kind, status, requested_by_member_id, assigned_to_member_id, decided_by_member_id, request_note, decision_reason, requested_at, decided_at, version) SELECT ?, 'expense', id, 'expense', 'pending', ?, ?, NULL, ?, NULL, ?, NULL, 1 FROM office_expenses WHERE id = ? AND status = 'submitted' AND version = ? AND updated_at = ?",
      )
      .bind(
        approvalId,
        memberId,
        input.assignedToMemberId ?? null,
        optionalText(input.requestNote),
        now,
        current.id,
        nextVersion,
        now,
      ),
    database
      .prepare(
        "INSERT INTO office_audit_events (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata, request_id, ip_hash, created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM office_expenses WHERE id = ? AND status = 'submitted' AND version = ? AND updated_at = ?",
      )
      .bind(
        event.id,
        event.actorMemberId,
        event.actorEmail,
        event.action,
        event.entityType,
        event.entityId,
        event.metadata,
        event.requestId,
        event.ipHash,
        event.createdAt,
        current.id,
        nextVersion,
        now,
      ),
  ]);
  requireChanged(results[0], "Expense changed before submission completed.");
  requireChanged(results[1], "Expense approval request was not created.");

  const expense = await getOfficeExpenseById(database, current.id);
  if (!expense) throw new OfficeRepositoryError("not_found", "Submitted expense could not be read.");
  return expense;
}

export async function decideOfficeExpense(
  input: DecideOfficeExpenseInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeExpenseView> {
  const database = await getD1();
  const memberId = requireActorMemberId(actor);
  const current = await getOfficeExpenseById(database, input.expenseId);
  if (!current) throw new OfficeRepositoryError("not_found", "Expense was not found.");
  if (current.status !== "submitted") {
    throw new OfficeRepositoryError("invalid_state", "Only a submitted expense can be decided.");
  }
  if (current.version !== input.expectedVersion) {
    throw new OfficeRepositoryError("optimistic_conflict", "Expense changed before review.");
  }
  if (!current.submittedByMemberId) {
    throw new OfficeRepositoryError("invalid_state", "Expense has no submitting member.");
  }
  if (input.decision === "approved") {
    const selfApproval = validateExpenseApproval(current.submittedByMemberId, memberId);
    if (selfApproval) {
      throw new OfficeRepositoryError("self_approval", selfApproval.message);
    }
  }
  const reason = optionalText(input.reason);
  if (input.decision === "rejected" && !reason) {
    throw new TypeError("A rejection reason is required.");
  }

  const now = new Date().toISOString();
  const nextVersion = current.version + 1;
  const event = createOfficeAuditEvent({
    actor,
    action: `expense.${input.decision}`,
    entityType: "expense",
    entityId: current.id,
    metadata: {
      fromStatus: current.status,
      toStatus: input.decision,
      reason,
      nextVersion,
    },
    createdAt: now,
  });
  const results = await database.batch([
    database
      .prepare(
        "UPDATE office_expenses SET status = ?, approved_by_member_id = ?, approved_at = ?, rejection_reason = ?, version = ?, updated_by_email = ?, updated_at = ? WHERE id = ? AND status = 'submitted' AND version = ?",
      )
      .bind(
        input.decision,
        input.decision === "approved" ? memberId : null,
        input.decision === "approved" ? now : null,
        input.decision === "rejected" ? reason : null,
        nextVersion,
        normalizeEmail(actor.email),
        now,
        current.id,
        current.version,
      ),
    database
      .prepare(
        "UPDATE office_approvals SET status = ?, decided_by_member_id = ?, decision_reason = ?, decided_at = ?, version = version + 1 WHERE entity_type = 'expense' AND entity_id = ? AND status = 'pending' AND EXISTS (SELECT 1 FROM office_expenses WHERE id = ? AND status = ? AND version = ? AND updated_at = ?)",
      )
      .bind(
        input.decision,
        memberId,
        reason,
        now,
        current.id,
        current.id,
        input.decision,
        nextVersion,
        now,
      ),
    database
      .prepare(
        "INSERT INTO office_audit_events (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata, request_id, ip_hash, created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM office_expenses WHERE id = ? AND status = ? AND version = ? AND updated_at = ?",
      )
      .bind(
        event.id,
        event.actorMemberId,
        event.actorEmail,
        event.action,
        event.entityType,
        event.entityId,
        event.metadata,
        event.requestId,
        event.ipHash,
        event.createdAt,
        current.id,
        input.decision,
        nextVersion,
        now,
      ),
  ]);
  requireChanged(results[0], "Expense changed before the decision completed.");

  const expense = await getOfficeExpenseById(database, current.id);
  if (!expense) throw new OfficeRepositoryError("not_found", "Decided expense could not be read.");
  return expense;
}

const APPROVAL_SELECT = `SELECT
  approval.id, approval.entity_type, approval.entity_id, approval.kind, approval.status,
  approval.requested_by_member_id, requester.display_name AS requested_by_member_name,
  approval.assigned_to_member_id, assignee.display_name AS assigned_to_member_name,
  approval.decided_by_member_id, decider.display_name AS decided_by_member_name,
  approval.request_note, approval.decision_reason, approval.requested_at, approval.decided_at,
  approval.version
FROM office_approvals approval
LEFT JOIN office_members requester ON requester.id = approval.requested_by_member_id
LEFT JOIN office_members assignee ON assignee.id = approval.assigned_to_member_id
LEFT JOIN office_members decider ON decider.id = approval.decided_by_member_id`;

export type ListOfficeApprovalsOptions = OfficeListOptions &
  Readonly<{
    status?: OfficeApprovalStatus;
    entityType?: OfficeApprovalEntityType;
    entityId?: string;
    assignedToMemberId?: string;
    requestedByMemberId?: string;
  }>;

async function getOfficeApprovalById(
  database: D1Database,
  id: string,
): Promise<OfficeApprovalView | null> {
  const row = await database
    .prepare(`${APPROVAL_SELECT} WHERE approval.id = ? LIMIT 1`)
    .bind(id)
    .first<ApprovalRow>();
  return row ? mapApproval(row) : null;
}

export async function listOfficeApprovals(
  options: ListOfficeApprovalsOptions = {},
): Promise<OfficeApprovalView[]> {
  const database = await getD1();
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (options.status) {
    conditions.push("approval.status = ?");
    bindings.push(options.status);
  }
  if (options.entityType) {
    conditions.push("approval.entity_type = ?");
    bindings.push(options.entityType);
  }
  if (options.entityId) {
    conditions.push("approval.entity_id = ?");
    bindings.push(options.entityId);
  }
  if (options.assignedToMemberId) {
    conditions.push("approval.assigned_to_member_id = ?");
    bindings.push(options.assignedToMemberId);
  }
  if (options.requestedByMemberId) {
    conditions.push("approval.requested_by_member_id = ?");
    bindings.push(options.requestedByMemberId);
  }
  const result = await prepareBoundedList(
    database,
    APPROVAL_SELECT,
    conditions,
    bindings,
    "ORDER BY CASE approval.status WHEN 'pending' THEN 0 ELSE 1 END, approval.requested_at DESC",
    options,
  ).all<ApprovalRow>();
  return result.results.map(mapApproval);
}

export async function decideOfficeApproval(
  input: DecideOfficeApprovalInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeApprovalView> {
  const database = await getD1();
  const memberId = requireActorMemberId(actor);
  const current = await getOfficeApprovalById(database, input.approvalId);
  if (!current) throw new OfficeRepositoryError("not_found", "Approval was not found.");
  if (current.status !== "pending") {
    throw new OfficeRepositoryError("invalid_state", "Only a pending approval can be decided.");
  }
  if (current.version !== input.expectedVersion) {
    throw new OfficeRepositoryError("optimistic_conflict", "Approval changed before review.");
  }

  if (current.entityType === "expense") {
    const expense = await getOfficeExpenseById(database, current.entityId);
    if (!expense) throw new OfficeRepositoryError("not_found", "Approval expense was not found.");
    await decideOfficeExpense(
      {
        expenseId: expense.id,
        expectedVersion: expense.version,
        decision: input.decision,
        reason: input.reason,
      },
      actor,
    );
    const decided = await getOfficeApprovalById(database, current.id);
    if (!decided) throw new OfficeRepositoryError("not_found", "Decided approval could not be read.");
    return decided;
  }

  const reason = optionalText(input.reason);
  if (input.decision === "rejected" && !reason) {
    throw new TypeError("A rejection reason is required.");
  }
  const now = new Date().toISOString();
  const nextVersion = current.version + 1;
  const event = createOfficeAuditEvent({
    actor,
    action: `approval.${input.decision}`,
    entityType: "approval",
    entityId: current.id,
    metadata: {
      approvalEntityType: current.entityType,
      approvalEntityId: current.entityId,
      reason,
      nextVersion,
    },
    createdAt: now,
  });
  const results = await database.batch([
    database
      .prepare(
        "UPDATE office_approvals SET status = ?, decided_by_member_id = ?, decision_reason = ?, decided_at = ?, version = ? WHERE id = ? AND status = 'pending' AND version = ?",
      )
      .bind(
        input.decision,
        memberId,
        reason,
        now,
        nextVersion,
        current.id,
        current.version,
      ),
    database
      .prepare(
        "INSERT INTO office_audit_events (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata, request_id, ip_hash, created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM office_approvals WHERE id = ? AND status = ? AND version = ? AND decided_at = ?",
      )
      .bind(
        event.id,
        event.actorMemberId,
        event.actorEmail,
        event.action,
        event.entityType,
        event.entityId,
        event.metadata,
        event.requestId,
        event.ipHash,
        event.createdAt,
        current.id,
        input.decision,
        nextVersion,
        now,
      ),
  ]);
  requireChanged(results[0], "Approval changed before the decision completed.");

  const approval = await getOfficeApprovalById(database, current.id);
  if (!approval) throw new OfficeRepositoryError("not_found", "Decided approval could not be read.");
  return approval;
}

const TEAM_MEMBER_SELECT = `SELECT
  member.id, member.email, member.display_name, member.role, member.status,
  member.invited_by_member_id, inviter.display_name AS invited_by_member_name, member.last_seen_at,
  member.version, member.created_at, member.updated_at, member.archived_at
FROM office_members member
LEFT JOIN office_members inviter ON inviter.id = member.invited_by_member_id`;

export type ListOfficeTeamMembersOptions = OfficeListOptions &
  Readonly<{
    role?: OfficeRole;
    status?: OfficeMemberStatus;
    query?: string;
  }>;

async function getOfficeTeamMemberById(
  database: D1Database,
  id: string,
): Promise<OfficeTeamMemberView | null> {
  const row = await database
    .prepare(`${TEAM_MEMBER_SELECT} WHERE member.id = ? LIMIT 1`)
    .bind(id)
    .first<TeamMemberRow>();
  return row ? mapTeamMember(row) : null;
}

export async function listOfficeTeamMembers(
  options: ListOfficeTeamMembersOptions = {},
): Promise<OfficeTeamMemberView[]> {
  const database = await getD1();
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (options.role) {
    conditions.push("member.role = ?");
    bindings.push(options.role);
  }
  if (options.status) {
    conditions.push("member.status = ?");
    bindings.push(options.status);
  }
  if (options.query?.trim()) {
    conditions.push(
      "(LOWER(member.display_name) LIKE ? ESCAPE '\\' OR member.normalized_email LIKE ? ESCAPE '\\')",
    );
    const pattern = searchPattern(options.query);
    bindings.push(pattern, pattern);
  }
  const result = await prepareBoundedList(
    database,
    TEAM_MEMBER_SELECT,
    conditions,
    bindings,
    "ORDER BY CASE member.status WHEN 'active' THEN 0 WHEN 'invited' THEN 1 ELSE 2 END, member.display_name ASC",
    options,
  ).all<TeamMemberRow>();
  return result.results.map(mapTeamMember);
}

export async function addOfficeTeamMember(
  input: AddOfficeTeamMemberInput,
  actor: OfficeRepositoryActor,
): Promise<OfficeTeamMemberView> {
  const database = await getD1();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const email = requireText(input.email, "Team member email");
  const status = input.status ?? "invited";
  const event = createOfficeAuditEvent({
    actor,
    action: "team_member.added",
    entityType: "office_member",
    entityId: id,
    metadata: { email: normalizeEmail(email), role: input.role, status },
    createdAt: now,
  });

  await database.batch([
    database
      .prepare(
        "INSERT INTO office_members (id, email, normalized_email, display_name, role, status, invited_by_member_id, last_seen_at, version, created_at, updated_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 1, ?, ?, NULL)",
      )
      .bind(
        id,
        email,
        normalizeEmail(email),
        requireText(input.displayName, "Team member name"),
        input.role,
        status,
        actor.memberId,
        now,
        now,
      ),
    prepareOfficeAuditInsert(database, event),
  ]);

  const member = await getOfficeTeamMemberById(database, id);
  if (!member) throw new OfficeRepositoryError("not_found", "Added team member could not be read.");
  return member;
}

export type ListOfficeAuditEventsOptions = OfficeListOptions &
  Readonly<{
    entityType?: string;
    entityId?: string;
    actorMemberId?: string;
    action?: string;
  }>;

export async function listOfficeAuditEvents(
  options: ListOfficeAuditEventsOptions = {},
): Promise<OfficeAuditEventView[]> {
  const database = await getD1();
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (options.entityType) {
    conditions.push("audit.entity_type = ?");
    bindings.push(requireText(options.entityType, "Audit entity type"));
  }
  if (options.entityId) {
    conditions.push("audit.entity_id = ?");
    bindings.push(requireText(options.entityId, "Audit entity id"));
  }
  if (options.actorMemberId) {
    conditions.push("audit.actor_member_id = ?");
    bindings.push(options.actorMemberId);
  }
  if (options.action) {
    conditions.push("audit.action = ?");
    bindings.push(requireText(options.action, "Audit action"));
  }
  const result = await prepareBoundedList(
    database,
    `SELECT
      audit.id, audit.actor_member_id, member.display_name AS actor_name, audit.actor_email,
      audit.action, audit.entity_type, audit.entity_id, audit.metadata, audit.request_id,
      audit.ip_hash, audit.created_at
    FROM office_audit_events audit
    LEFT JOIN office_members member ON member.id = audit.actor_member_id`,
    conditions,
    bindings,
    "ORDER BY audit.created_at DESC, audit.id DESC",
    options,
  ).all<AuditEventRow>();
  return result.results.map(mapAuditEvent);
}
