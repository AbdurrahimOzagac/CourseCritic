# DersSeç / CourseCritic — Ürün Planı

> Bu dosya tasarım kararlarının tek kaynağıdır. Karar değiştikçe güncellenir.
> Gizli anahtarlar (API key vb.) asla bu dosyaya ya da repoya yazılmaz.

## Amaç

Öğrencilerin ders seçerken birbirine yardımcı olması. İlk prototip: **Hacettepe Üniversitesi Bilgisayar Mühendisliği**. İleride tüm üniversiteye, sonra üniversiteler arası bir sisteme genişleyebilir.

- Türkçe adı: **DersSeç**
- İngilizce adı: **CourseCritic**
- Arayüz TR/EN olarak iki dilde. Kullanıcı yorumları çevrilmez, yazıldığı dilde görünür.

## Temel kavram: Ders → Ders + Hoca → Ders + Hoca + Dönem

En küçük birim **"X hocanın 2026 Güz döneminde verdiği şu ders"**. Her değerlendirme bu birime bağlanır. Üst seviyeler bu değerlendirmelerden hesaplanır:

1. Ders + Hoca + Dönem (ör. BBM 342 · Adnan Hoca · 2026 Güz)
2. Ders + Hoca (ör. BBM 342 · Adnan Hoca)
3. Ders (ör. BBM 342)

Yapı her ders için aynıdır. Tek hocalı dersler için ayrı bir davranış yoktur.

- **Dönemler:** Güz, Bahar, Yaz okulu. Yaz okulu Hacettepe'de şu an yok ama seçenek olarak durur.
- **Ortak verilen dersler:** Her değerlendirmenin üst bilgisinde "şu dönem, şu hocadan alındı" yazar.

### Eşdeğer dersler

- Müfredat değişince kodu değişen dersler **ayrı sayfalardır**, çünkü işleniş de değişmiştir.
- Sayfalar birbirine "Eşdeğer ders: …" bağlantısıyla işaretlenir.
- Dersi eski koduyla almış olanlar eski kod üzerinden değerlendirme yapar.

## Sayfalar

- **Ana sayfa:** Arama çubuğu ve ders tablosu.
- **Ders sayfası:** Genel puanlar, hocalar, değerlendirmeler.
- **Hoca sayfası:** Sadece "Verdiği dersler" listesi. **Puan ve yorum yoktur.** Listedeki dersler ilgili ders sayfasına götürür.
- **Arama:** Her sayfada bulunur. Ders kodu, ders adı (TR/EN) ve hoca adında arar. Türkçe karakterden bağımsızdır ("dagitik" → "Dağıtık").
- **Tasarım:** Beyaz, sade, resmi bir üniversite sayfası havası. Bilgi tablo ağırlıklı gösterilir. Hacettepe logosu ve kurumsal kimliği kullanılmaz.

## Değerlendirme

### Puanlama: 7 basamaklı adlandırılmış ölçek (yıldız yok)

Her kriterin kendi etiketleri vardır. Etiketler taslaktır.

| Kriter                  | 1 → 7                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Konu zorluğu            | Çok kolay · Kolay · Orta kolay · Orta · Orta zor · Zor · Çok zor                          |
| İş yükü                 | Çok az · Az · Orta az · Orta · Orta fazla · Fazla · Çok fazla                             |
| Öğreticilik             | Hiç öğretici değil · Az öğretici · Orta altı · Orta · Orta üstü · Öğretici · Çok öğretici |
| Hocanın anlatımı        | Çok kötü · Kötü · Orta kötü · Orta · Orta iyi · İyi · Çok iyi                             |
| Hocanın tutumu          | Çok kötü · Kötü · Orta kötü · Orta · Orta iyi · İyi · Çok iyi                             |
| Hocanın konu hakimiyeti | Çok zayıf · Zayıf · Orta zayıf · Orta · Orta iyi · İyi · Çok iyi                          |

- Özet puan, ortalamanın etiketiyle gösterilir (ör. "Orta zor"). Yanında 7 basamağın dağılımını gösteren küçük bir çubuk olur.
- **Az değerlendirme:** Değerlendirme sayısı 3'ten azsa ders listesinde özet puan yerine "Yetersiz değerlendirme (n)" yazar. Ders sayfasında puanlar ve yorumlar yine görünür.

### Değerlendirmeye eklenen bilgiler (isteğe bağlı)

- **Durum:** "Dersi X kez aldım" ve sonucu: Geçtim / Kaldım / Bıraktım.
- **O dönemin not bilgisi:** Sınıf ortalaması yaklaşık kaçtı, çan eğrisi uygulandı mı. Bireysel not sorulmaz.
- **Yorum:** Serbest metin.

## Yorumlar

- Yorumlara cevap yazılamaz.
- Sıralama: en yeni üstte.
- **Yorum üst bilgisi:** "2026 Güz · Adnan Hoca · 2. kez aldı, geçti"

