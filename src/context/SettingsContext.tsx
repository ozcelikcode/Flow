import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { translations, categoryKeys, type Language, type TranslationKey } from '../i18n/translations';
import { useAuth } from './AuthContext';
import { encryptAndSave, loadAndDecrypt } from '../services/cryptoService';

type Currency = 'USD' | 'EUR' | 'TRY';

interface CurrencyRates {
    USD: number;
    EUR: number;
    TRY: number;
    lastUpdated: string;
}

// Encrypted user settings interface
interface UserSettings {
    theme: 'light' | 'dark';
    language: Language;
    currency: Currency;
    currencyRates: CurrencyRates;
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
    isLoading: boolean;
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

// Get default theme from system preference
function getDefaultTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id;
    const userPassword = user?.passwordHash?.substring(0, 32) || 'default';

    const [theme, setThemeState] = useState<'light' | 'dark'>(getDefaultTheme);
    const [currency, setCurrencyState] = useState<Currency>('USD');
    const [language, setLanguageState] = useState<Language>('en');
    const [rates, setRates] = useState<CurrencyRates>(DEFAULT_RATES);
    const [isUpdatingRates, setIsUpdatingRates] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Get user-specific storage key
    const getStorageKey = useCallback(() => {
        return userId ? `flow_settings_${userId}` : 'flow_settings';
    }, [userId]);

    // Load encrypted settings when user changes
    useEffect(() => {
        const loadData = async () => {
            if (!userId) {
                // Not logged in - use defaults or system preferences
                setThemeState(getDefaultTheme());
                setLanguageState('en');
                setCurrencyState('USD');
                setRates(DEFAULT_RATES);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const key = getStorageKey();

            try {
                const data = await loadAndDecrypt<UserSettings>(key, userPassword);
                if (data) {
                    setThemeState(data.theme);
                    setLanguageState(data.language);
                    setCurrencyState(data.currency);
                    setRates(data.currencyRates);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
                // Try loading unencrypted data for migration
                const stored = localStorage.getItem(key);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (parsed && typeof parsed === 'object' && !('iv' in parsed)) {
                            // Old format - migrate
                            if (parsed.theme) setThemeState(parsed.theme);
                            if (parsed.language) setLanguageState(parsed.language);
                            if (parsed.currency) setCurrencyState(parsed.currency);
                            if (parsed.currencyRates) setRates(parsed.currencyRates);
                        }
                    } catch {
                        // Ignore parse errors
                    }
                }
            }
            setIsLoading(false);
        };

        loadData();
    }, [userId, userPassword, getStorageKey]);

    // Save encrypted settings
    const saveSettings = useCallback(async (settings: UserSettings) => {
        if (!userId) return;

        const key = getStorageKey();
        try {
            await encryptAndSave(key, settings, userPassword);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }, [userId, userPassword, getStorageKey]);

    // Apply theme to DOM
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const setTheme = useCallback((newTheme: 'light' | 'dark') => {
        setThemeState(newTheme);
        saveSettings({ theme: newTheme, language, currency, currencyRates: rates });
    }, [language, currency, rates, saveSettings]);

    const setCurrency = useCallback((newCurrency: Currency) => {
        setCurrencyState(newCurrency);
        saveSettings({ theme, language, currency: newCurrency, currencyRates: rates });
    }, [theme, language, rates, saveSettings]);

    const setLanguage = useCallback((newLanguage: Language) => {
        setLanguageState(newLanguage);
        saveSettings({ theme, language: newLanguage, currency, currencyRates: rates });
    }, [theme, currency, rates, saveSettings]);

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
                saveSettings({ theme, language, currency, currencyRates: newRates });
            } else {
                throw new Error('API error');
            }
        } catch (error) {
            console.error('Failed to fetch rates:', error);
            const newRates = {
                ...rates,
                lastUpdated: `${new Date().toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')} (offline)`,
            };
            setRates(newRates);
            saveSettings({ theme, language, currency, currencyRates: newRates });
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
            translateCategory,
            isLoading
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
