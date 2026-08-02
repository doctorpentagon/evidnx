CREATE TABLE `analyses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`dataset_id` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`config` text NOT NULL,
	`results` text,
	`assumptions` text,
	`interpretation` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dataset_columns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dataset_id` integer NOT NULL,
	`name` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`measurement_type` text DEFAULT 'nominal' NOT NULL,
	`value_type` text DEFAULT 'string' NOT NULL,
	FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dataset_rows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dataset_id` integer NOT NULL,
	`row_index` integer NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `datasets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`source_questionnaire_id` integer,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_questionnaire_id`) REFERENCES `questionnaires`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text DEFAULT 'local' NOT NULL,
	`name` text NOT NULL,
	`topic` text,
	`project_type` text DEFAULT 'research' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `questionnaires` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`share_slug` text NOT NULL,
	`target_sample_size` integer,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `questionnaires_share_slug_unique` ON `questionnaires` (`share_slug`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`questionnaire_id` integer NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`type` text NOT NULL,
	`text` text NOT NULL,
	`help_text` text,
	`options` text,
	`required` integer DEFAULT true NOT NULL,
	`variable_name` text NOT NULL,
	FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `references` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`authors` text NOT NULL,
	`year` integer,
	`journal` text,
	`doi` text,
	`url` text,
	`notes` text,
	`pdf_path` text,
	`tags` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`sections` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `response_answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`response_id` integer NOT NULL,
	`question_id` integer NOT NULL,
	`value` text,
	FOREIGN KEY (`response_id`) REFERENCES `responses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `responses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`questionnaire_id` integer NOT NULL,
	`submitted_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires`(`id`) ON UPDATE no action ON DELETE cascade
);
