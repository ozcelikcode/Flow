import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Category } from '../types';
import { useAuth } from './AuthContext';
import { encryptAndSave, loadAndDecrypt } from '../services/cryptoService';

// Default categories with bilingual names and descriptions
const DEFAULT_CATEGORIES: Category[] = [
    // Expense categories
    { id: 'food-drink', name: 'Food & Drink', nameEn: 'Food & Drink', nameTr: 'Yiyecek ve İçecek', icon: 'UtensilsCrossed', descriptionEn: 'Restaurants, groceries, coffee', descriptionTr: 'Restoranlar, market, kahve', type: 'expense', isCustom: false },
    { id: 'transportation', name: 'Transportation', nameEn: 'Transportation', nameTr: 'Ulaşım', icon: 'Car', descriptionEn: 'Gas, public transit, parking', descriptionTr: 'Benzin, toplu taşıma, otopark', type: 'expense', isCustom: false },
    { id: 'entertainment', name: 'Entertainment', nameEn: 'Entertainment', nameTr: 'Eğlence', icon: 'Gamepad2', descriptionEn: 'Movies, games, events', descriptionTr: 'Sinema, oyunlar, etkinlikler', type: 'expense', isCustom: false },
    { id: 'shopping', name: 'Shopping', nameEn: 'Shopping', nameTr: 'Alışveriş', icon: 'ShoppingBag', descriptionEn: 'Clothing, electronics, gifts', descriptionTr: 'Giyim, elektronik, hediyeler', type: 'expense', isCustom: false },
    { id: 'bills', name: 'Bills', nameEn: 'Bills', nameTr: 'Faturalar', icon: 'Receipt', descriptionEn: 'Utilities, phone, internet', descriptionTr: 'Fatura, telefon, internet', type: 'expense', isCustom: false },
    { id: 'subscription', name: 'Subscription', nameEn: 'Subscription', nameTr: 'Abonelik', icon: 'RefreshCw', descriptionEn: 'Streaming, software, memberships', descriptionTr: 'Yayın, yazılım, üyelikler', type: 'expense', isCustom: false },
    { id: 'health', name: 'Health', nameEn: 'Health', nameTr: 'Sağlık', icon: 'Heart', descriptionEn: 'Medical, pharmacy, gym', descriptionTr: 'Tıbbi, eczane, spor salonu', type: 'expense', isCustom: false },
    { id: 'education', name: 'Education', nameEn: 'Education', nameTr: 'Eğitim', icon: 'GraduationCap', descriptionEn: 'Courses, books, training', descriptionTr: 'Kurslar, kitaplar, eğitim', type: 'expense', isCustom: false },
    // Income categories
    { id: 'salary', name: 'Salary', nameEn: 'Salary', nameTr: 'Maaş', icon: 'Banknote', descriptionEn: 'Monthly salary, wages', descriptionTr: 'Aylık maaş, ücretler', type: 'income', isCustom: false },
    { id: 'freelance', name: 'Freelance', nameEn: 'Freelance', nameTr: 'Serbest Çalışma', icon: 'Laptop', descriptionEn: 'Project work, consulting', descriptionTr: 'Proje işleri, danışmanlık', type: 'income', isCustom: false },
    { id: 'investment', name: 'Investment', nameEn: 'Investment', nameTr: 'Yatırım', icon: 'TrendingUp', descriptionEn: 'Dividends, interest, gains', descriptionTr: 'Temettüler, faiz, kazançlar', type: 'income', isCustom: false },
    { id: 'gift', name: 'Gift', nameEn: 'Gift', nameTr: 'Hediye', icon: 'Gift', descriptionEn: 'Money received as gift', descriptionTr: 'Hediye olarak alınan para', type: 'income', isCustom: false },
    // Both
    { id: 'other', name: 'Other', nameEn: 'Other', nameTr: 'Diğer', icon: 'MoreHorizontal', descriptionEn: 'Miscellaneous transactions', descriptionTr: 'Çeşitli işlemler', type: 'both', isCustom: false },
];

