import { describe, expect, it } from 'vitest';
import { seal, unseal } from './crypto.ts';

describe('seal', () => {
	const secret = 'test-secret-test-secret-test-secret';

	it('round-trips and uses a fresh IV each time', async () => {
		const a = await seal(secret, 'hesap-ozeti');
		const b = await seal(secret, 'hesap-ozeti');
		expect(a).not.toBe(b);
		expect(a).not.toContain('hesap');
		expect(await unseal(secret, a)).toBe('hesap-ozeti');
	});

	it('rejects tampered data and other keys', async () => {
		const a = await seal(secret, 'x');
		expect(await unseal('another-secret-another-secret-123', a)).toBeNull();
		expect(await unseal(secret, a.slice(0, -2) + (a.endsWith('A') ? 'BB' : 'AA'))).toBeNull();
		expect(await unseal(secret, 'bozuk')).toBeNull();
	});
});
