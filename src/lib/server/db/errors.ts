/** D1/drizzle hata zincirinde UNIQUE kısıtı ihlali var mı? */
export function isUniqueViolation(e: unknown): boolean {
	for (let cur = e as { message?: string; cause?: unknown } | undefined, i = 0; cur && i < 5; i++) {
		if (cur.message?.includes('UNIQUE constraint failed')) return true;
		cur = cur.cause as typeof cur;
	}
	return false;
}
