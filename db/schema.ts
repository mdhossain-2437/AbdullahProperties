import { foreignKey, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
    documentType: text("document_type", { enum: ["invoice", "receipt", "expense"] }).notNull(),
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
