import { error, type RequestEvent } from '@sveltejs/kit';

/** Admin action'ları için: layout load action'larda çalışmaz, her action kendini korumalı. */
export function requireAdmin(event: Pick<RequestEvent, 'locals'>) {
	if (event.locals.user?.role !== 'admin') error(404, 'Sayfa bulunamadı');
	return event.locals.user;
}
