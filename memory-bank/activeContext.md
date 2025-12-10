# Aktif Bağlam (Active Context)

## Mevcut Odak
- Uçtan uca şifreleme sistemi tamamlandı.
- Hesap silme özelliği eklendi.
- Tüm kişisel veriler şifreli olarak saklanıyor.

## Son Değişiklikler (10 Aralık 2025)

### Güvenlik ve Şifreleme
- **Uçtan Uca Şifreleme**: Tüm kişisel veriler AES-256-GCM ile şifreleniyor.
- `cryptoService.ts`: PBKDF2 anahtar türetme (100,000 iterasyon).
- Her kaydetmede yeni salt ve IV oluşturulur (tek harf değişikliğinde bile).
- Şifreli veriler: İşlemler, kategoriler, kullanıcı ayarları.

### Hesap Silme
- Settings → Güvenlik bölümüne "Tehlikeli Bölge" eklendi.
- Şifre doğrulama zorunlu.
- Admin hesabı silinemez koruması.
- Silinen veriler: transactions, categories, settings.

### Provider Sıralaması
- `App.tsx`'de provider sırası düzeltildi: `AuthProvider > SettingsProvider > CategoryProvider`.
- `SettingsContext` artık `useAuth()` kullandığı için `AuthProvider` en dışta olmalı.

### Yaklaşan İşlemler (Upcoming) Sayfası
- `Upcoming.tsx` sayfası oluşturuldu.
- `subscriptionService.ts` güncellendi.
- `endDate` (Bitiş Tarihi) desteği eklendi.
- Navigasyon menüsüne "Upcoming" eklendi.

### Önceki Değişiklikler (8 Aralık)
- Kategori yönetim sistemi geliştirildi.
- Transactions sayfasında liste/grid görünüm geçişi eklendi.
- Çift dil desteği tam olarak uygulandı.
- `dateUtils.ts` oluşturuldu, merkezi tarih yönetimi sağlandı.

## Sonraki Adımlar
- Kategoriye göre filtreleme özelliği.
- Arama fonksiyonu.
- Veri dışa/içe aktarma (JSON).
- PWA desteği.
