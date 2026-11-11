# Güvenlik İncelemesi — Ekim 2026

İncelenen kod: `claude/gallant-curie-p1ytij` branch'i, `ecc97d5` commit'i (sitenin ilk canlı sürümü).
Yöntem: kodun tamamı bağımsız bir inceleme ve her bulgu için ayrı bir yanlış alarm kontrolüyle tarandı. Framework davranışları
SvelteKit kaynak kodundan doğrulandı. Açık 1 ve bazı "açık değil" sonuçları yerel sunucuda test edildi.

## Durum özeti

| #   | Bulgu                                                                | Önem                 | Durum     |
| --- | -------------------------------------------------------------------- | -------------------- | --------- |
| 1   | Admin verileri giriş yapmadan okunabiliyor                           | Orta                 | Kapatıldı |
| 2   | Giriş kodu deneme sınırı eşzamanlı isteklerle aşılabiliyor           | Yüksek (başarılırsa) | Kapatıldı |
| 3   | Giriş ekranı bir e-postanın banlı olup olmadığını söylüyor           | Orta                 | Kapatıldı |
| 4   | "+" eklenmiş adreslerle tek posta kutusundan çok hesap açılabiliyor  | Orta                 | Kapatıldı |
| 5   | Hesap silip yeniden açarak tek kişi yorum gizletebiliyor             | Orta                 | Kapatıldı |
| 6   | Tarayıcıya kullanıcının kendi kimliği (`id`) gönderiliyor            | Düşük                | Kapatıldı |
| 7   | `ADMIN_EMAILS`'ten çıkarılan admin, yeniden giriş yapana kadar admin | Düşük                | Kapatıldı |

Düzeltmeler 26 Ekim 2026'da canlıya alındı (Worker sürümü `0f01ddf9`, migration'lar `0001` ve `0002`).

---

## 1. Admin verileri giriş yapmadan okunabiliyor

- **Yer:** `src/routes/admin/+layout.server.ts:4` (tek kontrol noktası). Kontrol yapmayan veri kodları:
  `admin/+page.server.ts`, `admin/bildirimler/+page.server.ts`, `admin/hocalar/+page.server.ts`,
  `admin/oneriler/+page.server.ts`, `admin/esdegerler/+page.server.ts`.
- **Kategori:** yetki atlatma (`authorization_bypass`).
- **Açıklama:** SvelteKit, sayfa verisi istenirken hangi `load` fonksiyonlarının çalışacağına istemcinin gönderdiği
  `x-sveltekit-invalidated` parametresine göre karar verir (`@sveltejs/kit/src/runtime/server/respond.js:161`,
  `runtime/server/data/index.js:76-81`). Bu parametreyle ortak admin dosyası atlatılınca sadece sayfanın veri kodu
  çalışır ve admin kontrolü hiç yapılmaz. Form işlemleri etkilenmez; her biri ayrıca `requireAdmin` ile korunuyor.
- **Saldırı:** Giriş yapmamış biri `GET /admin/bildirimler/__data.json?x-sveltekit-invalidated=001` isteğiyle
  gizlenmiş yorumların tam metnini ve bildirim nedenlerini okur. Aynı yöntemle admin istatistikleri, onay bekleyen hoca
  isimleri ve ders önerileri de okunabilir. Yerelde test edildi.
- **Düzeltme:** Admin kontrolü `hooks.server.ts`'te, eşleşen rotanın kimliğine (`event.route.id`) göre her istekte
  yapılır. Bu sayfa, veri isteği ve form işlemlerinin hepsini kapsar. URL yerine rota kimliği kullanıldığı için `%61dmin`
  gibi kodlanmış yollarla da atlatılamaz.

## 2. Giriş kodu deneme sınırı eşzamanlı isteklerle aşılabiliyor

- **Yer:** `src/lib/server/auth.ts:70-83` (`verifyLoginCode`).
- **Kategori:** kimlik doğrulama atlatma (`authentication_bypass`).
- **Açıklama:** Kod başına 5 yanlış deneme hakkı var. Ama sayaç önce okunuyor, kod karşılaştırılıyor, sonra okunan
  değerin bir fazlası yazılıyor. Aynı anda gelen istekler sayacı aynı değerde görür ve her biri bir tahmin hakkı kazanır.
- **Saldırı:** Saldırgan admin adresi için kod ister (adres `workers.dev` alt alan adından tahmin edilebilir) ve aynı
  anda binlerce tahmin gönderir. Saatte 5 yeni kod istenebildiği için zamanla admin oturumu ele geçirilebilir.
- **Düzeltme:** Sayaç tek bir SQL komutuyla, sadece sınırın altındaysa artırılır
  (`UPDATE ... SET attempts = attempts + 1 WHERE attempts < 5 RETURNING`). Kod yalnızca bu komut bir satır döndürürse
  karşılaştırılır.
