# Aktif Bağlam (Active Context)

## Mevcut Odak
- İşlem ekleme/düzenleme modeline saat bilgisi eklendi.
- PDF ve Resim tarama işlemlerinde saat çıkarma özelliği eklendi.

## Son Değişiklikler (13 Aralık 2025)

### Saat Bilgisi Desteği (YENİ)
- **Transaction tipine `time` alanı eklendi**: İşlemlerin saat bilgisi artık kaydediliyor (HH:MM formatında).
- **TransactionModal güncellendi**: Tarih alanının yanına saat input'u eklendi.
- **receiptParser güncellendi**: Fiş/faturalardan saat bilgisi çıkarılıyor (SAAT:, TIME:, HH:MM:SS pattern'leri destekleniyor).
- **PDF/Resim tarama güncellendi**: Taranan belgelerden saat otomatik olarak çıkarılıyor ve forma dolduruluyor.
- **Çeviriler güncellendi**: "time" / "Saat" çevirileri eklendi.

### Önceki Değişiklikler (Gelir/Gider Sayfaları)
- **/income** ve **/expenses** sayfaları eklendi.
- **Tam Ekran Layout**: `h-[calc(100vh-6rem)]` ile sayfa scroll gerektirmeden tam ekrana sığdırıldı.
- **Esnek Düzen**: Flexbox mimarisiyle grafikler (Area, Pie, Bar) ekranı verimli kullanır.
- **Navbar Güncellemesi**: "İşlemler" menüsü dropdown yapıldı.

### Fiş/Fatura Tarama (OCR)
- **Tesseract.js** ile görüntü OCR.
- **PDF.js** ile PDF metin çıkarma.
- Türk fişi pattern matching ve güven yüzdesi gösterimi.
- **Saat bilgisi çıkarma** artık destekleniyor.
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
