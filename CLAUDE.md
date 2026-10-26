# CLAUDE.md

DersSeç / CourseCritic: öğrencilerin ders + hoca + dönem bazında değerlendirme yaptığı site.
Ürün kararları: PLAN.md (karar değişince güncelle). Kurulum ve yapı: README.md.

## Komutlar

- `npm run dev`: yerel sunucu. Giriş kodu terminale yazılır (`[dev] Giriş kodu: …`).
- `npm test`, `npm run check`, `npm run lint`: değişiklikten sonra üçü de temiz olmalı.
- `npm run db:generate` → `npm run db:migrate:local`: şema değişikliği.

## Kurallar

- SvelteKit 3: `$lib` yok, `#lib/...` kullan ve **dosya uzantısını yaz** (`#lib/server/auth.ts`, `#lib/server/db/index.ts`).
  `$app/environment` yerine `$app/env`. `Handle` tipi `@sveltejs/kit/hooks`'tan gelir.
- Cloudflare bağlantıları `event.platform` üzerinden değil `cloudflare:workers` modülünden okunur (`#lib/server/env.ts`).
  Sayfalarda `locals.db` ve `locals.env` kullan.
- Arayüz metinleri `messages/tr.json` ve `messages/en.json` içinde; ikisine de ekle. `import { m } from '#lib/paraglide/messages.js'`.
- Anonimlik temel kural: e-posta adresi hiçbir yerde saklanmaz veya loglanmaz, istemciye `userId` gönderilmez
  (sadece `isMine` gibi boolean'lar). IP kaydı tutulmaz.
- Görünür değerlendirme = `status = 'published'` ve hocası `approved`. Sorgular `queries.ts` içindeki `VISIBLE` koşulunu kullanır.
- Bildirimler kişiyi `reporterKey(secret, reviewId, emailHash)` ile tanır, `user_id` ile değil (hesap silinince
  `user_id` boşalır, bildirim sayılmaya devam eder). Gizleme kararı `dismissed = 0` bildirimler sayılarak verilir.
- Kullanıcı silmek için `deleteUser` / `banUser` kullan (bildirim nedenlerini de temizler).
- Admin yetkisi `hooks.server.ts`'te `adminAccess(event.route.id, ...)` ile kontrol edilir. Layout `load`'una güvenme:
  SvelteKit veri isteklerinde (`__data.json?x-sveltekit-invalidated=...`) layout `load`'larını atlayabilir.
  Admin form işlemleri ayrıca `requireAdmin(event)` çağırır.
- Gizli değerler `.dev.vars` (yerel) ve `wrangler secret` (canlı) içinde; repoya girmez.
