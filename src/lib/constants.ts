export const TERMS = ['fall', 'spring', 'summer'] as const;
export type Term = (typeof TERMS)[number];

export const OUTCOMES = ['passed', 'failed', 'dropped', 'ongoing'] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const CURVE_ANSWERS = ['yes', 'no', 'unknown'] as const;
export type CurveAnswer = (typeof CURVE_ANSWERS)[number];

export const COURSE_KINDS = ['compulsory', 'elective'] as const;
export type CourseKind = (typeof COURSE_KINDS)[number];

/** Değerlendirme kriterleri. Hepsi 1-7 arası, 7 basamaklı adlandırılmış ölçek. */
export const COURSE_CRITERIA = ['difficulty', 'workload', 'teachingValue'] as const;
export const INSTRUCTOR_CRITERIA = [
	'instructorClarity',
	'instructorAttitude',
	'instructorExpertise'
] as const;
export const CRITERIA = [...COURSE_CRITERIA, ...INSTRUCTOR_CRITERIA] as const;
export type Criterion = (typeof CRITERIA)[number];

export const SCALE_MIN = 1;
export const SCALE_MAX = 7;

/** Ders listesinde özet puan göstermek için gereken en az değerlendirme sayısı. */
export const MIN_REVIEWS_FOR_SUMMARY = 3;

/** Bu kadar bildirim alan değerlendirme otomatik gizlenir. */
export const REPORT_HIDE_THRESHOLD = 3;

export const COMMENT_MAX_LENGTH = 3000;
export const MAX_ATTEMPTS = 5;
