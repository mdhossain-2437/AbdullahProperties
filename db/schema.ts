import { sql } from "drizzle-orm";
import { check, foreignKey, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const contentEntries = sqliteTable(
  "content_entries",
  {
    id: text("id").primaryKey(),
    type: text("type", { enum: ["insight", "area_guide", "faq", "announcement"] }).notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    payload: text("payload").notNull(),
    status: text("status", { enum: ["draft", "in_review", "published", "archived"] }).notNull().default("draft"),
    verification: text("verification", { enum: ["editorial", "source_reviewed", "owner_approved"] }).notNull().default("editorial"),
    seoTitle: text("seo_title").notNull(),
    seoDescription: text("seo_description").notNull(),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    publishedAt: text("published_at"),
    version: integer("version").notNull().default(1),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("content_entries_type_slug_unique").on(table.type, table.slug),
    index("content_entries_publication_idx").on(table.type, table.status, table.publishedAt),
    index("content_entries_featured_idx").on(table.status, table.featured, table.publishedAt),
  ],
);

export const contentRevisions = sqliteTable(
  "content_revisions",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id").notNull().references(() => contentEntries.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    snapshot: text("snapshot").notNull(),
    actorEmail: text("actor_email").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("content_revisions_entry_version_unique").on(table.entryId, table.version)],
);

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    actorEmail: text("actor_email").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: text("metadata").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("audit_events_entity_created_idx").on(table.entityType, table.entityId, table.createdAt)],
);

export const officeMembers = sqliteTable(
  "office_members",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    normalizedEmail: text("normalized_email").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role", {
      enum: ["owner", "admin", "manager", "sales", "projects", "accounts", "viewer"],
    }).notNull(),
    status: text("status", { enum: ["invited", "active", "suspended", "archived"] })
      .notNull()
      .default("invited"),
    invitedByMemberId: text("invited_by_member_id"),
    lastSeenAt: text("last_seen_at"),
    version: integer("version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [
    uniqueIndex("office_members_normalized_email_unique").on(table.normalizedEmail),
    index("office_members_status_role_idx").on(table.status, table.role),
    foreignKey({
      columns: [table.invitedByMemberId],
      foreignColumns: [table.id],
      name: "office_members_invited_by_member_fk",
    }).onDelete("set null"),
  ],
);

