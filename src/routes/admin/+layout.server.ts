import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	if (!locals.user) redirect(303, `/giris?r=${encodeURIComponent(url.pathname)}`);
	if (locals.user.role !== 'admin') error(404, 'Sayfa bulunamadı');
};
