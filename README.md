# DersSeç / CourseCritic

Doğrulanmış öğrencilerin ders, hoca ve döneme göre değerlendirme yaptığı ders değerlendirme platformu.
İlk prototip: Hacettepe Üniversitesi Bilgisayar Mühendisliği. Ürün kararları için [PLAN.md](PLAN.md) dosyasına bakın.

## Teknoloji

| Katman   | Seçim                                                              |
| -------- | ------------------------------------------------------------------ |
| Uygulama | SvelteKit 3 (Svelte 5), Cloudflare Workers üzerinde                |
| Veri     | Cloudflare D1 (SQLite) + Drizzle ORM                               |
| Stil     | Tailwind CSS 4                                                     |
| Dil      | Paraglide (TR varsayılan, EN). Tercih çerezde, yoksa tarayıcı dili |
| Giriş    | E-posta + 6 haneli kod (kendi sistemimiz, e-posta saklanmaz)       |
| E-posta  | Resend (yerelde kod konsola yazılır)                               |

## Yerelde çalıştırma

```sh
npm install
cp .dev.vars.example .dev.vars      # AUTH_SECRET'ı değiştirin, ADMIN_EMAILS'e kendi adresinizi yazın
npm run db:migrate:local            # yerel D1 veritabanını oluşturur (.wrangler/)
python3 scripts/make-sample-sql.py > seed/sample.sql && npm run db:seed:local   # isteğe bağlı örnek veri
npm run dev
```

`http://localhost:5173` adresini açın. Giriş yaparken `RESEND_API_KEY` boşsa giriş kodu terminale yazılır:
`[dev] Giriş kodu: 123456`. `ADMIN_EMAILS` listesindeki bir adresle giriş yapan kullanıcı admin olur.

Diğer komutlar:

```sh
npm test               # birim testleri (vitest)
npm run check          # tip kontrolü (svelte-check)
npm run lint           # biçim kontrolü (prettier)
npm run db:generate    # schema.ts değişince yeni migration üretir (migrations/)
```

## Canlıya alma (Cloudflare)

1. Veritabanını oluşturun ve çıkan `database_id` değerini `wrangler.jsonc` dosyasına yazın:
   ```sh
   npx wrangler d1 create coursecritic
   npm run db:migrate:remote
   ```
2. Gizli değerleri girin (asla repoya yazmayın):
   ```sh
   npx wrangler secret put AUTH_SECRET      # openssl rand -base64 48
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put ADMIN_EMAILS     # virgülle ayrılmış; bu adresler .edu şartından muaftır
   ```
3. `wrangler.jsonc` içindeki `EMAIL_FROM` ve `CONTACT_EMAIL` değerlerini güncelleyin.
   E-posta gönderimi için Resend'de doğrulanmış bir alan adı gerekir (ör. `.com.tr`).
4. `npm run deploy`. Site `coursecritic.<hesap>.workers.dev` adresinde yayına girer; alan adı Cloudflare panelinden bağlanır.

> **AUTH_SECRET'ı kaybetmeyin ve değiştirmeyin.** Kullanıcı hesapları ve banlar bu anahtarla alınan e-posta özetlerine
> bağlıdır. Anahtar değişirse herkes yeni hesap açmış gibi olur ve banlar geçersizleşir.

## Ders ve hoca verisi

Admin panelindeki **İçe aktar** sekmesinden CSV yüklenir. Örnek biçimler: [seed/courses.sample.csv](seed/courses.sample.csv),
[seed/instructors.sample.csv](seed/instructors.sample.csv).

- Dersler: `code,name_tr,name_en,credits,ects,year_level,kind,prerequisites,description_tr,description_en`.
  `kind`: `zorunlu` / `seçmeli`. Aynı kodlu ders varsa güncellenir.
- Hocalar: `title,name,courses`. `courses` alanı noktalı virgülle ayrılmış ders kodlarıdır (`BBM 101;BBM 342`).
  Aynı isimli hoca tekrar eklenmez.

## Proje yapısı

```
src/lib/constants.ts        kriterler, dönemler, eşikler
src/lib/review-form.ts      değerlendirme formu doğrulaması (test: review-form.spec.ts)
src/lib/profanity.ts        küfür filtresi (test: profanity.spec.ts)
src/lib/summary.ts          puan özetleri ve dağılımlar
src/lib/i18n.ts             etiketler ve dönem/hoca adı biçimleri
src/lib/server/auth.ts      giriş kodu, oturum, ban
src/lib/server/queries.ts   ders listesi, ders sayfası, hoca sayfası sorguları
src/lib/server/db/schema.ts veritabanı şeması
src/routes/                 sayfalar (Türkçe yollar: /ders, /hoca, /giris, /admin…)
messages/{tr,en}.json       arayüz metinleri
migrations/                 D1 migration'ları (drizzle-kit üretir, wrangler uygular)
```
