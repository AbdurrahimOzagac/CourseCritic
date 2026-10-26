import { courses } from '#lib/server/db/schema.ts';
import { listApprovedInstructors } from '#lib/server/queries.ts';
import { matchesQuery } from '#lib/text.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	if (!q) return { q, courses: [], instructors: [] };

	const [allCourses, allInstructors] = await Promise.all([
		locals.db
			.select({
				id: courses.id,
				code: courses.code,
				slug: courses.slug,
				nameTr: courses.nameTr,
				nameEn: courses.nameEn
			})
			.from(courses)
			.orderBy(courses.code),
		listApprovedInstructors(locals.db)
	]);

	return {
		q,
		courses: allCourses.filter((c) => matchesQuery(q, c.code, c.nameTr, c.nameEn)).slice(0, 50),
		instructors: allInstructors.filter((i) => matchesQuery(q, i.title, i.name)).slice(0, 50)
	};
};
