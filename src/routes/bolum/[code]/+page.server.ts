import { error } from '@sveltejs/kit';
import { listDepartments } from '#lib/server/courses.ts';
import { listCourses } from '#lib/server/queries.ts';
import type { PageServerLoad } from './$types';

/** Bir bölümün ders listesi. Bölüme ana sayfadaki fakülte → bölüm seçiminden gelinir. */
export const load: PageServerLoad = async ({ locals, params }) => {
	const department = (await listDepartments(locals.db)).find((d) => d.code === params.code);
	if (!department) error(404, 'Bölüm bulunamadı');
	const { id, ...rest } = department;
	return { department: rest, courses: await listCourses(locals.db, id) };
};
