import { eq } from 'drizzle-orm';
import type { Db } from './db';
import { instructors } from './db/schema';
import { foldText, slugify } from '#lib/text.ts';

/** Aynı isimde hoca varsa onu döndürür (onaylı ya da beklemede), yoksa yeni hoca oluşturur. */
export async function findOrCreateInstructor(
	db: Db,
	input: { title: string | null; name: string },
	opts: { status: 'approved' | 'pending'; createdBy: string | null }
): Promise<{ id: string; status: 'approved' | 'pending' }> {
	const name = input.name.replace(/\s+/g, ' ').trim();
	const folded = foldText(name);
	const all = await db
		.select({ id: instructors.id, name: instructors.name, status: instructors.status })
		.from(instructors);
	const existing = all.find((i) => foldText(i.name) === folded);
	if (existing) return existing;

	const slug = await uniqueSlug(db, slugify(name) || 'hoca');
	const [row] = await db
		.insert(instructors)
		.values({
			title: input.title?.trim() || null,
			name,
			slug,
			status: opts.status,
			createdBy: opts.createdBy
		})
		.returning({ id: instructors.id, status: instructors.status });
	return row;
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
