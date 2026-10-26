import {
	COMMENT_MAX_LENGTH,
	CRITERIA,
	CURVE_ANSWERS,
	MAX_ATTEMPTS,
	OUTCOMES,
	SCALE_MAX,
	SCALE_MIN,
	TERMS,
	type Criterion,
	type CurveAnswer,
	type Outcome,
	type Term
} from './constants';
import { findProfanity } from './profanity';
import { isTermAllowed } from './terms';

export const NEW_INSTRUCTOR = '__new__';

export type FieldError = 'required' | 'invalid' | 'profanity' | 'too_long' | 'future_term';

export interface ReviewInput extends Record<Criterion, number> {
	instructor: { id: string } | { title: string | null; name: string };
	academicYear: number;
	term: Term;
	attempts: number | null;
	outcome: Outcome | null;
	classAverage: number | null;
	curve: CurveAnswer | null;
	comment: string | null;
}

export type ReviewFormResult =
	| { ok: true; data: ReviewInput }
	| { ok: false; errors: Partial<Record<string, FieldError>>; profanity: string[] };

function str(form: FormData, key: string): string {
	const v = form.get(key);
	return typeof v === 'string' ? v.trim() : '';
}

function optionalInt(
	form: FormData,
	key: string,
	min: number,
	max: number
): number | null | 'invalid' {
	const raw = str(form, key);
	if (!raw) return null;
	const n = Number(raw);
	return Number.isInteger(n) && n >= min && n <= max ? n : 'invalid';
}

function optionalEnum<T extends string>(
	form: FormData,
	key: string,
	values: readonly T[]
): T | null | 'invalid' {
	const raw = str(form, key);
	if (!raw) return null;
	return (values as readonly string[]).includes(raw) ? (raw as T) : 'invalid';
}

export function parseReviewForm(form: FormData, now = new Date()): ReviewFormResult {
	const errors: Partial<Record<string, FieldError>> = {};
	let profanity: string[] = [];

	let instructor: ReviewInput['instructor'] | null = null;
	const instructorId = str(form, 'instructor');
	if (!instructorId) errors.instructor = 'required';
	else if (instructorId === NEW_INSTRUCTOR) {
		const name = str(form, 'newInstructorName');
		const title = str(form, 'newInstructorTitle') || null;
		if (name.length < 3) errors.newInstructorName = 'required';
		else if (name.length > 100 || (title && title.length > 40))
			errors.newInstructorName = 'too_long';
		else {
			const bad = findProfanity(`${title ?? ''} ${name}`);
			if (bad.length) {
				errors.newInstructorName = 'profanity';
				profanity = profanity.concat(bad);
			} else instructor = { title, name };
		}
	} else instructor = { id: instructorId };

	const academicYear = Number(str(form, 'academicYear'));
	const term = str(form, 'term') as Term;
	if (!Number.isInteger(academicYear) || !academicYear) errors.academicYear = 'required';
	if (!TERMS.includes(term)) errors.term = 'required';
	if (!errors.academicYear && !errors.term && !isTermAllowed(academicYear, term, now)) {
		errors.term = 'future_term';
	}

	const ratings = {} as Record<Criterion, number>;
	for (const c of CRITERIA) {
		const n = Number(str(form, c));
		if (!Number.isInteger(n) || n < SCALE_MIN || n > SCALE_MAX) errors[c] = 'required';
		else ratings[c] = n;
	}

	const attempts = optionalInt(form, 'attempts', 1, MAX_ATTEMPTS);
	if (attempts === 'invalid') errors.attempts = 'invalid';
	const outcome = optionalEnum(form, 'outcome', OUTCOMES);
	if (outcome === 'invalid') errors.outcome = 'invalid';
	const classAverage = optionalInt(form, 'classAverage', 0, 100);
	if (classAverage === 'invalid') errors.classAverage = 'invalid';
	const curve = optionalEnum(form, 'curve', CURVE_ANSWERS);
	if (curve === 'invalid') errors.curve = 'invalid';

	const comment =
		str(form, 'comment')
			.replace(/\r\n/g, '\n')
			.replace(/\n{3,}/g, '\n\n') || null;
	if (comment && comment.length > COMMENT_MAX_LENGTH) errors.comment = 'too_long';
	else if (comment) {
		const bad = findProfanity(comment);
		if (bad.length) {
			errors.comment = 'profanity';
			profanity = profanity.concat(bad);
		}
	}

	if (Object.keys(errors).length || !instructor) return { ok: false, errors, profanity };

	return {
		ok: true,
		data: {
			instructor,
			academicYear,
			term,
			...ratings,
			attempts: attempts as number | null,
			outcome: outcome as Outcome | null,
			classAverage: classAverage as number | null,
			curve: curve as CurveAnswer | null,
			comment
		}
	};
}
