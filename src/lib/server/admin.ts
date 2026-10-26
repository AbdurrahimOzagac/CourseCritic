import { error, type RequestEvent } from '@sveltejs/kit';
import type { SessionUser } from './auth.ts';

/**
 * Rota admin bölümünde mi? URL yerine eşleşen rotanın kimliğine bakılır: `%61dmin` gibi kodlanmış yollar ve
 * `/admin/.../__data.json` veri istekleri de aynı rotaya eşleşir.
 */
export function isAdminRoute(routeId: string | null): boolean {
	return routeId === '/admin' || !!routeId?.startsWith('/admin/');
}

/**
 * Admin bölümüne giden her istek için karar (sayfa, `__data.json` veri isteği, form işlemi).
 * `hooks.server.ts` her istekte çağırır. Layout `load`'u yeterli değildir: SvelteKit veri isteklerinde, istemcinin
 * gönderdiği `x-sveltekit-invalidated` parametresine göre layout `load`'larını atlayabilir.
 */
export function adminAccess(
	routeId: string | null,
	user: Pick<SessionUser, 'role'> | null
): 'allow' | 'login' | 'not_found' {
	if (!isAdminRoute(routeId)) return 'allow';
	if (!user) return 'login';
	return user.role === 'admin' ? 'allow' : 'not_found';
}

/** Admin form işlemleri için ikinci savunma hattı. Asıl kontrol `hooks.server.ts`'te (`adminAccess`). */
export function requireAdmin(event: Pick<RequestEvent, 'locals'>) {
	if (event.locals.user?.role !== 'admin') error(404, 'Sayfa bulunamadı');
	return event.locals.user;
}
