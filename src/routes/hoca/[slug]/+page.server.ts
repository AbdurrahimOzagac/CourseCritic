import { error } from '@sveltejs/kit';
import { getApprovedInstructorBySlug, getInstructorCourses } from '#lib/server/queries.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const instructor = await getApprovedInstructorBySlug(locals.db, params.slug);
	if (!instructor) error(404, 'Hoca bulunamadı');
	return {
		instructor: { slug: instructor.slug, title: instructor.title, name: instructor.name },
		courses: await getInstructorCourses(locals.db, instructor.id)
	};
};
