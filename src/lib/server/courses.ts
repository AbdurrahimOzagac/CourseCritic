import { asc, eq, sql } from 'drizzle-orm';
import type { CourseFields } from '#lib/course-form.ts';
import { courseSlug } from '#lib/text.ts';
import type { Db } from './db';
import { courses, departments } from './db/schema';

export const UNIVERSITY = 'Hacettepe Üniversitesi';

/** Bölümü belirtilmeden içe aktarılan dersler buraya girer (ilk katalog: seed/courses.cmp.csv). */
export const DEFAULT_DEPARTMENT = {
	code: 'bilgisayar-muhendisligi',
	university: UNIVERSITY,
	nameTr: 'Bilgisayar Mühendisliği',
	nameEn: 'Computer Engineering',
	facultyTr: 'Bilgisayar ve Bilişim Bilimleri Fakültesi',
	facultyEn: 'Faculty of Computer and Information Sciences'
};

export class UnknownDepartmentError extends Error {
	constructor(code: string) {
		super(`Bilinmeyen bölüm: ${code}`);
	}
}

export interface DepartmentItem {
	id: string;
	code: string;
	nameTr: string;
	nameEn: string;
	facultyTr: string | null;
	facultyEn: string | null;
	courseCount: number;
}

/** Tüm bölümler, fakülte ve ada göre sıralı (ders sayısıyla birlikte). */
export async function listDepartments(db: Db): Promise<DepartmentItem[]> {
	return db
		.select({
			id: departments.id,
			code: departments.code,
			nameTr: departments.nameTr,
			nameEn: departments.nameEn,
			facultyTr: departments.facultyTr,
			facultyEn: departments.facultyEn,
			courseCount: sql<number>`(SELECT COUNT(*) FROM courses c WHERE c.department_id = ${departments.id})`
		})
		.from(departments)
		.orderBy(asc(departments.facultyTr), asc(departments.nameTr));
}

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

export async function departmentIdByCode(db: Db, code: string): Promise<string | undefined> {
	const row = await db.query.departments.findFirst({
		where: eq(departments.code, code),
		columns: { id: true }
	});
	return row?.id;
}

async function resolveDepartment(db: Db, code: string): Promise<string> {
	const id = await departmentIdByCode(db, code);
	if (!id) throw new UnknownDepartmentError(code);
	return id;
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
	const departmentId = fields.department ? await resolveDepartment(db, fields.department) : null;
	const existing = await db.query.courses.findFirst({ where: eq(courses.slug, values.slug) });
	if (existing) {
		await db
			.update(courses)
			.set({ ...values, ...(departmentId ? { departmentId } : {}) })
			.where(eq(courses.id, existing.id));
		return { id: existing.id, slug: values.slug, created: false };
	}
	const [row] = await db
		.insert(courses)
		.values({ ...values, departmentId: departmentId ?? (await defaultDepartmentId(db)) })
		.returning({ id: courses.id });
	return { id: row.id, slug: values.slug, created: true };
}

/** Yeni ders ekler; aynı kodda ders varsa dokunmaz ve `null` döner (öğrencinin eklediği dersler). */
export async function createCourse(
	db: Db,
	fields: CourseFields & { department: string }
): Promise<{ id: string; slug: string } | null> {
	const values = columns(fields);
	const departmentId = await resolveDepartment(db, fields.department);
	const [row] = await db
		.insert(courses)
		.values({ ...values, departmentId })
		.onConflictDoNothing()
		.returning({ id: courses.id });
	return row ? { id: row.id, slug: values.slug } : null;
}

export async function updateCourse(db: Db, id: string, fields: CourseFields) {
	const values = columns(fields);
	const departmentId = fields.department ? await resolveDepartment(db, fields.department) : null;
	await db
		.update(courses)
		.set({ ...values, ...(departmentId ? { departmentId } : {}) })
		.where(eq(courses.id, id));
	return values.slug;
}

export function courseToFields(
	c: typeof courses.$inferSelect,
	departmentCode: string | null
): CourseFields {
	return {
		department: departmentCode,
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
