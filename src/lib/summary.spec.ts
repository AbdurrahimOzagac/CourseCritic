import { describe, expect, it } from 'vitest';
import { summarizeCriterion, summarizeReviews } from './summary';

describe('summary', () => {
	it('summarizes one criterion', () => {
		const s = summarizeCriterion([1, 7, 7, 4]);
		expect(s.n).toBe(4);
		expect(s.average).toBe(4.75);
		expect(s.level).toBe(5);
		expect(s.distribution).toEqual([1, 0, 0, 1, 0, 0, 2]);
	});

	it('handles empty input', () => {
		const s = summarizeReviews([]);
		expect(s.n).toBe(0);
		expect(s.criteria.difficulty.average).toBeNull();
		expect(s.classAverage.average).toBeNull();
	});

	it('summarizes optional fields', () => {
		const base = {
			difficulty: 4,
			workload: 4,
			teachingValue: 4,
			instructorClarity: 4,
			instructorAttitude: 4,
			instructorExpertise: 4
		};
		const s = summarizeReviews([
			{ ...base, classAverage: 50, curve: 'yes', outcome: 'passed' },
			{ ...base, classAverage: null, curve: null, outcome: 'dropped' },
			{ ...base, classAverage: 70, curve: 'yes', outcome: null }
		]);
		expect(s.classAverage).toEqual({ n: 2, average: 60 });
		expect(s.curve.yes).toBe(2);
		expect(s.outcomes).toEqual({ passed: 1, failed: 0, dropped: 1, ongoing: 0 });
	});
});
