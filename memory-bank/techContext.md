# Teknoloji Bağlamı (Tech Context)

## Teknoloji Yığını

### Frontend
- **Framework**: Vite + React 18 (TypeScript)
- **Stil**: Tailwind CSS v4
- **İkonlar**: Lucide React (Material Symbols'den değiştirildi)
- **Fontlar**: Inter (Google Fonts)
- **Grafikler**: Recharts
- **Sürükle-Bırak**: @dnd-kit/core, @dnd-kit/sortable

### State Yönetimi
- React Context API
  - `TransactionContext`: İşlem CRUD ve sıralama
  - `SettingsContext`: Tema, dil, para birimi
  - `CategoryContext`: Kategori CRUD ve çeviri

### Veri Kalıcılığı
- localStorage
  - `flow_transactions`: İşlem listesi
  - `flow_categories`: Özel kategoriler
  - `flow_settings`: Tema, dil, para birimi
  - `transactionViewMode`: Liste/Grid tercih

## Proje Yapısı
```
src/
├── components/
│   ├── dashboard/       # TransactionModal, StatsCard, TransactionTable
│   ├── layout/          # Layout (sidebar, navbar)
│   ├── reports/         # YearlyActivityMap
│   └── ui/              # Modal
├── context/             # React Context providers
├── i18n/               # Çeviri dosyaları
├── pages/              # Dashboard, Transactions, Reports, Settings, Categories
├── services/           # subscriptionService
├── styles/             # charts.css
├── types/              # TypeScript interfaces
└── App.tsx             # Router ve provider sarmalayıcı
```

## Geliştirme
- **Başlatma**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`

## Kısıtlamalar
- Uygulama premium ve modern hissettirmeli
- Responsive tasarım zorunlu (mobil-first)
- Dark/Light tema desteği zorunlu
- Çift dil desteği (EN/TR) zorunlu
