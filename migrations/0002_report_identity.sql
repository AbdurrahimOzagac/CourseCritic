PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_reports` (
	`review_id` text NOT NULL,
	`reporter_key` text NOT NULL,
	`user_id` text,
	`reason` text,
	`dismissed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`review_id`, `reporter_key`),
	FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
-- Eski bildirimlerin e-posta özeti bilinmediği için kullanıcı kimliğinden geçici bir anahtar türetilir.
INSERT INTO `__new_reports`("review_id", "reporter_key", "user_id", "reason", "dismissed", "created_at") SELECT "review_id", 'legacy:' || "user_id", "user_id", "reason", false, "created_at" FROM `reports`;--> statement-breakpoint
DROP TABLE `reports`;--> statement-breakpoint
ALTER TABLE `__new_reports` RENAME TO `reports`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `reports_user_idx` ON `reports` (`user_id`);