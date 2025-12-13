# Aktif Bağlam (Active Context)

## Mevcut Odak
- Fiş/Fatura taramada otomatik kategori tespiti ve seçimi eklendi.
- İşlem ekleme/düzenleme modal UI tamamen yeniden tasarlandı (kompakt).

## Son Değişiklikler (13 Aralık 2025)

### Otomatik Kategori Tespiti (YENİ)
- **receiptParser'a kategori tespiti eklendi**: Fiş içeriğinden akıllı kategori tahmini yapılıyor.
- **Desteklenen kategoriler**: Food & Drink, Transportation, Health, Shopping, Bills, Entertainment, Subscription, Education.
- **Anahtar kelime tabanlı tespit**: Türkçe ve İngilizce anahtar kelimeler destekleniyor.
- **3 senaryo**:
  1. Kategori tespit edilip mevcutsa → seçilir
  2. Kategori tespit edilip mevcut değilse → otomatik oluşturulur
  3. Tespit edilemezse → "Other" seçilir

### Kompakt Modal UI (YENİ)
- **Form gap'leri azaltıldı**: Scroll gerektirmeyen kompakt tasarım.
- **Alanlar birleştirildi**: Tür + İsim tek satırda, Kategori + Tarih + Saat tek satırda.
- **Scanner section küçültüldü**: Daha az yer kaplıyor.
- **Font boyutları optimize edildi**: text-xs kullanımı artırıldı.
- **Butonlar yeniden tasarlandı**: Daha düşük padding ve border-top ayracı.

### Saat Bilgisi Desteği
- **Transaction tipine `time` alanı eklendi**: İşlemlerin saat bilgisi kaydediliyor.
- **Fiş taramada saat çıkarma**: SAAT:, TIME:, HH:MM:SS pattern'leri destekleniyor.

### Fiş/Fatura Tarama (OCR)
- **Tesseract.js** ile görüntü OCR.
- **PDF.js** ile PDF metin çıkarma.
- Türk fişi pattern matching ve güven yüzdesi gösterimi.
- **Saat ve Kategori bilgisi çıkarma** artık destekleniyor.
- Tamamen client-side işleme.

## Önceki Değişiklikler (10 Aralık 2025)

### Güvenlik ve Şifreleme
- **Uçtan Uca Şifreleme**: Tüm kişisel veriler AES-256-GCM ile şifreleniyor.
- `cryptoService.ts`: PBKDF2 anahtar türetme.
- Hesap silme özelliği ("Tehlikeli Bölge").

## Sonraki Adımlar
- Kategoriye göre filtreleme özelliği (Transactions sayfasında).
- Arama fonksiyonu.
- Veri dışa/içe aktarma (JSON).
- PWA desteği.
