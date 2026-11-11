-- Mevcut zaman damgalarını güne yuvarla (bkz. src/lib/server/time.ts): e-posta sağlayıcısının gönderim
-- kayıtlarıyla saniye saniye eşleştirme yapılamasın. Giriş kodları zaten en fazla 1 saat saklanıyor.
UPDATE `users` SET `created_at` = `created_at` / 86400 * 86400;--> statement-breakpoint
UPDATE `banned_emails` SET `created_at` = `created_at` / 86400 * 86400;--> statement-breakpoint
UPDATE `sessions` SET `expires_at` = `expires_at` / 86400 * 86400;--> statement-breakpoint
UPDATE `reviews` SET `created_at` = `created_at` / 86400 * 86400, `updated_at` = `updated_at` / 86400 * 86400;--> statement-breakpoint
UPDATE `reports` SET `created_at` = `created_at` / 86400 * 86400;--> statement-breakpoint
UPDATE `course_suggestions` SET `created_at` = `created_at` / 86400 * 86400;--> statement-breakpoint
UPDATE `instructors` SET `created_at` = `created_at` / 86400 * 86400;--> statement-breakpoint
UPDATE `courses` SET `created_at` = `created_at` / 86400 * 86400;
