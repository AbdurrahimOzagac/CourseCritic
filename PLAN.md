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
- Ders bilgileri (kredi, AKTS, sınıf, tür, ön koşul, açıklama) ders sayfasında gösterilir. Öğrenciler düzeltme önerebilir, admin onaylar. Yeni ders ekleme için bkz. "Karar: her kullanıcı ders ekleyebilir".
- Mezunlar: e-posta adresi açık kaldığı sürece giriş yapabilir. Oturumlar 1 yıl geçerli ve kullanıldıkça uzar. Ayrıca okul dışı e-posta bağlama yok; edu e-postasıyla giriş kritik.
- Yıllara göre puanlama (deneme sürümü): ders sayfasında **Hoca** ve **Dönem** filtreleri var. Puanlar seçime göre yeniden hesaplanır. Böylece üç seviye (ders / ders + hoca / ders + hoca + dönem) tek sayfada. Kullanımla birlikte yeniden değerlendirilecek.

## Ders kataloğu ve BBM → CMP geçişi (Kasım 2026)

- Bölüm 2026-2027 Güz'den itibaren yeni müfredata geçti: ders kodları **BBM** yerine **CMP** oldu.
- Sitede şimdilik sadece yeni **CMP kodlu bölüm içi dersler** var: 25 zorunlu + 40 teknik seçmeli = 65 ders.
  Kaynak: bölüm sitesindeki "Müfredat (Yeni)" sayfası (TR ve EN). Liste `seed/courses.cmp.csv` dosyasında.
- Bölüm dışı dersler (MAT, FİZ, İNG, TKD vb.) ve eski BBM dersleri henüz eklenmedi.
- Ön koşullar eklenmedi (bölüm bunları ayrı bir Google tablosunda tutuyor).

### Karar: her kullanıcı ders ekleyebilir

- Giriş yapmış her kullanıcı, admin onayı beklemeden yeni ders ekleyebilecek.
- Gerekçe: ders kodu tekil olduğu için aynı ders iki kez eklenemez.
- Henüz uygulanmadı: şu an yeni ders "öneri" olarak admin onayına düşüyor.
- Uygularken dikkat: kod biçimi denetimi ve küfür filtresi kalmalı; yanlış ya da uydurma eklenen dersi admin
  düzeltebilmeli ya da silebilmeli.

### Eski–yeni ders eşleştirmesi (taslak)

Bölüm sitesinde resmi bir intibak tablosu bulunamadı. Aşağıdaki eşleştirme **ders adlarının benzerliğine göre**
hazırlandı; resmi tabloyla doğrulanmalı. Eski BBM dersleri siteye eklenince bu çiftler "eşdeğer ders" olarak
bağlanacak (ayrı sayfalar, birbirine bağlantı).

