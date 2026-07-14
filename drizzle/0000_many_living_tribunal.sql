CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_events_entity_created_idx` ON `audit_events` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `content_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`verification` text DEFAULT 'editorial' NOT NULL,
	`seo_title` text NOT NULL,
	`seo_description` text NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`published_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_entries_type_slug_unique` ON `content_entries` (`type`,`slug`);--> statement-breakpoint
CREATE INDEX `content_entries_publication_idx` ON `content_entries` (`type`,`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `content_entries_featured_idx` ON `content_entries` (`status`,`featured`,`published_at`);--> statement-breakpoint
CREATE TABLE `content_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`version` integer NOT NULL,
	`snapshot` text NOT NULL,
	`actor_email` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `content_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_revisions_entry_version_unique` ON `content_revisions` (`entry_id`,`version`);