- **Doğrulama:** Düzeltmeden önce 60 eşzamanlı istekte 13 tahmin değerlendirildi; sonra tam 5 (yerel test).

## 3. Giriş ekranı bir e-postanın banlı olup olmadığını söylüyor

- **Yer:** `src/routes/giris/+page.server.ts:32`.
- **Kategori:** gizlilik / kullanıcı sorgulama (`user_enumeration`).
- **Açıklama:** Ban kontrolü, kod gönderilmeden önce, e-postanın sahibi olmayan biri için de çalışıyor. Banlı adreste
  "hesap uzaklaştırıldı" mesajı çıkıyor, diğerlerinde kod sayfasına geçiliyor.
- **Saldırı:** Hakkında hakaret içerikli yorum yazılan bir hoca, yorum kaldırılıp yazar banlandıktan sonra şüphelendiği
  öğrencilerin adreslerini giriş ekranına tek tek yazar. "Banlı" cevabı yorumun yazarını ortaya çıkarır. Bu, sitenin
  temel vaadi olan anonimliği bozar.
- **Düzeltme:** Kod isteme adımında banlı adreslere de diğerleri gibi davranılır. "Banlısın" bilgisi sadece kod
  doğrulandıktan sonra, yani sadece posta kutusunun sahibine gösterilir.

## 4. "+" eklenmiş adreslerle tek posta kutusundan çok hesap açılabiliyor

- **Yer:** `src/lib/email.ts:2-12`.
- **Kategori:** kimlik / sahte hesap, ban atlatma.
- **Açıklama:** Adres sadece küçük harfe çevriliyor ve kabul kuralı `+` ile `%` karakterlerine izin veriyor.
  `ali+1@hacettepe.edu.tr`, `ali+2@...` ayrı hesaplar olarak açılıyor, banlar da sadece tam adrese uygulanıyor. Microsoft
  365'te (Hacettepe öğrencilere Microsoft 365 hesabı veriyor) bu tür adresler varsayılan olarak asıl kutuya teslim ediliyor.
  Ayrıca `hacettepe.edu.tr` altındaki her alt alan adı kabul ediliyordu; bu da bir öğrenciye birden fazla adres verebilir.
- **Saldırı:** Bir kişi 3 hesapla bir yorumu tek başına gizletir, aynı ders, hoca ve dönem için birden fazla
  değerlendirme yazar ya da banlandıktan sonra yeni bir etiketle geri döner.
- **Düzeltme:** Adresin `@` öncesi kısmında sadece harf, rakam, nokta, tire ve alt çizgi kabul edilir. Alan adı
  `ALLOWED_EMAIL_DOMAINS` listesiyle tam eşleşmeli; alt alan adı ancak listeye açıkça yazılırsa kabul edilir.

## 5. Hesap silip yeniden açarak tek kişi yorum gizletebiliyor

- **Yer:** `src/routes/ders/[slug]/+page.server.ts:76-88` (bildirim), `src/routes/hesabim/+page.server.ts:37-41`
  (hesap silme), `src/lib/server/db/schema.ts` (`reports` tablosu).
- **Kategori:** iş mantığı / moderasyon atlatma.
- **Açıklama:** Bildirim tekrarı sadece kullanıcı kimliğine göre engelleniyor. Hesap silinince o kişinin bildirimleri de
  siliniyor ama yorumdaki sayaç azalmıyor. Aynı adresle yeniden giriş yapınca yeni bir kullanıcı kimliği oluştuğu için
  aynı yorum tekrar bildirilebiliyor. Admin yorumu geri açınca bildirimler silinip sayaç sıfırlandığı için döngü tekrar
  edilebiliyor.
- **Saldırı:** Bildir → hesabı sil → tekrar giriş yap → bildir; üç turda yorum herkes için gizlenir.
- **Düzeltme:**
  - Her bildirim, e-posta özetinden ve yorumdan türetilen, hesap silinince değişmeyen bir anahtarla saklanır
    (yorum başına ayrı HMAC; farklı yorumlardaki bildirimler birbirine bağlanamaz).
  - Hesap silinince bildirim sayılmaya devam eder ama kişiyle bağı ve yazdığı neden metni silinir.
  - Gizleme kararı saklanan sayaçtan değil, gerçek bildirim satırları sayılarak verilir.
  - Admin bir yorumu geri açınca mevcut bildirimler "reddedildi" olarak işaretlenir. Aynı kişiler o yorumu tekrar
    gizletemez.
- **Doğrulama:** Düzeltmeden önce tek kişi 3 turda yorumu gizletti. Sonra 3 turda sayaç 1'de kaldı; 3 farklı kişi
  gizletebiliyor, admin geri açınca aynı kişiler tekrar gizletemiyor (yerel test).

