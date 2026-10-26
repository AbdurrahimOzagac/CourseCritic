import { fail } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import type { Term } from '#lib/constants.ts';
import { requireAdmin } from '#lib/server/admin.ts';
import { banUser } from '#lib/server/auth.ts';
import { reports, reviews } from '#lib/server/db/schema.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const rows = await locals.db.all<{
		id: string;
		status: 'published' | 'hidden';
		reportCount: number;
		comment: string | null;
		academicYear: number;
		term: Term;
		courseCode: string;
		courseSlug: string;
		instructorTitle: string | null;
		instructorName: string;
		reasons: string | null;
	}>(sql`
		SELECT r.id, r.status, r.report_count AS reportCount, r.comment, r.academic_year AS academicYear, r.term,
			c.code AS courseCode, c.slug AS courseSlug, i.title AS instructorTitle, i.name AS instructorName,
			(SELECT json_group_array(p.reason) FROM reports p WHERE p.review_id = r.id AND p.reason IS NOT NULL) AS reasons
		FROM reviews r
		JOIN courses c ON c.id = r.course_id
		JOIN instructors i ON i.id = r.instructor_id
		WHERE r.report_count > 0 OR r.status = 'hidden'
		ORDER BY r.status = 'hidden' DESC, r.report_count DESC
		LIMIT 200
	`);
	return {
		reviews: rows.map((r) => ({
			...r,
			reasons: (JSON.parse(r.reasons ?? '[]') as string[]).filter(Boolean)
		}))
	};
};

async function reviewFromForm(locals: App.Locals, request: Request) {
	const id = String((await request.formData()).get('reviewId') ?? '');
	return locals.db.query.reviews.findFirst({ where: eq(reviews.id, id) });
}

export const actions: Actions = {
	restore: async (event) => {
		requireAdmin(event);
		const review = await reviewFromForm(event.locals, event.request);
		if (!review) return fail(404);
		await event.locals.db.batch([
			event.locals.db.delete(reports).where(eq(reports.reviewId, review.id)),
			event.locals.db
				.update(reviews)
				.set({ status: 'published', reportCount: 0 })
				.where(eq(reviews.id, review.id))
		]);
	},
	hide: async (event) => {
		requireAdmin(event);
		const review = await reviewFromForm(event.locals, event.request);
		if (!review) return fail(404);
		await event.locals.db
			.update(reviews)
			.set({ status: 'hidden' })
			.where(eq(reviews.id, review.id));
	},
	delete: async (event) => {
		requireAdmin(event);
		const review = await reviewFromForm(event.locals, event.request);
		if (!review) return fail(404);
		await event.locals.db.delete(reviews).where(eq(reviews.id, review.id));
	},
	ban: async (event) => {
		const admin = requireAdmin(event);
		const review = await reviewFromForm(event.locals, event.request);
		if (!review) return fail(404);
		if (review.userId === admin.id) return fail(400, { error: 'self' });
		await banUser(event.locals.db, review.userId);
	}
};
