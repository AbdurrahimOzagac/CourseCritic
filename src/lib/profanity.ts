/**
 * Basit küfür/hakaret filtresi (TR + EN). Sunucuda zorunlu, istemcide canlı uyarı olarak çalışır.
 * Amaç her şeyi yakalamak değil, açık küfürü engellemek. Gerisini bildirim + admin denetimi yakalar.
 *
 * Kelimeler küçük harfe çevrilir, Türkçe karakterler sadeleştirilir ("ş" → "s"), tekrar eden harfler
 * tekilleştirilir ("siiiktir" → "siktir") ve basit leet yazımı çözülür ("@" → "a").
 */

/** Kelimenin tamamı eşleşmeli ("aq" engellenir, "aquarium" engellenmez). */
const EXACT = [
	'amk',
	'aq',
	'amq',
	'amg',
	'mk',
	'oç',
	'wtf',
	'stfu',
	'fck',
	'fuk',
	'cunt',
	'dick',
	'cock',
	'twat'
];

/** Kelime bu kökle başlıyorsa engellenir ("orospu", "orospunun"). */
const PREFIX = [
	'orospu',
	'orspu',
	'siktir',
	'yarrak',
	'yarak',
	'dalyarak',
	'amcık',
	'amına',
	'amınakoy',
	'amcığ',
	'pezevenk',
	'pezeveng',
	'kahpe',
	'gavat',
	'ibne',
	'puşt',
	'kaltak',
	'yavşak',
	'gerizekalı',
	'salak',
	'salağ',
	'şerefsiz',
	'haysiyetsiz',
	'pislik',
	'götveren',
	'götlek',
	'avradını',
	'bacını',
	'dangalak',
	'itoğlu',
	'kancık',
	'kevaşe',
	'fuck',
	'motherfuck',
	'shit',
	'bullshit',
	'bitch',
	'asshole',
	'bastard',
	'dickhead',
	'retard',
	'whore',
	'slut',
	'idiot',
	'moron'
];

/** Birden fazla kelimeden oluşan ifadeler. */
const PHRASES = ['mal herif', 'it oğlu', 'ananı sik'];

/**
 * Sadeleşince masum kelimelerle karışan kökler: yalnızca Türkçe yazımıyla aranır.
 * ("göt" sadeleşince İngilizce "got" olur, "piç" ise "pic" olur.)
 */
const STRICT_PREFIX = ['göt', 'piç'];
const STRICT_ALLOW = ['götür', 'göte'];

/**
 * "sik" kökü ayrıca ele alınır: ASCII yazanlar "sıkıcı" yerine "sikici", "sıkıntı" yerine "sikinti" yazar.
 * Noktasız "ı" ile yazılan kelimeler ("sıktı", "sıkıcı") hiç engellenmez.
 */
const SIK_BLOCK = /^sik($|ik|im|er|ey|t|is|ecem|icem|eceg|icek)/;
const SIK_ALLOW = [
	'sikint',
	'sikic',
	'sikil',
	'sikisik',
	'sikist',
	'sikca',
	'sikke',
	'sikiy',
	'sikis tep'
];

const LEET: Record<string, string> = {
	'0': 'o',
	'1': 'i',
	'3': 'e',
	'4': 'a',
	'5': 's',
	'@': 'a',
	$: 's',
	'!': 'i'
};

function fold(word: string): string {
	return word
		.replace(/ç/g, 'c')
		.replace(/ğ/g, 'g')
		.replace(/ı/g, 'i')
		.replace(/ö/g, 'o')
		.replace(/ş/g, 's')
		.replace(/ü/g, 'u');
}

function collapseRepeats(word: string): string {
	return word.replace(/(.)\1+/g, '$1');
}

function normalizeWord(word: string): string {
	return collapseRepeats(fold(word));
}

function tokenize(text: string): string[] {
	return text
		.toLocaleLowerCase('tr')
		.replace(/[013458@$!]/g, (c) => LEET[c] ?? c)
		.split(/[^a-zçğıöşüâîû]+/)
		.filter(Boolean);
}

const exactSet = new Set(EXACT.map(normalizeWord));
const prefixes = PREFIX.map(normalizeWord);
const phrases = PHRASES.map((p) => p.split(' ').map(normalizeWord).join(' '));

function isBlockedWord(raw: string): boolean {
	const w = normalizeWord(raw);
	if (exactSet.has(w) || prefixes.some((p) => w.startsWith(p))) return true;

	const strict = collapseRepeats(raw);
	if (
		STRICT_PREFIX.some((p) => strict.startsWith(p)) &&
		!STRICT_ALLOW.some((a) => strict.startsWith(a))
	) {
		return true;
	}

	// Noktasız ı ile başlayan "sık-" ailesi masumdur.
	if (!raw.startsWith('sı') && SIK_BLOCK.test(w) && !SIK_ALLOW.some((a) => w.startsWith(a))) {
		return true;
	}
	return false;
}

/** Metindeki engelli kelimeleri döndürür. Boş dizi = temiz. */
export function findProfanity(text: string): string[] {
	const tokens = tokenize(text);
	const found = new Set(tokens.filter(isBlockedWord));
	const joined = ' ' + tokens.map(normalizeWord).join(' ') + ' ';
	for (const p of phrases) if (joined.includes(' ' + p + ' ')) found.add(p);
	return [...found];
}
