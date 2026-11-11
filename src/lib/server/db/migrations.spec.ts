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

const files = readdirSync(dir)
	.filter((f) => f.endsWith('.sql'))
	.sort();

type Db = InstanceType<typeof DatabaseSync>;

function applyFile(db: Db, file: string) {
	for (const stmt of readFileSync(join(dir, file), 'utf8').split('--> statement-breakpoint')) {
		if (stmt.trim()) db.exec(stmt);
	}
}

/** D1 gibi yabancı anahtarlar her zaman açık. `until` verilirse o dosyaya kadar (hariç) uygular. */
function migratedDb(until?: string): Db {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON');
	for (const file of files) {
		if (until && file >= until) break;
		applyFile(db, file);
	}
	return db;
}

const columns = (db: Db, table: string) =>
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

	// Tablo yeniden kurma, D1'de (yabancı anahtarlar kapatılamaz) üst tabloyu silerken bağlı satırları zincirleme
	// silebilir. Boş veritabanında bu görünmez: 0004 verili bir veritabanında denenir.
	it('0004 veri kaybetmeden uygulanır', () => {
		const db = migratedDb('0004');
		db.exec(`
			INSERT INTO departments (id, code, university, name_tr, name_en) VALUES ('d', 'D', 'U', 'B', 'B');
			INSERT INTO courses (id, department_id, code, slug, name_tr) VALUES ('c', 'd', 'BBM 1', 'bbm1', 'Ders');
			INSERT INTO instructors (id, name, slug) VALUES ('i', 'Hoca', 'hoca');
			INSERT INTO users (id, email_hash) VALUES ('u1', 'h1'), ('u2', 'h2');
			INSERT INTO reviews (id, user_id, course_id, instructor_id, academic_year, term, difficulty, workload,
				teaching_value, instructor_clarity, instructor_attitude, instructor_expertise)
				VALUES ('r', 'u1', 'c', 'i', 2024, 'fall', 3, 3, 3, 3, 3, 3);
			INSERT INTO reports (review_id, reporter_key, user_id, reason) VALUES ('r', 'legacy:u2', 'u2', 'neden');
			INSERT INTO sessions (id, user_id, expires_at) VALUES ('s', 'u1', 1900000000);
			INSERT INTO course_suggestions (id, user_id, payload) VALUES ('cs', 'u2', '{}');
			INSERT INTO banned_emails (email_hash) VALUES ('b');
			UPDATE instructors SET created_by = 'u1';
		`);
		const tables = [
			'users',
			'reviews',
			'reports',
			'sessions',
			'course_suggestions',
			'banned_emails',
			'instructors'
		];
		const counts = () => tables.map((t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).all()[0].n);
		const before = counts();
		applyFile(
			db,
			files.find((f) => f.startsWith('0004'))!
		);
		expect(counts()).toEqual(before);
		expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
		// Eski anahtar kimliği taşımaz ve sayılmaz; oturum bitişi giriş gününü açık etmez
		const [report] = db.prepare('SELECT reporter_key, dismissed FROM reports').all();
		expect(report.reporter_key).not.toContain('u2');
		expect(report.dismissed).toBe(1);
		const [session] = db.prepare('SELECT expires_at FROM sessions').all();
		expect(Number(session.expires_at) % 86400).toBe(0);
	});
});
