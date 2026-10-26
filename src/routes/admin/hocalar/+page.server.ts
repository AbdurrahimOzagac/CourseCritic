import { fail } from '@sveltejs/kit';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { requireAdmin } from '#lib/server/admin.ts';
import { courseInstructors, courses, instructors, reviews } from '#lib/server/db/schema.ts';
import { findOrCreateInstructor } from '#lib/server/instructors.ts';
import { courseSlug } from '#lib/text.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const all = await locals.db.all<{
		id: string;
		slug: string;
		title: string | null;
		name: string;
		status: 'approved' | 'pending';
		reviewCount: number;
		courseCodes: string | null;
	}>(sql`
		SELECT i.id, i.slug, i.title, i.name, i.status,
			(SELECT COUNT(*) FROM reviews r WHERE r.instructor_id = i.id) AS reviewCount,
			(SELECT group_concat(c.code, ', ') FROM course_instructors ci JOIN courses c ON c.id = ci.course_id WHERE ci.instructor_id = i.id) AS courseCodes
		FROM instructors i
		ORDER BY i.name
	`);
	return {
		pending: all.filter((i) => i.status === 'pending'),
		approved: all.filter((i) => i.status === 'approved')
	};
};

function field(form: FormData, key: string) {
	return String(form.get(key) ?? '').trim();
}

/** "BBM 101, BBM 102" → course id listesi */
async function courseIdsFromCodes(db: App.Locals['db'], codes: string) {
	const slugs = codes
		.split(/[,;\n]/)
		.map((c) => courseSlug(c))
		.filter(Boolean);
	if (!slugs.length) return { ids: [], missing: [] };
	const found = await db
		.select({ id: courses.id, slug: courses.slug })
		.from(courses)
		.where(inArray(courses.slug, slugs));
	return {
		ids: found.map((f) => f.id),
		missing: slugs.filter((s) => !found.some((f) => f.slug === s))
	};
}

export const actions: Actions = {
	approve: async (event) => {
		requireAdmin(event);
		const id = field(await event.request.formData(), 'id');
		await event.locals.db
			.update(instructors)
			.set({ status: 'approved' })
			.where(eq(instructors.id, id));
	},

	/** Bekleyen hocayı mevcut bir hocayla birleştirir (yazım farkı, kopya vb.). */
	merge: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = field(form, 'id');
		const target = field(form, 'target');
		if (!target || target === id) return fail(400, { error: 'merge_target' });
		const db = event.locals.db;
		// Aynı kullanıcının hedef hocaya aynı dönem için zaten değerlendirmesi varsa çakışmasın: kopyayı sil
		await db.run(sql`
			DELETE FROM reviews WHERE instructor_id = ${id} AND EXISTS (
				SELECT 1 FROM reviews t WHERE t.instructor_id = ${target} AND t.user_id = reviews.user_id
				AND t.course_id = reviews.course_id AND t.academic_year = reviews.academic_year AND t.term = reviews.term)
		`);
		await db.batch([
			db.update(reviews).set({ instructorId: target }).where(eq(reviews.instructorId, id)),
			db.run(sql`INSERT OR IGNORE INTO course_instructors (course_id, instructor_id)
				SELECT course_id, ${target} FROM course_instructors WHERE instructor_id = ${id}`),
			db.delete(instructors).where(eq(instructors.id, id))
		]);
	},

	/** Siler. Bu hocaya bağlı değerlendirmeler de silinir. */
	reject: async (event) => {
		requireAdmin(event);
		const id = field(await event.request.formData(), 'id');
		await event.locals.db
			.delete(instructors)
			.where(and(eq(instructors.id, id), eq(instructors.status, 'pending')));
	},

	create: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const name = field(form, 'name');
		if (name.length < 3) return fail(400, { error: 'name' });
		const instructor = await findOrCreateInstructor(
			event.locals.db,
			{ title: field(form, 'title') || null, name },
			{ status: 'approved', createdBy: event.locals.user!.id }
		);
		const { ids, missing } = await courseIdsFromCodes(event.locals.db, field(form, 'courses'));
		if (ids.length) {
			await event.locals.db
				.insert(courseInstructors)
				.values(ids.map((courseId) => ({ courseId, instructorId: instructor.id })))
				.onConflictDoNothing();
		}
		return { created: true, missing };
	},

	update: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const id = field(form, 'id');
		const name = field(form, 'name');
		if (name.length < 3) return fail(400, { error: 'name' });
		const { ids, missing } = await courseIdsFromCodes(event.locals.db, field(form, 'courses'));
		const db = event.locals.db;
		await db.batch([
			db
				.update(instructors)
				.set({ title: field(form, 'title') || null, name })
				.where(eq(instructors.id, id)),
			db.delete(courseInstructors).where(eq(courseInstructors.instructorId, id)),
			...ids.map((courseId) =>
				db.insert(courseInstructors).values({ courseId, instructorId: id }).onConflictDoNothing()
			)
		]);
		return { updated: id, missing };
	}
};