| Eski (BBM) | Yeni (CMP) | Ders                                                     |
| ---------- | ---------- | -------------------------------------------------------- |
| BBM 101    | CMP 101    | Programlamaya Giriş I                                    |
| BBM 103    | CMP 103    | Programlamaya Giriş Laboratuvarı I                       |
| BBM 102    | CMP 102    | Programlamaya Giriş II                                   |
| BBM 104    | CMP 104    | Programlamaya Giriş Laboratuvarı II                      |
| BBM 201    | CMP 201    | Veri Yapıları                                            |
| BBM 203    | CMP 203    | Yazılım Laboratuvarı I                                   |
| BBM 205    | CMP 205    | Kesikli Matematiksel Yapılar                             |
| BBM 231    | CMP 211    | Mantıksal Tasarım                                        |
| BBM 233    | CMP 213    | Mantıksal Tasarım Laboratuvarı                           |
| BBM 202    | CMP 202    | Algoritmalar                                             |
| BBM 204    | CMP 204    | Yazılım Laboratuvarı II                                  |
| BBM 234    | CMP 212    | Bilgisayar Yapısı                                        |
| BBM 401    | CMP 206    | Biçimsel Diller ve Özdevinirler Kuramı (eskiden seçmeli) |
| BBM 301    | CMP 301    | Programlama Dilleri                                      |
| BBM 371    | CMP 361    | Veri Yönetimi                                            |
| BBM 325    | CMP 300    | Staj I                                                   |
| BBM 342    | CMP 332    | İşletim Sistemleri                                       |
| BBM 382    | CMP 352    | Yazılım Mühendisliği                                     |
| BBM 384    | CMP 354    | Yazılım Mühendisliği Laboratuvarı                        |
| BBM 425    | CMP 400    | Staj II                                                  |
| BBM 479    | CMP 491    | Tasarım Projesi I                                        |
| BBM 480    | CMP 492    | Tasarım Projesi II                                       |
| BBM 408    | CMP 401    | Algoritma Analizi                                        |
| BBM 402    | CMP 402    | Hesaplama Kuramı                                         |
| BBM 403    | CMP 403    | Kombinatorik ve Çizge Kuramı                             |
| BBM 404    | CMP 404    | Derleyici Gerçekleştiriminin Temelleri                   |
| BBM 412    | CMP 405    | Bilgisayar Grafiği                                       |
| BBM 421    | CMP 406    | Oyun Teknolojileri                                       |
| BBM 442    | CMP 412    | Koşut İşlem                                              |
| BBM 433    | CMP 413    | Mikroişleyiciler                                         |
| BBM 441    | CMP 414    | Yüksek Başarımlı Hesaplamaya Giriş                       |
| BBM 452    | CMP 421    | Veri İletişimi                                           |
| BBM 451    | CMP 422    | Bilgisayar Ağları                                        |
| BBM 456    | CMP 423    | Bilgisayar ve Ağ Güvenliği                               |
| BBM 458    | CMP 424    | Kablosuz ve Mobil Ağlar                                  |
| BBM 432    | CMP 431    | Gömülü Sistemler                                         |
| BBM 443    | CMP 433    | Blokzincirinin Temelleri                                 |
| BBM 463    | CMP 441    | Bilgi Güvenliği                                          |
| BBM 462    | CMP 442    | Sosyal ve Ekonomik Ağlar                                 |
| BBM 475    | CMP 443    | Yönetim Bilişim Sistemleri                               |
| BBM 498    | CMP 451    | Yazılım Gereksinimleri                                   |
| BBM 485    | CMP 452    | Yazılım Mimarileri                                       |
| BBM 481    | CMP 453    | Yazılım Geliştirme                                       |
| BBM 482    | CMP 454    | Yazılım Kalite Güvence                                   |
| BBM 471    | CMP 461    | Veri Tabanı Yönetim Sistemleri                           |
| BBM 467    | CMP 462    | Veri Yoğunluklu Uygulamalar                              |
| BBM 405    | CMP 471    | Yapay Zekâya Giriş (eski adı: Yapay Zekânın Temelleri)   |
| BBM 406    | CMP 472    | Makine Öğrenmesine Giriş                                 |
| BBM 413    | CMP 473    | Görüntü İşlemeye Giriş                                   |
| BBM 416    | CMP 474    | Bilgisayarlı Görüye Giriş                                |
| BBM 495    | CMP 476    | Doğal Dil İşlemeye Giriş                                 |
| BBM 411    | CMP 478    | Biyoenformatiğe Giriş                                    |
| BBM 407    | CMP 479    | Bulanık Mantık                                           |

Emin olunamayanlar (ad farklı, içerik aynı olabilir):

- BBM 431 İleri Bilgisayar Mimarileri ↔ CMP 411 Yüksek Başarımlı Bilgisayar Mimarileri
- BBM 461 Güvenli Programlama ↔ CMP 455 Yazılım Güvenliği
- BBM 105 Bilgisayar Mühendisliğine Giriş ↔ CMP 100 Bilgisayar Mühendisliği Oryantasyonu

Eski karşılığı bulunamayan yeni dersler: CMP 341, 390, 432, 434, 463, 475, 477, 480, 481.
Eski müfredattaki ayrı laboratuvar dersleri (BBM 409, 414, 415, 418 vb.) yeni müfredatta ayrı ders olarak yok.

## Açık konular

- [ ] Ek sorular ve formatları: yoklama nasıl alındı, hoca dersi gerçekte hangi dilde işliyor, slaytlar yeterli mi, kaynak bulunuyor mu vb.
- [ ] Ders tablosundaki sütunlar, filtreler ve sıralama seçenekleri (şimdilik: kod, hocalar, konu zorluğu, iş yükü, öğreticilik, değerlendirme sayısı; sınıf ve tür filtresi).
- [ ] Kullanım koşulları ve KVKK metinlerinin hukuki kontrolü.
- [ ] Giriş kodu isteklerine IP'den bağımsız ek koruma (Cloudflare Turnstile ya da Rate Limiting). Şu an sadece e-posta başına saatte 5 kod sınırı var.

## Teknik yapı

- **Altyapı:** Cloudflare Workers + SvelteKit 3 + D1 (SQLite) + Drizzle. Ayrıntılar README.md'de.
- **Giriş:** Kendi e-posta kodu sistemimiz. E-posta yerine sadece HMAC özeti saklanır. Admin'ler `ADMIN_EMAILS` gizli değişkeniyle belirlenir.
  Admin adresleri `.edu` şartından muaftır (ör. Gmail ile yönetim).
- **E-posta gönderimi:** Resend. Güvenilir gönderim için kendi alan adı gerekir, `.com.tr` düşünülüyor.
