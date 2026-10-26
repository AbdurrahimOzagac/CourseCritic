import type { Cookies } from '@sveltejs/kit';
import { and, eq, gt, lt, sql } from 'drizzle-orm';
import type { Db } from './db';
import { bannedEmails, loginCodes, sessions, users } from './db/schema';
import { hmac, randomCode, randomToken, sha256, timingSafeEqual } from './crypto';
import { normalizeEmail } from '../email';

export const SESSION_COOKIE = 'sid';
export const LOGIN_COOKIE = 'login_attempt';

const DAY = 24 * 60 * 60 * 1000;
/** Uzun oturum: mezunlar okul e-postası kapandıktan sonra da bir süre içeride kalabilsin. */
const SESSION_TTL = 365 * DAY;
const SESSION_RENEW_BEFORE = 180 * DAY;
const CODE_TTL = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const MAX_CODES_PER_HOUR = 5;

export type SessionUser = { id: string; role: 'user' | 'admin' };

const adminHashCache = new Map<string, Promise<Set<string>>>();

/**
 * `ADMIN_EMAILS` listesindeki adreslerin özetleri. Rol veritabanına yazılmaz, her istekte buradan hesaplanır:
 * listeden çıkarılan biri açık oturumunda da hemen admin yetkisini kaybeder.
 */
export function adminEmailHashes(
	secret: string,
	adminEmails: string | undefined
): Promise<Set<string>> {
	const key = adminEmails ?? '';
	let hashes = adminHashCache.get(key);
	if (!hashes) {
		const list = key
			.split(',')
			.map((e) => normalizeEmail(e))
			.filter(Boolean);
		hashes = Promise.all(list.map((e) => emailHash(secret, e))).then((h) => new Set(h));
		adminHashCache.set(key, hashes);
	}
	return hashes;
}

export function emailHash(secret: string, normalizedEmail: string) {
	return hmac(secret, `email:${normalizedEmail}`);
}

export async function isBanned(db: Db, hash: string) {
	return !!(await db.query.bannedEmails.findFirst({ where: eq(bannedEmails.emailHash, hash) }));
}

export type RequestCodeResult =
	{ ok: true; attemptId: string; code: string } | { ok: false; reason: 'rate_limited' };

export async function createLoginCode(
	db: Db,
	secret: string,
	hash: string
): Promise<RequestCodeResult> {
	const now = Date.now();
	await db.delete(loginCodes).where(lt(loginCodes.expiresAt, new Date(now - DAY)));

	const recent = await db
		.select({ id: loginCodes.id })
		.from(loginCodes)
		.where(
			and(eq(loginCodes.emailHash, hash), gt(loginCodes.createdAt, new Date(now - 60 * 60 * 1000)))
		);
	if (recent.length >= MAX_CODES_PER_HOUR) return { ok: false, reason: 'rate_limited' };

	const attemptId = crypto.randomUUID();
	const code = randomCode();
	await db.insert(loginCodes).values({
		id: attemptId,
		emailHash: hash,
		codeHash: await hmac(secret, `code:${attemptId}:${code}`),
		expiresAt: new Date(now + CODE_TTL)
	});
	return { ok: true, attemptId, code };
}

export type VerifyCodeResult =
	| { ok: true; userId: string }
	| { ok: false; reason: 'expired' | 'wrong_code' | 'too_many_attempts' | 'banned' };

export async function verifyLoginCode(
	db: Db,
	secret: string,
	attemptId: string,
	code: string
): Promise<VerifyCodeResult> {
	// Deneme hakkı, kod karşılaştırılmadan önce tek ve bölünmez bir sorguyla harcanır. Aynı anda gelen istekler
	// sayacı aynı değerde göremez: sınır dolduysa satır dönmez ve kod hiç karşılaştırılmaz.
	const [attempt] = await db
		.update(loginCodes)
		.set({ attempts: sql`${loginCodes.attempts} + 1` })
		.where(
			and(
				eq(loginCodes.id, attemptId),
				lt(loginCodes.attempts, MAX_CODE_ATTEMPTS),
				gt(loginCodes.expiresAt, new Date())
			)
		)
		.returning();
	if (!attempt) {
		const row = await db.query.loginCodes.findFirst({
			where: eq(loginCodes.id, attemptId),
			columns: { expiresAt: true }
		});
		const expired = !row || row.expiresAt.getTime() < Date.now();
		return { ok: false, reason: expired ? 'expired' : 'too_many_attempts' };
	}

	const expected = await hmac(secret, `code:${attemptId}:${code.replace(/\D/g, '')}`);
	if (!timingSafeEqual(expected, attempt.codeHash)) {
		return {
			ok: false,
			reason: attempt.attempts >= MAX_CODE_ATTEMPTS ? 'too_many_attempts' : 'wrong_code'
		};
	}

	await db.delete(loginCodes).where(eq(loginCodes.emailHash, attempt.emailHash));
	if (await isBanned(db, attempt.emailHash)) return { ok: false, reason: 'banned' };

	await db.insert(users).values({ emailHash: attempt.emailHash }).onConflictDoNothing();
	const user = await db.query.users.findFirst({
		where: eq(users.emailHash, attempt.emailHash),
		columns: { id: true }
	});
	if (!user) return { ok: false, reason: 'expired' };
	return { ok: true, userId: user.id };
}

export async function createSession(db: Db, cookies: Cookies, userId: string) {
	const token = randomToken();
	const expiresAt = new Date(Date.now() + SESSION_TTL);
	await db.insert(sessions).values({ id: await sha256(token), userId, expiresAt });
	setSessionCookie(cookies, token, expiresAt);
}

function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt
	});
}

export async function validateSession(
	db: Db,
	cookies: Cookies,
	admin: { secret: string; emails: string | undefined }
): Promise<SessionUser | null> {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return null;
	const id = await sha256(token);
	const [row] = await db
		.select({ userId: users.id, emailHash: users.emailHash, expiresAt: sessions.expiresAt })
		.from(sessions)
		.innerJoin(users, eq(users.id, sessions.userId))
		.where(eq(sessions.id, id));

	if (!row || row.expiresAt.getTime() < Date.now()) {
		if (row) await db.delete(sessions).where(eq(sessions.id, id));
		cookies.delete(SESSION_COOKIE, { path: '/' });
		return null;
	}

	if (row.expiresAt.getTime() - Date.now() < SESSION_RENEW_BEFORE) {
		const expiresAt = new Date(Date.now() + SESSION_TTL);
		await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
		setSessionCookie(cookies, token, expiresAt);
	}
	const admins = await adminEmailHashes(admin.secret, admin.emails);
	return { id: row.userId, role: admins.has(row.emailHash) ? 'admin' : 'user' };
}

export async function destroySession(db: Db, cookies: Cookies) {
	const token = cookies.get(SESSION_COOKIE);
	if (token) await db.delete(sessions).where(eq(sessions.id, await sha256(token)));
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

/** Kullanıcıyı ve tüm içeriğini siler, e-posta özetini kara listeye ekler. */
export async function banUser(db: Db, userId: string) {
	const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
	if (!user) return;
	await db.batch([
		db.insert(bannedEmails).values({ emailHash: user.emailHash }).onConflictDoNothing(),
		db.delete(users).where(eq(users.id, userId))
	]);
}
