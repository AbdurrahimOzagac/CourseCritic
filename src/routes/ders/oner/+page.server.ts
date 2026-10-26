import { fail, redirect } from '@sveltejs/kit';
import { parseCourseFields } from '#lib/course-form.ts';
import { upsertCourse } from '#lib/server/courses.ts';
import { courseSuggestions } from '#lib/server/db/schema.ts';
import { getCourseBySlug } from '#lib/server/queries.ts';
import { courseSlug } from '#lib/text.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.user) redirect(303, `/giris?r=${encodeURIComponent(url.pathname)}`);
	return { isAdmin: locals.user.role === 'admin' };
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/giris');
		const form = await request.formData();
		const parsed = parseCourseFields((k) => form.get(k) as string | null);
		if (!parsed.ok)
			return fail(400, {
				errors: parsed.errors as Record<string, string>,
				existing: null as string | null
			});

		const existing = await getCourseBySlug(locals.db, courseSlug(parsed.data.code));
		if (existing)
			return fail(409, {
				errors: { code: 'exists' } as Record<string, string>,
				existing: existing.slug
			});

		if (locals.user.role === 'admin') {
			const { slug } = await upsertCourse(locals.db, parsed.data);
			redirect(303, `/ders/${slug}`);
		}

		await locals.db.insert(courseSuggestions).values({
			userId: locals.user.id,
			courseId: null,
			payload: JSON.stringify(parsed.data),
			note:
				String(form.get('note') ?? '')
					.trim()
					.slice(0, 1000) || null
		});
		return { suggested: true };
	}
};
