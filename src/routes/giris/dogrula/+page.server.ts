import { fail, redirect } from '@sveltejs/kit';
import { createSession, LOGIN_COOKIE, verifyLoginCode } from '#lib/server/auth.ts';
import { safeRedirectPath } from '#lib/server/redirect.ts';
import type { Actions, PageServerLoad } from './$types';

function readAttempt(raw: string | undefined): { id: string; r: string } | null {
	try {
		const v = JSON.parse(raw ?? '');
		return typeof v?.id === 'string' ? { id: v.id, r: safeRedirectPath(v.r) } : null;
	} catch {
		return null;
	}
}

export const load: PageServerLoad = ({ cookies }) => {
	if (!readAttempt(cookies.get(LOGIN_COOKIE))) redirect(303, '/giris');
};

export const actions: Actions = {
	default: async ({ locals, request, cookies }) => {
		const attempt = readAttempt(cookies.get(LOGIN_COOKIE));
		if (!attempt) redirect(303, '/giris');

		const code = String((await request.formData()).get('code') ?? '');
		const result = await verifyLoginCode(locals.db, locals.env.AUTH_SECRET, attempt.id, code);
		if (!result.ok) {
			if (result.reason !== 'wrong_code') cookies.delete(LOGIN_COOKIE, { path: '/giris' });
			return fail(400, { error: result.reason });
		}

		cookies.delete(LOGIN_COOKIE, { path: '/giris' });
		await createSession(locals.db, cookies, result.userId);
		redirect(303, attempt.r);
	}
};
