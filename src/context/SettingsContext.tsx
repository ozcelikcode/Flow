import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

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
        // Check system preference if no saved theme
        if (!saved) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return saved as 'light' | 'dark';
    });

    const [currency, setCurrencyState] = useState<Currency>(() => {
        const saved = localStorage.getItem('currency');
        return (saved as Currency) || 'USD';
    });

    const [rates, setRates] = useState<CurrencyRates>(() => {
        const saved = localStorage.getItem('currencyRates');
        return saved ? JSON.parse(saved) : DEFAULT_RATES;
    });

    const [isUpdatingRates, setIsUpdatingRates] = useState(false);

    // Apply theme on mount and change
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
        localStorage.setItem('currencyRates', JSON.stringify(rates));
    }, [rates]);

    const setTheme = (newTheme: 'light' | 'dark') => {
        setThemeState(newTheme);
    };

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency);
    };

    const updateRates = async () => {
        setIsUpdatingRates(true);
        try {
            // Using exchangerate-api.com free tier (or fallback to mock data)
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (response.ok) {
                const data = await response.json();
                const newRates: CurrencyRates = {
                    USD: 1,
                    EUR: data.rates.EUR || DEFAULT_RATES.EUR,
                    TRY: data.rates.TRY || DEFAULT_RATES.TRY,
                    lastUpdated: new Date().toLocaleString('tr-TR'),
                };
                setRates(newRates);
            } else {
                throw new Error('API error');
            }
        } catch (error) {
            console.error('Failed to fetch rates, using cached/default values:', error);
            // Keep existing rates but update timestamp to show attempt
            setRates(prev => ({
                ...prev,
                lastUpdated: `${new Date().toLocaleString('tr-TR')} (offline)`,
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
            isUpdatingRates
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
