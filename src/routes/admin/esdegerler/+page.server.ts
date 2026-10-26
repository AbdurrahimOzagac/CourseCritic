import { fail } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import { requireAdmin } from '#lib/server/admin.ts';
import { courseEquivalents } from '#lib/server/db/schema.ts';
import { getCourseBySlug } from '#lib/server/queries.ts';
import { courseSlug } from '#lib/text.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	pairs: await locals.db.all<{
		a: string;
		b: string;
		aCode: string;
		bCode: string;
		aSlug: string;
		bSlug: string;
	}>(sql`
		SELECT e.course_a AS a, e.course_b AS b, ca.code AS aCode, cb.code AS bCode, ca.slug AS aSlug, cb.slug AS bSlug
		FROM course_equivalents e
		JOIN courses ca ON ca.id = e.course_a
		JOIN courses cb ON cb.id = e.course_b
		ORDER BY ca.code
	`)
});

export const actions: Actions = {
	add: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const [x, y] = await Promise.all(
			['a', 'b'].map((k) => getCourseBySlug(event.locals.db, courseSlug(String(form.get(k) ?? ''))))
		);
		if (!x || !y) return fail(400, { error: 'not_found' });
		if (x.id === y.id) return fail(400, { error: 'same' });
		const [courseA, courseB] = x.id < y.id ? [x.id, y.id] : [y.id, x.id];
		await event.locals.db
			.insert(courseEquivalents)
			.values({ courseA, courseB })
			.onConflictDoNothing();
	},
	remove: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		await event.locals.db
			.delete(courseEquivalents)
			.where(
				and(
					eq(courseEquivalents.courseA, String(form.get('a'))),
					eq(courseEquivalents.courseB, String(form.get('b')))
				)
			);
	}
};
