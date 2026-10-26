/**
 * Türkçe karakterden bağımsız karşılaştırma için metni sadeleştirir.
 * "Dağıtık Sistemler" → "dagitik sistemler", "BBM-342" → "bbm 342"
 */
export function foldText(input: string): string {
	return input
		.toLocaleLowerCase('tr')
		.replace(/ç/g, 'c')
		.replace(/ğ/g, 'g')
		.replace(/ı/g, 'i')
		.replace(/ö/g, 'o')
		.replace(/ş/g, 's')
		.replace(/ü/g, 'u')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

/** Arama sorgusunun hedef metinle eşleşip eşleşmediği. Boşluksuz hali de denenir ("bbm342" ↔ "BBM 342"). */
export function matchesQuery(query: string, ...targets: (string | null | undefined)[]): boolean {
	const q = foldText(query);
	if (!q) return true;
	const qCompact = q.replace(/ /g, '');
	const qTokens = q.split(' ');
	const hay = foldText(targets.filter(Boolean).join(' '));
	if (hay.replace(/ /g, '').includes(qCompact)) return true;
	return qTokens.every((t) => hay.includes(t));
}

export function slugify(input: string): string {
	return foldText(input).replace(/ /g, '-');
}

/** Ders kodundan URL parçası: "BBM 342" → "bbm342" */
export function courseSlug(code: string): string {
	return foldText(code).replace(/ /g, '');
}

/** Ders kodunu tek biçime getirir: "bbm342" / "BBM-342" → "BBM 342" */
export function normalizeCourseCode(code: string): string {
	const compact = code.toLocaleUpperCase('tr').replace(/[^A-ZÇĞİÖŞÜ0-9]/g, '');
	const m = compact.match(/^([A-ZÇĞİÖŞÜ]+)(\d.*)$/);
	return m ? `${m[1]} ${m[2]}` : compact;
}
