import { describe, expect, it } from 'vitest';
import { parseCourseFields } from './course-form';

const from = (o: Record<string, string>) => (k: string) => o[k];

describe('parseCourseFields', () => {
	it('normalizes and parses', () => {
		const r = parseCourseFields(
			from({ code: 'bbm342', nameTr: 'İşletim Sistemleri', ects: '6', kind: 'compulsory' })
		);
		expect(r).toEqual({
			ok: true,
			data: expect.objectContaining({
				code: 'BBM 342',
				nameTr: 'İşletim Sistemleri',
				ects: 6,
				kind: 'compulsory',
				nameEn: null
			})
		});
	});

	it('reports errors', () => {
		const r = parseCourseFields(from({ code: '???', nameTr: '', yearLevel: '9', kind: 'x' }));
		expect(r.ok).toBe(false);
		if (!r.ok)
			expect(r.errors).toEqual({
				code: 'invalid',
				nameTr: 'required',
				yearLevel: 'invalid',
				kind: 'invalid'
			});
	});
});
