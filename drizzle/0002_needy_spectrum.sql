CREATE TABLE `office_contact_preferences` (
	`contact_id` text PRIMARY KEY NOT NULL,
	`preferred_locale` text DEFAULT 'bn' NOT NULL,
	`transactional_email_enabled` integer DEFAULT true NOT NULL,
	`transactional_sms_enabled` integer DEFAULT true NOT NULL,
	`updated_by_email` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `office_contacts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `office_contact_preferences_locale_idx` ON `office_contact_preferences` (`preferred_locale`);--> statement-breakpoint
CREATE TABLE `office_notice_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`notice_id` text NOT NULL,
	`version` integer NOT NULL,
	`snapshot` text NOT NULL,
	`actor_email` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`notice_id`) REFERENCES `office_notices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_notice_revisions_notice_version_unique` ON `office_notice_revisions` (`notice_id`,`version`);--> statement-breakpoint
CREATE INDEX `office_notice_revisions_notice_created_idx` ON `office_notice_revisions` (`notice_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `office_notices` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text,
	`branch_code` text DEFAULT 'JOY' NOT NULL,
	`fiscal_year` text,
	`sequence_value` integer,
	`kind` text DEFAULT 'general' NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`contact_id` text,
	`project_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`recipient_snapshot` text,
	`company_snapshot` text NOT NULL,
	`issue_date` text,
	`effective_date` text,
	`expires_at` text,
	`tracking_code` text,
	`tracking_issued_at` text,
	`public_access_revoked_at` text,
	`template_version` text DEFAULT 'ap-notice-v1' NOT NULL,
	`issued_by_member_id` text,
	`issued_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by_email` text NOT NULL,
	`updated_by_email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`contact_id`) REFERENCES `office_contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `office_projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`issued_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_notices_number_unique` ON `office_notices` (`number`);--> statement-breakpoint
CREATE UNIQUE INDEX `office_notices_tracking_code_unique` ON `office_notices` (`tracking_code`);--> statement-breakpoint
CREATE INDEX `office_notices_status_issue_idx` ON `office_notices` (`status`,`issue_date`);--> statement-breakpoint
CREATE INDEX `office_notices_contact_created_idx` ON `office_notices` (`contact_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `office_notices_project_status_idx` ON `office_notices` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `office_notices_fiscal_sequence_idx` ON `office_notices` (`branch_code`,`fiscal_year`,`sequence_value`);--> statement-breakpoint
CREATE TABLE `office_notification_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`outbox_id` text NOT NULL,
	`attempt_no` integer NOT NULL,
	`status` text NOT NULL,
	`provider_reference` text,
	`error_code` text,
	`error_summary` text,
	`started_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`outbox_id`) REFERENCES `office_notification_outbox`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_notification_attempts_outbox_attempt_unique` ON `office_notification_attempts` (`outbox_id`,`attempt_no`);--> statement-breakpoint
CREATE INDEX `office_notification_attempts_outbox_started_idx` ON `office_notification_attempts` (`outbox_id`,`started_at`);--> statement-breakpoint
CREATE TABLE `office_notification_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`channel` text NOT NULL,
	`recipient` text NOT NULL,
	`template` text NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`idempotency_key` text NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 5 NOT NULL,
	`available_at` text NOT NULL,
	`claimed_at` text,
	`claim_token` text,
	`provider_reference` text,
	`error_code` text,
	`error_summary` text,
	`sent_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_notification_outbox_idempotency_unique` ON `office_notification_outbox` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `office_notification_outbox_dispatch_idx` ON `office_notification_outbox` (`status`,`available_at`,`created_at`);--> statement-breakpoint
CREATE INDEX `office_notification_outbox_entity_idx` ON `office_notification_outbox` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `office_invoices` ADD `kind` text DEFAULT 'service' NOT NULL;--> statement-breakpoint
ALTER TABLE `office_invoices` ADD `purpose` text DEFAULT 'Property services' NOT NULL;--> statement-breakpoint
ALTER TABLE `office_invoices` ADD `locale` text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `office_invoices` ADD `tracking_code` text;--> statement-breakpoint
ALTER TABLE `office_invoices` ADD `tracking_issued_at` text;--> statement-breakpoint
ALTER TABLE `office_invoices` ADD `public_access_revoked_at` text;--> statement-breakpoint
ALTER TABLE `office_invoices` ADD `template_version` text DEFAULT 'ap-invoice-v1' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `office_invoices_tracking_code_unique` ON `office_invoices` (`tracking_code`);--> statement-breakpoint
ALTER TABLE `office_payments` ADD `client_operation_id` text;--> statement-breakpoint
ALTER TABLE `office_payments` ADD `locale` text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `office_payments` ADD `tracking_code` text;--> statement-breakpoint
ALTER TABLE `office_payments` ADD `tracking_issued_at` text;--> statement-breakpoint
ALTER TABLE `office_payments` ADD `public_access_revoked_at` text;--> statement-breakpoint
ALTER TABLE `office_payments` ADD `template_version` text DEFAULT 'ap-receipt-v1' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `office_payments_client_operation_unique` ON `office_payments` (`client_operation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `office_payments_tracking_code_unique` ON `office_payments` (`tracking_code`);