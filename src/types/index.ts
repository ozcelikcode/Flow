export type RecurrenceType = 'once' | 'daily' | 'monthly' | 'yearly';

export interface PriceTier {
    periodNumber: number; // 1. yıl, 2. yıl, 3. ay, vb.
    amount: number; // USD bazında fiyat
}

export interface Transaction {
    id: string;
    name: string;
    category: string;
    date: string; // İşlem başlangıç tarihi
    amount: number; // Mevcut dönemin fiyatı (USD bazında)
    type: 'income' | 'expense';

    // Abonelik özellikleri
    recurrence?: RecurrenceType;
    priceTiers?: PriceTier[]; // Dönem bazlı fiyatlar
    currentPeriod?: number; // Şu anki dönem (1, 2, 3...)
    nextBillingDate?: string; // Sonraki ödeme tarihi
    isActive?: boolean; // Abonelik aktif mi?
}
