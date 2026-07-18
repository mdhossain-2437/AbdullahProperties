CREATE TABLE `office_desktop_pairing_codes` (
	`device_id` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`consumed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `office_desktop_devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_desktop_pairing_codes_hash_unique` ON `office_desktop_pairing_codes` (`code_hash`);--> statement-breakpoint
CREATE INDEX `office_desktop_pairing_codes_expiry_idx` ON `office_desktop_pairing_codes` (`expires_at`,`consumed_at`);--> statement-breakpoint
ALTER TABLE `office_desktop_drafts` ADD `materialized_entity_type` text;--> statement-breakpoint
ALTER TABLE `office_desktop_drafts` ADD `materialized_entity_id` text;--> statement-breakpoint
ALTER TABLE `office_desktop_drafts` ADD `reviewed_by_member_id` text REFERENCES office_members(id);--> statement-breakpoint
ALTER TABLE `office_desktop_drafts` ADD `reviewed_at` text;--> statement-breakpoint
UPDATE `office_desktop_drafts` SET `status` = 'received' WHERE `status` = 'draft';
--> statement-breakpoint
CREATE TABLE `office_desktop_ingress_rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`identity_hash` text NOT NULL,
	`kind` text NOT NULL,
	`window_started_at` text NOT NULL,
	`request_count` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_desktop_ingress_identity_window_unique` ON `office_desktop_ingress_rate_limits` (`identity_hash`,`window_started_at`);--> statement-breakpoint
CREATE INDEX `office_desktop_ingress_window_idx` ON `office_desktop_ingress_rate_limits` (`window_started_at`);
