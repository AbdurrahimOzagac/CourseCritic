/** E-postayı karşılaştırma için tek biçime getirir. */
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

/**
 * Adres izin verilen bir alan adında mı?
 *
 * Bir posta kutusu = bir hesap kuralı için iki kısıt var:
 * - `@` öncesinde sadece harf, rakam, nokta, tire ve alt çizgi kabul edilir. `ali+1@…` gibi etiketli adresler
 *   (Microsoft 365 ve Google'da asıl kutuya teslim edilir) ve `%` ile yönlendirme reddedilir; aksi halde tek kutudan
 *   sınırsız hesap açılabilir.
 * - Alan adı listedekiyle tam eşleşmeli. Alt alan adları (ör. `cs.hacettepe.edu.tr`) ancak listeye açıkça yazılırsa
 *   kabul edilir.
 */
export function isAllowedEmail(email: string, allowedDomains: string[]): boolean {
	const m = normalizeEmail(email).match(/^[a-z0-9._-]+@([a-z0-9-]+(\.[a-z0-9-]+)+)$/);
	return !!m && allowedDomains.includes(m[1]);
}

export function parseDomainList(value: string | undefined): string[] {
	return (value ?? '')
		.split(',')
		.map((d) => d.trim().toLowerCase())
		.filter(Boolean);
}
