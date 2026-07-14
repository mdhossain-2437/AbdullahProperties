CREATE TABLE `office_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`summary` text NOT NULL,
	`details` text,
	`outcome` text,
	`occurred_at` text NOT NULL,
	`next_action_at` text,
	`actor_member_id` text,
	`contact_id` text,
	`lead_id` text,
	`land_parcel_id` text,
	`project_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`contact_id`) REFERENCES `office_contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`lead_id`) REFERENCES `office_leads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`land_parcel_id`) REFERENCES `office_land_parcels`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `office_projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `office_activities_contact_occurred_idx` ON `office_activities` (`contact_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `office_activities_lead_occurred_idx` ON `office_activities` (`lead_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `office_activities_project_occurred_idx` ON `office_activities` (`project_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `office_activities_actor_occurred_idx` ON `office_activities` (`actor_member_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `office_approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_by_member_id` text,
	`assigned_to_member_id` text,
	`decided_by_member_id` text,
	`request_note` text,
	`decision_reason` text,
	`requested_at` text NOT NULL,
	`decided_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`requested_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`decided_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `office_approvals_assignee_status_requested_idx` ON `office_approvals` (`assigned_to_member_id`,`status`,`requested_at`);--> statement-breakpoint
CREATE INDEX `office_approvals_entity_status_idx` ON `office_approvals` (`entity_type`,`entity_id`,`status`);--> statement-breakpoint
CREATE INDEX `office_approvals_requester_status_idx` ON `office_approvals` (`requested_by_member_id`,`status`);--> statement-breakpoint
CREATE TABLE `office_audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_member_id` text,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata` text NOT NULL,
	`request_id` text,
	`ip_hash` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `office_audit_events_entity_created_idx` ON `office_audit_events` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `office_audit_events_actor_created_idx` ON `office_audit_events` (`actor_member_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `office_audit_events_action_created_idx` ON `office_audit_events` (`action`,`created_at`);--> statement-breakpoint
CREATE TABLE `office_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`display_name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`email` text,
	`normalized_email` text,
	`phone` text,
	`normalized_phone` text,
	`organization_name` text,
	`address` text,
	`notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`assigned_member_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by_email` text NOT NULL,
	`updated_by_email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`assigned_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `office_contacts_name_idx` ON `office_contacts` (`normalized_name`);--> statement-breakpoint
CREATE INDEX `office_contacts_phone_idx` ON `office_contacts` (`normalized_phone`);--> statement-breakpoint
CREATE INDEX `office_contacts_email_idx` ON `office_contacts` (`normalized_email`);--> statement-breakpoint
CREATE INDEX `office_contacts_kind_status_idx` ON `office_contacts` (`kind`,`status`);--> statement-breakpoint
CREATE INDEX `office_contacts_assignee_status_idx` ON `office_contacts` (`assigned_member_id`,`status`);--> statement-breakpoint
CREATE TABLE `office_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`object_key` text NOT NULL,
	`original_filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`checksum_sha256` text NOT NULL,
	`classification` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`review_status` text DEFAULT 'pending' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`supersedes_document_id` text,
	`uploaded_by_member_id` text,
	`reviewed_by_member_id` text,
	`review_note` text,
	`reviewed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`uploaded_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewed_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_documents_object_key_unique` ON `office_documents` (`object_key`);--> statement-breakpoint
CREATE INDEX `office_documents_entity_created_idx` ON `office_documents` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `office_documents_classification_review_idx` ON `office_documents` (`classification`,`review_status`);--> statement-breakpoint
CREATE INDEX `office_documents_checksum_idx` ON `office_documents` (`checksum_sha256`);--> statement-breakpoint
CREATE TABLE `office_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`project_id` text,
	`vendor_contact_id` text,
	`amount_minor` integer NOT NULL,
	`currency` text DEFAULT 'BDT' NOT NULL,
	`incurred_at` text NOT NULL,
	`receipt_document_id` text,
	`submitted_by_member_id` text,
	`submitted_at` text,
	`approved_by_member_id` text,
	`approved_at` text,
	`paid_at` text,
	`rejection_reason` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by_email` text NOT NULL,
	`updated_by_email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `office_projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`vendor_contact_id`) REFERENCES `office_contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`submitted_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_expenses_number_unique` ON `office_expenses` (`number`);--> statement-breakpoint
CREATE INDEX `office_expenses_status_incurred_idx` ON `office_expenses` (`status`,`incurred_at`);--> statement-breakpoint
CREATE INDEX `office_expenses_project_status_idx` ON `office_expenses` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `office_expenses_submitter_status_idx` ON `office_expenses` (`submitted_by_member_id`,`status`);--> statement-breakpoint
CREATE TABLE `office_invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`position` integer NOT NULL,
	`description` text NOT NULL,
	`quantity_millis` integer NOT NULL,
	`unit_price_minor` integer NOT NULL,
	`discount_minor` integer DEFAULT 0 NOT NULL,
	`tax_rate_bps` integer DEFAULT 0 NOT NULL,
	`subtotal_minor` integer NOT NULL,
	`tax_minor` integer NOT NULL,
	`total_minor` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `office_invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_invoice_items_invoice_position_unique` ON `office_invoice_items` (`invoice_id`,`position`);--> statement-breakpoint
CREATE INDEX `office_invoice_items_invoice_idx` ON `office_invoice_items` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `office_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text,
	`branch_code` text DEFAULT 'JOY' NOT NULL,
	`fiscal_year` text,
	`sequence_value` integer,
	`contact_id` text NOT NULL,
	`project_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`issue_date` text,
	`due_date` text,
	`currency` text DEFAULT 'BDT' NOT NULL,
	`subtotal_minor` integer DEFAULT 0 NOT NULL,
	`discount_minor` integer DEFAULT 0 NOT NULL,
	`tax_minor` integer DEFAULT 0 NOT NULL,
	`total_minor` integer DEFAULT 0 NOT NULL,
	`paid_minor` integer DEFAULT 0 NOT NULL,
	`balance_minor` integer DEFAULT 0 NOT NULL,
	`customer_snapshot` text NOT NULL,
	`company_snapshot` text NOT NULL,
	`tax_snapshot` text,
	`terms_snapshot` text NOT NULL,
	`notes` text,
	`approved_by_member_id` text,
	`approved_at` text,
	`posted_by_member_id` text,
	`posted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by_email` text NOT NULL,
	`updated_by_email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `office_contacts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`project_id`) REFERENCES `office_projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`posted_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_invoices_number_unique` ON `office_invoices` (`number`);--> statement-breakpoint
CREATE INDEX `office_invoices_status_due_idx` ON `office_invoices` (`status`,`due_date`);--> statement-breakpoint
CREATE INDEX `office_invoices_contact_created_idx` ON `office_invoices` (`contact_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `office_invoices_project_status_idx` ON `office_invoices` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `office_invoices_fiscal_sequence_idx` ON `office_invoices` (`branch_code`,`fiscal_year`,`sequence_value`);--> statement-breakpoint
CREATE TABLE `office_land_parcels` (
	`id` text PRIMARY KEY NOT NULL,
	`reference_code` text NOT NULL,
	`title` text NOT NULL,
	`primary_landowner_contact_id` text,
	`stage` text DEFAULT 'lead' NOT NULL,
	`review_status` text DEFAULT 'not_started' NOT NULL,
	`address` text NOT NULL,
	`district` text DEFAULT 'Joypurhat' NOT NULL,
	`upazila` text,
	`union_or_ward` text,
	`mouza` text,
	`jl_number` text,
	`dag_numbers` text DEFAULT '[]' NOT NULL,
	`khatian_numbers` text DEFAULT '[]' NOT NULL,
	`area_square_feet` integer,
	`area_decimal` text,
	`ownership_share_bps` integer,
	`mutation_status` text,
	`land_tax_status` text,
	`possession_status` text,
	`verification_notes` text,
	`assignee_member_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by_email` text NOT NULL,
	`updated_by_email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`primary_landowner_contact_id`) REFERENCES `office_contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assignee_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_land_parcels_reference_code_unique` ON `office_land_parcels` (`reference_code`);--> statement-breakpoint
CREATE INDEX `office_land_parcels_stage_assignee_idx` ON `office_land_parcels` (`stage`,`assignee_member_id`);--> statement-breakpoint
CREATE INDEX `office_land_parcels_review_stage_idx` ON `office_land_parcels` (`review_status`,`stage`);--> statement-breakpoint
CREATE INDEX `office_land_parcels_location_idx` ON `office_land_parcels` (`district`,`upazila`,`mouza`);--> statement-breakpoint
CREATE INDEX `office_land_parcels_landowner_idx` ON `office_land_parcels` (`primary_landowner_contact_id`);--> statement-breakpoint
CREATE TABLE `office_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_id` text NOT NULL,
	`title` text NOT NULL,
	`source` text,
	`service_type` text NOT NULL,
	`stage` text DEFAULT 'new' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`assignee_member_id` text,
	`estimated_value_minor` integer,
	`currency` text DEFAULT 'BDT' NOT NULL,
	`next_action_at` text,
	`won_at` text,
	`closed_at` text,
	`lost_reason` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by_email` text NOT NULL,
	`updated_by_email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`contact_id`) REFERENCES `office_contacts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`assignee_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `office_leads_stage_assignee_next_action_idx` ON `office_leads` (`stage`,`assignee_member_id`,`next_action_at`);--> statement-breakpoint
CREATE INDEX `office_leads_contact_created_idx` ON `office_leads` (`contact_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `office_leads_priority_stage_idx` ON `office_leads` (`priority`,`stage`);--> statement-breakpoint
CREATE TABLE `office_members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`normalized_email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`invited_by_member_id` text,
	`last_seen_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`invited_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_members_normalized_email_unique` ON `office_members` (`normalized_email`);--> statement-breakpoint
CREATE INDEX `office_members_status_role_idx` ON `office_members` (`status`,`role`);--> statement-breakpoint
CREATE TABLE `office_milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'not_started' NOT NULL,
	`owner_member_id` text,
	`due_at` text,
	`completed_at` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `office_projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `office_milestones_project_status_due_idx` ON `office_milestones` (`project_id`,`status`,`due_at`);--> statement-breakpoint
CREATE INDEX `office_milestones_owner_status_due_idx` ON `office_milestones` (`owner_member_id`,`status`,`due_at`);--> statement-breakpoint
CREATE TABLE `office_payment_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text NOT NULL,
	`invoice_id` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`created_by_email` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `office_payments`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`invoice_id`) REFERENCES `office_invoices`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_payment_allocations_payment_invoice_unique` ON `office_payment_allocations` (`payment_id`,`invoice_id`);--> statement-breakpoint
CREATE INDEX `office_payment_allocations_invoice_idx` ON `office_payment_allocations` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `office_payment_allocations_payment_idx` ON `office_payment_allocations` (`payment_id`);--> statement-breakpoint
CREATE TABLE `office_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt_number` text,
	`branch_code` text DEFAULT 'JOY' NOT NULL,
	`fiscal_year` text,
	`sequence_value` integer,
	`contact_id` text NOT NULL,
	`project_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`method` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`currency` text DEFAULT 'BDT' NOT NULL,
	`paid_at` text NOT NULL,
	`reference` text,
	`note` text,
	`received_by_member_id` text,
	`posted_by_member_id` text,
	`posted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by_email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `office_contacts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`project_id`) REFERENCES `office_projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`received_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`posted_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_payments_receipt_number_unique` ON `office_payments` (`receipt_number`);--> statement-breakpoint
