CREATE TABLE `instructor_adds` (
	`id` text PRIMARY KEY NOT NULL,
	`limit_key` text NOT NULL,
	`week` integer NOT NULL
) WITHOUT ROWID;
--> statement-breakpoint
CREATE INDEX `instructor_adds_key_idx` ON `instructor_adds` (`limit_key`);