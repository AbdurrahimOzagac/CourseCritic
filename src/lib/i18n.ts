import { m } from '#lib/paraglide/messages.js';
import { getLocale } from '#lib/paraglide/runtime.js';
import type { CourseKind, Criterion, CurveAnswer, Outcome, Term } from './constants';

type Msg = () => string;

const CRITERION_NAMES: Record<Criterion, Msg> = {
	difficulty: m.criterion_difficulty,
	workload: m.criterion_workload,
	teachingValue: m.criterion_teachingValue,
	instructorClarity: m.criterion_instructorClarity,
	instructorAttitude: m.criterion_instructorAttitude,
	instructorExpertise: m.criterion_instructorExpertise
};

const CRITERION_HINTS: Record<Criterion, Msg> = {
	difficulty: m.criterion_difficulty_hint,
	workload: m.criterion_workload_hint,
	teachingValue: m.criterion_teachingValue_hint,
	instructorClarity: m.criterion_instructorClarity_hint,
	instructorAttitude: m.criterion_instructorAttitude_hint,
	instructorExpertise: m.criterion_instructorExpertise_hint
};

const SCALES: Record<Criterion, Msg[]> = {
	difficulty: [
		m.scale_difficulty_1,
		m.scale_difficulty_2,
		m.scale_difficulty_3,
		m.scale_difficulty_4,
		m.scale_difficulty_5,
		m.scale_difficulty_6,
		m.scale_difficulty_7
	],
	workload: [
		m.scale_workload_1,
		m.scale_workload_2,
		m.scale_workload_3,
		m.scale_workload_4,
		m.scale_workload_5,
		m.scale_workload_6,
		m.scale_workload_7
	],
	teachingValue: [
		m.scale_teachingValue_1,
		m.scale_teachingValue_2,
		m.scale_teachingValue_3,
		m.scale_teachingValue_4,
		m.scale_teachingValue_5,
		m.scale_teachingValue_6,
		m.scale_teachingValue_7
	],
	instructorClarity: [
		m.scale_quality_1,
		m.scale_quality_2,
		m.scale_quality_3,
		m.scale_quality_4,
		m.scale_quality_5,
		m.scale_quality_6,
		m.scale_quality_7
	],
	instructorAttitude: [
		m.scale_quality_1,
		m.scale_quality_2,
		m.scale_quality_3,
		m.scale_quality_4,
		m.scale_quality_5,
		m.scale_quality_6,
		m.scale_quality_7
	],
	instructorExpertise: [
		m.scale_expertise_1,
		m.scale_expertise_2,
		m.scale_expertise_3,
		m.scale_expertise_4,
		m.scale_expertise_5,
		m.scale_expertise_6,
		m.scale_expertise_7
	]
};

const TERM_NAMES: Record<Term, Msg> = {
	fall: m.term_fall,
	spring: m.term_spring,
	summer: m.term_summer
};

const OUTCOME_NAMES: Record<Outcome, Msg> = {
	passed: m.outcome_passed,
	failed: m.outcome_failed,
	dropped: m.outcome_dropped,
	ongoing: m.outcome_ongoing
};

const CURVE_NAMES: Record<CurveAnswer, Msg> = {
	yes: m.curve_yes,
	no: m.curve_no,
	unknown: m.curve_unknown
};

const KIND_NAMES: Record<CourseKind, Msg> = {
	compulsory: m.kind_compulsory,
	elective: m.kind_elective
};

export const criterionName = (c: Criterion) => CRITERION_NAMES[c]();
export const criterionHint = (c: Criterion) => CRITERION_HINTS[c]();
/** level: 1-7 */
export const scaleLabel = (c: Criterion, level: number) => SCALES[c][level - 1]?.() ?? '';
export const scaleLabels = (c: Criterion) => SCALES[c].map((f) => f());
export const termName = (t: Term) => TERM_NAMES[t]();
export const outcomeName = (o: Outcome) => OUTCOME_NAMES[o]();
export const curveName = (c: CurveAnswer) => CURVE_NAMES[c]();
export const kindName = (k: CourseKind) => KIND_NAMES[k]();

/** "2025-2026 Güz" */
export function termLabel(academicYear: number, term: Term): string {
	return `${academicYear}-${academicYear + 1} ${termName(term)}`;
}

export function courseName(course: { nameTr: string; nameEn: string | null }): string {
	return getLocale() === 'en' && course.nameEn ? course.nameEn : course.nameTr;
}

export function courseDescription(course: {
	descriptionTr: string | null;
	descriptionEn: string | null;
}) {
	return getLocale() === 'en'
		? course.descriptionEn || course.descriptionTr
		: course.descriptionTr || course.descriptionEn;
}

export function instructorName(i: { title: string | null; name: string }): string {
	return i.title ? `${i.title} ${i.name}` : i.name;
}

export function formatAverage(value: number | null): string {
	return value === null
		? '–'
		: value.toLocaleString(getLocale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}
