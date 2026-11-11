-- Kimlikle ilgili tabloları WITHOUT ROWID olarak yeniden kurar: satırlar rastgele UUID sırasıyla saklanır ve dışa
-- aktarılır, eklenme sırasından "kim ne zaman giriş yaptı / yazdı" çıkarılamaz. Ayrıca:
-- - users, banned_emails, reports: kimseye gerekmeyen created_at kaldırılır; reports.user_id kaldırılır.
-- - login_codes: hesap özeti yerine ayrı bir sınır anahtarı + şifreli hesap özeti (eski kodlar atılır, en fazla 1 saatlik).
-- - sessions: "açık kalsın" bilgisi (persistent). Mevcut oturumlar kalıcı kabul edilir.
--
-- Sıra önemli: SQLite'ta üst tablo silinirken bağlı satırlar ON DELETE CASCADE ile silinir. Bu yüzden önce yeni
-- tablolar kurulup doldurulur, eski alt tablolar üst tablolardan önce silinir, en son yeni tablolar yeniden adlandırılır
-- (yeniden adlandırma, diğer tablolardaki yabancı anahtar başvurularını da günceller).
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email_hash` text NOT NULL
) WITHOUT ROWID;--> statement-breakpoint
INSERT INTO `__new_users` (`id`, `email_hash`) SELECT `id`, `email_hash` FROM `users`;--> statement-breakpoint
CREATE TABLE `__new_reviews` (
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
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `__new_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "reviews_scale_range" CHECK("difficulty" BETWEEN 1 AND 7 AND "workload" BETWEEN 1 AND 7 AND "teaching_value" BETWEEN 1 AND 7 AND "instructor_clarity" BETWEEN 1 AND 7 AND "instructor_attitude" BETWEEN 1 AND 7 AND "instructor_expertise" BETWEEN 1 AND 7)
) WITHOUT ROWID;--> statement-breakpoint
INSERT INTO `__new_reviews` SELECT `id`, `user_id`, `course_id`, `instructor_id`, `academic_year`, `term`, `difficulty`, `workload`, `teaching_value`, `instructor_clarity`, `instructor_attitude`, `instructor_expertise`, `attempts`, `outcome`, `class_average`, `curve`, `comment`, `status`, `report_count`, `created_at`, `updated_at` FROM `reviews`;--> statement-breakpoint
CREATE TABLE `__new_reports` (
	`review_id` text NOT NULL,
	`reporter_key` text NOT NULL,
	`reason` text,
	`dismissed` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`review_id`, `reporter_key`),
	FOREIGN KEY (`review_id`) REFERENCES `__new_reviews`(`id`) ON UPDATE no action ON DELETE cascade
) WITHOUT ROWID;--> statement-breakpoint
-- Eski geçici anahtarlar ('legacy:' + kullanıcı kimliği) kimliği açık taşıyordu: rastgele değerle değiştirilir
INSERT INTO `__new_reports` SELECT `review_id`, CASE WHEN `reporter_key` LIKE 'legacy:%' THEN 'legacy:' || lower(hex(randomblob(16))) ELSE `reporter_key` END, `reason`, `dismissed` FROM `reports`;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`persistent` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `__new_users`(`id`) ON UPDATE no action ON DELETE cascade
) WITHOUT ROWID;--> statement-breakpoint
INSERT INTO `__new_sessions` SELECT `id`, `user_id`, `expires_at`, true FROM `sessions`;--> statement-breakpoint
CREATE TABLE `__new_course_suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text,
	`payload` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `__new_users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
) WITHOUT ROWID;--> statement-breakpoint
INSERT INTO `__new_course_suggestions` SELECT `id`, `user_id`, `course_id`, `payload`, `note`, `created_at` FROM `course_suggestions`;--> statement-breakpoint
CREATE TABLE `__new_banned_emails` (
	`email_hash` text PRIMARY KEY NOT NULL
) WITHOUT ROWID;--> statement-breakpoint
INSERT INTO `__new_banned_emails` SELECT `email_hash` FROM `banned_emails`;--> statement-breakpoint
-- Eski tablolar: önce alt tablolar (bağlı satırlar zincirleme silinmesin)
DROP TABLE `reports`;--> statement-breakpoint
DROP TABLE `reviews`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
DROP TABLE `course_suggestions`;--> statement-breakpoint
-- instructors.created_by kullanıcıya bağlanıyordu ve artık kullanılmıyor: önce boşaltılır
UPDATE `instructors` SET `created_by` = NULL;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
DROP TABLE `banned_emails`;--> statement-breakpoint
DROP TABLE `login_codes`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
ALTER TABLE `__new_reviews` RENAME TO `reviews`;--> statement-breakpoint
ALTER TABLE `__new_reports` RENAME TO `reports`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
ALTER TABLE `__new_course_suggestions` RENAME TO `course_suggestions`;--> statement-breakpoint
ALTER TABLE `__new_banned_emails` RENAME TO `banned_emails`;--> statement-breakpoint
CREATE TABLE `login_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`rate_key` text NOT NULL,
	`account_sealed` text NOT NULL,
	`code_hash` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`remember` integer DEFAULT false NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
) WITHOUT ROWID;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_hash_unique` ON `users` (`email_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_unique_offering` ON `reviews` (`user_id`,`course_id`,`instructor_id`,`academic_year`,`term`);--> statement-breakpoint
CREATE INDEX `reviews_course_idx` ON `reviews` (`course_id`);--> statement-breakpoint
CREATE INDEX `reviews_instructor_idx` ON `reviews` (`instructor_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `login_codes_rate_idx` ON `login_codes` (`rate_key`);
