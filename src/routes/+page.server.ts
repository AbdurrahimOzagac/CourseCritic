import { listDepartments } from '#lib/server/courses.ts';
import { listCourses } from '#lib/server/queries.ts';
import type { PageServerLoad } from './$types';

/**
 * Bölüm seçimi adreste durur (`/?bolum=matematik`); son seçim tarayıcıda hatırlanır, hesaba yazılmaz.
 * Bölüm seçilmezse üniversitenin tüm dersleri listelenir.
 */
export const load: PageServerLoad = async ({ locals, url }) => {
	const departments = await listDepartments(locals.db);
	const department = departments.find((d) => d.code === url.searchParams.get('bolum')) ?? null;
	return {
		departments: departments.map(({ id: _id, ...d }) => d),
		department: department?.code ?? null,
		courses: await listCourses(locals.db, department?.id)
	};
};
