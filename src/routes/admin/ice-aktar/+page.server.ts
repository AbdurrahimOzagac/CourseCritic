import { fail } from '@sveltejs/kit';
import { parseCourseFields } from '#lib/course-form.ts';
import { parseCsv } from '#lib/csv.ts';
import { requireAdmin } from '#lib/server/admin.ts';
import { upsertCourse } from '#lib/server/courses.ts';
import { courseInstructors, courses } from '#lib/server/db/schema.ts';
import { findOrCreateInstructor } from '#lib/server/instructors.ts';
import { courseSlug } from '#lib/text.ts';
import type { Actions } from './$types';

const KIND_ALIASES: Record<string, string> = {
	zorunlu: 'compulsory',
	compulsory: 'compulsory',
	required: 'compulsory',
	seçmeli: 'elective',
	secmeli: 'elective',
	elective: 'elective'
};

/** CSV başlıkları snake_case: name_tr → nameTr */
const toCamel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

async function readCsv(form: FormData): Promise<string> {
	const file = form.get('file');
	if (file instanceof File && file.size) return file.text();
	return String(form.get('csv') ?? '');
}

export const actions: Actions = {
	courses: async (event) => {
		requireAdmin(event);
		const rows = parseCsv(await readCsv(await event.request.formData()));
		if (!rows.length) return fail(400, { kind: 'courses', error: 'empty' });

		let created = 0;
		let updated = 0;
		const errors: string[] = [];
		for (const [i, row] of rows.entries()) {
			const camel = Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v]));
			if (camel.kind) camel.kind = KIND_ALIASES[camel.kind.toLocaleLowerCase('tr')] ?? camel.kind;
			const parsed = parseCourseFields((k) => camel[k]);
			if (!parsed.ok) {
				errors.push(
					`${i + 2}. satır (${row.code || '?'}): ${Object.entries(parsed.errors)
						.map(([k, v]) => `${k}=${v}`)
						.join(', ')}`
				);
				continue;
			}
			const r = await upsertCourse(event.locals.db, parsed.data);
			if (r.created) created++;
			else updated++;
		}
		return { kind: 'courses', created, updated, errors };
	},

	instructors: async (event) => {
		const admin = requireAdmin(event);
		const rows = parseCsv(await readCsv(await event.request.formData()));
		if (!rows.length) return fail(400, { kind: 'instructors', error: 'empty' });

		const allCourses = await event.locals.db
			.select({ id: courses.id, slug: courses.slug })
			.from(courses);
		const bySlug = new Map(allCourses.map((c) => [c.slug, c.id]));

		let processed = 0;
		let links = 0;
		const errors: string[] = [];
		for (const [i, row] of rows.entries()) {
			const name = (row.name ?? '').trim();
			if (name.length < 3) {
				errors.push(`${i + 2}. satır: name eksik`);
				continue;
			}
			const instructor = await findOrCreateInstructor(
				event.locals.db,
				{ title: row.title || null, name },
				{ status: 'approved', createdBy: admin.id }
			);
			processed++;
			for (const code of (row.courses ?? '')
				.split(/[;|]/)
				.map((c) => c.trim())
				.filter(Boolean)) {
				const courseId = bySlug.get(courseSlug(code));
				if (!courseId) {
					errors.push(`${i + 2}. satır: ders bulunamadı: ${code}`);
					continue;
				}
				await event.locals.db
					.insert(courseInstructors)
					.values({ courseId, instructorId: instructor.id })
					.onConflictDoNothing();
				links++;
			}
		}
		return { kind: 'instructors', processed, links, errors };
	}
};
