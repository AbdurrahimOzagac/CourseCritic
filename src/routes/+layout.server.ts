import type { LayoutServerLoad } from './$types';

// İstemciye kullanıcı kimliği gönderilmez, sadece giriş yapılıp yapılmadığı ve rol
export const load: LayoutServerLoad = ({ locals }) => ({
	user: locals.user ? { role: locals.user.role } : null
});