interface CategoryContextType {
    categories: Category[];
    addCategory: (category: Omit<Category, 'id' | 'isCustom'>) => Category;
    updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'isCustom'>>) => void;
    deleteCategory: (id: string) => boolean;
    getCategoryByName: (name: string) => Category | undefined;
    getExpenseCategories: () => Category[];
    getIncomeCategories: () => Category[];
    getCategoryDisplayName: (category: Category, language: 'en' | 'tr') => string;
    isLoading: boolean;
}

const CategoryContext = createContext<CategoryContextType | null>(null);

export function CategoryProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id;
    const userPassword = user?.passwordHash?.substring(0, 32) || 'default';

    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [isLoading, setIsLoading] = useState(true);

    const getStorageKey = useCallback(() => {
        return userId ? `flow_categories_${userId}` : 'flow_categories';
    }, [userId]);

    // Load encrypted categories
    useEffect(() => {
        const loadData = async () => {
            if (!userId) {
                setCategories(DEFAULT_CATEGORIES);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const key = getStorageKey();

            try {
                const data = await loadAndDecrypt<Category[]>(key, userPassword);
                if (data && data.length > 0) {
                    // Merge with defaults
                    const existingIds = new Set(data.map(c => c.id));
                    const merged = [...data];
                    DEFAULT_CATEGORIES.forEach(dc => {
                        if (!existingIds.has(dc.id)) {
                            merged.push(dc);
                        }
                    });
                    setCategories(merged);
                } else {
                    setCategories(DEFAULT_CATEGORIES);
                }
            } catch {
                setCategories(DEFAULT_CATEGORIES);
            }
            setIsLoading(false);
        };

        loadData();
    }, [userId, userPassword, getStorageKey]);

    // Save encrypted categories
    const saveCategories = useCallback(async (cats: Category[]) => {
        if (!userId) return;

        // Only save custom categories
        const customCats = cats.filter(c => c.isCustom);
        const key = getStorageKey();

        try {
            await encryptAndSave(key, customCats, userPassword);
        } catch (error) {
            console.error('Failed to save categories:', error);
        }
    }, [userId, userPassword, getStorageKey]);

    const addCategory = (category: Omit<Category, 'id' | 'isCustom'>): Category => {
        const newCategory: Category = {
            ...category,
            id: `custom-${Date.now()}`,
            isCustom: true
        };
        const newCats = [...categories, newCategory];
        setCategories(newCats);
        saveCategories(newCats);
        return newCategory;
    };

    const updateCategory = (id: string, updates: Partial<Omit<Category, 'id' | 'isCustom'>>) => {
        const newCats = categories.map(cat =>
            cat.id === id ? { ...cat, ...updates } : cat
        );
        setCategories(newCats);
        saveCategories(newCats);
    };

    const deleteCategory = (id: string): boolean => {
        const category = categories.find(c => c.id === id);
        if (!category || !category.isCustom) {
            return false;
        }
        const newCats = categories.filter(c => c.id !== id);
        setCategories(newCats);
        saveCategories(newCats);
        return true;
    };

    const getCategoryByName = (name: string): Category | undefined => {
        return categories.find(c => c.name === name || c.nameEn === name || c.nameTr === name);
    };

    const getExpenseCategories = (): Category[] => {
        return categories.filter(c => c.type === 'expense' || c.type === 'both');
    };

    const getIncomeCategories = (): Category[] => {
        return categories.filter(c => c.type === 'income' || c.type === 'both');
    };

    const getCategoryDisplayName = (category: Category, language: 'en' | 'tr'): string => {
        return language === 'tr' ? category.nameTr : category.nameEn;
    };

    return (
        <CategoryContext.Provider value={{
            categories,
            addCategory,
            updateCategory,
            deleteCategory,
            getCategoryByName,
            getExpenseCategories,
            getIncomeCategories,
            getCategoryDisplayName,
            isLoading
        }}>
            {children}
        </CategoryContext.Provider>
    );
}

export function useCategories() {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategories must be used within a CategoryProvider');
    }
    return context;
}