CREATE INDEX `office_payments_status_paid_at_idx` ON `office_payments` (`status`,`paid_at`);--> statement-breakpoint
CREATE INDEX `office_payments_contact_paid_at_idx` ON `office_payments` (`contact_id`,`paid_at`);--> statement-breakpoint
CREATE INDEX `office_payments_project_status_idx` ON `office_payments` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `office_payments_fiscal_sequence_idx` ON `office_payments` (`branch_code`,`fiscal_year`,`sequence_value`);--> statement-breakpoint
CREATE TABLE `office_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`project_type` text NOT NULL,
	`status` text DEFAULT 'feasibility' NOT NULL,
	`land_parcel_id` text,
	`customer_contact_id` text,
	`manager_member_id` text,
	`address` text NOT NULL,
	`district` text DEFAULT 'Joypurhat' NOT NULL,
	`upazila` text,
	`summary` text,
	`risk_level` text DEFAULT 'low' NOT NULL,
	`progress_bps` integer DEFAULT 0 NOT NULL,
	`budget_minor` integer,
	`currency` text DEFAULT 'BDT' NOT NULL,
	`start_at` text,
	`target_end_at` text,
	`actual_end_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by_email` text NOT NULL,
	`updated_by_email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`land_parcel_id`) REFERENCES `office_land_parcels`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`customer_contact_id`) REFERENCES `office_contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`manager_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_projects_code_unique` ON `office_projects` (`code`);--> statement-breakpoint
CREATE INDEX `office_projects_status_manager_idx` ON `office_projects` (`status`,`manager_member_id`);--> statement-breakpoint
CREATE INDEX `office_projects_land_parcel_idx` ON `office_projects` (`land_parcel_id`);--> statement-breakpoint
CREATE INDEX `office_projects_customer_idx` ON `office_projects` (`customer_contact_id`);--> statement-breakpoint
CREATE INDEX `office_projects_risk_status_idx` ON `office_projects` (`risk_level`,`status`);--> statement-breakpoint
CREATE TABLE `office_sequences` (
	`id` text PRIMARY KEY NOT NULL,
	`branch_code` text NOT NULL,
	`fiscal_year` text NOT NULL,
	`document_type` text NOT NULL,
	`current_value` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_sequences_scope_unique` ON `office_sequences` (`branch_code`,`fiscal_year`,`document_type`);--> statement-breakpoint
CREATE TABLE `office_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'open' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`assignee_member_id` text,
	`reporter_member_id` text,
	`contact_id` text,
	`lead_id` text,
	`land_parcel_id` text,
	`project_id` text,
	`due_at` text,
	`completed_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`assignee_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reporter_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`contact_id`) REFERENCES `office_contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`lead_id`) REFERENCES `office_leads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`land_parcel_id`) REFERENCES `office_land_parcels`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `office_projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `office_tasks_assignee_status_due_idx` ON `office_tasks` (`assignee_member_id`,`status`,`due_at`);--> statement-breakpoint
CREATE INDEX `office_tasks_project_status_idx` ON `office_tasks` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `office_tasks_lead_status_idx` ON `office_tasks` (`lead_id`,`status`);--> statement-breakpoint
CREATE INDEX `office_tasks_land_status_idx` ON `office_tasks` (`land_parcel_id`,`status`);