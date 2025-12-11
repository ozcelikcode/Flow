import { useState, useEffect } from 'react';
import type { Transaction, RecurrenceType, PriceTier } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useCategories } from '../../context/CategoryContext';
import Modal from '../ui/Modal';
import { Plus, X } from 'lucide-react';
import { parseLocalizedDate } from '../../utils/dateUtils';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<Transaction, 'id'>) => void;
    onDelete?: () => void;
    editTransaction?: Transaction | null;
}

export default function TransactionModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    editTransaction
}: TransactionModalProps) {
    const { currency, t, language, rates } = useSettings();
    const { addCategory, getExpenseCategories, getIncomeCategories, getCategoryDisplayName } = useCategories();

    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Food & Drink');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [inputCurrency, setInputCurrency] = useState<'USD' | 'EUR' | 'TRY'>(currency);

    // Subscription fields
    const [recurrence, setRecurrence] = useState<RecurrenceType>('once');
    const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [endDate, setEndDate] = useState('');

    // Quick add category
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickCategoryName, setQuickCategoryName] = useState('');

    // Currency symbols
    const currencySymbols = {
        USD: '$',
        EUR: '€',
        TRY: '₺'
    };

    // Convert from input currency to USD (divide by rate since rates are USD -> X)
    const convertToUsd = (value: number, fromCurrency: 'USD' | 'EUR' | 'TRY'): number => {
        return value / rates[fromCurrency];
    };

    // Convert from USD to display currency
    const convertFromUsd = (value: number, toCurrency: 'USD' | 'EUR' | 'TRY'): number => {
        return value * rates[toCurrency];
    };

    // Get available categories based on transaction type
    const getAvailableCategories = () => {
        if (type === 'expense') {
            return getExpenseCategories();
        } else {
            return getIncomeCategories();
        }
    };

    const handleQuickAddCategory = () => {
        if (quickCategoryName.trim()) {
            const trimmedName = quickCategoryName.trim();
            const newCat = addCategory({
                name: trimmedName,
                nameEn: trimmedName,
                nameTr: trimmedName,
                icon: 'Tag',
                descriptionEn: '',
                descriptionTr: '',
                type: type === 'expense' ? 'expense' : 'income'
            });
            setCategory(newCat.name);
            setQuickCategoryName('');
            setShowQuickAdd(false);
        }
    };

    // Format number with thousand separators (Turkish format)
    const formatWithThousands = (num: number): string => {
        const fixed = num.toFixed(2);
        const parts = fixed.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return parts.join(',');
    };

    // Pre-fill form when editing
    useEffect(() => {
        if (editTransaction) {
            setName(editTransaction.name);
            // Convert from USD to display currency
            const displayAmount = convertFromUsd(editTransaction.amount, currency);
            setAmount(formatWithThousands(displayAmount));
            setCategory(editTransaction.category);
            setType(editTransaction.type);

            // Fix Date Parsing
            const parsedDate = parseLocalizedDate(editTransaction.date);
            if (parsedDate && !isNaN(parsedDate.getTime())) {
                const year = parsedDate.getFullYear();
                const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                const day = String(parsedDate.getDate()).padStart(2, '0');
                setDate(`${year}-${month}-${day}`);
            }

            setInputCurrency(currency);
            setRecurrence(editTransaction.recurrence || 'once');
            setPriceTiers(editTransaction.priceTiers || []);
            setIsActive(editTransaction.isActive !== false);
            setEndDate(editTransaction.endDate || '');
        } else {
            setName('');
            setAmount('');
            setCategory('Food & Drink');
            setDate(new Date().toISOString().split('T')[0]);
            setType('expense');
            setInputCurrency(currency);
            setRecurrence('once');
            setPriceTiers([]);
            setIsActive(true);
            setEndDate('');
        }
    }, [editTransaction, currency, isOpen]);

    const addPriceTier = () => {
        const nextPeriod = priceTiers.length + 2; // +2 because tier 1 is the main amount
        setPriceTiers([...priceTiers, { periodNumber: nextPeriod, amount: 0 }]);
    };

    const removePriceTier = (index: number) => {
        setPriceTiers(priceTiers.filter((_, i) => i !== index));
    };

    const updatePriceTier = (index: number, amount: number) => {
        const updated = [...priceTiers];
        updated[index].amount = convertToUsd(amount, inputCurrency); // Store in USD
        setPriceTiers(updated);
    };

    const calculateNextBillingDate = (startDate: string, recurrence: RecurrenceType): string => {
        const start = new Date(startDate);
        switch (recurrence) {
            case 'daily':
                start.setDate(start.getDate() + 1);
                break;
            case 'monthly':
                start.setMonth(start.getMonth() + 1);
                break;
            case 'yearly':
                start.setFullYear(start.getFullYear() + 1);
                break;
            default:
                return '';
        }
        return start.toISOString().split('T')[0];
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount) return;

        const amountInUsd = convertToUsd(parseFloat(amount.replace(/\./g, '').replace(',', '.')), inputCurrency);

        const dateFormat = language === 'tr' ? 'tr-TR' : 'en-US';
        const formattedDate = new Date(date).toLocaleDateString(dateFormat, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const transaction: Omit<Transaction, 'id'> = {
            name,
            amount: amountInUsd,
            category,
            date: formattedDate,
            type,
            recurrence,
        };

        // Add subscription fields if not one-time
        if (recurrence !== 'once') {
            transaction.priceTiers = priceTiers.length > 0 ? priceTiers : undefined;
            transaction.currentPeriod = editTransaction?.currentPeriod || 1;

            // Always recalculate next billing date based on current date and recurrence
            // This ensures correct calculation when recurrence type or date changes
            const calculatedNextBilling = calculateNextBillingDate(date, recurrence);
            console.log('DEBUG nextBillingDate:', {
                inputDate: date,
                recurrence: recurrence,
                calculatedNextBilling: calculatedNextBilling,
                parsedInputDate: new Date(date).toISOString()
            });
            transaction.nextBillingDate = calculatedNextBilling;

            transaction.isActive = isActive;
            transaction.endDate = endDate || undefined;
        }

        onSave(transaction);
        onClose();
    };

    const isEditing = !!editTransaction;
    const modalTitle = isEditing ? t('editTransaction') : t('addTransaction');
    const isSubscription = recurrence !== 'once';

    // Get period label
    const getPeriodLabel = (period: number): string => {
        if (period === 1) return t('firstPeriod');
        if (period === 2) return t('secondPeriod');
        if (period === 3) return t('thirdPeriod');
        return `${period}. ${t('nthPeriod')}`;
    };

    // Get recurrence label for display
    const getRecurrenceLabel = (rec: RecurrenceType): string => {
        switch (rec) {
            case 'daily': return t('daily');
            case 'monthly': return t('monthly');
            case 'yearly': return t('yearly');
            default: return t('oneTime');
        }
    };

    // CSS to hide spinners
    const noSpinnerStyle = `
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
        }
        input[type=number] {
            -moz-appearance: textfield;
        }
    `;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            <style>{noSpinnerStyle}</style>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:gap-3 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto px-0 py-1">
                {/* Type Selection */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        {t('type')}
                    </label>
                    <div className="flex gap-1.5 sm:gap-2">
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${type === 'expense'
                                ? 'bg-danger/10 text-danger border border-danger/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-text-secondary-light dark:text-text-secondary-dark border border-transparent'
                                }`}
                        >
                            {t('expenseType')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${type === 'income'
                                ? 'bg-success/10 text-success border border-success/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-text-secondary-light dark:text-text-secondary-dark border border-transparent'
                                }`}
                        >
                            {t('incomeType')}
                        </button>
                    </div>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        {t('name')}
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-text-light dark:text-text-dark placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder={t('namePlaceholder')}
                        required
                    />
                </div>

                {/* Payment Type (Recurrence) */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        {t('paymentType')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                        {(['once', 'daily', 'monthly', 'yearly'] as RecurrenceType[]).map((rec) => (
                            <button
                                key={rec}
                                type="button"
                                onClick={() => setRecurrence(rec)}
                                className={`py-1.5 sm:py-2 px-1 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${recurrence === rec
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-text-secondary-light dark:text-text-secondary-dark border border-transparent'
                                    }`}
                            >
                                {getRecurrenceLabel(rec)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        {t('amount')} {isSubscription && `(${t('firstPeriod')})`}
                    </label>
                    <div className="flex gap-1.5 sm:gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                {currencySymbols[inputCurrency]}
                            </span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={amount}
                                onChange={(e) => {
                                    let value = e.target.value;
                                    value = value.replace(/[^\d.,]/g, '');
                                    const commaCount = (value.match(/,/g) || []).length;
                                    if (commaCount > 1) {
                                        const firstCommaIndex = value.indexOf(',');
                                        value = value.substring(0, firstCommaIndex + 1) + value.substring(firstCommaIndex + 1).replace(/,/g, '');
                                    }
                                    value = value.replace(/\./g, '');
                                    const parts = value.split(',');
                                    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                                    setAmount(parts.join(','));
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-full pl-7 sm:pl-8 pr-2 sm:pr-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-text-light dark:text-text-dark placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="0,00"
                                required
                            />
                        </div>
                        <select
                            value={inputCurrency}
                            onChange={(e) => setInputCurrency(e.target.value as 'USD' | 'EUR' | 'TRY')}
                            className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="TRY">TRY</option>
                        </select>
                    </div>
                </div>

                {/* Price Tiers for Subscriptions */}
                {isSubscription && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-text-light dark:text-text-dark">
                                {t('priceTiers')}
                            </label>
                            <button
                                type="button"
                                onClick={addPriceTier}
                                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                {t('addPriceTier')}
                            </button>
                        </div>

                        {priceTiers.length === 0 ? (
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                {language === 'tr'
                                    ? 'Fiyat değişikliği için dönem ekleyin (örn: 2. yıl farklı fiyat)'
                                    : 'Add periods for price changes (e.g., different price on 2nd year)'}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {priceTiers.map((tier, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark min-w-[80px]">
                                            {getPeriodLabel(tier.periodNumber)}
                                        </span>
                                        <div className="relative flex-1">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark text-xs">
                                                {currencySymbols[inputCurrency]}
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={Number(convertFromUsd(tier.amount, inputCurrency).toFixed(2)) || ''}
                                                onChange={(e) => updatePriceTier(index, parseFloat(e.target.value) || 0)}
                                                className="w-full pl-6 pr-2 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-light dark:text-text-dark focus:outline-none focus:ring-1 focus:ring-primary/50"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePriceTier(index)}
                                            className="text-danger hover:text-danger/80 p-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Subscription Active Toggle */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                {t('subscription')}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsActive(!isActive)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${isActive
                                    ? 'bg-success/10 text-success'
                                    : 'bg-slate-200 dark:bg-slate-700 text-text-secondary-light dark:text-text-secondary-dark'
                                    }`}
                            >
                                {isActive ? t('subscriptionActive') : t('subscriptionInactive')}
                            </button>
                        </div>
                    </div>
                )
                }

                {/* Category & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                            {t('category')}
                        </label>
                        {showQuickAdd ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={quickCategoryName}
                                    onChange={(e) => setQuickCategoryName(e.target.value)}
                                    placeholder={language === 'tr' ? 'Yeni kategori adı' : 'New category name'}
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleQuickAddCategory();
                                        } else if (e.key === 'Escape') {
                                            setShowQuickAdd(false);
                                            setQuickCategoryName('');
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleQuickAddCategory}
                                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowQuickAdd(false);
                                        setQuickCategoryName('');
                                    }}
                                    className="p-2 bg-slate-200 dark:bg-slate-700 text-text-secondary-light dark:text-text-secondary-dark rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    {getAvailableCategories().map(cat => (
                                        <option key={cat.id} value={cat.name}>{getCategoryDisplayName(cat, language)}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowQuickAdd(true)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 text-primary rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    title={t('addQuickCategory')}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                            {isSubscription ? t('startDate') : t('date')}
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {/* End Date (Only for Subscriptions) */}
                {
                    isSubscription && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                                {t('endDate')} <span className="text-xs font-normal text-slate-400">({t('optional')})</span>
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                                min={date}
                            />
                        </div>
                    )
                }

                {/* Actions */}
                <div className="flex gap-2 mt-2">
                    {isEditing && onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="flex-1 bg-danger/10 hover:bg-danger/20 text-danger font-bold py-2.5 rounded-lg transition-colors"
                        >
                            {t('delete')}
                        </button>
                    )}
                    <button
                        type="submit"
                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-lg transition-colors"
                    >
                        {isEditing ? t('save') : t('addTransaction')}
                    </button>
                </div>
            </form >
        </Modal >
    );
}
