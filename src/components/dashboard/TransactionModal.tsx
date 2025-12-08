import { useState, useEffect } from 'react';
import type { Transaction, RecurrenceType, PriceTier } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import Modal from '../ui/Modal';

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
    const { currency, t, language } = useSettings();

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

    // Currency symbols
    const currencySymbols = {
        USD: '$',
        EUR: '€',
        TRY: '₺'
    };

    // Conversion rates (to USD base)
    const toUsdRates: Record<string, number> = {
        USD: 1,
        EUR: 1.087,
        TRY: 0.029,
    };

    // Categories with translations
    const categories = [
        { value: 'Food & Drink', label: t('foodAndDrink') },
        { value: 'Transportation', label: t('transportation') },
        { value: 'Entertainment', label: t('entertainment') },
        { value: 'Shopping', label: t('shopping') },
        { value: 'Bills', label: t('bills') },
        { value: 'Subscription', label: t('subscriptionCategory') },
        { value: 'Salary', label: t('salary') },
        { value: 'Freelance', label: t('freelance') },
        { value: 'Investment', label: t('investment') },
        { value: 'Other', label: t('other') },
    ];

    // Pre-fill form when editing
    useEffect(() => {
        if (editTransaction) {
            setName(editTransaction.name);
            setAmount(Number(editTransaction.amount.toFixed(2)).toString());
            setCategory(editTransaction.category);
            setType(editTransaction.type);
            const parsedDate = new Date(editTransaction.date);
            if (!isNaN(parsedDate.getTime())) {
                setDate(parsedDate.toISOString().split('T')[0]);
            }
            setInputCurrency(currency);
            setRecurrence(editTransaction.recurrence || 'once');
            setPriceTiers(editTransaction.priceTiers || []);
            setIsActive(editTransaction.isActive !== false);
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
        updated[index].amount = amount * toUsdRates[inputCurrency]; // Store in USD
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

        const amountInUsd = parseFloat(amount) * toUsdRates[inputCurrency];

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
            transaction.nextBillingDate = calculateNextBillingDate(date, recurrence);
            transaction.isActive = isActive;
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        {t('type')}
                    </label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'expense'
                                ? 'bg-danger/10 text-danger border border-danger/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-text-secondary-light dark:text-text-secondary-dark border border-transparent'
                                }`}
                        >
                            {t('expenseType')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'income'
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
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        {t('name')}
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder={t('namePlaceholder')}
                        required
                    />
                </div>

                {/* Payment Type (Recurrence) */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        {t('paymentType')}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {(['once', 'daily', 'monthly', 'yearly'] as RecurrenceType[]).map((rec) => (
                            <button
                                key={rec}
                                type="button"
                                onClick={() => setRecurrence(rec)}
                                className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${recurrence === rec
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
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        {t('amount')} {isSubscription && `(${t('firstPeriod')})`}
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
                                {currencySymbols[inputCurrency]}
                            </span>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <select
                            value={inputCurrency}
                            onChange={(e) => setInputCurrency(e.target.value as 'USD' | 'EUR' | 'TRY')}
                            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                                <span className="material-symbols-outlined text-sm">add</span>
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
                                                value={tier.amount / toUsdRates[inputCurrency] || ''}
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
                                            <span className="material-symbols-outlined text-sm">close</span>
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
                )}

                {/* Category & Date */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                            {t('category')}
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
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
            </form>
        </Modal>
    );
}