export const officeContacts = sqliteTable(
  "office_contacts",
  {
    id: text("id").primaryKey(),
    kind: text("kind", {
      enum: ["customer", "landowner", "buyer", "seller", "vendor", "partner", "other"],
    }).notNull(),
    displayName: text("display_name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    email: text("email"),
    normalizedEmail: text("normalized_email"),
    phone: text("phone"),
    normalizedPhone: text("normalized_phone"),
    organizationName: text("organization_name"),
    address: text("address"),
    notes: text("notes"),
    status: text("status", { enum: ["active", "archived"] }).notNull().default("active"),
    assignedMemberId: text("assigned_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    version: integer("version").notNull().default(1),
    createdByEmail: text("created_by_email").notNull(),
    updatedByEmail: text("updated_by_email").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [
    index("office_contacts_name_idx").on(table.normalizedName),
    index("office_contacts_phone_idx").on(table.normalizedPhone),
    index("office_contacts_email_idx").on(table.normalizedEmail),
    index("office_contacts_kind_status_idx").on(table.kind, table.status),
    index("office_contacts_assignee_status_idx").on(table.assignedMemberId, table.status),
  ],
);

export const officeLeads = sqliteTable(
  "office_leads",
  {
    id: text("id").primaryKey(),
    contactId: text("contact_id")
      .notNull()
      .references(() => officeContacts.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    source: text("source"),
    serviceType: text("service_type", {
      enum: ["buy", "sell", "rent", "land_development", "construction", "consultation", "other"],
    }).notNull(),
    stage: text("stage", {
      enum: ["new", "qualified", "site_visit", "proposal", "negotiation", "won", "lost"],
    })
      .notNull()
      .default("new"),
    priority: text("priority", { enum: ["low", "normal", "high", "urgent"] })
      .notNull()
      .default("normal"),
    assigneeMemberId: text("assignee_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    estimatedValueMinor: integer("estimated_value_minor"),
    currency: text("currency").notNull().default("BDT"),
    nextActionAt: text("next_action_at"),
    wonAt: text("won_at"),
    closedAt: text("closed_at"),
    lostReason: text("lost_reason"),
    version: integer("version").notNull().default(1),
    createdByEmail: text("created_by_email").notNull(),
    updatedByEmail: text("updated_by_email").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [
    index("office_leads_stage_assignee_next_action_idx").on(
      table.stage,
      table.assigneeMemberId,
      table.nextActionAt,
    ),
    index("office_leads_contact_created_idx").on(table.contactId, table.createdAt),
    index("office_leads_priority_stage_idx").on(table.priority, table.stage),
  ],
);

export const officeLandParcels = sqliteTable(
  "office_land_parcels",
  {
    id: text("id").primaryKey(),
    referenceCode: text("reference_code").notNull(),
    title: text("title").notNull(),
    primaryLandownerContactId: text("primary_landowner_contact_id").references(
      () => officeContacts.id,
      { onDelete: "set null" },
    ),
    stage: text("stage", {
      enum: [
        "lead",
        "document_intake",
        "due_diligence",
        "survey_feasibility",
        "proposal",
        "negotiation",
        "legal_owner_approval",
        "agreement",
        "project_gates",
        "handover",
        "closed",
        "rejected",
      ],
    })
      .notNull()
      .default("lead"),
    reviewStatus: text("review_status", {
      enum: ["not_started", "in_review", "needs_information", "reviewed", "rejected"],
    })
      .notNull()
      .default("not_started"),
    address: text("address").notNull(),
    district: text("district").notNull().default("Joypurhat"),
    upazila: text("upazila"),
    unionOrWard: text("union_or_ward"),
    mouza: text("mouza"),
    jlNumber: text("jl_number"),
    dagNumbers: text("dag_numbers").notNull().default("[]"),
    khatianNumbers: text("khatian_numbers").notNull().default("[]"),
    areaSquareFeet: integer("area_square_feet"),
    areaDecimal: text("area_decimal"),
    ownershipShareBps: integer("ownership_share_bps"),
    mutationStatus: text("mutation_status"),
    landTaxStatus: text("land_tax_status"),
    possessionStatus: text("possession_status"),
    verificationNotes: text("verification_notes"),
    assigneeMemberId: text("assignee_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    version: integer("version").notNull().default(1),
    createdByEmail: text("created_by_email").notNull(),
    updatedByEmail: text("updated_by_email").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [
    uniqueIndex("office_land_parcels_reference_code_unique").on(table.referenceCode),
    index("office_land_parcels_stage_assignee_idx").on(table.stage, table.assigneeMemberId),
    index("office_land_parcels_review_stage_idx").on(table.reviewStatus, table.stage),
    index("office_land_parcels_location_idx").on(table.district, table.upazila, table.mouza),
    index("office_land_parcels_landowner_idx").on(table.primaryLandownerContactId),
  ],
);

export const officeProjects = sqliteTable(
  "office_projects",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    projectType: text("project_type", {
      enum: ["residential", "commercial", "mixed_use", "land_development", "construction", "other"],
    }).notNull(),
    status: text("status", {
      enum: [
        "feasibility",
        "secured",
        "design",
        "approval",
        "delivery",
        "inspection",
        "handover",
        "defect_follow_up",
        "closed",
        "on_hold",
        "cancelled",
      ],
    })
      .notNull()
      .default("feasibility"),
    landParcelId: text("land_parcel_id").references(() => officeLandParcels.id, {
      onDelete: "set null",
    }),
    customerContactId: text("customer_contact_id").references(() => officeContacts.id, {
      onDelete: "set null",
    }),
    managerMemberId: text("manager_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    address: text("address").notNull(),
    district: text("district").notNull().default("Joypurhat"),
    upazila: text("upazila"),
    summary: text("summary"),
    riskLevel: text("risk_level", { enum: ["low", "medium", "high", "critical"] })
      .notNull()
      .default("low"),
    progressBps: integer("progress_bps").notNull().default(0),
    budgetMinor: integer("budget_minor"),
    currency: text("currency").notNull().default("BDT"),
    startAt: text("start_at"),
    targetEndAt: text("target_end_at"),
    actualEndAt: text("actual_end_at"),
    version: integer("version").notNull().default(1),
    createdByEmail: text("created_by_email").notNull(),
    updatedByEmail: text("updated_by_email").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [
    uniqueIndex("office_projects_code_unique").on(table.code),
    index("office_projects_status_manager_idx").on(table.status, table.managerMemberId),
    index("office_projects_land_parcel_idx").on(table.landParcelId),
    index("office_projects_customer_idx").on(table.customerContactId),
    index("office_projects_risk_status_idx").on(table.riskLevel, table.status),
  ],
);

export const officeMilestones = sqliteTable(
  "office_milestones",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => officeProjects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", {
      enum: ["not_started", "in_progress", "blocked", "completed", "cancelled"],
    })
      .notNull()
      .default("not_started"),
    ownerMemberId: text("owner_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    dueAt: text("due_at"),
    completedAt: text("completed_at"),
    sortOrder: integer("sort_order").notNull().default(0),
    version: integer("version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("office_milestones_project_status_due_idx").on(table.projectId, table.status, table.dueAt),
    index("office_milestones_owner_status_due_idx").on(table.ownerMemberId, table.status, table.dueAt),
  ],
);

export const officeTasks = sqliteTable(
  "office_tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", { enum: ["open", "in_progress", "blocked", "done", "cancelled"] })
      .notNull()
      .default("open"),
    priority: text("priority", { enum: ["low", "normal", "high", "urgent"] })
      .notNull()
      .default("normal"),
    assigneeMemberId: text("assignee_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    reporterMemberId: text("reporter_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    contactId: text("contact_id").references(() => officeContacts.id, { onDelete: "set null" }),
    leadId: text("lead_id").references(() => officeLeads.id, { onDelete: "set null" }),
    landParcelId: text("land_parcel_id").references(() => officeLandParcels.id, {
      onDelete: "set null",
    }),
    projectId: text("project_id").references(() => officeProjects.id, { onDelete: "set null" }),
    dueAt: text("due_at"),
    completedAt: text("completed_at"),
    version: integer("version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [
    index("office_tasks_assignee_status_due_idx").on(table.assigneeMemberId, table.status, table.dueAt),
    index("office_tasks_project_status_idx").on(table.projectId, table.status),
    index("office_tasks_lead_status_idx").on(table.leadId, table.status),
    index("office_tasks_land_status_idx").on(table.landParcelId, table.status),
  ],
);

export const officeActivities = sqliteTable(
  "office_activities",
  {
    id: text("id").primaryKey(),
    type: text("type", {
      enum: ["call", "email", "meeting", "site_visit", "note", "status_change", "document", "other"],
    }).notNull(),
    summary: text("summary").notNull(),
    details: text("details"),
    outcome: text("outcome"),
    occurredAt: text("occurred_at").notNull(),
    nextActionAt: text("next_action_at"),
    actorMemberId: text("actor_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    contactId: text("contact_id").references(() => officeContacts.id, { onDelete: "set null" }),
    leadId: text("lead_id").references(() => officeLeads.id, { onDelete: "set null" }),
    landParcelId: text("land_parcel_id").references(() => officeLandParcels.id, {
      onDelete: "set null",
    }),
    projectId: text("project_id").references(() => officeProjects.id, { onDelete: "set null" }),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("office_activities_contact_occurred_idx").on(table.contactId, table.occurredAt),
    index("office_activities_lead_occurred_idx").on(table.leadId, table.occurredAt),
    index("office_activities_project_occurred_idx").on(table.projectId, table.occurredAt),
    index("office_activities_actor_occurred_idx").on(table.actorMemberId, table.occurredAt),
  ],
);

export const officeInvoices = sqliteTable(
  "office_invoices",
  {
    id: text("id").primaryKey(),
    number: text("number"),
    branchCode: text("branch_code").notNull().default("JOY"),
    fiscalYear: text("fiscal_year"),
    sequenceValue: integer("sequence_value"),
    contactId: text("contact_id")
      .notNull()
      .references(() => officeContacts.id, { onDelete: "restrict" }),
    projectId: text("project_id").references(() => officeProjects.id, { onDelete: "set null" }),
    kind: text("kind", {
      enum: ["service", "consultation", "booking", "installment", "construction", "other"],
    })
      .notNull()
      .default("service"),
    purpose: text("purpose").notNull().default("Property services"),
    locale: text("locale", { enum: ["en", "bn"] }).notNull().default("en"),
    status: text("status", {
      enum: ["draft", "pending_approval", "approved", "issued", "partially_paid", "paid", "overdue", "void"],
    })
      .notNull()
      .default("draft"),
    issueDate: text("issue_date"),
    dueDate: text("due_date"),
    currency: text("currency").notNull().default("BDT"),
    subtotalMinor: integer("subtotal_minor").notNull().default(0),
    discountMinor: integer("discount_minor").notNull().default(0),
    taxMinor: integer("tax_minor").notNull().default(0),
    totalMinor: integer("total_minor").notNull().default(0),
    paidMinor: integer("paid_minor").notNull().default(0),
    balanceMinor: integer("balance_minor").notNull().default(0),
    customerSnapshot: text("customer_snapshot").notNull(),
    companySnapshot: text("company_snapshot").notNull(),
    taxSnapshot: text("tax_snapshot"),
    termsSnapshot: text("terms_snapshot").notNull(),
    notes: text("notes"),
    trackingCode: text("tracking_code"),
    trackingIssuedAt: text("tracking_issued_at"),
    publicAccessRevokedAt: text("public_access_revoked_at"),
    templateVersion: text("template_version").notNull().default("ap-invoice-v1"),
    approvedByMemberId: text("approved_by_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    approvedAt: text("approved_at"),
    postedByMemberId: text("posted_by_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    postedAt: text("posted_at"),
    version: integer("version").notNull().default(1),
    createdByEmail: text("created_by_email").notNull(),
    updatedByEmail: text("updated_by_email").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_invoices_number_unique").on(table.number),
    uniqueIndex("office_invoices_tracking_code_unique").on(table.trackingCode),
    index("office_invoices_status_due_idx").on(table.status, table.dueDate),
    index("office_invoices_contact_created_idx").on(table.contactId, table.createdAt),
    index("office_invoices_project_status_idx").on(table.projectId, table.status),
    index("office_invoices_fiscal_sequence_idx").on(table.branchCode, table.fiscalYear, table.sequenceValue),
  ],
);

export const officeInvoiceItems = sqliteTable(
  "office_invoice_items",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => officeInvoices.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    description: text("description").notNull(),
    quantityMillis: integer("quantity_millis").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    discountMinor: integer("discount_minor").notNull().default(0),
    taxRateBps: integer("tax_rate_bps").notNull().default(0),
    subtotalMinor: integer("subtotal_minor").notNull(),
    taxMinor: integer("tax_minor").notNull(),
    totalMinor: integer("total_minor").notNull(),
    metadata: text("metadata").notNull().default("{}"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_invoice_items_invoice_position_unique").on(table.invoiceId, table.position),
    index("office_invoice_items_invoice_idx").on(table.invoiceId),
  ],
);

export const officePayments = sqliteTable(
  "office_payments",
  {
    id: text("id").primaryKey(),
    receiptNumber: text("receipt_number"),
    branchCode: text("branch_code").notNull().default("JOY"),
    fiscalYear: text("fiscal_year"),
    sequenceValue: integer("sequence_value"),
    contactId: text("contact_id")
      .notNull()
      .references(() => officeContacts.id, { onDelete: "restrict" }),
    projectId: text("project_id").references(() => officeProjects.id, { onDelete: "set null" }),
    clientOperationId: text("client_operation_id"),
    status: text("status", { enum: ["draft", "posted", "void", "refunded"] })
      .notNull()
      .default("draft"),
    method: text("method", {
      enum: ["cash", "bank_transfer", "card", "mobile_financial_service", "cheque", "other"],
    }).notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("BDT"),
    paidAt: text("paid_at").notNull(),
    reference: text("reference"),
    note: text("note"),
    locale: text("locale", { enum: ["en", "bn"] }).notNull().default("en"),
    trackingCode: text("tracking_code"),
    trackingIssuedAt: text("tracking_issued_at"),
    publicAccessRevokedAt: text("public_access_revoked_at"),
    templateVersion: text("template_version").notNull().default("ap-receipt-v1"),
    receivedByMemberId: text("received_by_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    postedByMemberId: text("posted_by_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    postedAt: text("posted_at"),
    version: integer("version").notNull().default(1),
    createdByEmail: text("created_by_email").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_payments_receipt_number_unique").on(table.receiptNumber),
    uniqueIndex("office_payments_client_operation_unique").on(table.clientOperationId),
    uniqueIndex("office_payments_tracking_code_unique").on(table.trackingCode),
    index("office_payments_status_paid_at_idx").on(table.status, table.paidAt),
    index("office_payments_contact_paid_at_idx").on(table.contactId, table.paidAt),
    index("office_payments_project_status_idx").on(table.projectId, table.status),
    index("office_payments_fiscal_sequence_idx").on(table.branchCode, table.fiscalYear, table.sequenceValue),
  ],
);

export const officePaymentAllocations = sqliteTable(
  "office_payment_allocations",
  {
    id: text("id").primaryKey(),
    paymentId: text("payment_id")
      .notNull()
      .references(() => officePayments.id, { onDelete: "restrict" }),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => officeInvoices.id, { onDelete: "restrict" }),
    amountMinor: integer("amount_minor").notNull(),
    createdByEmail: text("created_by_email").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_payment_allocations_payment_invoice_unique").on(
      table.paymentId,
      table.invoiceId,
    ),
    index("office_payment_allocations_invoice_idx").on(table.invoiceId),
    index("office_payment_allocations_payment_idx").on(table.paymentId),
  ],
);

export const officeExpenses = sqliteTable(
  "office_expenses",
  {
    id: text("id").primaryKey(),
    number: text("number"),
    status: text("status", {
      enum: ["draft", "submitted", "approved", "rejected", "paid", "cancelled"],
    })
      .notNull()
      .default("draft"),
    category: text("category").notNull(),
    description: text("description").notNull(),
    projectId: text("project_id").references(() => officeProjects.id, { onDelete: "set null" }),
    vendorContactId: text("vendor_contact_id").references(() => officeContacts.id, {
      onDelete: "set null",
    }),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("BDT"),
    incurredAt: text("incurred_at").notNull(),
    receiptDocumentId: text("receipt_document_id"),
    submittedByMemberId: text("submitted_by_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    submittedAt: text("submitted_at"),
    approvedByMemberId: text("approved_by_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    approvedAt: text("approved_at"),
    paidAt: text("paid_at"),
    rejectionReason: text("rejection_reason"),
    version: integer("version").notNull().default(1),
    createdByEmail: text("created_by_email").notNull(),
    updatedByEmail: text("updated_by_email").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_expenses_number_unique").on(table.number),
    index("office_expenses_status_incurred_idx").on(table.status, table.incurredAt),
    index("office_expenses_project_status_idx").on(table.projectId, table.status),
    index("office_expenses_submitter_status_idx").on(table.submittedByMemberId, table.status),
  ],
);

export const officeApprovals = sqliteTable(
  "office_approvals",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type", {
      enum: ["invoice", "payment", "expense", "document", "project", "land_parcel"],
    }).notNull(),
    entityId: text("entity_id").notNull(),
    kind: text("kind", {
      enum: ["posting", "expense", "adjustment", "document_review", "project_gate", "land_review"],
    }).notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected", "cancelled"] })
      .notNull()
      .default("pending"),
    requestedByMemberId: text("requested_by_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    assignedToMemberId: text("assigned_to_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    decidedByMemberId: text("decided_by_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    requestNote: text("request_note"),
    decisionReason: text("decision_reason"),
    requestedAt: text("requested_at").notNull(),
    decidedAt: text("decided_at"),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    index("office_approvals_assignee_status_requested_idx").on(
      table.assignedToMemberId,
      table.status,
      table.requestedAt,
    ),
    index("office_approvals_entity_status_idx").on(table.entityType, table.entityId, table.status),
    index("office_approvals_requester_status_idx").on(table.requestedByMemberId, table.status),
  ],
);

export const officeDocuments = sqliteTable(
  "office_documents",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type", {
      enum: ["contact", "lead", "land_parcel", "project", "invoice", "payment", "expense", "approval"],
    }).notNull(),
    entityId: text("entity_id").notNull(),
    objectKey: text("object_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    checksumSha256: text("checksum_sha256").notNull(),
    classification: text("classification", {
      enum: [
        "general",
        "title_deed",
        "mutation",
        "land_tax",
        "agreement",
        "invoice",
        "receipt",
        "expense_receipt",
        "approval",
        "other",
      ],
    }).notNull(),
    visibility: text("visibility", { enum: ["private", "restricted"] })
      .notNull()
      .default("private"),
    reviewStatus: text("review_status", {
      enum: ["pending", "reviewed", "rejected", "expired"],
    })
      .notNull()
      .default("pending"),
    revision: integer("revision").notNull().default(1),
    supersedesDocumentId: text("supersedes_document_id"),
    uploadedByMemberId: text("uploaded_by_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    reviewedByMemberId: text("reviewed_by_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    reviewNote: text("review_note"),
    reviewedAt: text("reviewed_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [
    uniqueIndex("office_documents_object_key_unique").on(table.objectKey),
    index("office_documents_entity_created_idx").on(table.entityType, table.entityId, table.createdAt),
    index("office_documents_classification_review_idx").on(table.classification, table.reviewStatus),
    index("office_documents_checksum_idx").on(table.checksumSha256),
  ],
);

export const officeSequences = sqliteTable(
  "office_sequences",
  {
    id: text("id").primaryKey(),
    branchCode: text("branch_code").notNull(),
    fiscalYear: text("fiscal_year").notNull(),
    documentType: text("document_type", { enum: ["invoice", "receipt", "expense", "notice"] }).notNull(),
    currentValue: integer("current_value").notNull().default(0),
    version: integer("version").notNull().default(1),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_sequences_scope_unique").on(
      table.branchCode,
      table.fiscalYear,
      table.documentType,
    ),
  ],
);

export const officeNotices = sqliteTable(
  "office_notices",
  {
    id: text("id").primaryKey(),
    number: text("number"),
    branchCode: text("branch_code").notNull().default("JOY"),
    fiscalYear: text("fiscal_year"),
    sequenceValue: integer("sequence_value"),
    kind: text("kind", {
      enum: ["general", "payment_reminder", "project_update", "appointment", "handover", "other"],
    })
      .notNull()
      .default("general"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    locale: text("locale", { enum: ["en", "bn"] }).notNull().default("en"),
    contactId: text("contact_id").references(() => officeContacts.id, { onDelete: "set null" }),
    projectId: text("project_id").references(() => officeProjects.id, { onDelete: "set null" }),
    status: text("status", { enum: ["draft", "issued", "archived"] }).notNull().default("draft"),
    recipientSnapshot: text("recipient_snapshot"),
    companySnapshot: text("company_snapshot").notNull(),
    issueDate: text("issue_date"),
    effectiveDate: text("effective_date"),
    expiresAt: text("expires_at"),
    trackingCode: text("tracking_code"),
    trackingIssuedAt: text("tracking_issued_at"),
    publicAccessRevokedAt: text("public_access_revoked_at"),
    templateVersion: text("template_version").notNull().default("ap-notice-v1"),
    issuedByMemberId: text("issued_by_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    issuedAt: text("issued_at"),
    version: integer("version").notNull().default(1),
    createdByEmail: text("created_by_email").notNull(),
    updatedByEmail: text("updated_by_email").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [
    uniqueIndex("office_notices_number_unique").on(table.number),
    uniqueIndex("office_notices_tracking_code_unique").on(table.trackingCode),
    index("office_notices_status_issue_idx").on(table.status, table.issueDate),
    index("office_notices_contact_created_idx").on(table.contactId, table.createdAt),
    index("office_notices_project_status_idx").on(table.projectId, table.status),
    index("office_notices_fiscal_sequence_idx").on(table.branchCode, table.fiscalYear, table.sequenceValue),
  ],
);

export const officeNoticeRevisions = sqliteTable(
  "office_notice_revisions",
  {
    id: text("id").primaryKey(),
    noticeId: text("notice_id")
      .notNull()
      .references(() => officeNotices.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    snapshot: text("snapshot").notNull(),
    actorEmail: text("actor_email").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_notice_revisions_notice_version_unique").on(table.noticeId, table.version),
    index("office_notice_revisions_notice_created_idx").on(table.noticeId, table.createdAt),
  ],
);

export const officeNotificationOutbox = sqliteTable(
  "office_notification_outbox",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type").notNull(),
    entityType: text("entity_type", { enum: ["invoice", "payment", "notice"] }).notNull(),
    entityId: text("entity_id").notNull(),
    channel: text("channel", { enum: ["email", "sms"] }).notNull(),
    recipient: text("recipient").notNull(),
    template: text("template").notNull(),
    locale: text("locale", { enum: ["en", "bn"] }).notNull().default("en"),
    payload: text("payload").notNull(),
    status: text("status", {
      enum: ["pending", "processing", "sent", "failed", "dead", "cancelled"],
    })
      .notNull()
      .default("pending"),
    idempotencyKey: text("idempotency_key").notNull(),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    availableAt: text("available_at").notNull(),
    claimedAt: text("claimed_at"),
    claimToken: text("claim_token"),
    providerReference: text("provider_reference"),
    errorCode: text("error_code"),
    errorSummary: text("error_summary"),
    sentAt: text("sent_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_notification_outbox_idempotency_unique").on(table.idempotencyKey),
    index("office_notification_outbox_dispatch_idx").on(table.status, table.availableAt, table.createdAt),
    index("office_notification_outbox_entity_idx").on(table.entityType, table.entityId, table.createdAt),
  ],
);

export const officeNotificationAttempts = sqliteTable(
  "office_notification_attempts",
  {
    id: text("id").primaryKey(),
    outboxId: text("outbox_id")
      .notNull()
      .references(() => officeNotificationOutbox.id, { onDelete: "cascade" }),
    attemptNo: integer("attempt_no").notNull(),
    status: text("status", { enum: ["processing", "sent", "failed"] }).notNull(),
    providerReference: text("provider_reference"),
    errorCode: text("error_code"),
    errorSummary: text("error_summary"),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
  },
  (table) => [
    uniqueIndex("office_notification_attempts_outbox_attempt_unique").on(table.outboxId, table.attemptNo),
    index("office_notification_attempts_outbox_started_idx").on(table.outboxId, table.startedAt),
  ],
);

export const officeContactPreferences = sqliteTable(
  "office_contact_preferences",
  {
    contactId: text("contact_id")
      .primaryKey()
      .references(() => officeContacts.id, { onDelete: "cascade" }),
    preferredLocale: text("preferred_locale", { enum: ["en", "bn"] }).notNull().default("bn"),
    transactionalEmailEnabled: integer("transactional_email_enabled", { mode: "boolean" })
      .notNull()
      .default(true),
    transactionalSmsEnabled: integer("transactional_sms_enabled", { mode: "boolean" })
      .notNull()
      .default(true),
    updatedByEmail: text("updated_by_email").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("office_contact_preferences_locale_idx").on(table.preferredLocale)],
);

export const officeAuditEvents = sqliteTable(
  "office_audit_events",
  {
    id: text("id").primaryKey(),
    actorMemberId: text("actor_member_id").references(() => officeMembers.id, {
      onDelete: "set null",
    }),
    actorEmail: text("actor_email").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: text("metadata").notNull(),
    requestId: text("request_id"),
    ipHash: text("ip_hash"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("office_audit_events_entity_created_idx").on(
      table.entityType,
      table.entityId,
      table.createdAt,
    ),
    index("office_audit_events_actor_created_idx").on(table.actorMemberId, table.createdAt),
    index("office_audit_events_action_created_idx").on(table.action, table.createdAt),
  ],
);

/**
 * Long-lived desktop credentials are deliberately separate from the browser session.
 * The browser receives only a short-lived one-time pairing code. The native client
 * exchanges it server-to-server and protects the returned bearer secret with DPAPI.
 */
export const officeDesktopDevices = sqliteTable(
  "office_desktop_devices",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => officeMembers.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    platform: text("platform", { enum: ["windows"] }).notNull(),
    tokenHash: text("token_hash").notNull(),
    tokenPrefix: text("token_prefix").notNull(),
    // The legacy database default remains `active`; every supported pairing write
    // supplies `pending` explicitly before activation. Keeping metadata aligned
    // prevents Drizzle from proposing a destructive SQLite table rebuild.
    status: text("status", { enum: ["pending", "active", "revoked"] }).notNull().default("active"),
    expiresAt: text("expires_at").notNull(),
    lastSeenAt: text("last_seen_at"),
    createdAt: text("created_at").notNull(),
    revokedAt: text("revoked_at"),
    revokedByEmail: text("revoked_by_email"),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    uniqueIndex("office_desktop_devices_token_hash_unique").on(table.tokenHash),
    index("office_desktop_devices_member_status_idx").on(table.memberId, table.status, table.createdAt),
    index("office_desktop_devices_status_expiry_idx").on(table.status, table.expiresAt),
  ],
);

export const officeDesktopPairingCodes = sqliteTable(
  "office_desktop_pairing_codes",
  {
    deviceId: text("device_id")
      .primaryKey()
      .references(() => officeDesktopDevices.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    attemptCount: integer("attempt_count").notNull().default(0),
    consumedAt: text("consumed_at"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_desktop_pairing_codes_hash_unique").on(table.codeHash),
    index("office_desktop_pairing_codes_expiry_idx").on(table.expiresAt, table.consumedAt),
  ],
);

/**
 * V1 desktop sync accepts draft-only entities. This register is intentionally not a
 * financial posting table: invoice numbers, receipts, balances, and notifications
 * remain behind their existing server-authoritative workflows.
 */
export const officeDesktopDrafts = sqliteTable(
  "office_desktop_drafts",
  {
    aggregateId: text("aggregate_id").primaryKey(),
    aggregateType: text("aggregate_type", {
      enum: ["lead", "invoice_draft", "notice_draft"],
    }).notNull(),
    draftId: text("draft_id").notNull(),
    draftLocalRevision: integer("draft_local_revision").notNull(),
    clientOperationId: text("client_operation_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    operationHash: text("operation_hash").notNull(),
    payload: text("payload").notNull(),
    // `draft` is the legacy storage default from migration 0003. The supported
    // sync ingress always writes `received` explicitly; retain the old value in
    // metadata so future migrations do not rebuild a referenced SQLite table.
    status: text("status", {
      enum: ["draft", "received", "materialized", "rejected"],
    }).notNull().default("draft"),
    serverVersion: integer("server_version").notNull().default(1),
    sourceDeviceId: text("source_device_id")
      .notNull()
      .references(() => officeDesktopDevices.id, { onDelete: "restrict" }),
    createdByMemberId: text("created_by_member_id")
      .notNull()
      .references(() => officeMembers.id, { onDelete: "restrict" }),
    createdByEmail: text("created_by_email").notNull(),
    clientCreatedAt: text("client_created_at").notNull(),
    acceptedAt: text("accepted_at").notNull(),
    materializedEntityType: text("materialized_entity_type"),
    materializedEntityId: text("materialized_entity_id"),
    reviewedByMemberId: text("reviewed_by_member_id").references(() => officeMembers.id),
    reviewedAt: text("reviewed_at"),
  },
  (table) => [
    uniqueIndex("office_desktop_drafts_client_operation_unique").on(table.clientOperationId),
    uniqueIndex("office_desktop_drafts_idempotency_unique").on(table.idempotencyKey),
    index("office_desktop_drafts_type_accepted_idx").on(table.aggregateType, table.acceptedAt),
    index("office_desktop_drafts_device_accepted_idx").on(table.sourceDeviceId, table.acceptedAt),
  ],
);

export const officeDesktopRateLimits = sqliteTable(
  "office_desktop_rate_limits",
  {
    id: text("id").primaryKey(),
    deviceId: text("device_id")
      .notNull()
      .references(() => officeDesktopDevices.id, { onDelete: "cascade" }),
    windowStartedAt: text("window_started_at").notNull(),
    requestCount: integer("request_count").notNull().default(1),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_desktop_rate_limits_device_window_unique").on(
      table.deviceId,
      table.windowStartedAt,
    ),
    index("office_desktop_rate_limits_window_idx").on(table.windowStartedAt),
  ],
);

export const officeDesktopIngressRateLimits = sqliteTable(
  "office_desktop_ingress_rate_limits",
  {
    id: text("id").primaryKey(),
    identityHash: text("identity_hash").notNull(),
    kind: text("kind", { enum: ["network", "credential_prefix"] }).notNull(),
    windowStartedAt: text("window_started_at").notNull(),
    requestCount: integer("request_count").notNull().default(1),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_desktop_ingress_identity_window_unique").on(
      table.identityHash,
      table.windowStartedAt,
    ),
    index("office_desktop_ingress_window_idx").on(table.windowStartedAt),
  ],
);

/**
 * Payroll is intentionally separate from login membership: many employees never need Office OS
 * access, while privileged office members are not necessarily employees. Compensation is
 * effective-dated and snapshotted into a run before approval or posting.
 */
export const officeEmployees = sqliteTable(
  "office_employees",
  {
    id: text("id").primaryKey(),
    employeeCode: text("employee_code").notNull(),
    memberId: text("member_id").references(() => officeMembers.id, { onDelete: "set null" }),
    displayName: text("display_name").notNull(),
    designation: text("designation").notNull(),
    department: text("department").notNull(),
    employmentType: text("employment_type", {
      enum: ["permanent", "probation", "contract", "part_time"],
    }).notNull(),
    status: text("status", { enum: ["active", "suspended", "separated"] })
      .notNull()
      .default("active"),
    joinDate: text("join_date").notNull(),
    separationDate: text("separation_date"),
    createdByMemberId: text("created_by_member_id")
      .notNull()
      .references(() => officeMembers.id, { onDelete: "restrict" }),
    version: integer("version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_employees_code_unique").on(table.employeeCode),
    uniqueIndex("office_employees_member_unique")
      .on(table.memberId)
      .where(sql`${table.memberId} IS NOT NULL`),
    index("office_employees_status_department_idx").on(table.status, table.department),
    index("office_employees_join_status_idx").on(table.joinDate, table.status),
    check(
      "office_employees_employment_type_check",
      sql`${table.employmentType} IN ('permanent', 'probation', 'contract', 'part_time')`,
    ),
    check(
      "office_employees_status_check",
      sql`${table.status} IN ('active', 'suspended', 'separated')`,
    ),
    check(
      "office_employees_join_date_check",
      sql`${table.joinDate} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`,
    ),
    check(
      "office_employees_separation_date_check",
      sql`${table.separationDate} IS NULL OR (${table.separationDate} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND ${table.separationDate} >= ${table.joinDate})`,
    ),
    check(
      "office_employees_non_separated_date_check",
      sql`${table.status} = 'separated' OR ${table.separationDate} IS NULL`,
    ),
    check(
      "office_employees_separated_date_check",
      sql`${table.status} != 'separated' OR ${table.separationDate} IS NOT NULL`,
    ),
  ],
);

export const officeCompensationProfiles = sqliteTable(
  "office_compensation_profiles",
  {
    id: text("id").primaryKey(),
    employeeId: text("employee_id")
      .notNull()
      .references(() => officeEmployees.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
    effectiveFrom: text("effective_from").notNull(),
    baseSalaryMinor: integer("base_salary_minor").notNull(),
    currency: text("currency").notNull().default("BDT"),
    payFrequency: text("pay_frequency", { enum: ["monthly"] }).notNull().default("monthly"),
    createdByMemberId: text("created_by_member_id")
      .notNull()
      .references(() => officeMembers.id, { onDelete: "restrict" }),
    version: integer("version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_compensation_profiles_employee_effective_unique").on(
      table.employeeId,
      table.effectiveFrom,
    ),
    uniqueIndex("office_compensation_profiles_one_active_unique")
      .on(table.employeeId)
      .where(sql`${table.status} = 'active'`),
    index("office_compensation_profiles_employee_status_idx").on(table.employeeId, table.status),
    index("office_compensation_profiles_effective_idx").on(table.effectiveFrom, table.status),
    check(
      "office_compensation_profiles_status_check",
      sql`${table.status} IN ('active', 'inactive')`,
    ),
    check(
      "office_compensation_profiles_effective_from_check",
      sql`${table.effectiveFrom} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`,
    ),
    check(
      "office_compensation_profiles_base_salary_check",
      sql`${table.baseSalaryMinor} >= 0`,
    ),
    check(
      "office_compensation_profiles_currency_check",
      sql`length(${table.currency}) = 3 AND ${table.currency} = upper(${table.currency})`,
    ),
    check(
      "office_compensation_profiles_pay_frequency_check",
      sql`${table.payFrequency} = 'monthly'`,
    ),
    check("office_compensation_profiles_version_check", sql`${table.version} >= 1`),
  ],
);

export const officeCompensationComponents = sqliteTable(
  "office_compensation_components",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => officeCompensationProfiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["allowance", "deduction"] }).notNull(),
    calculationType: text("calculation_type", {
      enum: ["fixed_minor", "basis_points_of_base"],
    }).notNull(),
    value: integer("value").notNull(),
    status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
    version: integer("version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_compensation_components_profile_name_unique").on(table.profileId, table.name),
    index("office_compensation_components_profile_status_idx").on(table.profileId, table.status),
    check(
      "office_compensation_components_kind_check",
      sql`${table.kind} IN ('allowance', 'deduction')`,
    ),
    check(
      "office_compensation_components_calculation_type_check",
      sql`${table.calculationType} IN ('fixed_minor', 'basis_points_of_base')`,
    ),
    check("office_compensation_components_value_check", sql`${table.value} >= 0`),
    check(
      "office_compensation_components_status_check",
      sql`${table.status} IN ('active', 'inactive')`,
    ),
    check("office_compensation_components_version_check", sql`${table.version} >= 1`),
    check(
      "office_compensation_components_basis_points_check",
      sql`${table.calculationType} != 'basis_points_of_base' OR ${table.value} <= 10000`,
    ),
  ],
);

export const officePayrollRuns = sqliteTable(
  "office_payroll_runs",
  {
    id: text("id").primaryKey(),
    number: text("number").notNull(),
    periodStart: text("period_start").notNull(),
    periodEnd: text("period_end").notNull(),
    currency: text("currency").notNull().default("BDT"),
    status: text("status", {
      enum: ["draft", "pending_approval", "approved", "posted", "cancelled"],
    }).notNull().default("draft"),
    employeeCount: integer("employee_count").notNull(),
    baseSalaryMinor: integer("base_salary_minor").notNull(),
    allowanceMinor: integer("allowance_minor").notNull(),
    deductionMinor: integer("deduction_minor").notNull(),
    grossMinor: integer("gross_minor").notNull(),
    netMinor: integer("net_minor").notNull(),
    settingsSnapshot: text("settings_snapshot").notNull(),
    note: text("note"),
    createdByMemberId: text("created_by_member_id")
      .notNull()
      .references(() => officeMembers.id, { onDelete: "restrict" }),
    approvedByMemberId: text("approved_by_member_id").references(() => officeMembers.id, {
      onDelete: "restrict",
    }),
    postedByMemberId: text("posted_by_member_id").references(() => officeMembers.id, {
      onDelete: "restrict",
    }),
    submittedAt: text("submitted_at"),
    approvedAt: text("approved_at"),
    postedAt: text("posted_at"),
    version: integer("version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_payroll_runs_number_unique").on(table.number),
    uniqueIndex("office_payroll_runs_live_period_unique")
      .on(table.periodStart, table.periodEnd, table.currency)
      .where(sql`${table.status} != 'cancelled'`),
    index("office_payroll_runs_period_status_idx").on(table.periodEnd, table.status),
    index("office_payroll_runs_status_created_idx").on(table.status, table.createdAt),
    check(
      "office_payroll_runs_period_start_check",
      sql`${table.periodStart} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`,
    ),
    check(
      "office_payroll_runs_period_end_check",
      sql`${table.periodEnd} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`,
    ),
    check(
      "office_payroll_runs_currency_check",
      sql`length(${table.currency}) = 3 AND ${table.currency} = upper(${table.currency})`,
    ),
    check(
      "office_payroll_runs_status_check",
      sql`${table.status} IN ('draft', 'pending_approval', 'approved', 'posted', 'cancelled')`,
    ),
    check(
      "office_payroll_runs_employee_count_check",
      sql`${table.employeeCount} BETWEEN 1 AND 100`,
    ),
    check("office_payroll_runs_base_salary_check", sql`${table.baseSalaryMinor} >= 0`),
    check("office_payroll_runs_allowance_check", sql`${table.allowanceMinor} >= 0`),
    check("office_payroll_runs_deduction_check", sql`${table.deductionMinor} >= 0`),
    check("office_payroll_runs_gross_check", sql`${table.grossMinor} >= 0`),
    check("office_payroll_runs_net_check", sql`${table.netMinor} >= 0`),
    check("office_payroll_runs_period_order_check", sql`${table.periodEnd} >= ${table.periodStart}`),
    check(
      "office_payroll_runs_gross_calculation_check",
      sql`${table.grossMinor} = ${table.baseSalaryMinor} + ${table.allowanceMinor}`,
    ),
    check(
      "office_payroll_runs_net_calculation_check",
      sql`${table.netMinor} = ${table.grossMinor} - ${table.deductionMinor} AND ${table.deductionMinor} <= ${table.grossMinor}`,
    ),
    check(
      "office_payroll_runs_state_timestamps_check",
      sql`(
        (${table.status} = 'draft' AND ${table.submittedAt} IS NULL AND ${table.approvedAt} IS NULL AND ${table.postedAt} IS NULL)
        OR (${table.status} = 'pending_approval' AND ${table.submittedAt} IS NOT NULL AND ${table.approvedAt} IS NULL AND ${table.postedAt} IS NULL)
        OR (${table.status} = 'approved' AND ${table.submittedAt} IS NOT NULL AND ${table.approvedAt} IS NOT NULL AND ${table.approvedByMemberId} IS NOT NULL AND ${table.postedAt} IS NULL)
        OR (${table.status} = 'posted' AND ${table.submittedAt} IS NOT NULL AND ${table.approvedAt} IS NOT NULL AND ${table.approvedByMemberId} IS NOT NULL AND ${table.postedAt} IS NOT NULL AND ${table.postedByMemberId} IS NOT NULL)
        OR ${table.status} = 'cancelled'
      )`,
    ),
    check("office_payroll_runs_version_check", sql`${table.version} >= 1`),
  ],
);

export const officePayrollEntries = sqliteTable(
  "office_payroll_entries",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => officePayrollRuns.id, { onDelete: "cascade" }),
    employeeId: text("employee_id")
      .notNull()
      .references(() => officeEmployees.id, { onDelete: "restrict" }),
    employeeSnapshot: text("employee_snapshot").notNull(),
    compensationProfileId: text("compensation_profile_id")
      .notNull()
      .references(() => officeCompensationProfiles.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["included", "held"] }).notNull().default("included"),
    baseSalaryMinor: integer("base_salary_minor").notNull(),
    allowanceMinor: integer("allowance_minor").notNull(),
    deductionMinor: integer("deduction_minor").notNull(),
    grossMinor: integer("gross_minor").notNull(),
    netMinor: integer("net_minor").notNull(),
    componentSnapshot: text("component_snapshot").notNull(),
    version: integer("version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("office_payroll_entries_run_employee_unique").on(table.runId, table.employeeId),
    index("office_payroll_entries_employee_created_idx").on(table.employeeId, table.createdAt),
    index("office_payroll_entries_run_status_idx").on(table.runId, table.status),
    check(
      "office_payroll_entries_status_check",
      sql`${table.status} IN ('included', 'held')`,
    ),
    check("office_payroll_entries_base_salary_check", sql`${table.baseSalaryMinor} >= 0`),
    check("office_payroll_entries_allowance_check", sql`${table.allowanceMinor} >= 0`),
    check("office_payroll_entries_deduction_check", sql`${table.deductionMinor} >= 0`),
    check("office_payroll_entries_gross_check", sql`${table.grossMinor} >= 0`),
    check("office_payroll_entries_net_check", sql`${table.netMinor} >= 0`),
    check(
      "office_payroll_entries_gross_calculation_check",
      sql`${table.grossMinor} = ${table.baseSalaryMinor} + ${table.allowanceMinor}`,
    ),
    check(
      "office_payroll_entries_net_calculation_check",
      sql`${table.netMinor} = ${table.grossMinor} - ${table.deductionMinor} AND ${table.deductionMinor} <= ${table.grossMinor}`,
    ),
    check("office_payroll_entries_version_check", sql`${table.version} >= 1`),
  ],
);
