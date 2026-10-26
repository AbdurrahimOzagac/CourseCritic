import { eq } from 'drizzle-orm';
import type { CourseFields } from '#lib/course-form.ts';
import { courseSlug } from '#lib/text.ts';
import type { Db } from './db';
import { courses, departments } from './db/schema';

export const DEFAULT_DEPARTMENT = {
	code: 'HU-BBM',
	university: 'Hacettepe Üniversitesi',
	nameTr: 'Bilgisayar Mühendisliği',
	nameEn: 'Computer Engineering'
};

export async function defaultDepartmentId(db: Db): Promise<string> {
	const existing = await db.query.departments.findFirst({
		where: eq(departments.code, DEFAULT_DEPARTMENT.code)
	});
	if (existing) return existing.id;
	const [row] = await db
		.insert(departments)
		.values(DEFAULT_DEPARTMENT)
		.onConflictDoNothing()
		.returning();
	return row?.id ?? (await defaultDepartmentId(db));
}

function columns(fields: CourseFields) {
	return {
		code: fields.code,
		slug: courseSlug(fields.code),
		nameTr: fields.nameTr,
		nameEn: fields.nameEn,
		descriptionTr: fields.descriptionTr,
		descriptionEn: fields.descriptionEn,
		credits: fields.credits,
		ects: fields.ects,
		yearLevel: fields.yearLevel,
		kind: fields.kind,
		prerequisites: fields.prerequisites
	};
}

/** Koda göre ekler ya da günceller. CSV içe aktarma ve admin onayı kullanır. */
export async function upsertCourse(
	db: Db,
	fields: CourseFields
): Promise<{ id: string; slug: string; created: boolean }> {
	const values = columns(fields);
	const existing = await db.query.courses.findFirst({ where: eq(courses.slug, values.slug) });
	if (existing) {
		await db.update(courses).set(values).where(eq(courses.id, existing.id));
		return { id: existing.id, slug: values.slug, created: false };
	}
	const [row] = await db
		.insert(courses)
		.values({ ...values, departmentId: await defaultDepartmentId(db) })
		.returning({ id: courses.id });
	return { id: row.id, slug: values.slug, created: true };
}

export async function updateCourse(db: Db, id: string, fields: CourseFields) {
	const values = columns(fields);
	await db.update(courses).set(values).where(eq(courses.id, id));
	return values.slug;
}

export function courseToFields(c: typeof courses.$inferSelect): CourseFields {
	return {
		code: c.code,
		nameTr: c.nameTr,
		nameEn: c.nameEn,
		descriptionTr: c.descriptionTr,
		descriptionEn: c.descriptionEn,
		credits: c.credits,
		ects: c.ects,
		yearLevel: c.yearLevel,
		kind: c.kind,
		prerequisites: c.prerequisites
	};
}
