import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { translations, categoryKeys, type Language, type TranslationKey } from '../i18n/translations';

type Currency = 'USD' | 'EUR' | 'TRY';

interface CurrencyRates {
    USD: number;
    EUR: number;
    TRY: number;
    lastUpdated: string;
}

interface SettingsContextType {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    formatAmount: (amount: number) => string;
    rates: CurrencyRates;
    updateRates: () => Promise<void>;
    isUpdatingRates: boolean;
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: TranslationKey, params?: Record<string, string>) => string;
    translateCategory: (category: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_RATES: CurrencyRates = {
    USD: 1,
    EUR: 0.92,
    TRY: 34.85,
    lastUpdated: 'Never',
};

const CURRENCY_LOCALES: Record<Currency, { locale: string; currency: string }> = {
    USD: { locale: 'en-US', currency: 'USD' },
    EUR: { locale: 'de-DE', currency: 'EUR' },
    TRY: { locale: 'tr-TR', currency: 'TRY' },
};

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('theme');
        if (!saved) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return saved as 'light' | 'dark';
    });

    const [currency, setCurrencyState] = useState<Currency>(() => {
        const saved = localStorage.getItem('currency');
        return (saved as Currency) || 'USD';
    });

    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('language');
        return (saved as Language) || 'en';
    });

    const [rates, setRates] = useState<CurrencyRates>(() => {
        const saved = localStorage.getItem('currencyRates');
        return saved ? JSON.parse(saved) : DEFAULT_RATES;
    });

    const [isUpdatingRates, setIsUpdatingRates] = useState(false);

    // Apply theme
    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem('currencyRates', JSON.stringify(rates));
    }, [rates]);

    const setTheme = (newTheme: 'light' | 'dark') => {
        setThemeState(newTheme);
    };

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency);
    };

    const setLanguage = (newLanguage: Language) => {
        setLanguageState(newLanguage);
    };

    const t = (key: TranslationKey, params?: Record<string, string>): string => {
        let text: string = translations[language][key] || translations.en[key] || key;

        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                text = text.replace(`{${paramKey}}`, value);
            });
        }

        return text;
    };

    // Translate category names based on current language
    const translateCategory = (category: string): string => {
        const key = categoryKeys[category];
        if (key && translations[language][key as TranslationKey]) {
            return translations[language][key as TranslationKey];
        }
        return category; // Return original if no translation found
    };

    const updateRates = async () => {
        setIsUpdatingRates(true);
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (response.ok) {
                const data = await response.json();
                const newRates: CurrencyRates = {
                    USD: 1,
                    EUR: data.rates.EUR || DEFAULT_RATES.EUR,
                    TRY: data.rates.TRY || DEFAULT_RATES.TRY,
                    lastUpdated: new Date().toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US'),
                };
                setRates(newRates);
            } else {
                throw new Error('API error');
            }
        } catch (error) {
            console.error('Failed to fetch rates:', error);
            setRates(prev => ({
                ...prev,
                lastUpdated: `${new Date().toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')} (offline)`,
            }));
        } finally {
            setIsUpdatingRates(false);
        }
    };

    const formatAmount = (amount: number) => {
        const config = CURRENCY_LOCALES[currency];
        const rate = rates[currency];
        const convertedAmount = amount * rate;

        return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: config.currency,
            minimumFractionDigits: 2,
        }).format(convertedAmount);
    };

    return (
        <SettingsContext.Provider value={{
            theme,
            setTheme,
            currency,
            setCurrency,
            formatAmount,
            rates,
            updateRates,
            isUpdatingRates,
            language,
            setLanguage,
            t,
            translateCategory
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

