import { error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';

/** Cloudflare ortam değişkenleri ve bağlantılar. Eksik gizli anahtar varsa açıkça hata verir. */
export function getEnv(): Env {
	if (!env.DB) error(500, 'D1 bağlantısı (DB) bulunamadı. wrangler.jsonc ayarlarını kontrol edin.');
	if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) {
		error(
			500,
			'AUTH_SECRET tanımlı değil ya da 32 karakterden kısa. .dev.vars.example dosyasına bakın.'
		);
	}
	return env;
}
