# Aktif Bağlam (Active Context)

## Mevcut Odak
- Mobil ve tablet UI iyileştirmeleri tamamlandı.
- Raporlar sayfası responsive düzeltmeleri yapıldı.
- Günlük Harcama Trendi grafiği bugüne kadar gösterecek şekilde güncellendi.

## Son Değişiklikler (11 Aralık 2025)

### Mobil ve Tablet UI İyileştirmeleri
- **History.tsx**: Stats kartları 2 sütunlu grid, daha kompakt boyutlar.
- **TransactionModal.tsx**: Mobil uyumlu form, küçültülmüş butonlar ve inputlar.
- **Reports.tsx**: Grafik container'larına debounce eklendi, Recharts uyarıları giderildi.
- **Layout.tsx**: Mobil sidebar'a X kapatma butonu eklendi.

### Günlük Harcama Trendi Düzeltmeleri
- Grafik sadece ayın 1'inden bugüne kadar gösteriyor (gelecek günler hariç).
- X ekseni gün numaraları düzgün yerleştirildi (`interval={0}`, `tickMargin={5}`).
- Ay geçişlerinde sorunsuz çalışıyor.

### Console Temizliği
- React DevTools mesajı gizlendi (`main.tsx`).
- `cryptoService.ts`'deki `console.error` kaldırıldı (güvenlik için).

## Önceki Değişiklikler (10 Aralık 2025)

### Güvenlik ve Şifreleme
- **Uçtan Uca Şifreleme**: Tüm kişisel veriler AES-256-GCM ile şifreleniyor.
- `cryptoService.ts`: PBKDF2 anahtar türetme (100,000 iterasyon).
- Her kaydetmede yeni salt ve IV oluşturulur.
- Şifreli veriler: İşlemler, kategoriler, kullanıcı ayarları.

### Hesap Silme
- Settings → Güvenlik bölümüne "Tehlikeli Bölge" eklendi.
- Şifre doğrulama zorunlu, Admin hesabı silinemez.

### Provider Sıralaması
- `App.tsx`'de: `AuthProvider > SettingsProvider > CategoryProvider`.

## Sonraki Adımlar
- Kategoriye göre filtreleme özelliği.
- Arama fonksiyonu.
- Veri dışa/içe aktarma (JSON).
- PWA desteği.

