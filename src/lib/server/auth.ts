import type { Cookies } from '@sveltejs/kit';
import { and, eq, gt, lt, sql } from 'drizzle-orm';
import type { Db } from './db';
import { bannedEmails, loginCodes, reports, sessions, users } from './db/schema';
import { hmac, randomCode, randomToken, seal, sha256, timingSafeEqual, unseal } from './crypto';
import { normalizeEmail } from '../email';
import { dayStart } from './time';

export const SESSION_COOKIE = 'sid';
export const LOGIN_COOKIE = 'login_attempt';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const SESSION_RENEW_BEFORE = 180 * DAY;
const CODE_TTL = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const MAX_CODES_PER_HOUR = 5;

/** Sadece sunucuda kalır; istemciye en fazla `role` gönderilir. */
export type SessionUser = { id: string; role: 'user' | 'admin'; emailHash: string };

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

/** 0..max-1 arası eşit dağılımlı rastgele tam sayı. */
function randomInt(max: number) {
	return crypto.getRandomValues(new Uint32Array(1))[0] % max;
}

/**
 * Oturum bitişi güne yuvarlanır ve rastgele kaydırılır: kayıttan giriş günü çıkarılamaz (bkz. time.ts).
 * Kalıcı: 300–420 gün. Geçici: 1–3 gün (çerez zaten tarayıcı kapanınca biter).
 */
function sessionExpiry(persistent: boolean) {
	const days = persistent ? 300 + randomInt(121) : 1 + randomInt(3);
	// Önce yuvarla, sonra ekle: en az `days` tam gün kalır (gece yarısına yakın girişte hemen bitmesin)
	return new Date(dayStart().getTime() + (days + 1) * DAY);
}

export function emailHash(secret: string, normalizedEmail: string) {
	return hmac(secret, `email:${normalizedEmail}`);
}

export async function isBanned(db: Db, hash: string) {
	return !!(await db.query.bannedEmails.findFirst({ where: eq(bannedEmails.emailHash, hash) }));
}

export type RequestCodeResult =
	{ ok: true; attemptId: string; code: string } | { ok: false; reason: 'rate_limited' };

/**
 * Kod satırında hesap özeti açık tutulmaz. Aksi halde veritabanını okuyabilen biri giriş formuna bir öğrencinin
 * adresini yazıp oluşan satırdan hesabını (ve yorumlarını) bulabilirdi. Saatlik sınır ayrı bir anahtarla tutulur,
 * hesap özeti şifreli saklanır ve sadece kod doğrulandıktan sonra açılır.
 */
export async function createLoginCode(
	db: Db,
	secret: string,
	normalizedEmail: string,
	remember: boolean
): Promise<RequestCodeResult> {
	const now = Date.now();
	// Kodlar, saatlik sınır için gereken 1 saatten fazla saklanmaz
	await db.delete(loginCodes).where(lt(loginCodes.createdAt, new Date(now - HOUR)));

	const rateKey = await hmac(secret, `rl:${normalizedEmail}`);
	const recent = await db
		.select({ id: loginCodes.id })
		.from(loginCodes)
		.where(and(eq(loginCodes.rateKey, rateKey), gt(loginCodes.createdAt, new Date(now - HOUR))));
	if (recent.length >= MAX_CODES_PER_HOUR) return { ok: false, reason: 'rate_limited' };

	const attemptId = crypto.randomUUID();
	const code = randomCode();
	await db.insert(loginCodes).values({
		id: attemptId,
		rateKey,
		accountSealed: await seal(secret, await emailHash(secret, normalizedEmail), attemptId),
		codeHash: await hmac(secret, `code:${attemptId}:${code}`),
		remember,
		expiresAt: new Date(now + CODE_TTL),
		createdAt: new Date(now)
	});
	return { ok: true, attemptId, code };
}

export type VerifyCodeResult =
	| { ok: true; userId: string; remember: boolean }
	| { ok: false; reason: 'expired' | 'wrong_code' | 'too_many_attempts' | 'banned' };

export async function verifyLoginCode(
	db: Db,
	secret: string,
	attemptId: string,
	code: string
): Promise<VerifyCodeResult> {
	// Süresi geçmiş kodlar her doğrulamada da temizlenir (kimse yeni kod istemese de 1 saatten fazla kalmasın)
	await db.delete(loginCodes).where(lt(loginCodes.createdAt, new Date(Date.now() - HOUR)));

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

	// Bu adres için bekleyen tüm kodlar silinir; hesap özeti sadece burada, kod doğrulandıktan sonra açılır
	await db.delete(loginCodes).where(eq(loginCodes.rateKey, attempt.rateKey));
	const accountHash = await unseal(secret, attempt.accountSealed, attemptId);
	if (!accountHash) return { ok: false, reason: 'expired' };
	if (await isBanned(db, accountHash)) return { ok: false, reason: 'banned' };

	await db.insert(users).values({ emailHash: accountHash }).onConflictDoNothing();
	const user = await db.query.users.findFirst({
		where: eq(users.emailHash, accountHash),
		columns: { id: true }
	});
	if (!user) return { ok: false, reason: 'expired' };
	return { ok: true, userId: user.id, remember: attempt.remember };
}

