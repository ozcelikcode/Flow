import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Category } from '../types';

// Default categories with bilingual names
const DEFAULT_CATEGORIES: Category[] = [
    // Expense categories
    { id: 'food-drink', name: 'Food & Drink', nameEn: 'Food & Drink', nameTr: 'Yiyecek ve İçecek', icon: 'UtensilsCrossed', description: 'Restaurants, groceries, coffee', type: 'expense', isCustom: false },
    { id: 'transportation', name: 'Transportation', nameEn: 'Transportation', nameTr: 'Ulaşım', icon: 'Car', description: 'Gas, public transit, parking', type: 'expense', isCustom: false },
    { id: 'entertainment', name: 'Entertainment', nameEn: 'Entertainment', nameTr: 'Eğlence', icon: 'Gamepad2', description: 'Movies, games, events', type: 'expense', isCustom: false },
    { id: 'shopping', name: 'Shopping', nameEn: 'Shopping', nameTr: 'Alışveriş', icon: 'ShoppingBag', description: 'Clothing, electronics, gifts', type: 'expense', isCustom: false },
    { id: 'bills', name: 'Bills', nameEn: 'Bills', nameTr: 'Faturalar', icon: 'Receipt', description: 'Utilities, phone, internet', type: 'expense', isCustom: false },
    { id: 'subscription', name: 'Subscription', nameEn: 'Subscription', nameTr: 'Abonelik', icon: 'RefreshCw', description: 'Streaming, software, memberships', type: 'expense', isCustom: false },
    { id: 'health', name: 'Health', nameEn: 'Health', nameTr: 'Sağlık', icon: 'Heart', description: 'Medical, pharmacy, gym', type: 'expense', isCustom: false },
    { id: 'education', name: 'Education', nameEn: 'Education', nameTr: 'Eğitim', icon: 'GraduationCap', description: 'Courses, books, training', type: 'expense', isCustom: false },
    // Income categories
    { id: 'salary', name: 'Salary', nameEn: 'Salary', nameTr: 'Maaş', icon: 'Banknote', description: 'Monthly salary, wages', type: 'income', isCustom: false },
    { id: 'freelance', name: 'Freelance', nameEn: 'Freelance', nameTr: 'Serbest Çalışma', icon: 'Laptop', description: 'Project work, consulting', type: 'income', isCustom: false },
    { id: 'investment', name: 'Investment', nameEn: 'Investment', nameTr: 'Yatırım', icon: 'TrendingUp', description: 'Dividends, interest, gains', type: 'income', isCustom: false },
    { id: 'gift', name: 'Gift', nameEn: 'Gift', nameTr: 'Hediye', icon: 'Gift', description: 'Money received as gift', type: 'income', isCustom: false },
    // Both
    { id: 'other', name: 'Other', nameEn: 'Other', nameTr: 'Diğer', icon: 'MoreHorizontal', description: 'Miscellaneous transactions', type: 'both', isCustom: false },
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
}

const CategoryContext = createContext<CategoryContextType | null>(null);

export function CategoryProvider({ children }: { children: ReactNode }) {
    const [categories, setCategories] = useState<Category[]>(() => {
        const saved = localStorage.getItem('flow_categories');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Migrate old categories that don't have nameEn/nameTr
                const migrated = parsed.map((c: any) => ({
                    ...c,
                    nameEn: c.nameEn || c.name,
                    nameTr: c.nameTr || c.name,
                }));
                // Merge with defaults to ensure all default categories exist
                const existingIds = new Set(migrated.map((c: Category) => c.id));
                const merged = [...migrated];
                DEFAULT_CATEGORIES.forEach(dc => {
                    if (!existingIds.has(dc.id)) {
                        merged.push(dc);
                    } else {
                        // Update default category translations if they exist
                        const idx = merged.findIndex((c: Category) => c.id === dc.id);
                        if (idx !== -1 && !merged[idx].isCustom) {
                            merged[idx] = { ...merged[idx], nameEn: dc.nameEn, nameTr: dc.nameTr };
                        }
                    }
                });
                return merged;
            } catch {
                return DEFAULT_CATEGORIES;
            }
        }
        return DEFAULT_CATEGORIES;
    });

    useEffect(() => {
        localStorage.setItem('flow_categories', JSON.stringify(categories));
    }, [categories]);

    const addCategory = (category: Omit<Category, 'id' | 'isCustom'>): Category => {
        const newCategory: Category = {
            ...category,
            id: `custom-${Date.now()}`,
            isCustom: true
        };
        setCategories(prev => [...prev, newCategory]);
        return newCategory;
    };

    const updateCategory = (id: string, updates: Partial<Omit<Category, 'id' | 'isCustom'>>) => {
        setCategories(prev => prev.map(cat =>
            cat.id === id ? { ...cat, ...updates } : cat
        ));
    };

    const deleteCategory = (id: string): boolean => {
        const category = categories.find(c => c.id === id);
        if (!category || !category.isCustom) {
            return false; // Can't delete default categories
        }
        setCategories(prev => prev.filter(c => c.id !== id));
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
            getCategoryDisplayName
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
