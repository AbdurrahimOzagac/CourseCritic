import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [counts] = await locals.db.all<{
		courses: number;
		instructors: number;
		reviews: number;
		users: number;
		reported: number;
		pendingInstructors: number;
		suggestions: number;
		banned: number;
	}>(sql`
		SELECT
			(SELECT COUNT(*) FROM courses) AS courses,
			(SELECT COUNT(*) FROM instructors WHERE status = 'approved') AS instructors,
			(SELECT COUNT(*) FROM reviews) AS reviews,
			(SELECT COUNT(*) FROM users) AS users,
			(SELECT COUNT(*) FROM reviews WHERE report_count > 0) AS reported,
			(SELECT COUNT(*) FROM instructors WHERE status = 'pending') AS pendingInstructors,
			(SELECT COUNT(*) FROM course_suggestions) AS suggestions,
			(SELECT COUNT(*) FROM banned_emails) AS banned
	`);
	return { counts };
};
