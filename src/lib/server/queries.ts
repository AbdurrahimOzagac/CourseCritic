import { and, asc, eq, sql } from 'drizzle-orm';
import type { Db } from './db';
import { courses, instructors } from './db/schema';
import type { CourseKind, CurveAnswer, Outcome, Term } from '#lib/constants.ts';

/** Görünür değerlendirme: yayında + hocası onaylı. Tüm sorgular bu koşulu kullanır. */
const VISIBLE = sql`r.status = 'published' AND r.instructor_id IN (SELECT id FROM instructors WHERE status = 'approved')`;
const TERM_ORDER_SQL = sql`CASE r.term WHEN 'fall' THEN 1 WHEN 'spring' THEN 2 ELSE 3 END`;

export interface InstructorRef {
	id: string;
	slug: string;
	title: string | null;
	name: string;
}

export interface CourseListItem {
	id: string;
	code: string;
	slug: string;
	nameTr: string;
	nameEn: string | null;
	yearLevel: number | null;
	kind: CourseKind | null;
	reviewCount: number;
	difficulty: number | null;
	workload: number | null;
	teachingValue: number | null;
	instructors: InstructorRef[];
}

/** Ders–hoca eşleşmeleri: admin'in girdikleri + görünür değerlendirmelerden gelenler. */
async function courseInstructorPairs(
	db: Db,
	where: { courseId?: string; instructorId?: string } = {}
) {
	const filter = sql.join(
		[
			sql`i.status = 'approved'`,
			where.courseId ? sql`p.course_id = ${where.courseId}` : undefined,
			where.instructorId ? sql`p.instructor_id = ${where.instructorId}` : undefined
		].filter(Boolean) as ReturnType<typeof sql>[],
		sql` AND `
	);
	return db.all<{ courseId: string } & InstructorRef>(sql`
		SELECT p.course_id AS courseId, i.id, i.slug, i.title, i.name
		FROM (
			SELECT course_id, instructor_id FROM course_instructors
			UNION
			SELECT r.course_id, r.instructor_id FROM reviews r WHERE ${VISIBLE}
		) p
		JOIN instructors i ON i.id = p.instructor_id
		WHERE ${filter}
		ORDER BY i.name
	`);
}

export async function listCourses(db: Db): Promise<CourseListItem[]> {
	const rows = await db.all<Omit<CourseListItem, 'instructors'>>(sql`
		SELECT c.id, c.code, c.slug, c.name_tr AS nameTr, c.name_en AS nameEn, c.year_level AS yearLevel, c.kind,
			COUNT(r.id) AS reviewCount,
			AVG(r.difficulty) AS difficulty, AVG(r.workload) AS workload, AVG(r.teaching_value) AS teachingValue
		FROM courses c
		LEFT JOIN reviews r ON r.course_id = c.id AND ${VISIBLE}
		GROUP BY c.id
		ORDER BY c.code
	`);
	const pairs = await courseInstructorPairs(db);
	const byCourse = new Map<string, InstructorRef[]>();
	for (const { courseId, ...i } of pairs) {
		if (!byCourse.has(courseId)) byCourse.set(courseId, []);
		byCourse.get(courseId)!.push(i);
	}
	return rows.map((r) => ({ ...r, instructors: byCourse.get(r.id) ?? [] }));
}

export async function getCourseBySlug(db: Db, slug: string) {
	return db.query.courses.findFirst({ where: eq(courses.slug, slug) });
}

export async function getEquivalents(db: Db, courseId: string) {
	return db.all<{
		id: string;
		code: string;
		slug: string;
		nameTr: string;
		nameEn: string | null;
	}>(sql`
		SELECT c.id, c.code, c.slug, c.name_tr AS nameTr, c.name_en AS nameEn
		FROM course_equivalents e
		JOIN courses c ON c.id = CASE WHEN e.course_a = ${courseId} THEN e.course_b ELSE e.course_a END
		WHERE e.course_a = ${courseId} OR e.course_b = ${courseId}
		ORDER BY c.code
	`);
}

export interface CourseInstructorRow extends InstructorRef {
	reviewCount: number;
	terms: { academicYear: number; term: Term }[];
}

export async function getCourseInstructors(
	db: Db,
	courseId: string
): Promise<CourseInstructorRow[]> {
	const pairs = await courseInstructorPairs(db, { courseId });
	const terms = await db.all<{
		instructorId: string;
		academicYear: number;
		term: Term;
		n: number;
	}>(sql`
		SELECT r.instructor_id AS instructorId, r.academic_year AS academicYear, r.term, COUNT(*) AS n
		FROM reviews r
		WHERE r.course_id = ${courseId} AND ${VISIBLE}
		GROUP BY r.instructor_id, r.academic_year, r.term
		ORDER BY r.academic_year DESC, ${TERM_ORDER_SQL} DESC
	`);
	return pairs.map(({ courseId: _c, ...i }) => {
		const own = terms.filter((t) => t.instructorId === i.id);
		return {
			...i,
			reviewCount: own.reduce((a, t) => a + t.n, 0),
			terms: own.map((t) => ({ academicYear: t.academicYear, term: t.term }))
		};
	});
}

