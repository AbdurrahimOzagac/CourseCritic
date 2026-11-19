-- Puanlar isteğe bağlı oldu: reviews tablosundaki 6 puan sütunu boş (NULL) olabilir. SQLite sütunun NOT NULL
-- kısıtını değiştirmeye izin vermediği için tablo yeniden kurulur. 0004 gibi elle yazıldı: Drizzle'ın ürettiği
-- sürüm WITHOUT ROWID'i düşürür ve D1'de (yabancı anahtarlar kapatılamaz) bağlı reports satırlarını silebilir.
-- Sıra: yeni tablolar kurulup doldurulur, eski alt tablo (reports) üst tablodan (reviews) önce silinir.
-- CHECK kısıtı değişmedi: NULL değerler kontrolü geçer, dolu olanlar yine 1-7 arasında olmalı.
CREATE TABLE `__new_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`instructor_id` text NOT NULL,
	`academic_year` integer NOT NULL,
	`term` text NOT NULL,
	`difficulty` integer,
	`workload` integer,
	`teaching_value` integer,
	`instructor_clarity` integer,
	`instructor_attitude` integer,
	`instructor_expertise` integer,
	`attempts` integer,
	`outcome` text,
	`class_average` integer,
	`curve` text,
	`comment` text,
	`status` text DEFAULT 'published' NOT NULL,
	`report_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
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
INSERT INTO `__new_reports` SELECT `review_id`, `reporter_key`, `reason`, `dismissed` FROM `reports`;--> statement-breakpoint
DROP TABLE `reports`;--> statement-breakpoint
DROP TABLE `reviews`;--> statement-breakpoint
ALTER TABLE `__new_reviews` RENAME TO `reviews`;--> statement-breakpoint
ALTER TABLE `__new_reports` RENAME TO `reports`;--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_unique_offering` ON `reviews` (`user_id`,`course_id`,`instructor_id`,`academic_year`,`term`);--> statement-breakpoint
CREATE INDEX `reviews_course_idx` ON `reviews` (`course_id`);--> statement-breakpoint
CREATE INDEX `reviews_instructor_idx` ON `reviews` (`instructor_id`);
