const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;

/** Log'a yazılacak metindeki e-posta adreslerini maskeler. */
export function redactEmails(text: string): string {
	return text.replace(EMAIL, '[e-posta]');
}

/** Beklenmeyen bir hatayı log için tek satıra indirir: sadece tür ve maskelenmiş mesaj, istek gövdesi yok. */
export function describeError(error: unknown): string {
	// Drizzle sorgu hataları mesajda parametreleri de taşır (kullanıcı kimliği, yorum metni, özetler):
	// sadece veritabanının kendi hata mesajı loglanır
	if (error instanceof Error && error.message.startsWith('Failed query')) {
		const cause = error.cause instanceof Error ? error.cause.message : 'bilinmeyen neden';
		return redactEmails(`${error.name}: veritabanı sorgusu başarısız (${cause})`).slice(0, 1000);
	}
	if (error instanceof Error) {
		const cause = error.cause instanceof Error ? ` (neden: ${error.cause.message})` : '';
		return redactEmails(`${error.name}: ${error.message}${cause}`).slice(0, 1000);
	}
	return redactEmails(String(error)).slice(0, 1000);
}
