-- Elle düzenlendi: WITHOUT ROWID, eklenme sırası okunamasın (migrations.spec.ts denetler).
CREATE TABLE `add_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`period` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
) WITHOUT ROWID;