export interface ReviewRow {
	id: string;
	isMine: boolean;
	reportedByMe: boolean;
	instructor: InstructorRef;
	academicYear: number;
	term: Term;
	difficulty: number;
	workload: number;
	teachingValue: number;
	instructorClarity: number;
	instructorAttitude: number;
	instructorExpertise: number;
	attempts: number | null;
	outcome: Outcome | null;
	classAverage: number | null;
	curve: CurveAnswer | null;
	comment: string | null;
	edited: boolean;
}

type RawReview = Omit<ReviewRow, 'instructor' | 'isMine' | 'reportedByMe' | 'edited'> & {
	isMine: number;
	reportedByMe: number;
	edited: number;
	iId: string;
	iSlug: string;
	iTitle: string | null;
	iName: string;
};

export async function getCourseReviews(
	db: Db,
	courseId: string,
	filter: { instructorId?: string; academicYear?: number; term?: Term },
	userId: string | null
): Promise<ReviewRow[]> {
	const conditions = [sql`r.course_id = ${courseId}`, VISIBLE];
	if (filter.instructorId) conditions.push(sql`r.instructor_id = ${filter.instructorId}`);
	if (filter.academicYear && filter.term) {
		conditions.push(sql`r.academic_year = ${filter.academicYear} AND r.term = ${filter.term}`);
	}
	const rows = await db.all<RawReview>(sql`
		SELECT r.id, r.academic_year AS academicYear, r.term,
			r.difficulty, r.workload, r.teaching_value AS teachingValue,
			r.instructor_clarity AS instructorClarity, r.instructor_attitude AS instructorAttitude,
			r.instructor_expertise AS instructorExpertise,
			r.attempts, r.outcome, r.class_average AS classAverage, r.curve, r.comment,
			r.updated_at IS NOT NULL AS edited,
			r.user_id = ${userId ?? ''} AS isMine,
			EXISTS (SELECT 1 FROM reports p WHERE p.review_id = r.id AND p.user_id = ${userId ?? ''}) AS reportedByMe,
			i.id AS iId, i.slug AS iSlug, i.title AS iTitle, i.name AS iName
		FROM reviews r
		JOIN instructors i ON i.id = r.instructor_id
		WHERE ${sql.join(conditions, sql` AND `)}
		ORDER BY r.academic_year DESC, ${TERM_ORDER_SQL} DESC, r.created_at DESC
	`);
	return rows.map(({ iId, iSlug, iTitle, iName, isMine, reportedByMe, edited, ...r }) => ({
		...r,
		isMine: !!isMine,
		reportedByMe: !!reportedByMe,
		edited: !!edited,
		instructor: { id: iId, slug: iSlug, title: iTitle, name: iName }
	}));
}

export async function getApprovedInstructorBySlug(db: Db, slug: string) {
	return db.query.instructors.findFirst({
		where: and(eq(instructors.slug, slug), eq(instructors.status, 'approved'))
	});
}

export async function getInstructorCourses(db: Db, instructorId: string) {
	const pairs = await courseInstructorPairs(db, { instructorId });
	const courseIds = [...new Set(pairs.map((p) => p.courseId))];
	if (!courseIds.length) return [];
	const rows = await db.all<{
		id: string;
		code: string;
		slug: string;
		nameTr: string;
		nameEn: string | null;
	}>(sql`
		SELECT id, code, slug, name_tr AS nameTr, name_en AS nameEn FROM courses
		WHERE id IN (${sql.join(
			courseIds.map((id) => sql`${id}`),
			sql`, `
		)})
		ORDER BY code
	`);
	const terms = await db.all<{ courseId: string; academicYear: number; term: Term }>(sql`
		SELECT DISTINCT r.course_id AS courseId, r.academic_year AS academicYear, r.term
		FROM reviews r
		WHERE r.instructor_id = ${instructorId} AND ${VISIBLE}
		ORDER BY r.academic_year DESC, ${TERM_ORDER_SQL} DESC
	`);
	return rows.map((c) => ({
		...c,
		terms: terms
			.filter((t) => t.courseId === c.id)
			.map(({ academicYear, term }) => ({ academicYear, term }))
	}));
}

export async function listApprovedInstructors(db: Db) {
	return db
		.select({
			id: instructors.id,
			slug: instructors.slug,
			title: instructors.title,
			name: instructors.name
		})
		.from(instructors)
		.where(eq(instructors.status, 'approved'))
		.orderBy(asc(instructors.name));
}

export async function courseInstructorIds(db: Db, courseId: string): Promise<Set<string>> {
	return new Set((await courseInstructorPairs(db, { courseId })).map((p) => p.id));
}
