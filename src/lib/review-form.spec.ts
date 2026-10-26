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

	it('requires all ratings', () => {
		const r = parseReviewForm(form({ ...valid, workload: '', difficulty: '8' }), now);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.errors).toMatchObject({ workload: 'required', difficulty: 'required' });
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
				newInstructorTitle: 'Dr.',
				newInstructorName: 'Ayşe Yılmaz'
			}),
			now
		);
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.data.instructor).toEqual({ title: 'Dr.', name: 'Ayşe Yılmaz' });
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
