import { CRITERIA, SCALE_MAX, type Criterion, type CurveAnswer, type Outcome } from './constants';

export type Ratings = Record<Criterion, number>;

export interface CriterionSummary {
	n: number;
	/** Ortalama (1-7) */
	average: number | null;
	/** Ortalamanın yuvarlanmış hali, etiket göstermek için (1-7) */
	level: number | null;
	/** distribution[i] = (i+1) puanını veren kişi sayısı */
	distribution: number[];
}

export interface ReviewSummary {
	n: number;
	criteria: Record<Criterion, CriterionSummary>;
	classAverage: { n: number; average: number | null };
	curve: Record<CurveAnswer, number>;
	outcomes: Record<Outcome, number>;
}

interface SummarizableReview extends Ratings {
	classAverage: number | null;
	curve: CurveAnswer | null;
	outcome: Outcome | null;
}

export function summarizeCriterion(values: number[]): CriterionSummary {
	const distribution = Array.from({ length: SCALE_MAX }, () => 0);
	for (const v of values) if (v >= 1 && v <= SCALE_MAX) distribution[v - 1]++;
	const n = values.length;
	const average = n ? values.reduce((a, b) => a + b, 0) / n : null;
	return { n, average, level: average === null ? null : Math.round(average), distribution };
}

export function summarizeReviews(reviews: SummarizableReview[]): ReviewSummary {
	const criteria = Object.fromEntries(
		CRITERIA.map((c) => [c, summarizeCriterion(reviews.map((r) => r[c]))])
	) as Record<Criterion, CriterionSummary>;

	const averages = reviews.map((r) => r.classAverage).filter((v): v is number => v !== null);
	const curve: Record<CurveAnswer, number> = { yes: 0, no: 0, unknown: 0 };
	const outcomes: Record<Outcome, number> = { passed: 0, failed: 0, dropped: 0, ongoing: 0 };
	for (const r of reviews) {
		if (r.curve) curve[r.curve]++;
		if (r.outcome) outcomes[r.outcome]++;
	}

	return {
		n: reviews.length,
		criteria,
		classAverage: {
			n: averages.length,
			average: averages.length ? averages.reduce((a, b) => a + b, 0) / averages.length : null
		},
		curve,
		outcomes
	};
}
