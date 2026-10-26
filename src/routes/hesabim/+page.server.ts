import { redirect } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import type { Term } from '#lib/constants.ts';
import { destroySession } from '#lib/server/auth.ts';
import { users } from '#lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/giris?r=/hesabim');
	const reviews = await locals.db.all<{
		id: string;
		academicYear: number;
		term: Term;
		status: 'published' | 'hidden';
		courseCode: string;
		courseSlug: string;
		courseNameTr: string;
		courseNameEn: string | null;
		instructorTitle: string | null;
		instructorName: string;
		instructorStatus: 'approved' | 'pending';
	}>(sql`
		SELECT r.id, r.academic_year AS academicYear, r.term, r.status,
			c.code AS courseCode, c.slug AS courseSlug, c.name_tr AS courseNameTr, c.name_en AS courseNameEn,
			i.title AS instructorTitle, i.name AS instructorName, i.status AS instructorStatus
		FROM reviews r
		JOIN courses c ON c.id = r.course_id
		JOIN instructors i ON i.id = r.instructor_id
		WHERE r.user_id = ${locals.user.id}
		ORDER BY r.created_at DESC
	`);
	return { reviews };
};

export const actions: Actions = {
	deleteAccount: async ({ locals, cookies }) => {
		if (!locals.user) redirect(303, '/giris');
		await locals.db.delete(users).where(eq(users.id, locals.user.id));
		await destroySession(locals.db, cookies);
		redirect(303, '/');
	}
};