/**
 * persistent: "bu cihazda açık kalsın" seçildi → uzun ömürlü çerez, kullanıldıkça uzar.
 * Değilse tarayıcı kapanınca biten çerez ve birkaç gün içinde sona eren kayıt (ortak bilgisayarlar için).
 */
export async function createSession(db: Db, cookies: Cookies, userId: string, persistent: boolean) {
	await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
	const token = randomToken();
	const expiresAt = sessionExpiry(persistent);
	await db.insert(sessions).values({ id: await sha256(token), userId, expiresAt, persistent });
	setSessionCookie(cookies, token, persistent ? expiresAt : null);
}

function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date | null) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		...(expiresAt ? { expires: expiresAt } : {})
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
		.select({
			userId: users.id,
			emailHash: users.emailHash,
			expiresAt: sessions.expiresAt,
			persistent: sessions.persistent
		})
		.from(sessions)
		.innerJoin(users, eq(users.id, sessions.userId))
		.where(eq(sessions.id, id));

	if (!row || row.expiresAt.getTime() < Date.now()) {
		if (row) await db.delete(sessions).where(eq(sessions.id, id));
		cookies.delete(SESSION_COOKIE, { path: '/' });
		return null;
	}

	if (row.persistent && row.expiresAt.getTime() - Date.now() < SESSION_RENEW_BEFORE) {
		const expiresAt = sessionExpiry(true);
		await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
		setSessionCookie(cookies, token, expiresAt);
	}
	const admins = await adminEmailHashes(admin.secret, admin.emails);
	return {
		id: row.userId,
		role: admins.has(row.emailHash) ? 'admin' : 'user',
		emailHash: row.emailHash
	};
}

export async function destroySession(db: Db, cookies: Cookies) {
	const token = cookies.get(SESSION_COOKIE);
	if (token) await db.delete(sessions).where(eq(sessions.id, await sha256(token)));
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

/**
 * Kullanıcıyı ve içeriğini siler: değerlendirmeler, öneriler ve oturumlar silinir (FK cascade). Yaptığı bildirimler
 * zaten kimseye bağlı değildir (yorum başına anahtar); sayılmaya devam eder, aksi halde hesabı silip yeniden açarak
 * aynı yorum tekrar bildirilebilirdi.
 */
async function deleteUserStatements(
	db: Db,
	secret: string,
	user: { id: string; emailHash: string }
) {
	// Kişinin yazdığı bildirim nedenleri silinir. Bildirimler kullanıcıya bağlı tutulmadığı için, nedeni olan her
	// bildirimin anahtarı bu kişi için yeniden hesaplanıp karşılaştırılır.
	const withReason = await db.all<{ reviewId: string; reporterKey: string }>(
		sql`SELECT review_id AS reviewId, reporter_key AS reporterKey FROM reports WHERE reason IS NOT NULL`
	);
	const mine: { reviewId: string; reporterKey: string }[] = [];
	for (const r of withReason) {
		if ((await reporterKey(secret, r.reviewId, user.emailHash)) === r.reporterKey) mine.push(r);
	}
	return [
		...mine.map((r) =>
			db
				.update(reports)
				.set({ reason: null })
				.where(and(eq(reports.reviewId, r.reviewId), eq(reports.reporterKey, r.reporterKey)))
		),
		db.delete(users).where(eq(users.id, user.id))
	];
}

export async function deleteUser(db: Db, secret: string, userId: string) {
	const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
	if (!user) return;
	const [first, ...rest] = await deleteUserStatements(db, secret, user);
	await db.batch([first, ...rest]);
}

/** Kullanıcıyı ve tüm içeriğini siler, e-posta özetini kara listeye ekler. */
export async function banUser(db: Db, secret: string, userId: string) {
	const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
	if (!user) return;
	await db.batch([
		db.insert(bannedEmails).values({ emailHash: user.emailHash }).onConflictDoNothing(),
		...(await deleteUserStatements(db, secret, user))
	]);
}

/** Bir kişinin bir yorum için bildirim anahtarı: hesap değişse de aynı, yorumlar arasında bağlanamaz. */
export function reporterKey(secret: string, reviewId: string, userEmailHash: string) {
	return hmac(secret, `report:${reviewId}:${userEmailHash}`);
}
