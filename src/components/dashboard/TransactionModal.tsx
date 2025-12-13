import { useState, useEffect, useRef } from 'react';
import type { Transaction, RecurrenceType, PriceTier } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useCategories } from '../../context/CategoryContext';
import Modal from '../ui/Modal';
import { Plus, X, ScanLine, Loader2 } from 'lucide-react';
import { parseLocalizedDate } from '../../utils/dateUtils';
import { processReceiptImage } from '../../services/ocrService';
import { processPDFFile } from '../../services/pdfService';
import type { ParsedReceiptData } from '../../services/receiptParser';

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
    const { addCategory, getExpenseCategories, getIncomeCategories, getCategoryDisplayName, getCategoryByName } = useCategories();

    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Food & Drink');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(() => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    });
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

    // Receipt scanner state
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState<{ status: string; progress: number } | null>(null);
    const [scanResult, setScanResult] = useState<ParsedReceiptData | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

            // Set time if available
            if (editTransaction.time) {
                setTime(editTransaction.time);
            } else {
                const now = new Date();
                setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
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
            const now = new Date();
            setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
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

    // Handle receipt file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setScanError(null);
        setScanResult(null);
        setScanProgress({ status: language === 'tr' ? 'Başlatılıyor...' : 'Starting...', progress: 0 });

        try {
            let result;

            if (file.type === 'application/pdf') {
                result = await processPDFFile(file, (progress) => {
                    setScanProgress({ status: progress.status, progress: progress.progress });
                });
            } else {
                result = await processReceiptImage(file, (progress) => {
                    setScanProgress({ status: progress.status, progress: progress.progress });
                });
            }

            console.log('Scan Result:', result); // Debug log

            if (result.success && result.data) {
                setScanResult(result.data);

                // Auto-fill form fields with extracted data
                if (result.data.companyName) {
                    console.log('Setting name:', result.data.companyName); // Debug log
                    setName(result.data.companyName);
                }

                if (result.data.amount !== null && result.data.amount > 0) {
                    // Convert to display currency format
                    const formattedAmount = formatWithThousands(result.data.amount);
                    console.log('Setting amount:', formattedAmount); // Debug log
                    setAmount(formattedAmount);
                    setInputCurrency('TRY'); // Turkish receipts are in TRY
                }

                if (result.data.date) {
                    console.log('Setting date:', result.data.date); // Debug log
                    setDate(result.data.date);
                }

                if (result.data.time) {
                    console.log('Setting time:', result.data.time); // Debug log
                    setTime(result.data.time);
                }

                // Set type to expense (most receipts are expenses)
                setType('expense');

                // Auto-select category based on scan result
                if (result.data.suggestedCategory) {
                    console.log('Suggested category:', result.data.suggestedCategory);

                    // Check if the suggested category exists
                    const existingCategory = getCategoryByName(result.data.suggestedCategory);

                    if (existingCategory) {
                        // Scenario 1: Category exists, select it
                        console.log('Category found, selecting:', existingCategory.name);
                        setCategory(existingCategory.name);
                    } else {
                        // Scenario 2: Category doesn't exist, create a new one automatically
                        console.log('Category not found, creating new:', result.data.suggestedCategory);
                        const newCat = addCategory({
                            name: result.data.suggestedCategory,
                            nameEn: result.data.suggestedCategory,
                            nameTr: result.data.suggestedCategory,
                            icon: 'Tag',
                            descriptionEn: 'Auto-created from receipt scan',
                            descriptionTr: 'Fiş taramasından otomatik oluşturuldu',
                            type: 'expense'
                        });
                        setCategory(newCat.name);
                    }
                } else {
                    // Scenario 3: Category couldn't be detected, select "Other"
                    console.log('Category not detected, selecting Other');
                    setCategory('Other');
                }
            } else {
                setScanError(result.error || (language === 'tr' ? 'Tarama başarısız' : 'Scan failed'));
            }
        } catch (error) {
            console.error('Scan error:', error);
            setScanError(language === 'tr' ? 'Beklenmeyen hata oluştu' : 'Unexpected error occurred');
        } finally {
            setIsScanning(false);
            setScanProgress(null);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
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
            time,
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
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-0 py-0.5">

                {/* Receipt Scanner Section */}
                {!editTransaction && (
                    <div className="mb-1">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".jpg,.jpeg,.png,.bmp,.pdf"
                            className="hidden"
                            id="receipt-upload"
                        />

                        <label
                            htmlFor="receipt-upload"
                            className={`flex items-center justify-center gap-2 w-full py-2 px-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                                ${isScanning
                                    ? 'border-primary bg-primary/5 cursor-wait'
                                    : 'border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-primary/5'
                                }`}
                        >
                            {isScanning ? (
                                <>
                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                    <span className="text-xs text-primary">
                                        {scanProgress?.status || (language === 'tr' ? 'İşleniyor...' : 'Processing...')}
                                        {scanProgress?.progress ? ` (${scanProgress.progress}%)` : ''}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <ScanLine className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
                                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                        {language === 'tr' ? 'Fiş/Fatura Tara (Resim veya PDF)' : 'Scan Receipt (Image or PDF)'}
                                    </span>
                                </>
                            )}
                        </label>

                        {/* Scan Error */}
                        {scanError && (
                            <div className="mt-2 p-2 bg-danger/10 border border-danger/20 rounded-lg">
                                <p className="text-xs text-danger">{scanError}</p>
                            </div>
                        )}

                        {/* Scan Result with Confidence */}
                        {scanResult && (
                            <div className="mt-2 p-2 bg-success/10 border border-success/20 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-success">
                                        {language === 'tr' ? 'Tarama Sonucu' : 'Scan Result'}
                                    </span>
                                    <span className="text-xs bg-success/20 text-success px-1.5 py-0.5 rounded">
                                        {language === 'tr' ? 'Güven' : 'Confidence'}: {scanResult.confidence.overall}%
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    {scanResult.companyName && (
                                        <span className={`px-1.5 py-0.5 rounded ${scanResult.confidence.companyName >= 70
                                            ? 'bg-success/20 text-success'
                                            : 'bg-warning/20 text-warning'
                                            }`}>
                                            {language === 'tr' ? 'İşletme' : 'Store'}: {scanResult.companyName} ({scanResult.confidence.companyName}%)
                                        </span>
                                    )}
                                    {scanResult.amount !== null && (
                                        <span className={`px-1.5 py-0.5 rounded ${scanResult.confidence.amount >= 70
                                            ? 'bg-success/20 text-success'
                                            : 'bg-warning/20 text-warning'
                                            }`}>
                                            {language === 'tr' ? 'Tutar' : 'Amount'}: ₺{scanResult.amount.toFixed(2)} ({scanResult.confidence.amount}%)
                                        </span>
                                    )}
                                    {scanResult.date && (
                                        <span className={`px-1.5 py-0.5 rounded ${scanResult.confidence.date >= 70
                                            ? 'bg-success/20 text-success'
                                            : 'bg-warning/20 text-warning'
                                            }`}>
                                            {language === 'tr' ? 'Tarih' : 'Date'}: {scanResult.date} ({scanResult.confidence.date}%)
                                        </span>
                                    )}
                                    {scanResult.time && (
                                        <span className={`px-1.5 py-0.5 rounded ${scanResult.confidence.time >= 70
                                            ? 'bg-success/20 text-success'
                                            : 'bg-warning/20 text-warning'
                                            }`}>
                                            {language === 'tr' ? 'Saat' : 'Time'}: {scanResult.time} ({scanResult.confidence.time}%)
                                        </span>
                                    )}
                                    {scanResult.suggestedCategory && (
                                        <span className={`px-1.5 py-0.5 rounded ${scanResult.confidence.category >= 70
                                            ? 'bg-success/20 text-success'
                                            : 'bg-warning/20 text-warning'
                                            }`}>
                                            {language === 'tr' ? 'Kategori' : 'Category'}: {scanResult.suggestedCategory} ({scanResult.confidence.category}%)
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Type Selection & Name - Combined Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-0.5">
                            {t('type')}
                        </label>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => setType('expense')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${type === 'expense'
                                    ? 'bg-danger/10 text-danger border border-danger/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-text-secondary-light dark:text-text-secondary-dark border border-transparent'
                                    }`}
                            >
                                {t('expenseType')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('income')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${type === 'income'
                                    ? 'bg-success/10 text-success border border-success/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-text-secondary-light dark:text-text-secondary-dark border border-transparent'
                                    }`}
                            >
                                {t('incomeType')}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-0.5">
                            {t('name')}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-text-light dark:text-text-dark placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder={t('namePlaceholder')}
                            required
                        />
                    </div>
                </div>

                {/* Payment Type (Recurrence) */}
                <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-0.5">
                        {t('paymentType')}
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                        {(['once', 'daily', 'monthly', 'yearly'] as RecurrenceType[]).map((rec) => (
                            <button
                                key={rec}
                                type="button"
                                onClick={() => setRecurrence(rec)}
                                className={`py-1 px-1 rounded-lg text-[10px] font-medium transition-colors ${recurrence === rec
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
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-0.5">
                        {t('amount')} {isSubscription && `(${t('firstPeriod')})`}
                    </label>
                    <div className="flex gap-1">
                        <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
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
                                className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-text-light dark:text-text-dark placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="0,00"
                                required
                            />
                        </div>
                        <select
                            value={inputCurrency}
                            onChange={(e) => setInputCurrency(e.target.value as 'USD' | 'EUR' | 'TRY')}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
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

                {/* Category, Date & Time */}
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-0.5">
                            {t('category')}
                        </label>
                        {showQuickAdd ? (
                            <div className="flex gap-1">
                                <input
                                    type="text"
                                    value={quickCategoryName}
                                    onChange={(e) => setQuickCategoryName(e.target.value)}
                                    placeholder={language === 'tr' ? 'Yeni kategori' : 'New category'}
                                    className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                                    className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowQuickAdd(false);
                                        setQuickCategoryName('');
                                    }}
                                    className="p-1.5 bg-slate-200 dark:bg-slate-700 text-text-secondary-light dark:text-text-secondary-dark rounded-lg"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-1">
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    {getAvailableCategories().map(cat => (
                                        <option key={cat.id} value={cat.name}>{getCategoryDisplayName(cat, language)}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowQuickAdd(true)}
                                    className="p-1.5 bg-slate-100 dark:bg-slate-800 text-primary rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    title={t('addQuickCategory')}
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-0.5">
                            {isSubscription ? t('startDate') : t('date')}
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-0.5">
                            {t('time')}
                        </label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {/* End Date (Only for Subscriptions) */}
                {
                    isSubscription && (
                        <div>
                            <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-0.5">
                                {t('endDate')} <span className="text-[10px] font-normal text-slate-400">({t('optional')})</span>
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                min={date}
                            />
                        </div>
                    )
                }

                {/* Actions */}
                <div className="flex gap-2 mt-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {isEditing && onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="flex-1 bg-danger/10 hover:bg-danger/20 text-danger font-semibold py-2 rounded-lg transition-colors text-sm"
                        >
                            {t('delete')}
                        </button>
                    )}
                    <button
                        type="submit"
                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
                    >
                        {isEditing ? t('save') : t('addTransaction')}
                    </button>
                </div>
            </form >
        </Modal >
    );
}
