import { sql } from 'drizzle-orm';
import {
	check,
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import { COURSE_KINDS, CURVE_ANSWERS, OUTCOMES, TERMS } from '../../constants';

const id = () =>
	text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
	integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`);

// ---------------------------------------------------------------------------
// Kullanıcılar ve giriş
//
// Anonimlik: e-posta adresi hiçbir tabloda açık metin olarak tutulmaz. Sadece
// AUTH_SECRET ile alınmış HMAC özeti saklanır (bkz. lib/server/crypto.ts).
// ---------------------------------------------------------------------------

export const users = sqliteTable('users', {
	id: id(),
	emailHash: text('email_hash').notNull().unique(),
	createdAt: createdAt()
});

/** Banlanan e-posta özetleri. Kullanıcı ve içerikleri silinir, özet burada kalır. */
export const bannedEmails = sqliteTable('banned_emails', {
	emailHash: text('email_hash').primaryKey(),
	createdAt: createdAt()
});

export const loginCodes = sqliteTable(
	'login_codes',
	{
		id: id(),
		emailHash: text('email_hash').notNull(),
		codeHash: text('code_hash').notNull(),
		attempts: integer('attempts').notNull().default(0),
		expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
		createdAt: createdAt()
	},
	(t) => [index('login_codes_email_idx').on(t.emailHash)]
);

export const sessions = sqliteTable(
	'sessions',
	{
		/** Çerezdeki token'ın SHA-256 özeti. */
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
	},
	(t) => [index('sessions_user_idx').on(t.userId)]
);

// ---------------------------------------------------------------------------
// Dersler ve hocalar
// ---------------------------------------------------------------------------

/** Üniversiteler arası büyümeye hazırlık. Şimdilik tek kayıt: Hacettepe BBM. */
export const departments = sqliteTable('departments', {
	id: id(),
	code: text('code').notNull().unique(),
	university: text('university').notNull(),
	nameTr: text('name_tr').notNull(),
	nameEn: text('name_en').notNull()
});

export const courses = sqliteTable(
	'courses',
	{
		id: id(),
		departmentId: text('department_id')
			.notNull()
			.references(() => departments.id),
		/** Görünen kod, ör. "BBM 342" */
		code: text('code').notNull(),
		/** URL'de kullanılan kod, ör. "bbm342" */
		slug: text('slug').notNull().unique(),
		nameTr: text('name_tr').notNull(),
		nameEn: text('name_en'),
		descriptionTr: text('description_tr'),
		descriptionEn: text('description_en'),
		credits: integer('credits'),
		ects: integer('ects'),
		/** Kaçıncı sınıfta alındığı (1-4) */
		yearLevel: integer('year_level'),
		kind: text('kind', { enum: COURSE_KINDS }),
		prerequisites: text('prerequisites'),
		createdAt: createdAt()
	},
	(t) => [index('courses_department_idx').on(t.departmentId)]
);

/** Eşdeğer dersler (ör. müfredat değişince yeni koda geçen ders). Çift sıralı saklanır: courseA < courseB. */
export const courseEquivalents = sqliteTable(
	'course_equivalents',
	{
		courseA: text('course_a')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),
		courseB: text('course_b')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' })
	},
	(t) => [
		primaryKey({ columns: [t.courseA, t.courseB] }),
		check('equiv_order', sql`${t.courseA} < ${t.courseB}`)
	]
);

export const instructors = sqliteTable('instructors', {
	id: id(),
	/** Ünvan, ör. "Prof. Dr." */
	title: text('title'),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	/** Kullanıcıların eklediği hocalar admin onayına kadar "pending" kalır. */
	status: text('status', { enum: ['approved', 'pending'] })
		.notNull()
		.default('approved'),
	createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
	createdAt: createdAt()
});

/** Admin'in bildiği ders–hoca eşleşmeleri. Değerlendirmelerden gelen eşleşmeler ayrıca hesaplanır. */
export const courseInstructors = sqliteTable(
	'course_instructors',
	{
		courseId: text('course_id')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),
		instructorId: text('instructor_id')
			.notNull()
			.references(() => instructors.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.courseId, t.instructorId] })]
);

// ---------------------------------------------------------------------------
// Değerlendirmeler
//
// En küçük birim: ders + hoca + dönem (akademik yıl + yarıyıl).
// ---------------------------------------------------------------------------

export const reviews = sqliteTable(
	'reviews',
	{
		id: id(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		courseId: text('course_id')
			.notNull()
			.references(() => courses.id, { onDelete: 'cascade' }),
		instructorId: text('instructor_id')
			.notNull()
			.references(() => instructors.id, { onDelete: 'cascade' }),
		/** Akademik yılın başladığı yıl. 2025 → "2025-2026" */
		academicYear: integer('academic_year').notNull(),
		term: text('term', { enum: TERMS }).notNull(),

		// 7 basamaklı ölçekler (1-7)
		difficulty: integer('difficulty').notNull(),
		workload: integer('workload').notNull(),
		teachingValue: integer('teaching_value').notNull(),
		instructorClarity: integer('instructor_clarity').notNull(),
		instructorAttitude: integer('instructor_attitude').notNull(),
		instructorExpertise: integer('instructor_expertise').notNull(),

		// İsteğe bağlı bilgiler
		attempts: integer('attempts'),
		outcome: text('outcome', { enum: OUTCOMES }),
		/** O dönem sınıf ortalaması, yaklaşık (0-100) */
		classAverage: integer('class_average'),
		curve: text('curve', { enum: CURVE_ANSWERS }),
		comment: text('comment'),

		status: text('status', { enum: ['published', 'hidden'] })
			.notNull()
			.default('published'),
		reportCount: integer('report_count').notNull().default(0),
		createdAt: createdAt(),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
	},
	(t) => [
		uniqueIndex('reviews_unique_offering').on(
			t.userId,
			t.courseId,
			t.instructorId,
			t.academicYear,
			t.term
		),
		index('reviews_course_idx').on(t.courseId),
		index('reviews_instructor_idx').on(t.instructorId),
		check(
			'reviews_scale_range',
			sql`${t.difficulty} BETWEEN 1 AND 7 AND ${t.workload} BETWEEN 1 AND 7 AND ${t.teachingValue} BETWEEN 1 AND 7 AND ${t.instructorClarity} BETWEEN 1 AND 7 AND ${t.instructorAttitude} BETWEEN 1 AND 7 AND ${t.instructorExpertise} BETWEEN 1 AND 7`
		)
	]
);

/**
 * Bildirimler. Bir kişi bir yorumu bir kez bildirebilir; kişi `reporterKey` ile tanınır, kullanıcı kimliğiyle değil.
 * Böylece hesabı silip yeniden açmak yeni bir bildirim hakkı vermez.
 */
export const reports = sqliteTable(
	'reports',
	{
		reviewId: text('review_id')
			.notNull()
			.references(() => reviews.id, { onDelete: 'cascade' }),
		/**
		 * HMAC(AUTH_SECRET, yorum + e-posta özeti). Hesap silinip yeniden açılsa da aynı kalır. Yorum başına farklı
		 * olduğu için bir kişinin farklı yorumlara yaptığı bildirimler birbirine bağlanamaz.
		 */
		reporterKey: text('reporter_key').notNull(),
		/** Sadece "bildirdin" göstermek için. Hesap silinince boşalır, bildirim sayılmaya devam eder. */
		userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
		/** Hesap silinince temizlenir (kişinin yazdığı içerik). */
		reason: text('reason'),
		/** Admin yorumu geri açınca işaretlenir: artık sayılmaz, aynı kişi o yorumu tekrar bildiremez. */
		dismissed: integer('dismissed', { mode: 'boolean' }).notNull().default(false),
		createdAt: createdAt()
	},
	(t) => [
		primaryKey({ columns: [t.reviewId, t.reporterKey] }),
		index('reports_user_idx').on(t.userId)
	]
);

/** Öğrencilerin ders bilgisi düzeltme / yeni ders önerileri. Admin onaylayınca uygulanır. */
export const courseSuggestions = sqliteTable('course_suggestions', {
	id: id(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	/** null ise yeni ders önerisi */
	courseId: text('course_id').references(() => courses.id, { onDelete: 'cascade' }),
	/** CourseFields JSON */
	payload: text('payload').notNull(),
	note: text('note'),
	createdAt: createdAt()
});
