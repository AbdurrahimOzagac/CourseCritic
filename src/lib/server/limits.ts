import { and, eq, lt, sql } from 'drizzle-orm';
import type { Db } from './db';
import { hmac } from './crypto';
import { addLimits } from './db/schema';

export type AddKind = 'instructor' | 'course';

/** Öğrenci bir ayda en fazla bu kadar yeni hoca, hesabı boyunca en fazla bu kadar yeni ders ekleyebilir. */
export const ADD_LIMITS: Record<AddKind, number> = { instructor: 30, course: 120 };

/** Hoca sınırı takvim ayına göre (UTC) yenilenir; ders sınırı hiç yenilenmez. */
function currentPeriod(kind: AddKind, now = new Date()) {
	return kind === 'instructor' ? now.getUTCFullYear() * 12 + now.getUTCMonth() : 0;
}

async function limitKey(secret: string, kind: AddKind, userEmailHash: string, period: number) {
	return hmac(secret, `limit:${kind}:${userEmailHash}:${period}`);
}

export type AddAllowance = { used: number; limit: number; remaining: number };

/** Kullanıcının bu dönem kaç ekleme yaptığı ve kaç hakkı kaldığı (formda uyarı göstermek için). */
export async function addAllowance(
	db: Db,
	secret: string,
	kind: AddKind,
	userEmailHash: string
): Promise<AddAllowance> {
	const key = await limitKey(secret, kind, userEmailHash, currentPeriod(kind));
	const row = await db.query.addLimits.findFirst({
		where: eq(addLimits.key, key),
		columns: { count: true }
	});
	const used = row?.count ?? 0;
	const limit = ADD_LIMITS[kind];
	return { used, limit, remaining: Math.max(0, limit - used) };
}

/**
 * Bir ekleme hakkı harcar. Sayaç tek bir sorguyla ve sadece sınırın altındaysa artırılır: aynı anda gelen istekler
 * sınırı aşamaz. Hak kalmadıysa `false` döner.
 */
export async function useAddSlot(
	db: Db,
	secret: string,
	kind: AddKind,
	userEmailHash: string
): Promise<boolean> {
	const period = currentPeriod(kind);
	if (kind === 'instructor') {
		// Geçmiş ayların sayaçları tutulmaz
		await db
			.delete(addLimits)
			.where(and(eq(addLimits.kind, 'instructor'), lt(addLimits.period, period)));
	}
	const key = await limitKey(secret, kind, userEmailHash, period);
	const updated = await db
		.insert(addLimits)
		.values({ key, kind, period, count: 1 })
		.onConflictDoUpdate({
			target: addLimits.key,
			set: { count: sql`${addLimits.count} + 1` },
			setWhere: lt(addLimits.count, ADD_LIMITS[kind])
		})
		.returning({ count: addLimits.count });
	return updated.length > 0;
}
