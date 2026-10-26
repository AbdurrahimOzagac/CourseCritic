import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/env';
import { m } from '#lib/paraglide/messages.js';
import { createLoginCode, emailHash, LOGIN_COOKIE } from '#lib/server/auth.ts';
import { isAllowedEmail, normalizeEmail, parseDomainList } from '#lib/email.ts';
import { sendLoginCode } from '#lib/server/mail.ts';
import { safeRedirectPath } from '#lib/server/redirect.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, safeRedirectPath(url.searchParams.get('r')));
	return {
		domains: parseDomainList(locals.env.ALLOWED_EMAIL_DOMAINS),
		r: safeRedirectPath(url.searchParams.get('r'))
	};
};

export const actions: Actions = {
	default: async ({ locals, request, cookies }) => {
		const form = await request.formData();
		const email = normalizeEmail(String(form.get('email') ?? ''));
		const r = safeRedirectPath(String(form.get('r') ?? ''));
		const domains = parseDomainList(locals.env.ALLOWED_EMAIL_DOMAINS);

		// Admin adresleri alan adı şartından muaftır (ör. Gmail ile yönetim)
		const isAdmin = parseDomainList(locals.env.ADMIN_EMAILS).includes(email);
		if (!isAdmin && !isAllowedEmail(email, domains)) {
			return fail(400, { email, error: 'domain' as const });
		}

		// Ban burada kontrol edilmez: aksi halde posta kutusunun sahibi olmayan biri, bir adresin banlı olup olmadığını
		// öğrenebilir (ör. silinen bir yorumun yazarını tespit etmek için). Banlı adrese de kod gönderilir; "banlısın"
		// bilgisi sadece kod doğrulandıktan sonra, yani sadece posta kutusunun sahibine gösterilir (verifyLoginCode).
		const hash = await emailHash(locals.env.AUTH_SECRET, email);

		const result = await createLoginCode(locals.db, locals.env.AUTH_SECRET, hash, isAdmin);
		if (!result.ok) return fail(429, { email, error: 'rate_limited' as const });

		const sent = await sendLoginCode(locals.env, {
			to: email,
			code: result.code,
			siteName: m.site_name(),
			subject: m.login_mail_subject({ site: m.site_name() }),
			body: m.login_mail_body()
		});
		if (!sent) return fail(502, { email, error: 'mail_failed' as const });

		cookies.set(LOGIN_COOKIE, JSON.stringify({ id: result.attemptId, r }), {
			path: '/giris',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 15 * 60,
			secure: !dev
		});
		redirect(303, '/giris/dogrula');
	}
};
