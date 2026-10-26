import { describe, expect, it } from 'vitest';
import {
	currentAcademicYear,
	isTermAllowed,
	latestStartedTerm,
	parseTermKey,
	termKey
} from './terms';

describe('terms', () => {
	it('computes academic year', () => {
		expect(currentAcademicYear(new Date(2026, 9, 26))).toBe(2026);
		expect(currentAcademicYear(new Date(2027, 2, 1))).toBe(2026);
	});

	it('computes latest started term', () => {
		expect(latestStartedTerm(new Date(2026, 9, 26))).toEqual({ academicYear: 2026, term: 'fall' });
		expect(latestStartedTerm(new Date(2027, 0, 10))).toEqual({ academicYear: 2026, term: 'fall' });
		expect(latestStartedTerm(new Date(2027, 3, 1))).toEqual({ academicYear: 2026, term: 'spring' });
		expect(latestStartedTerm(new Date(2027, 6, 15))).toEqual({
			academicYear: 2026,
			term: 'summer'
		});
	});

	it('rejects future terms', () => {
		const now = new Date(2026, 9, 26);
		expect(isTermAllowed(2026, 'fall', now)).toBe(true);
		expect(isTermAllowed(2026, 'spring', now)).toBe(false);
		expect(isTermAllowed(2025, 'summer', now)).toBe(true);
		expect(isTermAllowed(1990, 'fall', now)).toBe(false);
	});

	it('round-trips term keys', () => {
		expect(parseTermKey(termKey(2025, 'spring'))).toEqual({ academicYear: 2025, term: 'spring' });
		expect(parseTermKey('bad')).toBeNull();
	});
});
