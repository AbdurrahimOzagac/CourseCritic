/** Açık yönlendirme açığını önler: sadece site içi yollar. */
export function safeRedirectPath(value: string | null | undefined, fallback = '/'): string {
	if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\'))
		return fallback;
	return value;
}
