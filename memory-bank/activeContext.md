# Aktif Bağlam (Active Context)

## Mevcut Odak
- Kategori yönetim sistemi geliştirilmesi tamamlandı.
- Transactions sayfasında liste/grid görünüm geçişi eklendi.
- Çift dil desteği (İngilizce/Türkçe) tam olarak uygulandı.

## Son Değişiklikler (8 Aralık 2025)

### Kategori Yönetimi
- Category tipi güncellendi: `nameEn`, `nameTr`, `descriptionEn`, `descriptionTr` alanları eklendi.
- Categories sayfası: İki dilde isim ve açıklama girişi, geniş ikon seçimi, önizleme bölümü.
- 70+ farklı Lucide ikonu kategori seçimi için kullanılabilir.
- Varsayılan kategoriler Türkçe çevirileriyle güncellendi.

### Transactions Sayfası
- Liste ve Grid görünüm modu eklendi.
- Görünüm tercihi localStorage'da saklanıyor.
- Grid görünümünde kartlar hover efektiyle düzenleme imkanı.

### UI/UX İyileştirmeleri
- Takvim (date picker) dark mode için stillendirildi.
- Özel scrollbar stilleri eklendi.
- Reports sayfasındaki günlük harcama grafiği ayın 1'inden bugüne kadar gösteriyor.
- Tooltip pozisyonlaması iyileştirildi.

### Teknik İyileştirmeler
- Yıl geçişi sorunları kontrol edildi ve düzeltildi.
- Tüm bileşenler responsive tasarıma sahip.
- Material Symbols yerine Lucide ikonları kullanılıyor.
- **Bug Fix**: Tarih formatlama sorunu giderildi (Türkçe/İngilizce tarih formatları).
- **Bug Fix**: Dashboard "Bu Ay Toplam Harcama" hesaplaması düzeltildi.
- **Bug Fix**: Reports sayfasındaki günlük trend grafiği tam ayı kapsayacak şekilde güncellendi.
- `dateUtils.ts` oluşturuldu, merkezi tarih yönetimi sağlandı.

## Son Değişiklikler (10 Aralık 2025)

### Yaklaşan İşlemler (Upcoming) Sayfası
- `Upcoming.tsx` sayfası oluşturuldu: Gelecek finansal durumu (tahmini gelir/gider) ve yaklaşan işlemleri gösterir.
- `subscriptionService.ts` güncellendi:
    - `getUpcomingTransactions` fonksiyonu yenilendi: Tekrarlayan ve gelecekteki tek seferlik işlemleri kapsıyor.
    - Abonelik güncelleme mantığı değiştirildi: Abonelikler artık sadece fatura tarihi *geçtikten* sonra (ertesi gün) güncelleniyor, böylece "Bugün" vadesi gelenler "Upcoming" listesinde görünüyor.
    - `endDate` (Bitiş Tarihi) desteği eklendi.
- Navigasyon menüsüne "Upcoming" eklendi.

### Tarih Yönetimi
- `parseLocalizedDate` yardımcı fonksiyonu eklendi: Farklı formatlardaki tarih dizelerini (örn. Türkçe "8 Ara 2025") güvenilir şekilde Date objesine çeviriyor.
- Tüm abonelik ve gelecek işlem hesaplamaları bu güvenli tarih ayrıştırma yapısını kullanacak şekilde güncellendi.

### Diğer İyileştirmeler
- **Transaction Modal**: Period Prices için sayı girişi okları (spinners) gizlendi.
- **Transaction Modal**: Abonelikler için opsiyonel "Bitiş Tarihi" alanı eklendi.
- **Bug Fix**: Tarih düzenleme ve kaydetme sırasında oluşan format sorunları giderildi.

### Önceki Değişiklikler
- **Dashboard**: Kategori Dağılımı bölümü kaldırıldı, Quick Stats tek sütuna dönüştürüldü.
- **Dashboard**: Son işlemler listesi 5 yerine 10 işlem gösterecek şekilde güncellendi.
- **History**: İşlem listesinin boş görünmesine neden olan tarih formatlama hatası `parseDate` kullanılarak düzeltildi.
- **Transaction Modal**: Form alanları görsel olarak daraltılarak (padding artırılarak) daha kompakt bir görünüm sağlandı.


## Sonraki Adımlar
- Kategori ikonlarını işlem listelerinde gösterme.
- Kategoriye göre filtreleme özelliği.
- Arama fonksiyonu.
- Veri dışa/içe aktarma.
