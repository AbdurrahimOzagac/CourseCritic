import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { reviews } from '#lib/server/db/schema.ts';
import { dayStart } from '#lib/server/time.ts';
import { addInstructorForStudent, confirmInstructorIfUsed } from '#lib/server/instructors.ts';
import { addAllowance } from '#lib/server/limits.ts';
import {
	courseInstructorIds,
	getCourseBySlug,
	listApprovedInstructors
} from '#lib/server/queries.ts';
import { parseReviewForm } from '#lib/review-form.ts';
import { selectableYears } from '#lib/terms.ts';
import { isUniqueViolation } from '#lib/server/db/errors.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.user) redirect(303, `/giris?r=${encodeURIComponent(url.pathname + url.search)}`);

	const course = await getCourseBySlug(locals.db, params.slug);
	if (!course) error(404, 'Ders bulunamadı');

	const [all, linked, instructorAdds] = await Promise.all([
		listApprovedInstructors(locals.db),
		courseInstructorIds(locals.db, course.id),
		addAllowance(locals.db, locals.env.AUTH_SECRET, 'instructor', locals.user.emailHash)
	]);

	const reviewId = url.searchParams.get('id');
	const existing = reviewId
		? await locals.db.query.reviews.findFirst({
				where: and(
					eq(reviews.id, reviewId),
					eq(reviews.userId, locals.user.id),
					eq(reviews.courseId, course.id)
				)
			})
		: null;
	if (reviewId && !existing) error(404, 'Değerlendirme bulunamadı');

	// Bekleyen (onaysız) bir hoca için yapılmış değerlendirme düzenleniyorsa o hocayı da listeye ekle
	let pendingInstructor = null;
	if (existing && !all.some((i) => i.id === existing.instructorId)) {
		pendingInstructor = await locals.db.query.instructors.findFirst({
			where: (t, { eq }) => eq(t.id, existing.instructorId),
			columns: { id: true, slug: true, name: true }
		});
	}

	const preselected = all.find((i) => i.slug === url.searchParams.get('hoca'))?.id ?? '';

	return {
		course: {
			id: course.id,
			code: course.code,
			slug: course.slug,
			nameTr: course.nameTr,
			nameEn: course.nameEn
		},
		courseInstructors: all.filter((i) => linked.has(i.id)),
		otherInstructors: all.filter((i) => !linked.has(i.id)),
		pendingInstructor,
		years: selectableYears(),
		existing: existing
			? {
					id: existing.id,
					instructor: existing.instructorId,
					academicYear: existing.academicYear,
					term: existing.term,
					difficulty: existing.difficulty,
					workload: existing.workload,
					teachingValue: existing.teachingValue,
					instructorClarity: existing.instructorClarity,
					instructorAttitude: existing.instructorAttitude,
					instructorExpertise: existing.instructorExpertise,
					attempts: existing.attempts,
					outcome: existing.outcome,
					classAverage: existing.classAverage,
					curve: existing.curve,
					comment: existing.comment
				}
			: null,
		preselected,
		/** Bu ay kaç yeni hoca eklendiği ve kalan hak: "listede yok" seçilince uyarı olarak gösterilir */
		instructorAdds
	};
};

export const actions: Actions = {
	default: async ({ locals, params, request, url }) => {
		if (!locals.user) redirect(303, `/giris?r=${encodeURIComponent(url.pathname)}`);
		const course = await getCourseBySlug(locals.db, params.slug);
		if (!course) error(404);

		const form = await request.formData();
		const parsed = parseReviewForm(form);
		if (!parsed.ok) return fail(400, { errors: parsed.errors, profanity: parsed.profanity });
		const data = parsed.data;

		let instructorId: string;
		let instructorPending = false;
		if ('id' in data.instructor) {
			const found = await locals.db.query.instructors.findFirst({
				where: (t, { eq }) => eq(t.id, (data.instructor as { id: string }).id)
			});
			if (!found) return fail(400, { errors: { instructor: 'invalid' as const }, profanity: [] });
			instructorId = found.id;
			instructorPending = found.status === 'pending';
		} else {
			// Öğrencinin eklediği hoca "beklemede" açılır; ikinci bir öğrenci seçince herkese görünür (admin onayı gerekmez).
			// Admin'in eklediği hoca da aynı yoldan geçer: hemen yayınlanan yorum yazarın admin olduğunu belli ederdi.
			const created = await addInstructorForStudent(
				locals.db,
				locals.env.AUTH_SECRET,
				locals.user.emailHash,
				data.instructor.name
			);
			if (!created.ok) {
				return fail(429, { errors: { newInstructorName: 'limit' as const }, profanity: [] });
			}
			instructorId = created.id;
			instructorPending = created.status === 'pending';
		}

		const values = {
			courseId: course.id,
			instructorId,
			academicYear: data.academicYear,
			term: data.term,
			difficulty: data.difficulty,
			workload: data.workload,
			teachingValue: data.teachingValue,
			instructorClarity: data.instructorClarity,
			instructorAttitude: data.instructorAttitude,
			instructorExpertise: data.instructorExpertise,
			attempts: data.attempts,
			outcome: data.outcome,
			classAverage: data.classAverage,
			curve: data.curve,
			comment: data.comment
		};

		const reviewId = String(form.get('id') ?? '');
		try {
			if (reviewId) {
				const updated = await locals.db
					.update(reviews)
					.set({ ...values, updatedAt: dayStart() })
					.where(and(eq(reviews.id, reviewId), eq(reviews.userId, locals.user.id)))
					.returning({ id: reviews.id });
				if (!updated.length) error(404);
			} else {
				await locals.db.insert(reviews).values({ ...values, userId: locals.user.id });
			}
		} catch (e) {
			if (isUniqueViolation(e)) {
				return fail(409, { errors: { term: 'duplicate' as const }, profanity: [] });
			}
			throw e;
		}

		// İkinci bir öğrenci aynı hocayı kullandıysa hoca (ve bekleyen değerlendirmeler) herkese görünür olur
		if (instructorPending && (await confirmInstructorIfUsed(locals.db, instructorId))) {
			instructorPending = false;
		}

		const instructor = await locals.db.query.instructors.findFirst({
			where: (t, { eq }) => eq(t.id, instructorId),
			columns: { slug: true }
		});
		redirect(
			303,
			`/ders/${course.slug}?${instructorPending ? 'bekliyor=1' : `hoca=${instructor?.slug ?? ''}`}`
		);
	}
};
