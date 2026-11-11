import { describe, expect, it } from 'vitest';
import { seal, unseal } from './crypto.ts';

describe('seal', () => {
	const secret = 'test-secret-test-secret-test-secret';

	it('round-trips and uses a fresh IV each time', async () => {
		const a = await seal(secret, 'hesap-ozeti', 'satir-1');
		const b = await seal(secret, 'hesap-ozeti', 'satir-1');
		expect(a).not.toBe(b);
		expect(a).not.toContain('hesap');
		expect(await unseal(secret, a, 'satir-1')).toBe('hesap-ozeti');
		expect(await unseal(secret, a, 'satir-2')).toBeNull();
	});

	it('rejects tampered data and other keys', async () => {
		const a = await seal(secret, 'x', 'c');
		expect(await unseal('another-secret-another-secret-123', a, 'c')).toBeNull();
		expect(await unseal(secret, a.slice(0, -2) + (a.endsWith('A') ? 'BB' : 'AA'), 'c')).toBeNull();
		expect(await unseal(secret, 'bozuk', 'c')).toBeNull();
	});
});
