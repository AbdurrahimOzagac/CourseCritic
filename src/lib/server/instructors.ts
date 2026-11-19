import { and, eq, sql } from 'drizzle-orm';
import type { Db } from './db';
import { instructors, reviews } from './db/schema';
import { useAddSlot } from './limits';
import { foldText, slugify } from '#lib/text.ts';

/** Öğrencinin eklediği hoca, bu kadar farklı öğrenci kullanınca herkese görünür. */
export const INSTRUCTOR_CONFIRMATIONS = 2;

/** Aynı isimde (Türkçe karakterden bağımsız) hoca var mı? Onaylı ya da beklemede olabilir. */
export async function findInstructorByName(
	db: Db,
	name: string
): Promise<{ id: string; status: 'approved' | 'pending' } | undefined> {
	const folded = foldText(name);
	const all = await db
		.select({ id: instructors.id, name: instructors.name, status: instructors.status })
		.from(instructors);
	return all.find((i) => foldText(i.name) === folded);
}

async function createInstructor(db: Db, name: string, status: 'approved' | 'pending') {
	const slug = await uniqueSlug(db, slugify(name) || 'hoca');
	const [row] = await db
		.insert(instructors)
		.values({ name, slug, status })
		.returning({ id: instructors.id, status: instructors.status });
	return row;
}

const cleanName = (name: string) => name.replace(/\s+/g, ' ').trim();

/** Aynı isimde hoca varsa onu döndürür (onaylı ya da beklemede), yoksa yeni hoca oluşturur. (Admin yolları) */
export async function findOrCreateInstructor(
	db: Db,
	input: { name: string },
	opts: { status: 'approved' | 'pending' }
): Promise<{ id: string; status: 'approved' | 'pending' }> {
	const name = cleanName(input.name);
	return (await findInstructorByName(db, name)) ?? (await createInstructor(db, name, opts.status));
}

/**
 * Öğrencinin yeni hoca eklemesi. İsim zaten varsa o hoca kullanılır ve sınır harcanmaz (ikinci öğrenci aynı ismi
 * yazarak ilkini onaylamış olur). Yoksa aylık sınır (limits.ts) kontrol edilir ve hoca "beklemede" oluşturulur.
 */
export async function addInstructorForStudent(
	db: Db,
	secret: string,
	userEmailHash: string,
	rawName: string
): Promise<
	{ ok: true; id: string; status: 'approved' | 'pending' } | { ok: false; reason: 'limit' }
> {
	const name = cleanName(rawName);
	const existing = await findInstructorByName(db, name);
	if (existing) return { ok: true, ...existing };

	if (!(await useAddSlot(db, secret, 'instructor', userEmailHash)))
		return { ok: false, reason: 'limit' };

	return { ok: true, ...(await createInstructor(db, name, 'pending')) };
}

/**
 * Beklemedeki hoca, farklı öğrenciler tarafından yeterince kullanıldıysa herkese görünür yapılır.
 * Sayı değerlendirmeyi yazan farklı hesaplara göre hesaplanır; aynı kişinin birden fazla değerlendirmesi tek sayılır.
 */
export async function confirmInstructorIfUsed(db: Db, instructorId: string): Promise<boolean> {
	const [{ n }] = await db
		.select({ n: sql<number>`COUNT(DISTINCT ${reviews.userId})` })
		.from(reviews)
		.where(eq(reviews.instructorId, instructorId));
	if (n < INSTRUCTOR_CONFIRMATIONS) return false;
	const updated = await db
		.update(instructors)
		.set({ status: 'approved' })
		.where(and(eq(instructors.id, instructorId), eq(instructors.status, 'pending')))
		.returning({ id: instructors.id });
	return updated.length > 0;
}

async function uniqueSlug(db: Db, base: string): Promise<string> {
	for (let n = 1; ; n++) {
		const slug = n === 1 ? base : `${base}-${n}`;
		if (
			!(await db.query.instructors.findFirst({
				where: eq(instructors.slug, slug),
				columns: { id: true }
			}))
		)
			return slug;
	}
}
