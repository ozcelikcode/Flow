# Aktif Bağlam (Active Context)

## Mevcut Odak
- Proje genel incelemesi ve dokümantasyon senkronizasyonu tamamlanıyor.
- Gelir ve Gider sayfalarının tam ekran (100vh) düzeni oturtuldu.

## Son Değişiklikler (13 Aralık 2025)

### Yeni Sayfalar: Gelir ve Giderler
- **/income** ve **/expenses** sayfaları eklendi.
- **Tam Ekran Layout**: `h-[calc(100vh-6rem)]` ile sayfa scroll gerektirmeden tam ekrana sığdırıldı.
- **Esnek Düzen**: Flexbox mimarisiyle grafikler (Area, Pie, Bar) ekranı verimli kullanır (Sol %66 Trend, Sağ %33 Dağılım).
- **Navbar Güncellemesi**: "İşlemler" menüsü dropdown yapıldı -> "Tüm İşlemler", "Gelirler", "Giderler".

### İşlem Sayfası İyileştirmeleri
- **Klavye Kısayolu**: `CTRL + A` ile artık "Tüm İşlemler" tablosundaki bütün satırlar seçiliyor (önceden modal açıyordu, değiştirildi).
- Çoklu seçim ve toplu işlemler için altyapı hazır.

### Mobil ve Tablet UI İyileştirmeleri (Önceki)
- **History.tsx**: Stats kartları 2 sütunlu grid, daha kompakt boyutlar.
- **TransactionModal.tsx**: Mobil uyumlu form, küçültülmüş butonlar ve inputlar.
- **Reports.tsx**: Grafik container'larına debounce eklendi.
- **Layout.tsx**: Mobil sidebar'a X kapatma butonu eklendi.

### Fiş/Fatura Tarama (OCR)
- **Tesseract.js** ile görüntü OCR.
- **PDF.js** ile PDF metin çıkarma.
- Türk fişi pattern matching ve güven yüzdesi gösterimi.
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
