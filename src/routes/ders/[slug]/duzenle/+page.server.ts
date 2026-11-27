import { error, fail, redirect } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { parseCourseFields } from '#lib/course-form.ts';
import { requireAdmin } from '#lib/server/admin.ts';
import { courseToFields, listDepartments, updateCourse } from '#lib/server/courses.ts';
import { courseSuggestions, courses } from '#lib/server/db/schema.ts';
import { isUniqueViolation } from '#lib/server/db/errors.ts';
import { getCourseBySlug } from '#lib/server/queries.ts';
import type { Actions, PageServerLoad } from './$types';

type Errors = Record<string, string>;

async function reviewCount(db: App.Locals['db'], courseId: string) {
	const [{ n }] = await db.all<{ n: number }>(
		sql`SELECT COUNT(*) AS n FROM reviews WHERE course_id = ${courseId}`
	);
	return n;
}

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.user) redirect(303, `/giris?r=${encodeURIComponent(url.pathname)}`);
	const course = await getCourseBySlug(locals.db, params.slug);
	if (!course) error(404, 'Ders bulunamadı');
	const departments = await listDepartments(locals.db);
	const isAdmin = locals.user.role === 'admin';
	return {
		slug: course.slug,
		fields: courseToFields(
			course,
			departments.find((d) => d.id === course.departmentId)?.code ?? null
		),
		departments: departments.map(({ id: _id, ...d }) => d),
		isAdmin,
		/** Admin sadece değerlendirmesi olmayan dersi silebilir (yanlış ya da uydurma eklenen dersler için) */
		canDelete: isAdmin && (await reviewCount(locals.db, course.id)) === 0
	};
};

export const actions: Actions = {
	save: async ({ locals, params, request }) => {
		if (!locals.user) redirect(303, '/giris');
		const course = await getCourseBySlug(locals.db, params.slug);
		if (!course) error(404);

		const form = await request.formData();
		const parsed = parseCourseFields((k) => form.get(k) as string | null);
		if (!parsed.ok) return fail(400, { errors: parsed.errors as Errors });

		if (locals.user.role === 'admin') {
			try {
				const slug = await updateCourse(locals.db, course.id, parsed.data);
				redirect(303, `/ders/${slug}`);
			} catch (e) {
				if (isUniqueViolation(e)) return fail(409, { errors: { code: 'invalid' } as Errors });
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
	},

	delete: async (event) => {
		requireAdmin(event);
		const db = event.locals.db;
		const course = await getCourseBySlug(db, event.params.slug);
		if (!course) error(404);
		if ((await reviewCount(db, course.id)) > 0)
			return fail(409, { errors: { delete: 'has_reviews' } as Errors });
		await db.delete(courses).where(eq(courses.id, course.id));
		redirect(303, '/');
	}
};
