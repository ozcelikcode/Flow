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

### UI/UX İyileştirmeleri (9 Aralık 2025)
- Kategori dağılımı kartına "Harcama Özeti" (Spending Insight) bölümü eklendi.
- En çok harcanan kategorinin toplam içindeki oranı görsel progress bar ile gösteriliyor.
- **Yeni Sayfa (History)**: Tüm finansal geçmişi (Toplam Varlık, Gelir, Gider, Birikim) gösteren ve aylık bazda işlemleri gruplayan yeni sayfa eklendi.
- Sidebar menüsüne "Geçmiş" (History) bağlantısı eklendi.

## Sonraki Adımlar
- Kategori ikonlarını işlem listelerinde gösterme.
- Kategoriye göre filtreleme özelliği.
- Arama fonksiyonu.
- Veri dışa/içe aktarma.
