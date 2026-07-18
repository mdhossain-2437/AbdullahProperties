CREATE TABLE `office_desktop_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`name` text NOT NULL,
	`platform` text NOT NULL,
	`token_hash` text NOT NULL,
	`token_prefix` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`expires_at` text NOT NULL,
	`last_seen_at` text,
	`created_at` text NOT NULL,
	`revoked_at` text,
	`revoked_by_email` text,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_desktop_devices_token_hash_unique` ON `office_desktop_devices` (`token_hash`);--> statement-breakpoint
CREATE INDEX `office_desktop_devices_member_status_idx` ON `office_desktop_devices` (`member_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `office_desktop_devices_status_expiry_idx` ON `office_desktop_devices` (`status`,`expires_at`);--> statement-breakpoint
CREATE TABLE `office_desktop_drafts` (
	`aggregate_id` text PRIMARY KEY NOT NULL,
	`aggregate_type` text NOT NULL,
	`draft_id` text NOT NULL,
	`draft_local_revision` integer NOT NULL,
	`client_operation_id` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`operation_hash` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`server_version` integer DEFAULT 1 NOT NULL,
	`source_device_id` text NOT NULL,
	`created_by_member_id` text NOT NULL,
	`created_by_email` text NOT NULL,
	`client_created_at` text NOT NULL,
	`accepted_at` text NOT NULL,
	FOREIGN KEY (`source_device_id`) REFERENCES `office_desktop_devices`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_desktop_drafts_client_operation_unique` ON `office_desktop_drafts` (`client_operation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `office_desktop_drafts_idempotency_unique` ON `office_desktop_drafts` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `office_desktop_drafts_type_accepted_idx` ON `office_desktop_drafts` (`aggregate_type`,`accepted_at`);--> statement-breakpoint
CREATE INDEX `office_desktop_drafts_device_accepted_idx` ON `office_desktop_drafts` (`source_device_id`,`accepted_at`);--> statement-breakpoint
CREATE TABLE `office_desktop_rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`window_started_at` text NOT NULL,
	`request_count` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `office_desktop_devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_desktop_rate_limits_device_window_unique` ON `office_desktop_rate_limits` (`device_id`,`window_started_at`);--> statement-breakpoint
CREATE INDEX `office_desktop_rate_limits_window_idx` ON `office_desktop_rate_limits` (`window_started_at`);