## 6. Tarayıcıya kullanıcının kendi kimliği gönderiliyor

- **Yer:** `src/routes/+layout.server.ts:4`.
- **Açıklama:** Sadece kişinin kendi kimliği gittiği için sömürülemez, ama "kullanıcı kimliği istemciye gitmez"
  kuralına aykırı.
- **Düzeltme:** İstemciye sadece rol bilgisi gönderilir.

## 7. `ADMIN_EMAILS`'ten çıkarılan admin, yeniden giriş yapana kadar admin kalıyor

- **Yer:** `src/lib/server/auth.ts` (rol, giriş anında `users.role`'e yazılıyordu).
- **Açıklama:** Admin listesinden çıkarılan birinin açık oturumu (en fazla 1 yıl) admin yetkisiyle çalışmaya devam ediyor.
- **Düzeltme:** Rol her istekte `ADMIN_EMAILS`'teki adreslerin özetiyle karşılaştırılarak hesaplanır. `users.role` ve
  `login_codes.is_admin` sütunları kaldırılır.

---

## E-posta gizliliği (Kasım 2026)

Soru: bir öğrencinin e-posta adresi sızabilir mi, ya da bir yorum/hesap belirli bir öğrenciyle eşleştirilebilir mi?
Ölçüm: yerelde benzersiz bir adresle giriş + değerlendirme yapılıp veritabanının tamamında ve loglarda adres arandı:
adres hiçbir yerde yok. Sonra bağımsız bir gizlilik incelemesi yapıldı; bulgular ve durumları:

| #   | Bulgu                                                                                        | Önem        | Durum                |
| --- | -------------------------------------------------------------------------------------------- | ----------- | -------------------- |
| E1  | Veritabanını okuyabilen biri giriş formuyla bir adresin hesabını bulabiliyordu (login_codes) | Yüksek      | Kapatıldı            |
| E2  | Eklenme sırası (rowid) gün yuvarlamasını boşa çıkarıyordu                                    | Yüksek      | Kapatıldı            |
| E3  | Oturum kayıtları her girişin gününü bir yıl saklıyordu                                       | Orta-Yüksek | Kapatıldı            |
| E4  | Kullanılmayan giriş kodları tam zamanlarıyla günlerce kalabiliyordu                          | Orta        | Kapatıldı            |
| E5  | Aynı gündeki yorumlar eklenme sırasıyla listeleniyordu                                       | Orta        | Kapatıldı (sıralama) |
| E6  | Yorum hemen yayınlandığı için gönderim saati dışarıdan izlenebiliyor                         | Orta        | Karar bekliyor       |
| E7  | Küçük sınıflarda "3. kez aldı, kaldı" gibi alanlar yazarı belli edebilir                     | Orta        | Karar bekliyor       |
| E8  | Veritabanı hata loglarına sorgu parametreleri düşebiliyordu                                  | Düşük-Orta  | Kapatıldı            |
| E9  | Bildirimler hesap varken kullanıcıya bağlıydı                                                | Düşük       | Kapatıldı            |
| E10 | Giriş ekranı Hacettepe dışı admin adresini belli ediyor                                      | Düşük       | Kabul edildi         |
| E11 | Admin'in eklediği hoca hemen onaylandığı için admin'in yorumu belli oluyordu                 | Düşük       | Kapatıldı            |
| E12 | Saatlik kod sınırı mesajı yakın zamandaki girişleri belli ediyor                             | Düşük       | Turnstile ile        |
| E13 | 1 yıllık oturum ortak bilgisayarlarda risk                                                   | Düşük       | Kapatıldı            |

Yapılanlar:

- Zamanlar güne yuvarlanır; kimlikle ilgili tablolar `WITHOUT ROWID` (rastgele UUID sırası); oturum bitişi rastgele
  kaydırılır; kullanılmayan alanlar (`users.created_at`, `reports.user_id` vb.) kaldırıldı (migration 0003, 0004).
- Giriş kodu satırında hesap özeti yok: saatlik sınır ayrı bir HMAC ile, hesap özeti AES-GCM ile şifreli tutulur ve
  sadece kod doğrulanınca açılır. Kodlar en fazla 1 saat saklanır.
- "Bu cihazda açık kalsın" kutusu (varsayılan kapalı): işaretlenmezse tarayıcı kapanınca oturum biter. Giriş yapmış
  sayfalar `Cache-Control: private, no-store`.
- Hata logları tek satır, e-posta ve sorgu parametresi içermez. Font kendi sitemizden, CSP sadece kendi sitemize izin
  verir.

Uygulamanın kontrolü dışında kalanlar:

- E-posta sağlayıcısı (Resend) alıcı adresini, gönderim zamanını ve içeriği kendi saklama süresi boyunca tutar.
- Üniversitenin e-posta sunucusu bir öğrenciye DersSeç'ten e-posta geldiğini ve saatini görür (kimin ne yazdığını değil).
- Cloudflare isteğin IP adresini ve zamanını kenar sunucuda görür. D1 Time Travel geçmiş veritabanı durumlarını bir süre
  saklar; Cloudflare hesabına erişen biri bunları geri yükleyebilir.
- `AUTH_SECRET` ya da Cloudflare'e kod yükleme yetkisi olan biri, öğrenci listesini deneyerek hesapları eşleştirebilir
  ya da adresleri kaydeden kod yükleyebilir. Bunu sadece hesap güvenliği (2FA, dar yetkili anahtarlar) önler.
- Yorumun içeriği ya da yazım üslubu yazarı belli edebilir.
- Migration 0004 öncesindeki veritabanı durumu (eski giriş kodu satırları, eklenme sırası) Cloudflare'in Time Travel
  geçmişinde saklama süresi dolana kadar durur. Canlıda o tarihte sadece admin hesabı vardı, öğrenci verisi yoktu.

İkinci doğrulama turunda ayrıca düzeltilenler: 100'den fazla yorumu olan derslerde "Bildirildi" sorgusunun D1'in
100 parametre sınırına takılması; gece yarısına yakın girişlerde geçici oturumun dakikalar içinde bitmesi; eski
oturumların giriş gününü açık etmesi; hesap silinince bildirim nedenlerinin kalması; şifreli değerin başka satıra
taşınabilmesi (AES-GCM ek veri); hata zincirinde sorgu parametrelerinin loglanabilmesi; migration testinin veri
kaybını denetlememesi.

- **Gizlenen yorumun yeniden yazılması:** Yazar gizlenen yorumunu silip yeniden yazabilir. Tekrarlayanlar admin
  tarafından banlanır.
- **Admin'in kişisel adresinin tahmin edilebilmesi:** Admin adresleri alan adı şartından muaf olduğu için, Hacettepe
  dışı bir adresin giriş ekranında kabul edilmesi onun admin adresi olduğunu gösterir. Adres zaten gizli bir bilgi değil;
  Açık 2 düzeltildikten sonra bu bilgi tek başına bir saldırıya yetmez.
- **Saatlik kod sınırı:** Aynı anda gönderilen isteklerle saatte 5 kod sınırı biraz aşılabilir. Her kod artık en fazla
  5 tahmine izin verdiği için bu bir hız sınırı konusudur. Canlıya geniş açılmadan önce Cloudflare Turnstile önerilir.
- **İki ayrı üniversite adresi:** `ALLOWED_EMAIL_DOMAINS` listesine bölüm adresleri (ör. `cs.hacettepe.edu.tr`) de
  eklenirse, iki adresi olan bir öğrenci iki hesap açabilir. Şu an sadece `hacettepe.edu.tr` kabul ediliyor.

## İncelenip sorun bulunmayan alanlar

- **SQL enjeksiyonu:** Tüm sorgular parametreli (Drizzle sorgu kurucu ve `sql` şablonları).
- **XSS:** `{@html}` kullanılmıyor, kullanıcı metinleri her yerde güvenli şekilde basılıyor. Dil çerezi sadece `tr`/`en`
  kabul ediyor.
- **Başka siteye yönlendirme:** `?r=` parametresiyle `/\t/evil.com` gibi hileler denendi. SvelteKit 3 başka siteye
  yönlendirmeyi kendisi reddediyor; yerelde test edildi.
- **CSRF:** SvelteKit'in kaynak kontrolü açık, oturum çerezi `SameSite=Lax`, `httpOnly`, canlıda `secure`.
- **Admin işlemleri:** Hepsinde `requireAdmin` var. Değerlendirme düzenleme ve silme sadece sahibine açık.
- **Oturum ve kodlar:** Oturum anahtarları 256 bit rastgele ve sadece SHA-256 özetleri saklanıyor. Giriş kodları HMAC ile
  saklanıyor, kod üreteci her kodu eşit olasılıkla üretiyor.
- **Ban ve hesap silme:** Kullanıcının tüm değerlendirmelerini gerçekten siliyor; yerelde test edildi.
- **Anonimlik:** Herkese açık yanıtlarda kullanıcı kimliği, e-posta ya da zaman damgası yok. IP kaydı yok. Giriş kodu
  sadece yerel geliştirmede konsola yazılıyor, adres hiçbir zaman yazılmıyor.
- **Gizli değerler:** `.dev.vars` repoda değil, örnek dosyada sadece yer tutucu değerler var.
