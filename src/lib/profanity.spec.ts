import { describe, expect, it } from 'vitest';
import { findProfanity } from './profanity';

describe('findProfanity', () => {
	it.each([
		'Hoca çok iyi anlatıyor, ders sıkıcı ama öğretici.',
		'ders cok sikici ama hoca iyi, sikinti yok',
		'Bu dersten sıkıldım, sıktı beni.',
		'I got an AA, great pic of the syllabus',
		'awk ve sed konuları işlendi, aquarium örneği',
		'Ödevleri götürmek zor, sikke koleksiyonu gibi',
		'Assignment, class, classic, Scunthorpe'
	])('temiz metni geçirir: %s', (text) => {
		expect(findProfanity(text)).toEqual([]);
	});

	it.each([
		['hoca tam bir orospu çocuğu', 'orospu'],
		['AMK bu ders ne', 'amk'],
		['siiiktir git', 'siiiktir'],
		['s1kt1r', 'siktir'],
		['bu hoca şerefsiz', 'şerefsiz'],
		['what the fuck is this course', 'fuck'],
		['hoca salağın teki', 'salağın'],
		['tam bir mal herif', 'mal herif'],
		['göt gibi ders', 'göt'],
		['sikerim böyle dersi', 'sikerim']
	])('küfrü yakalar: %s', (text, word) => {
		expect(findProfanity(text)).toContain(word);
	});
});
