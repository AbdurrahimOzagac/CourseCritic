import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Tüm migration'ları sırayla boş bir SQLite veritabanına uygular ve gizlilik kurallarını denetler.
// Drizzle WITHOUT ROWID'i bilmez: bir tabloyu yeniden kuran yeni bir migration bu özelliği düşürürse burası yakalar.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as {
	DatabaseSync: new (path: string) => {
		exec(sql: string): void;
		prepare(sql: string): { all(...args: unknown[]): Record<string, unknown>[] };
	};
};

const dir = join(process.cwd(), 'migrations');

function migratedDb() {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON');
	for (const file of readdirSync(dir)
		.filter((f) => f.endsWith('.sql'))
		.sort()) {
		for (const stmt of readFileSync(join(dir, file), 'utf8').split('--> statement-breakpoint')) {
			if (stmt.trim()) db.exec(stmt);
		}
	}
	return db;
}

const columns = (db: ReturnType<typeof migratedDb>, table: string) =>
	db
		.prepare(`PRAGMA table_info(${table})`)
		.all()
		.map((c) => c.name as string);

describe('migrations', () => {
	const db = migratedDb();

	it.each([
		'users',
		'sessions',
		'reviews',
		'reports',
		'login_codes',
		'banned_emails',
		'course_suggestions'
	])('%s eklenme sırasını saklamaz (WITHOUT ROWID)', (table) => {
		const [row] = db
			.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`)
			.all(table);
		expect(String(row?.sql)).toMatch(/WITHOUT ROWID\s*$/i);
	});

	it('hiçbir tabloda e-posta ya da bildirimi kullanıcıya bağlayan sütun yok', () => {
		const tables = db
			.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`)
			.all()
			.map((t) => t.name as string);
		for (const t of tables) {
			for (const c of columns(db, t)) expect(c).not.toMatch(/^e?mail$|^email_address$|^address$/);
		}
		expect(columns(db, 'login_codes')).not.toContain('email_hash');
		expect(columns(db, 'reports')).not.toContain('user_id');
		expect(columns(db, 'users')).toEqual(['id', 'email_hash']);
	});
});
