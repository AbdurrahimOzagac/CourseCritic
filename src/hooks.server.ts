import { error, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { getDb } from '#lib/server/db/index.ts';
import { getEnv } from '#lib/server/env.ts';
import { validateSession } from '#lib/server/auth.ts';
import { adminAccess } from '#lib/server/admin.ts';
import { describeError } from '#lib/server/redact.ts';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		return resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					html
						.replace('%paraglide.lang%', locale)
						.replace('%paraglide.dir%', getTextDirection(locale))
			}
		);
	});

const handleAuth: Handle = async ({ event, resolve }) => {
	const env = getEnv();
	event.locals.env = env;
	event.locals.db = getDb(env.DB);
	event.locals.user = await validateSession(event.locals.db, event.cookies, {
		secret: env.AUTH_SECRET,
		emails: env.ADMIN_EMAILS
	});

	// Admin bölümü burada korunur: sayfalar, veri istekleri ve form işlemleri için tek kontrol noktası
	const access = adminAccess(event.route.id, event.locals.user);
	if (access === 'login') {
		redirect(303, `/giris?r=${encodeURIComponent(event.url.pathname + event.url.search)}`);
	}
	if (access === 'not_found') error(404, 'Sayfa bulunamadı');

	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'same-origin');
	response.headers.set('X-Frame-Options', 'DENY');
	return response;
};

// Auth önce çalışır: paraglide event kopyası oluşturduğu için platform gibi alanlar sonrasında erişilemeyebilir
export const handle = sequence(handleAuth, handleParaglide);

/**
 * Beklenmeyen hatalar sadece tür ve maskelenmiş mesajla loglanır: istek gövdesi, form verisi ya da e-posta adresi
 * log'a yazılmaz. Kullanıcıya genel bir mesaj döner.
 */
export const handleError: HandleServerError = ({ kind, error, event }) => {
	if (kind !== 'unknown') return;
	console.error(`[${event.route.id ?? 'yol yok'}] ${describeError(error)}`);
};