## Kullanıcılar ve anonimlik

- Giriş **@hacettepe.edu.tr** uzantılı e-posta ile yapılır ve e-posta doğrulanır.
- Siteye bakmak için giriş gerekmez. Sadece değerlendirme yapmak için gerekir.
- Kimler değerlendirme yapabilir:
  - Hacettepe e-postası olan herkes. Başka bölümden öğrenciler de dahil.
  - Hocalar da değerlendirme yapabilir; bu bilinçli bir karar.
  - Mezunlar da yapabilmeli (bkz. açık konular).
- **Anonimlik temel hedeftir:**
  - E-posta adresi açık metin olarak saklanmaz.
  - Yorumlarda takma ad yoktur, "Anonim öğrenci" yazar.
  - IP adresi kaydı tutulmaz.
- Her kullanıcı her ders + hoca + dönem için tek bir değerlendirme yapabilir. Değerlendirmesini düzenleyebilir ya da silebilir.
- Değerlendirmeler bekletilmez, hemen yayınlanır.

## Hocalar

- Hoca listesini proje sahibi yükler.
- Kullanıcı değerlendirme yaparken listede olmayan bir hocayı ekleyebilir.
- Yeni eklenen hoca admin onayına düşer. Onaylanınca o hocaya bağlı değerlendirme de görünür olur.

## Denetim ve admin

- **Küfür filtresi:** Türkçe ve İngilizce. Filtreye takılan yorum gönderilemez.
- **Gönderim öncesi uyarı:** "Hakaret içeren içerik paylaşan kullanıcılar, tüm içerikleriyle birlikte sistemden kalıcı olarak uzaklaştırılır."
- **Bildir butonu:** 3 bildirim alan yorum otomatik gizlenir ve admin kuyruğuna düşer.
- **Admin paneli:**
  - Bildirilen yorumlar
  - Onay bekleyen hocalar
  - Ders ve hoca listesini CSV ile yükleme
  - Eşdeğer ders bağlantıları
  - Ban: kullanıcının tüm içeriği silinir ve e-postası kara listeye alınır.
- **Kaldırma talepleri:** Hakaret ya da kişisel saldırı içeren yorumlar kaldırılır. Sadece olumsuz eleştiri içeren yorumlar kalır.
- **Gerekli sayfalar:** Kullanıcı sözleşmesi, KVKK aydınlatma metni, iletişim ve kaldırma talebi adresi.

## Kapsam dışı (şimdilik)

- Ders sepeti / program planlayıcı
- Hoca puanlaması ve hoca sıralaması (hoca sayfası sadece ders listesi içerir)
- Yorumlara cevap

## Sonradan verilen kararlar

- Reddit tarzı tartışma bölümü **yok**.
- "Tavsiye eder misin?" sorusu **yok**. Derslere yığılma yaratabilir.
- Ders bilgileri (kredi, AKTS, sınıf, tür, ön koşul, açıklama) ders sayfasında gösterilir. Öğrenciler düzeltme ya da yeni ders önerebilir, admin onaylar.
- Mezunlar: e-posta adresi açık kaldığı sürece giriş yapabilir. Oturumlar 1 yıl geçerli ve kullanıldıkça uzar. Ayrıca okul dışı e-posta bağlama yok; edu e-postasıyla giriş kritik.
- Yıllara göre puanlama (deneme sürümü): ders sayfasında **Hoca** ve **Dönem** filtreleri var. Puanlar seçime göre yeniden hesaplanır. Böylece üç seviye (ders / ders + hoca / ders + hoca + dönem) tek sayfada. Kullanımla birlikte yeniden değerlendirilecek.

## Açık konular

- [ ] Ek sorular ve formatları: yoklama nasıl alındı, hoca dersi gerçekte hangi dilde işliyor, slaytlar yeterli mi, kaynak bulunuyor mu vb.
- [ ] Ders tablosundaki sütunlar, filtreler ve sıralama seçenekleri (şimdilik: kod, hocalar, konu zorluğu, iş yükü, öğreticilik, değerlendirme sayısı; sınıf ve tür filtresi).
- [ ] Kullanım koşulları ve KVKK metinlerinin hukuki kontrolü.
- [ ] Giriş kodu isteklerine IP'den bağımsız ek koruma (Cloudflare Turnstile ya da Rate Limiting). Şu an sadece e-posta başına saatte 5 kod sınırı var.

## Teknik yapı

- **Altyapı:** Cloudflare Workers + SvelteKit 3 + D1 (SQLite) + Drizzle. Ayrıntılar README.md'de.
- **Giriş:** Kendi e-posta kodu sistemimiz. E-posta yerine sadece HMAC özeti saklanır. Admin'ler `ADMIN_EMAILS` gizli değişkeniyle belirlenir.
- **E-posta gönderimi:** Resend. Güvenilir gönderim için kendi alan adı gerekir, `.com.tr` düşünülüyor.
