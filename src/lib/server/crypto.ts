const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
	return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function toBase64Url(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

const keyCache = new Map<string, Promise<CryptoKey>>();

function hmacKey(secret: string): Promise<CryptoKey> {
	let key = keyCache.get(secret);
	if (!key) {
		key = crypto.subtle.importKey(
			'raw',
			encoder.encode(secret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign']
		);
		keyCache.set(secret, key);
	}
	return key;
}

/** HMAC-SHA256, hex. Anahtar olmadan geri çevrilemez, aynı girdi her zaman aynı çıktıyı verir. */
export async function hmac(secret: string, value: string): Promise<string> {
	return toHex(await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(value)));
}

export async function sha256(value: string): Promise<string> {
	return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

export function randomToken(bytes = 32): string {
	return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** 6 haneli, eşit dağılımlı sayısal kod. */
export function randomCode(): string {
	const max = 4_294_967_296 - (4_294_967_296 % 1_000_000);
	const buf = new Uint32Array(1);
	do crypto.getRandomValues(buf);
	while (buf[0] >= max);
	return String(buf[0] % 1_000_000).padStart(6, '0');
}

export function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

const sealKeyCache = new Map<string, Promise<CryptoKey>>();

/** AUTH_SECRET'tan türetilen, sadece şifreleme için kullanılan AES-GCM anahtarı. */
function sealKey(secret: string): Promise<CryptoKey> {
	let key = sealKeyCache.get(secret);
	if (!key) {
		key = crypto.subtle
			.digest('SHA-256', encoder.encode(`seal:${secret}`))
			.then((raw) => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']));
		sealKeyCache.set(secret, key);
	}
	return key;
}

/**
 * Değeri AES-GCM ile şifreler (rastgele IV). Çıktı: base64url(iv | şifreli metin).
 * `context` (ör. satır kimliği) şifreye bağlanır: değer başka bir satıra taşınırsa açılmaz.
 */
export async function seal(secret: string, value: string, context: string): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ct = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv, additionalData: encoder.encode(context) },
			await sealKey(secret),
			encoder.encode(value)
		)
	);
	const out = new Uint8Array(iv.length + ct.length);
	out.set(iv);
	out.set(ct, iv.length);
	return toBase64Url(out);
}

/** `seal` çıktısını çözer; bozuk ya da başka anahtarla şifrelenmişse null. */
export async function unseal(
	secret: string,
	sealed: string,
	context: string
): Promise<string | null> {
	try {
		const bytes = Uint8Array.from(atob(sealed.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
			c.charCodeAt(0)
		);
		const pt = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: bytes.slice(0, 12), additionalData: encoder.encode(context) },
			await sealKey(secret),
			bytes.slice(12)
		);
		return new TextDecoder().decode(pt);
	} catch {
		return null;
	}
}
