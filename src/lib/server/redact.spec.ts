import { describe, expect, it } from 'vitest';
import { describeError, redactEmails } from './redact.ts';

describe('redact', () => {
	it('masks e-mail addresses', () => {
		expect(redactEmails('to ali.veli@hacettepe.edu.tr and X+1@gmail.com failed')).toBe(
			'to [e-posta] and [e-posta] failed'
		);
	});

	it('describes errors without leaking addresses', () => {
		const e = new Error('send failed for ali@hacettepe.edu.tr', {
			cause: new Error('rejected: ali@hacettepe.edu.tr')
		});
		expect(describeError(e)).toBe('Error: send failed for [e-posta] (neden: rejected: [e-posta])');
		expect(describeError('plain veli@hacettepe.edu.tr')).toBe('plain [e-posta]');
	});
});
