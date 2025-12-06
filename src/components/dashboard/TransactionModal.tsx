import { useState, useEffect } from 'react';
import type { Transaction } from '../../types';
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
        { value: 'Salary', label: t('salary') },
        { value: 'Freelance', label: t('freelance') },
        { value: 'Investment', label: t('investment') },
        { value: 'Other', label: t('other') },
    ];

    // Pre-fill form when editing
    useEffect(() => {
        if (editTransaction) {
            setName(editTransaction.name);
            setAmount(editTransaction.amount.toString());
            setCategory(editTransaction.category);
            setType(editTransaction.type);
            // Convert date back to input format
            const parsedDate = new Date(editTransaction.date);
            if (!isNaN(parsedDate.getTime())) {
                setDate(parsedDate.toISOString().split('T')[0]);
            }
            setInputCurrency('USD'); // Amount is stored in USD
        } else {
            // Reset form for new transaction
            setName('');
            setAmount('');
            setCategory('Food & Drink');
            setDate(new Date().toISOString().split('T')[0]);
            setType('expense');
            setInputCurrency(currency);
        }
    }, [editTransaction, currency, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount) return;

        // Convert amount to USD (base currency) for storage
        const amountInUsd = parseFloat(amount) * toUsdRates[inputCurrency];

        const dateFormat = language === 'tr' ? 'tr-TR' : 'en-US';
        const formattedDate = new Date(date).toLocaleDateString(dateFormat, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        onSave({
            name,
            amount: amountInUsd,
            category,
            date: formattedDate,
            type,
        });

        onClose();
    };

    const isEditing = !!editTransaction;
    const modalTitle = isEditing ? t('editTransaction') : t('addTransaction');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                <div>
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        {t('amount')} ({type === 'income' ? t('receivedIn') : t('paidIn')})
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
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        {t('amountNote')}
                    </p>
                </div>

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
                            {t('date')}
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

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
