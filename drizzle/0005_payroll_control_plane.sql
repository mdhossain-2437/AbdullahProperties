CREATE TABLE `office_employees` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_code` text NOT NULL,
	`member_id` text,
	`display_name` text NOT NULL,
	`designation` text NOT NULL,
	`department` text NOT NULL,
	`employment_type` text NOT NULL CHECK (`employment_type` IN ('permanent', 'probation', 'contract', 'part_time')),
	`status` text DEFAULT 'active' NOT NULL CHECK (`status` IN ('active', 'suspended', 'separated')),
	`join_date` text NOT NULL CHECK (`join_date` GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	`separation_date` text,
	`created_by_member_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL CHECK (`version` >= 1),
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CHECK (`separation_date` IS NULL OR (`separation_date` GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND `separation_date` >= `join_date`)),
	CHECK (`status` = 'separated' OR `separation_date` IS NULL),
	CHECK (`status` != 'separated' OR `separation_date` IS NOT NULL),
	FOREIGN KEY (`member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_employees_code_unique` ON `office_employees` (`employee_code`);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_employees_member_unique` ON `office_employees` (`member_id`) WHERE `member_id` IS NOT NULL;
--> statement-breakpoint
CREATE INDEX `office_employees_status_department_idx` ON `office_employees` (`status`, `department`);
--> statement-breakpoint
CREATE INDEX `office_employees_join_status_idx` ON `office_employees` (`join_date`, `status`);
--> statement-breakpoint
CREATE TABLE `office_compensation_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL CHECK (`status` IN ('active', 'inactive')),
	`effective_from` text NOT NULL CHECK (`effective_from` GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	`base_salary_minor` integer NOT NULL CHECK (`base_salary_minor` >= 0),
	`currency` text DEFAULT 'BDT' NOT NULL CHECK (length(`currency`) = 3 AND `currency` = upper(`currency`)),
	`pay_frequency` text DEFAULT 'monthly' NOT NULL CHECK (`pay_frequency` = 'monthly'),
	`created_by_member_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL CHECK (`version` >= 1),
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `office_employees`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_compensation_profiles_employee_effective_unique` ON `office_compensation_profiles` (`employee_id`, `effective_from`);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_compensation_profiles_one_active_unique` ON `office_compensation_profiles` (`employee_id`) WHERE `status` = 'active';
--> statement-breakpoint
CREATE INDEX `office_compensation_profiles_employee_status_idx` ON `office_compensation_profiles` (`employee_id`, `status`);
--> statement-breakpoint
CREATE INDEX `office_compensation_profiles_effective_idx` ON `office_compensation_profiles` (`effective_from`, `status`);
--> statement-breakpoint
CREATE TABLE `office_compensation_components` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL CHECK (`kind` IN ('allowance', 'deduction')),
	`calculation_type` text NOT NULL CHECK (`calculation_type` IN ('fixed_minor', 'basis_points_of_base')),
	`value` integer NOT NULL CHECK (`value` >= 0),
	`status` text DEFAULT 'active' NOT NULL CHECK (`status` IN ('active', 'inactive')),
	`version` integer DEFAULT 1 NOT NULL CHECK (`version` >= 1),
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CHECK (`calculation_type` != 'basis_points_of_base' OR `value` <= 10000),
	FOREIGN KEY (`profile_id`) REFERENCES `office_compensation_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_compensation_components_profile_name_unique` ON `office_compensation_components` (`profile_id`, `name`);
--> statement-breakpoint
CREATE INDEX `office_compensation_components_profile_status_idx` ON `office_compensation_components` (`profile_id`, `status`);
--> statement-breakpoint
CREATE TABLE `office_payroll_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`period_start` text NOT NULL CHECK (`period_start` GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	`period_end` text NOT NULL CHECK (`period_end` GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	`currency` text DEFAULT 'BDT' NOT NULL CHECK (length(`currency`) = 3 AND `currency` = upper(`currency`)),
	`status` text DEFAULT 'draft' NOT NULL CHECK (`status` IN ('draft', 'pending_approval', 'approved', 'posted', 'cancelled')),
	`employee_count` integer NOT NULL CHECK (`employee_count` BETWEEN 1 AND 100),
	`base_salary_minor` integer NOT NULL CHECK (`base_salary_minor` >= 0),
	`allowance_minor` integer NOT NULL CHECK (`allowance_minor` >= 0),
	`deduction_minor` integer NOT NULL CHECK (`deduction_minor` >= 0),
	`gross_minor` integer NOT NULL CHECK (`gross_minor` >= 0),
	`net_minor` integer NOT NULL CHECK (`net_minor` >= 0),
	`settings_snapshot` text NOT NULL,
	`note` text,
	`created_by_member_id` text NOT NULL,
	`approved_by_member_id` text,
	`posted_by_member_id` text,
	`submitted_at` text,
	`approved_at` text,
	`posted_at` text,
	`version` integer DEFAULT 1 NOT NULL CHECK (`version` >= 1),
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CHECK (`period_end` >= `period_start`),
	CHECK (`gross_minor` = `base_salary_minor` + `allowance_minor`),
	CHECK (`net_minor` = `gross_minor` - `deduction_minor` AND `deduction_minor` <= `gross_minor`),
	CHECK (
		(`status` = 'draft' AND `submitted_at` IS NULL AND `approved_at` IS NULL AND `posted_at` IS NULL)
		OR (`status` = 'pending_approval' AND `submitted_at` IS NOT NULL AND `approved_at` IS NULL AND `posted_at` IS NULL)
		OR (`status` = 'approved' AND `submitted_at` IS NOT NULL AND `approved_at` IS NOT NULL AND `approved_by_member_id` IS NOT NULL AND `posted_at` IS NULL)
		OR (`status` = 'posted' AND `submitted_at` IS NOT NULL AND `approved_at` IS NOT NULL AND `approved_by_member_id` IS NOT NULL AND `posted_at` IS NOT NULL AND `posted_by_member_id` IS NOT NULL)
		OR `status` = 'cancelled'
	),
	FOREIGN KEY (`created_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`approved_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`posted_by_member_id`) REFERENCES `office_members`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_payroll_runs_number_unique` ON `office_payroll_runs` (`number`);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_payroll_runs_live_period_unique` ON `office_payroll_runs` (`period_start`, `period_end`, `currency`) WHERE `status` != 'cancelled';
--> statement-breakpoint
CREATE INDEX `office_payroll_runs_period_status_idx` ON `office_payroll_runs` (`period_end`, `status`);
--> statement-breakpoint
CREATE INDEX `office_payroll_runs_status_created_idx` ON `office_payroll_runs` (`status`, `created_at`);
--> statement-breakpoint
CREATE TABLE `office_payroll_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`employee_snapshot` text NOT NULL,
	`compensation_profile_id` text NOT NULL,
	`status` text DEFAULT 'included' NOT NULL CHECK (`status` IN ('included', 'held')),
	`base_salary_minor` integer NOT NULL CHECK (`base_salary_minor` >= 0),
	`allowance_minor` integer NOT NULL CHECK (`allowance_minor` >= 0),
	`deduction_minor` integer NOT NULL CHECK (`deduction_minor` >= 0),
	`gross_minor` integer NOT NULL CHECK (`gross_minor` >= 0),
	`net_minor` integer NOT NULL CHECK (`net_minor` >= 0),
	`component_snapshot` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL CHECK (`version` >= 1),
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CHECK (`gross_minor` = `base_salary_minor` + `allowance_minor`),
	CHECK (`net_minor` = `gross_minor` - `deduction_minor` AND `deduction_minor` <= `gross_minor`),
	FOREIGN KEY (`run_id`) REFERENCES `office_payroll_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`employee_id`) REFERENCES `office_employees`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`compensation_profile_id`) REFERENCES `office_compensation_profiles`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `office_payroll_entries_run_employee_unique` ON `office_payroll_entries` (`run_id`, `employee_id`);
--> statement-breakpoint
CREATE INDEX `office_payroll_entries_employee_created_idx` ON `office_payroll_entries` (`employee_id`, `created_at`);
--> statement-breakpoint
CREATE INDEX `office_payroll_entries_run_status_idx` ON `office_payroll_entries` (`run_id`, `status`);
