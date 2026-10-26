import { describe, expect, it } from 'vitest';
import { courseSlug, foldText, matchesQuery, normalizeCourseCode, slugify } from './text';

describe('text', () => {
	it('folds Turkish characters', () => {
		expect(foldText('Dağıtık SİSTEMLER ÇÖZÜM Işık')).toBe('dagitik sistemler cozum isik');
		expect(foldText('Introduction')).toBe('introduction');
	});

	it('matches search queries', () => {
		expect(matchesQuery('dagitik', 'BBM 342', 'Dağıtık Sistemler')).toBe(true);
		expect(matchesQuery('bbm342', 'BBM 342')).toBe(true);
		expect(matchesQuery('bbm 342', 'BBM342')).toBe(true);
		expect(matchesQuery('sistem dağ', 'Dağıtık Sistemler')).toBe(true);
		expect(matchesQuery('veri', 'Dağıtık Sistemler')).toBe(false);
		expect(matchesQuery('', 'x')).toBe(true);
	});

	it('builds slugs and codes', () => {
		expect(courseSlug('BBM 342')).toBe('bbm342');
		expect(slugify('Prof. Dr. Şükrü Öztürk')).toBe('prof-dr-sukru-ozturk');
		expect(normalizeCourseCode('bbm-342')).toBe('BBM 342');
		expect(normalizeCourseCode('BİL 101L')).toBe('BİL 101L');
	});
});
