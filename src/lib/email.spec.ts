import { describe, expect, it } from 'vitest';
import { isAllowedEmail, parseDomainList } from './email';

describe('isAllowedEmail', () => {
	const domains = parseDomainList('hacettepe.edu.tr, ');
	it.each([
		['ali.veli@hacettepe.edu.tr', true],
		[' Ali@Hacettepe.Edu.Tr ', true],
		['b2210356000@hacettepe.edu.tr', true],
		['ali_veli-2@hacettepe.edu.tr', true],
		// Bir posta kutusundan birden fazla hesap açılmasın
		['ali.veli+1@hacettepe.edu.tr', false],
		['ali%x@hacettepe.edu.tr', false],
		// Alt alan adları sadece listede açıkça varsa
		['b2210356000@cs.hacettepe.edu.tr', false],
		['ali@nothacettepe.edu.tr', false],
		['ali@hacettepe.edu.tr.evil.com', false],
		['ali@gmail.com', false],
		['not-an-email', false]
	])('%s → %s', (email, expected) => {
		expect(isAllowedEmail(email, domains)).toBe(expected);
	});

	it('accepts subdomains that are listed explicitly', () => {
		const withCs = parseDomainList('hacettepe.edu.tr,cs.hacettepe.edu.tr');
		expect(isAllowedEmail('b2210356000@cs.hacettepe.edu.tr', withCs)).toBe(true);
		expect(isAllowedEmail('x@other.hacettepe.edu.tr', withCs)).toBe(false);
	});
});
