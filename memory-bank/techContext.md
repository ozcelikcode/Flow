# Teknoloji Bağlamı (Tech Context)

## Teknoloji Yığını

### Frontend
- **Framework**: Vite + React 18 (TypeScript)
- **Stil**: Tailwind CSS v4
- **İkonlar**: Lucide React (Material Symbols'den değiştirildi)
- **Fontlar**: Inter (Google Fonts)
- **Grafikler**: Recharts
- **Sürükle-Bırak**: @dnd-kit/core, @dnd-kit/sortable
- **OCR**: Tesseract.js (fiş/fatura tarama)
- **PDF İşleme**: pdfjs-dist (PDF metin çıkarma)

### Güvenlik
- **Şifreleme**: Web Crypto API (AES-256-GCM)
- **Anahtar Türetme**: PBKDF2 (100,000 iterasyon)
- **Kimlik Doğrulama**: Yerel session (localStorage)

### State Yönetimi
- React Context API
  - `AuthContext`: Kullanıcı kimlik doğrulama ve oturum
  - `TransactionContext`: İşlem CRUD ve sıralama (şifreli)
  - `SettingsContext`: Tema, dil, para birimi (şifreli)
  - `CategoryContext`: Kategori CRUD ve çeviri (şifreli)
  - `ToastContext`: Bildirim yönetimi

### Veri Kalıcılığı (Şifreli)
- localStorage
  - `flow_transactions_{userId}`: İşlem listesi (şifreli)
  - `flow_categories_{userId}`: Özel kategoriler (şifreli)
  - `flow_settings_{userId}`: Tema, dil, para birimi (şifreli)
  - `flow_users`: Kullanıcı listesi (hash'li şifreler)
  - `flow_session`: Oturum bilgisi

## Proje Yapısı
```
src/
├── components/
│   ├── auth/            # ProtectedRoute
│   ├── dashboard/       # TransactionModal, StatsCard, TransactionTable
│   ├── layout/          # Layout (sidebar, navbar)
│   ├── reports/         # YearlyActivityMap
│   └── ui/              # Modal
├── context/             # React Context providers
├── i18n/               # Çeviri dosyaları
├── pages/              # Dashboard, Transactions, Reports, Settings, Categories, Upcoming, History
├── services/           # subscriptionService, authService, cryptoService
├── styles/             # charts.css
├── types/              # TypeScript interfaces
├── utils/              # dateUtils
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
- Tüm kişisel veriler şifreli saklanmalı
