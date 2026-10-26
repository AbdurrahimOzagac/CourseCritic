import { describe, expect, it } from 'vitest';
import { isAllowedEmail, parseDomainList } from './email';

describe('isAllowedEmail', () => {
	const domains = parseDomainList('hacettepe.edu.tr, ');
	it.each([
		['ali.veli@hacettepe.edu.tr', true],
		['B2210356000@cs.hacettepe.edu.tr', true],
		[' Ali@Hacettepe.Edu.Tr ', true],
		['ali@nothacettepe.edu.tr', false],
		['ali@hacettepe.edu.tr.evil.com', false],
		['ali@gmail.com', false],
		['not-an-email', false]
	])('%s → %s', (email, expected) => {
		expect(isAllowedEmail(email, domains)).toBe(expected);
	});
});
