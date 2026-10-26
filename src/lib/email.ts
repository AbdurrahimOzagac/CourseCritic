/** E-postayı karşılaştırma için tek biçime getirir. */
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

/** İzin verilen alan adı ya da alt alan adı mı? ("x@cs.hacettepe.edu.tr" → hacettepe.edu.tr altında) */
export function isAllowedEmail(email: string, allowedDomains: string[]): boolean {
	const m = normalizeEmail(email).match(/^[a-z0-9._%+-]+@([a-z0-9-]+(\.[a-z0-9-]+)+)$/);
	if (!m) return false;
	const domain = m[1];
	return allowedDomains.some((d) => domain === d || domain.endsWith('.' + d));
}

export function parseDomainList(value: string | undefined): string[] {
	return (value ?? '')
		.split(',')
		.map((d) => d.trim().toLowerCase())
		.filter(Boolean);
}
