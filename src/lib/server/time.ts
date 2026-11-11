const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Günün başı (UTC). Veritabanına yazılan zamanlar güne yuvarlanır: e-posta sağlayıcısının gönderim kayıtlarıyla
 * saniye saniye eşleştirilip "şu saatte kod alan kişi = şu saatte açılan hesap / yazılan yorum" çıkarımı yapılamasın.
 * Sadece kısa ömürlü giriş kodları (en fazla 1 saat saklanır) tam zamanlıdır.
 */
export function dayStart(date: Date = new Date()): Date {
	return new Date(Math.floor(date.getTime() / DAY_MS) * DAY_MS);
}
