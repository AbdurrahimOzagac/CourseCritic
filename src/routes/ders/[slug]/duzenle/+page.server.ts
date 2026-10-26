import { error, fail, redirect } from '@sveltejs/kit';
import { parseCourseFields } from '#lib/course-form.ts';
import { courseToFields, updateCourse } from '#lib/server/courses.ts';
import { courseSuggestions } from '#lib/server/db/schema.ts';
import { isUniqueViolation } from '#lib/server/db/errors.ts';
import { getCourseBySlug } from '#lib/server/queries.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.user) redirect(303, `/giris?r=${encodeURIComponent(url.pathname)}`);
	const course = await getCourseBySlug(locals.db, params.slug);
	if (!course) error(404, 'Ders bulunamadı');
	return {
		slug: course.slug,
		fields: courseToFields(course),
		isAdmin: locals.user.role === 'admin'
	};
};

export const actions: Actions = {
	default: async ({ locals, params, request }) => {
		if (!locals.user) redirect(303, '/giris');
		const course = await getCourseBySlug(locals.db, params.slug);
		if (!course) error(404);

		const form = await request.formData();
		const parsed = parseCourseFields((k) => form.get(k) as string | null);
		if (!parsed.ok) return fail(400, { errors: parsed.errors as Record<string, string> });

		if (locals.user.role === 'admin') {
			try {
				const slug = await updateCourse(locals.db, course.id, parsed.data);
				redirect(303, `/ders/${slug}`);
			} catch (e) {
				if (isUniqueViolation(e))
					return fail(409, { errors: { code: 'invalid' } as Record<string, string> });
				throw e;
			}
		}

		await locals.db.insert(courseSuggestions).values({
			userId: locals.user.id,
			courseId: course.id,
			payload: JSON.stringify(parsed.data),
			note:
				String(form.get('note') ?? '')
					.trim()
					.slice(0, 1000) || null
		});
		return { suggested: true };
	}
};
