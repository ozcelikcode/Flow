# Sistem Modelleri (System Patterns)

## Mimari
Uygulama, React/Vite ile Bileşen Tabanlı Mimari kullanmaktadır.

## Ana Bileşenler

### Layout
- Sabit sidebar (desktop) / hamburger menü (mobil)
- Ana içerik alanı
- Sayfa yönlendirmesi (React Router)

### Dashboard
- Finansal özet kartları (StatsCard)
- Hızlı istatistikler grid'i
- Kategori dağılımı pasta grafiği
- Son işlemler tablosu (TransactionTable)

### Transactions
- Liste görünümü (sürükle-bırak sıralama)
- Grid görünümü (kart tabanlı)
- Görünüm modu tercihi localStorage'da

### Categories
- Gider/Gelir kategorileri ayrı listeleme
- Kategori kartları (ikon, isim, açıklama, tip)
- Ekleme/düzenleme modal

### Reports
- Gelir vs Gider bar grafiği
- Kategoriye göre harcama pasta grafiği
- Günlük harcama trend grafiği
- Yıllık aktivite haritası (GitHub tarzı)

### Settings
- Tema seçimi (açık/koyu)
- Dil seçimi (İngilizce/Türkçe)
- Para birimi seçimi (USD, EUR, TRY)

## Tasarım Desenleri

### State Yönetimi
- Context API ile global state
- Her context kendi localStorage yönetimi yapar
- Custom hooks ile context erişimi

### Çeviri Sistemi
- `translations.ts` içinde tüm çeviriler
- `t()` fonksiyonu ile erişim
- Kategoriler için `getCategoryDisplayName(category, language)`

### Para Birimi
- Tüm tutarlar USD olarak saklanır
- Gösterim anında seçili para birimine dönüştürülür
- `formatAmount()` fonksiyonu ile formatlama

### Tema
- Tailwind dark: prefix ile dark mode
- HTML root'unda `dark` class ile kontrol
- System preference desteği

### Responsive Design
- Mobile-first yaklaşım
- Tailwind breakpoints: sm, md, lg, xl
- Mobil için özel hamburger menü
