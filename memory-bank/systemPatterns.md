# Sistem Modelleri (System Patterns)

## Mimari
Uygulama, `code.html` içindeki tasarımı modüler hale getirmek için Bileşen Tabanlı Mimari (React/Vite) kullanacak.

## Ana Bileşenler
`code.html` analizine göre:
1.  **Layout**: Sidebar ve Ana İçerik kapsayıcısı.
2.  **Sidebar**: Navigasyon (Dashboard, İşlemler, Raporlar, Ayarlar) ve Profil.
3.  **Dashboard**:
    *   **Header**: Hoşgeldin mesajı ve özet.
    *   **Stats Cards**: Toplam Bakiye, Gelir, Gider kartları.
    *   **Recent Transactions Table**: İşlem detayları tablosu.
4.  **Transaction Modal/Form**: (Yeni eklenecek) İşlem ekleme formu.

## Tasarım Desenleri
- **Tailwind CSS Utility Classes**: Orijinal dosyadaki stiller korunacak.
- **Responsive Design**: Tailwind responsive önekleri kullanılacak.
