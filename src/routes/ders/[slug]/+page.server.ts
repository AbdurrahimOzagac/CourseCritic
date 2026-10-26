import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import { REPORT_HIDE_THRESHOLD } from '#lib/constants.ts';
import { reports, reviews } from '#lib/server/db/schema.ts';
import {
	getCourseBySlug,
	getCourseInstructors,
	getCourseReviews,
	getEquivalents
} from '#lib/server/queries.ts';
import { summarizeReviews } from '#lib/summary.ts';
import { compareTerms, parseTermKey, termKey } from '#lib/terms.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const course = await getCourseBySlug(locals.db, params.slug);
	if (!course) error(404, 'Ders bulunamadı');

	const [instructors, equivalents] = await Promise.all([
		getCourseInstructors(locals.db, course.id),
		getEquivalents(locals.db, course.id)
	]);

	const selectedInstructor =
		instructors.find((i) => i.slug === url.searchParams.get('hoca')) ?? null;
	const selectedTerm = parseTermKey(url.searchParams.get('donem'));

	// Dönem seçenekleri: seçili hocanın (ya da tüm hocaların) değerlendirildiği dönemler
	const termKeys = new Set<string>();
	const termOptions = (selectedInstructor ? [selectedInstructor] : instructors)
		.flatMap((i) => i.terms)
		.filter(
			(t) =>
				!termKeys.has(termKey(t.academicYear, t.term)) &&
				termKeys.add(termKey(t.academicYear, t.term))
		)
		.sort((a, b) => compareTerms(b, a));

	const reviewRows = await getCourseReviews(
		locals.db,
		course.id,
		{
			instructorId: selectedInstructor?.id,
			academicYear: selectedTerm?.academicYear,
			term: selectedTerm?.term
		},
		locals.user?.id ?? null
	);

	return {
		course,
		equivalents,
		instructors,
		termOptions,
		selectedInstructor: selectedInstructor?.slug ?? '',
		selectedTerm: selectedTerm ? termKey(selectedTerm.academicYear, selectedTerm.term) : '',
		summary: summarizeReviews(reviewRows),
		reviews: reviewRows
	};
};

export const actions: Actions = {
	report: async ({ locals, request, url }) => {
		if (!locals.user) redirect(303, `/giris?r=${encodeURIComponent(url.pathname)}`);
		const form = await request.formData();
		const reviewId = String(form.get('reviewId') ?? '');
		const reason =
			String(form.get('reason') ?? '')
				.trim()
				.slice(0, 500) || null;

		const review = await locals.db.query.reviews.findFirst({ where: eq(reviews.id, reviewId) });
		if (!review) return fail(404, { reportError: 'not_found' });
		if (review.userId === locals.user.id) return fail(400, { reportError: 'own_review' });

		const inserted = await locals.db
			.insert(reports)
			.values({ reviewId, userId: locals.user.id, reason })
			.onConflictDoNothing()
			.returning();
		if (inserted.length) {
			await locals.db
				.update(reviews)
				.set({
					reportCount: sql`${reviews.reportCount} + 1`,
					status: sql`CASE WHEN ${reviews.reportCount} + 1 >= ${REPORT_HIDE_THRESHOLD} THEN 'hidden' ELSE ${reviews.status} END`
				})
				.where(eq(reviews.id, reviewId));
		}
		return { reported: reviewId };
	},

	delete: async ({ locals, request }) => {
		if (!locals.user) error(401);
		const form = await request.formData();
		const reviewId = String(form.get('reviewId') ?? '');
		await locals.db
			.delete(reviews)
			.where(and(eq(reviews.id, reviewId), eq(reviews.userId, locals.user.id)));
		return { deleted: reviewId };
	}
};
