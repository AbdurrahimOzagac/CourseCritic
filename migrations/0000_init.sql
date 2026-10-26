CREATE TABLE `banned_emails` (
	`email_hash` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `course_equivalents` (
	`course_a` text NOT NULL,
	`course_b` text NOT NULL,
	PRIMARY KEY(`course_a`, `course_b`),
	FOREIGN KEY (`course_a`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_b`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "equiv_order" CHECK("course_equivalents"."course_a" < "course_equivalents"."course_b")
);
--> statement-breakpoint
CREATE TABLE `course_instructors` (
	`course_id` text NOT NULL,
	`instructor_id` text NOT NULL,
	PRIMARY KEY(`course_id`, `instructor_id`),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `course_suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text,
	`payload` text NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`department_id` text NOT NULL,
	`code` text NOT NULL,
	`slug` text NOT NULL,
	`name_tr` text NOT NULL,
	`name_en` text,
	`description_tr` text,
	`description_en` text,
	`credits` integer,
	`ects` integer,
	`year_level` integer,
	`kind` text,
	`prerequisites` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_slug_unique` ON `courses` (`slug`);--> statement-breakpoint
CREATE INDEX `courses_department_idx` ON `courses` (`department_id`);--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`university` text NOT NULL,
	`name_tr` text NOT NULL,
	`name_en` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `departments_code_unique` ON `departments` (`code`);--> statement-breakpoint
CREATE TABLE `instructors` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'approved' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instructors_slug_unique` ON `instructors` (`slug`);--> statement-breakpoint
CREATE TABLE `login_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`email_hash` text NOT NULL,
	`code_hash` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `login_codes_email_idx` ON `login_codes` (`email_hash`);--> statement-breakpoint
CREATE TABLE `reports` (
	`review_id` text NOT NULL,
	`user_id` text NOT NULL,
	`reason` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`review_id`, `user_id`),
	FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`instructor_id` text NOT NULL,
	`academic_year` integer NOT NULL,
	`term` text NOT NULL,
	`difficulty` integer NOT NULL,
	`workload` integer NOT NULL,
	`teaching_value` integer NOT NULL,
	`instructor_clarity` integer NOT NULL,
	`instructor_attitude` integer NOT NULL,
	`instructor_expertise` integer NOT NULL,
	`attempts` integer,
	`outcome` text,
	`class_average` integer,
	`curve` text,
	`comment` text,
	`status` text DEFAULT 'published' NOT NULL,
	`report_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "reviews_scale_range" CHECK("reviews"."difficulty" BETWEEN 1 AND 7 AND "reviews"."workload" BETWEEN 1 AND 7 AND "reviews"."teaching_value" BETWEEN 1 AND 7 AND "reviews"."instructor_clarity" BETWEEN 1 AND 7 AND "reviews"."instructor_attitude" BETWEEN 1 AND 7 AND "reviews"."instructor_expertise" BETWEEN 1 AND 7)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_unique_offering` ON `reviews` (`user_id`,`course_id`,`instructor_id`,`academic_year`,`term`);--> statement-breakpoint
CREATE INDEX `reviews_course_idx` ON `reviews` (`course_id`);--> statement-breakpoint
CREATE INDEX `reviews_instructor_idx` ON `reviews` (`instructor_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email_hash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_hash_unique` ON `users` (`email_hash`);