import { redirect } from '@sveltejs/kit';
import { listDepartments } from '#lib/server/courses.ts';
import type { PageServerLoad } from './$types';

/**
 * Ana sayfa: önce fakülte, sonra bölüm seçilir; dersler bölüm sayfasında (/bolum/[kod]) listelenir.
 * Seçili fakülte adreste durur (`/?fakulte=…`), hesaba yazılmaz.
 */
export const load: PageServerLoad = async ({ locals, url }) => {
	// Eski bağlantılar: /?bolum=matematik → /bolum/matematik
	const legacy = url.searchParams.get('bolum');
	if (legacy) redirect(301, `/bolum/${encodeURIComponent(legacy)}`);
	return {
		departments: (await listDepartments(locals.db)).map(({ id: _id, ...d }) => d)
	};
};
