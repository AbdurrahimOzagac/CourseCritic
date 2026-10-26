import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit/hooks';
import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { getDb } from '#lib/server/db/index.ts';
import { getEnv } from '#lib/server/env.ts';
import { validateSession } from '#lib/server/auth.ts';

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
	event.locals.user = await validateSession(event.locals.db, event.cookies);

	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'same-origin');
	response.headers.set('X-Frame-Options', 'DENY');
	return response;
};

// Auth önce çalışır: paraglide event kopyası oluşturduğu için platform gibi alanlar sonrasında erişilemeyebilir
export const handle = sequence(handleAuth, handleParaglide);
