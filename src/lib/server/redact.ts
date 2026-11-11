const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;

/** Log'a yazılacak metindeki e-posta adreslerini maskeler. */
export function redactEmails(text: string): string {
	return text.replace(EMAIL, '[e-posta]');
}

/** Tek bir hatanın log'a yazılabilir mesajı. Drizzle sorgu hataları parametre taşır: onlardan sadece başlık kalır. */
function safeMessage(error: unknown): string {
	if (!(error instanceof Error)) return String(error);
	if (error.message.startsWith('Failed query'))
		return `${error.name}: veritabanı sorgusu başarısız`;
	return `${error.name}: ${error.message}`;
}

/**
 * Beklenmeyen bir hatayı log için tek satıra indirir: zincirdeki her hata için tür ve maskelenmiş mesaj; sorgu
 * parametresi, istek gövdesi ya da e-posta adresi yok. Hiçbir durumda hata fırlatmaz.
 */
export function describeError(error: unknown): string {
	try {
		const parts: string[] = [];
		let current: unknown = error;
		for (let depth = 0; current !== undefined && current !== null && depth < 5; depth++) {
			parts.push(safeMessage(current));
			current = current instanceof Error ? current.cause : undefined;
		}
		return redactEmails(parts.join(' ← ')).slice(0, 1000);
	} catch {
		return 'açıklanamayan hata';
	}
}
