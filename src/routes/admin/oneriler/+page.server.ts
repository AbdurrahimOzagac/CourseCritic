import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { COURSE_FIELD_KEYS, type CourseFields } from '#lib/course-form.ts';
import { requireAdmin } from '#lib/server/admin.ts';
import { courseToFields, updateCourse, upsertCourse } from '#lib/server/courses.ts';
import { courseSuggestions, courses } from '#lib/server/db/schema.ts';
import { isUniqueViolation } from '#lib/server/db/errors.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const rows = await locals.db
		.select({ suggestion: courseSuggestions, course: courses })
		.from(courseSuggestions)
		.leftJoin(courses, eq(courses.id, courseSuggestions.courseId))
		.orderBy(courseSuggestions.createdAt);

	return {
		suggestions: rows.map(({ suggestion, course }) => {
			const proposed = JSON.parse(suggestion.payload) as CourseFields;
			const current = course ? courseToFields(course) : null;
			return {
				id: suggestion.id,
				note: suggestion.note,
				courseSlug: course?.slug ?? null,
				isNew: !course,
				changes: COURSE_FIELD_KEYS.filter(
					(k) => !current || (current[k] ?? null) !== (proposed[k] ?? null)
				).map((k) => ({
					field: k,
					from: current?.[k] ?? null,
					to: proposed[k] ?? null
				}))
			};
		})
	};
};

export const actions: Actions = {
	approve: async (event) => {
		requireAdmin(event);
		const db = event.locals.db;
		const id = String((await event.request.formData()).get('id') ?? '');
		const s = await db.query.courseSuggestions.findFirst({ where: eq(courseSuggestions.id, id) });
		if (!s) return fail(404);
		const fields = JSON.parse(s.payload) as CourseFields;
		try {
			if (s.courseId) await updateCourse(db, s.courseId, fields);
			else await upsertCourse(db, fields);
		} catch (e) {
			if (isUniqueViolation(e)) return fail(409, { error: 'code_conflict' });
			throw e;
		}
		await db.delete(courseSuggestions).where(eq(courseSuggestions.id, id));
	},
	reject: async (event) => {
		requireAdmin(event);
		const id = String((await event.request.formData()).get('id') ?? '');
		await event.locals.db.delete(courseSuggestions).where(eq(courseSuggestions.id, id));
	}
};
