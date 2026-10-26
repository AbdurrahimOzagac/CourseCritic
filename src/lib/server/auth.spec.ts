import { describe, expect, it } from 'vitest';
import { adminEmailHashes, emailHash } from './auth.ts';

describe('adminEmailHashes', () => {
	const secret = 'test-secret-test-secret-test-secret';

	it('hashes the normalized ADMIN_EMAILS list', async () => {
		const hashes = await adminEmailHashes(secret, ' Admin@Example.com, ikinci@hacettepe.edu.tr ,');
		expect(hashes.size).toBe(2);
		expect(hashes.has(await emailHash(secret, 'admin@example.com'))).toBe(true);
		expect(hashes.has(await emailHash(secret, 'ikinci@hacettepe.edu.tr'))).toBe(true);
		expect(hashes.has(await emailHash(secret, 'baska@hacettepe.edu.tr'))).toBe(false);
	});

	it('follows changes to the list (no stale admins)', async () => {
		const before = await adminEmailHashes(secret, 'a@example.com,b@example.com');
		const after = await adminEmailHashes(secret, 'a@example.com');
		const b = await emailHash(secret, 'b@example.com');
		expect(before.has(b)).toBe(true);
		expect(after.has(b)).toBe(false);
	});

	it('handles an empty list', async () => {
		expect((await adminEmailHashes(secret, undefined)).size).toBe(0);
	});
});
