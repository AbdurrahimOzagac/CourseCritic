import { describe, expect, it } from 'vitest';
import { adminAccess, isAdminRoute } from './admin.ts';

describe('admin access', () => {
	it('recognises admin routes by route id', () => {
		expect(isAdminRoute('/admin')).toBe(true);
		expect(isAdminRoute('/admin/bildirimler')).toBe(true);
		expect(isAdminRoute('/administrator')).toBe(false);
		expect(isAdminRoute('/ders/[slug]')).toBe(false);
		expect(isAdminRoute(null)).toBe(false);
	});

	it('decides access', () => {
		expect(adminAccess('/admin/hocalar', null)).toBe('login');
		expect(adminAccess('/admin/hocalar', { role: 'user' })).toBe('not_found');
		expect(adminAccess('/admin/hocalar', { role: 'admin' })).toBe('allow');
		expect(adminAccess('/ders/[slug]', null)).toBe('allow');
		expect(adminAccess(null, null)).toBe('allow');
	});
});
