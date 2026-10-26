import { dev } from '$app/env';

interface LoginMail {
	to: string;
	code: string;
	siteName: string;
	subject: string;
	body: string;
}

/**
 * Giriş kodunu gönderir. E-posta adresi sadece bu istekte kullanılır, hiçbir yere kaydedilmez.
 * RESEND_API_KEY yoksa (yerel geliştirme) kod konsola yazılır.
 */
export async function sendLoginCode(env: Env, mail: LoginMail): Promise<boolean> {
	if (!env.RESEND_API_KEY) {
		if (!dev) return false;
		console.log(`\n[dev] Giriş kodu: ${mail.code}\n`);
		return true;
	}

	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			from: env.EMAIL_FROM,
			to: [mail.to],
			subject: mail.subject,
			text: `${mail.body}\n\n${mail.code}\n\n${mail.siteName}`,
			html: `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#1e293b">
<p>${mail.body.replace(/\n/g, '<br>')}</p>
<p style="font-size:28px;letter-spacing:6px;font-weight:600;color:#1e3a5f">${mail.code}</p>
<p style="color:#64748b;font-size:13px">${mail.siteName}</p></div>`
		})
	});
	return res.ok;
}
