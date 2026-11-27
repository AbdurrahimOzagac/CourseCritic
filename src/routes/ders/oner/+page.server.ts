import { fail, redirect } from '@sveltejs/kit';
import { parseCourseFields } from '#lib/course-form.ts';
import {
	createCourse,
	departmentIdByCode,
	listDepartments,
	upsertCourse
} from '#lib/server/courses.ts';
import { getCourseBySlug } from '#lib/server/queries.ts';
import { addAllowance, useAddSlot } from '#lib/server/limits.ts';
import { courseSlug } from '#lib/text.ts';
import type { Actions, PageServerLoad } from './$types';

type Errors = Record<string, string>;

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(303, `/giris?r=${encodeURIComponent(url.pathname + url.search)}`);
	const isAdmin = locals.user.role === 'admin';
	const departments = await listDepartments(locals.db);
	const preselected = url.searchParams.get('bolum') ?? '';
	return {
		isAdmin,
		departments: departments.map(({ id: _id, ...d }) => d),
		preselected: departments.some((d) => d.code === preselected) ? preselected : '',
		/** Hesap başına ders ekleme hakkı (admin'in sınırı yok) */
		courseAdds: isAdmin
			? null
			: await addAllowance(locals.db, locals.env.AUTH_SECRET, 'course', locals.user.emailHash)
	};
};

/**
 * Öğrenci dersi doğrudan ekler (admin onayı yok, bkz. PLAN.md "her kullanıcı ders ekleyebilir"). Ders kimseye
 * bağlanmaz; sınır hesap başına 120 (limits.ts). Yanlış eklenen dersi admin düzeltir ya da siler.
 */
export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) redirect(303, '/giris');
		const form = await request.formData();
		const parsed = parseCourseFields((k) => form.get(k) as string | null);
		if (!parsed.ok)
			return fail(400, { errors: parsed.errors as Errors, existing: null as string | null });
		const data = parsed.data;
		if (!data.department || !(await departmentIdByCode(locals.db, data.department)))
			return fail(400, { errors: { department: 'required' } as Errors, existing: null });

		const existing = await getCourseBySlug(locals.db, courseSlug(data.code));
		if (existing)
			return fail(409, { errors: { code: 'exists' } as Errors, existing: existing.slug });

		if (locals.user.role === 'admin') {
			const { slug } = await upsertCourse(locals.db, data);
			redirect(303, `/ders/${slug}`);
		}

		if (!(await useAddSlot(locals.db, locals.env.AUTH_SECRET, 'course', locals.user.emailHash)))
			return fail(429, { errors: { limit: 'limit' } as Errors, existing: null });

		const created = await createCourse(locals.db, { ...data, department: data.department });
		// Aynı anda başka biri aynı kodu eklediyse onun dersine yönlendirilir
		redirect(303, `/ders/${created?.slug ?? courseSlug(data.code)}`);
	}
};
