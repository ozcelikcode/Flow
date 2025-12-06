export type Language = 'en' | 'tr';

export const translations = {
    en: {
        // Navigation
        dashboard: 'Dashboard',
        transactions: 'Transactions',
        reports: 'Reports',
        settings: 'Settings',
        myWallet: 'My Wallet',
        personalFinance: 'Personal Finance',
        addTransaction: 'Add Transaction',
        editTransaction: 'Edit Transaction',

        // Dashboard
        welcomeBack: 'Welcome back!',
        financialSummary: "Here's a summary of your financial health.",
        totalBalance: 'Total Balance',
        income: 'Income (This Month)',
        expense: 'Expense (This Month)',
        basedOnTransactions: 'Based on transactions',
        recentTransactions: 'Recent Transactions',

        // Transactions Page
        allTransactions: 'All Transactions',
        dragToReorder: 'Drag rows to reorder. Click Edit to modify details.',
        noTransactions: 'No transactions yet. Add one to get started!',

        // Reports
        financialReports: 'Financial Reports',
        incomeVsExpense: 'Income vs Expense',
        expenseByCategory: 'Expense by Category',

        // Settings
        appearance: 'Appearance',
        theme: 'Theme',
        themeDescription: 'Customize how the app looks on your device',
        light: 'Light',
        dark: 'Dark',
        currency: 'Currency',
        displayCurrency: 'Display Currency',
        exchangeRates: 'Exchange Rates (Base: USD)',
        updateRates: 'Update Rates',
        updating: 'Updating...',
        lastUpdated: 'Last updated',
        language: 'Language',
        languageDescription: 'Choose your preferred language',
        preferences: 'Preferences',

        // Transaction Modal
        type: 'Type',
        expenseType: 'Expense',
        incomeType: 'Income',
        name: 'Name',
        namePlaceholder: 'e.g. Starbucks',
        amount: 'Amount',
        paidIn: 'Paid in',
        receivedIn: 'Received in',
        amountNote: 'Amount will be converted and stored in USD base.',
        category: 'Category',
        date: 'Date',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',

        // Categories
        foodAndDrink: 'Food & Drink',
        transportation: 'Transportation',
        entertainment: 'Entertainment',
        shopping: 'Shopping',
        bills: 'Bills',
        salary: 'Salary',
        freelance: 'Freelance',
        investment: 'Investment',
        other: 'Other',

        // Table Headers
        nameColumn: 'Name',
        categoryColumn: 'Category',
        dateColumn: 'Date',
        amountColumn: 'Amount',
        noTransactionsFound: 'No transactions found.',
    },
    tr: {
        // Navigation
        dashboard: 'Ana Sayfa',
        transactions: 'İşlemler',
        reports: 'Raporlar',
        settings: 'Ayarlar',
        myWallet: 'Cüzdanım',
        personalFinance: 'Kişisel Finans',
        addTransaction: 'İşlem Ekle',
        editTransaction: 'İşlem Düzenle',

        // Dashboard
        welcomeBack: 'Tekrar hoş geldiniz!',
        financialSummary: 'İşte finansal durumunuzun özeti.',
        totalBalance: 'Toplam Bakiye',
        income: 'Gelir (Bu Ay)',
        expense: 'Gider (Bu Ay)',
        basedOnTransactions: 'İşlemlere dayalı',
        recentTransactions: 'Son İşlemler',

        // Transactions Page
        allTransactions: 'Tüm İşlemler',
        dragToReorder: 'Sıralamak için sürükleyin. Düzenlemek için Düzenle\'ye tıklayın.',
        noTransactions: 'Henüz işlem yok. Başlamak için bir tane ekleyin!',

        // Reports
        financialReports: 'Finansal Raporlar',
        incomeVsExpense: 'Gelir vs Gider',
        expenseByCategory: 'Kategoriye Göre Gider',

        // Settings
        appearance: 'Görünüm',
        theme: 'Tema',
        themeDescription: 'Uygulamanın cihazınızda nasıl görüneceğini özelleştirin',
        light: 'Açık',
        dark: 'Koyu',
        currency: 'Para Birimi',
        displayCurrency: 'Görüntüleme Para Birimi',
        exchangeRates: 'Döviz Kurları (Temel: USD)',
        updateRates: 'Kurları Güncelle',
        updating: 'Güncelleniyor...',
        lastUpdated: 'Son güncelleme',
        language: 'Dil',
        languageDescription: 'Tercih ettiğiniz dili seçin',
        preferences: 'Tercihler',

        // Transaction Modal
        type: 'Tür',
        expenseType: 'Gider',
        incomeType: 'Gelir',
        name: 'İsim',
        namePlaceholder: 'örn. Starbucks',
        amount: 'Tutar',
        paidIn: 'Ödeme para birimi',
        receivedIn: 'Alınan para birimi',
        amountNote: 'Tutar USD bazında dönüştürülüp saklanacaktır.',
        category: 'Kategori',
        date: 'Tarih',
        save: 'Kaydet',
        cancel: 'İptal',
        delete: 'Sil',
        edit: 'Düzenle',

        // Categories
        foodAndDrink: 'Yiyecek ve İçecek',
        transportation: 'Ulaşım',
        entertainment: 'Eğlence',
        shopping: 'Alışveriş',
        bills: 'Faturalar',
        salary: 'Maaş',
        freelance: 'Serbest Çalışma',
        investment: 'Yatırım',
        other: 'Diğer',

        // Table Headers
        nameColumn: 'İsim',
        categoryColumn: 'Kategori',
        dateColumn: 'Tarih',
        amountColumn: 'Tutar',
        noTransactionsFound: 'İşlem bulunamadı.',
    }
} as const;

export type TranslationKey = keyof typeof translations.en;
