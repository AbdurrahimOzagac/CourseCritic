import { describe, expect, it } from 'vitest';
import { NEW_INSTRUCTOR, parseReviewForm } from './review-form';

const now = new Date(2026, 9, 26);

function form(values: Record<string, string>) {
	const f = new FormData();
	for (const [k, v] of Object.entries(values)) f.set(k, v);
	return f;
}

const valid = {
	instructor: 'abc',
	academicYear: '2025',
	term: 'spring',
	difficulty: '5',
	workload: '6',
	teachingValue: '4',
	instructorClarity: '7',
	instructorAttitude: '7',
	instructorExpertise: '6'
};

describe('parseReviewForm', () => {
	it('accepts a minimal valid form', () => {
		const r = parseReviewForm(form(valid), now);
		expect(r.ok).toBe(true);
		if (r.ok) {
			expect(r.data.instructor).toEqual({ id: 'abc' });
			expect(r.data.difficulty).toBe(5);
			expect(r.data.comment).toBeNull();
			expect(r.data.attempts).toBeNull();
		}
	});

	it('allows skipping ratings', () => {
		const r = parseReviewForm(form({ ...valid, workload: '', instructorExpertise: '' }), now);
		expect(r.ok).toBe(true);
		if (r.ok) {
			expect(r.data.workload).toBeNull();
			expect(r.data.instructorExpertise).toBeNull();
			expect(r.data.difficulty).toBe(5);
		}
	});

	it('rejects out-of-range ratings', () => {
		const r = parseReviewForm(form({ ...valid, difficulty: '8', workload: '0' }), now);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.errors).toMatchObject({ difficulty: 'invalid', workload: 'invalid' });
	});

	it('requires at least one rating or a comment', () => {
		const none = {
			...valid,
			difficulty: '',
			workload: '',
			teachingValue: '',
			instructorClarity: '',
			instructorAttitude: '',
			instructorExpertise: ''
		};
		const empty = parseReviewForm(form(none), now);
		expect(empty.ok).toBe(false);
		if (!empty.ok) expect(empty.errors.ratings).toBe('empty_review');
		expect(parseReviewForm(form({ ...none, comment: 'Sadece yorum' }), now).ok).toBe(true);
		expect(parseReviewForm(form({ ...none, workload: '3' }), now).ok).toBe(true);
	});

	it('rejects future terms', () => {
		const r = parseReviewForm(form({ ...valid, academicYear: '2026', term: 'spring' }), now);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.errors.term).toBe('future_term');
	});

	it('rejects profanity in comments', () => {
		const r = parseReviewForm(form({ ...valid, comment: 'amk dersi' }), now);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.errors.comment).toBe('profanity');
			expect(r.profanity).toContain('amk');
		}
	});

	it('accepts a new instructor', () => {
		const r = parseReviewForm(
			form({
				...valid,
				instructor: NEW_INSTRUCTOR,
				newInstructorName: 'Ayşe Yılmaz'
			}),
			now
		);
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.data.instructor).toEqual({ name: 'Ayşe Yılmaz' });
	});

	it('validates optional fields', () => {
		const r = parseReviewForm(
			form({ ...valid, attempts: '9', classAverage: '120', curve: 'maybe' }),
			now
		);
		expect(r.ok).toBe(false);
		if (!r.ok)
			expect(r.errors).toMatchObject({
				attempts: 'invalid',
				classAverage: 'invalid',
				curve: 'invalid'
			});
	});
});
