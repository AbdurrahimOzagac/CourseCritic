ALTER TABLE `departments` ADD `faculty_tr` text;--> statement-breakpoint
ALTER TABLE `departments` ADD `faculty_en` text;--> statement-breakpoint
-- Elle eklendi: bölüm kodu URL'de kullanılacak (/?bolum=bilgisayar-muhendisligi). Bölüm listesi seed/departments.hacettepe.csv.
UPDATE `departments` SET `code` = 'bilgisayar-muhendisligi', `faculty_tr` = 'Bilgisayar ve Bilişim Bilimleri Fakültesi', `faculty_en` = 'Faculty of Computer and Information Sciences' WHERE `code` = 'HU-BBM';
