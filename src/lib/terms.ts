import type { Term } from './constants';

export const TERM_ORDER: Record<Term, number> = { fall: 1, spring: 2, summer: 3 };

/** Eylül ve sonrası yeni akademik yıldır: Ekim 2026 → 2026 (2026-2027). */
export function currentAcademicYear(now = new Date()): number {
	return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

/** Şu ana kadar başlamış en son yarıyıl. Eylül–Ocak: güz, Şubat–Haziran: bahar, Temmuz–Ağustos: yaz. */
export function latestStartedTerm(now = new Date()): { academicYear: number; term: Term } {
	const month = now.getMonth();
	const academicYear = currentAcademicYear(now);
	if (month >= 8 || month === 0) return { academicYear, term: 'fall' };
	if (month <= 5) return { academicYear, term: 'spring' };
	return { academicYear, term: 'summer' };
}

export function compareTerms(
	a: { academicYear: number; term: Term },
	b: { academicYear: number; term: Term }
): number {
	return a.academicYear - b.academicYear || TERM_ORDER[a.term] - TERM_ORDER[b.term];
}

/** Değerlendirilebilecek dönem: başlamış olmalı ve en fazla MAX_YEARS_BACK yıl geride. */
export const MAX_YEARS_BACK = 20;

export function isTermAllowed(academicYear: number, term: Term, now = new Date()): boolean {
	const latest = latestStartedTerm(now);
	if (academicYear < latest.academicYear - MAX_YEARS_BACK) return false;
	return compareTerms({ academicYear, term }, latest) <= 0;
}

export function selectableYears(now = new Date()): number[] {
	const latest = latestStartedTerm(now).academicYear;
	return Array.from({ length: MAX_YEARS_BACK + 1 }, (_, i) => latest - i);
}

/** URL parametresi: "2025-fall" */
export function termKey(academicYear: number, term: Term): string {
	return `${academicYear}-${term}`;
}

export function parseTermKey(key: string | null): { academicYear: number; term: Term } | null {
	const m = key?.match(/^(\d{4})-(fall|spring|summer)$/);
	return m ? { academicYear: Number(m[1]), term: m[2] as Term } : null;
}
