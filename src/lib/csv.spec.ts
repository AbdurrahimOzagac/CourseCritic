import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv';

describe('parseCsv', () => {
	it('parses quoted fields and both delimiters', () => {
		expect(parseCsv('code,name_tr\nBBM 101,"Programlama, Giriş"\n\n')).toEqual([
			{ code: 'BBM 101', name_tr: 'Programlama, Giriş' }
		]);
		expect(parseCsv('﻿Code;Name\r\nA;"x ""y"""\r\nB;z')).toEqual([
			{ code: 'A', name: 'x "y"' },
			{ code: 'B', name: 'z' }
		]);
	});
});
