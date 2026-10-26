import { COURSE_KINDS, type CourseKind } from './constants';
import { findProfanity } from './profanity';
import { normalizeCourseCode } from './text';

export interface CourseFields {
	code: string;
	nameTr: string;
	nameEn: string | null;
	descriptionTr: string | null;
	descriptionEn: string | null;
	credits: number | null;
	ects: number | null;
	yearLevel: number | null;
	kind: CourseKind | null;
	prerequisites: string | null;
}

export const COURSE_FIELD_KEYS = [
	'code',
	'nameTr',
	'nameEn',
	'credits',
	'ects',
	'yearLevel',
	'kind',
	'prerequisites',
	'descriptionTr',
	'descriptionEn'
] as const satisfies readonly (keyof CourseFields)[];

type Errors = Partial<
	Record<keyof CourseFields, 'required' | 'invalid' | 'too_long' | 'profanity'>
>;

/** Hem form verisini hem CSV satırlarını kabul eder. */
export function parseCourseFields(
	get: (key: string) => string | null | undefined
): { ok: true; data: CourseFields } | { ok: false; errors: Errors } {
	const errors: Errors = {};
	const text = (key: keyof CourseFields, max: number, required = false): string | null => {
		const v = (get(key) ?? '').trim();
		if (!v) {
			if (required) errors[key] = 'required';
			return null;
		}
		if (v.length > max) errors[key] = 'too_long';
		else if (findProfanity(v).length) errors[key] = 'profanity';
		return v;
	};
	const int = (key: keyof CourseFields, min: number, max: number): number | null => {
		const v = (get(key) ?? '').trim();
		if (!v) return null;
		const n = Number(v.replace(',', '.'));
		if (!Number.isFinite(n) || n < min || n > max) {
			errors[key] = 'invalid';
			return null;
		}
		return Math.round(n);
	};

	const rawCode = text('code', 20, true);
	const code = rawCode ? normalizeCourseCode(rawCode) : '';
	if (rawCode && !/^[A-ZÇĞİÖŞÜ]{2,6} ?\d{2,4}[A-Z]?$/.test(code)) errors.code = 'invalid';

	const kindRaw = (get('kind') ?? '').trim();
	const kind = kindRaw
		? (COURSE_KINDS as readonly string[]).includes(kindRaw)
			? (kindRaw as CourseKind)
			: null
		: null;
	if (kindRaw && !kind) errors.kind = 'invalid';

	const data: CourseFields = {
		code,
		nameTr: text('nameTr', 150, true) ?? '',
		nameEn: text('nameEn', 150),
		descriptionTr: text('descriptionTr', 3000),
		descriptionEn: text('descriptionEn', 3000),
		credits: int('credits', 0, 30),
		ects: int('ects', 0, 60),
		yearLevel: int('yearLevel', 1, 6),
		kind,
		prerequisites: text('prerequisites', 300)
	};
	return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}
