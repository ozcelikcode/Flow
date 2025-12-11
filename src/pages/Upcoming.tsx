import { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useTransactions } from '../context/TransactionContext';
import { useCategories } from '../context/CategoryContext';
import { getUpcomingTransactions } from '../services/subscriptionService';
import { parseLocalizedDate } from '../utils/dateUtils';
import * as LucideIcons from 'lucide-react';
import { Wallet, TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react';

const getIconComponent = (iconName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Tag;
};

// Helper to get ISO date string from Date object
const toIsoDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to get end of week (Sunday)
const getEndOfWeek = (date: Date): Date => {
    const endOfWeek = new Date(date);
    const dayOfWeek = date.getDay(); // 0 = Sunday
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    endOfWeek.setDate(date.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
};

// Helper to get end of month
const getEndOfMonth = (date: Date): Date => {
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    return endOfMonth;
};

export default function Upcoming() {
    const { transactions } = useTransactions();
    const { currency, rates, language, t } = useSettings();
    const { getCategoryByName } = useCategories();

    const upcomingData = useMemo(() => {
        return getUpcomingTransactions(transactions);
    }, [transactions]);

    // Group transactions by time period
    const groupedTransactions = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endOfWeek = getEndOfWeek(today);
        const endOfMonth = getEndOfMonth(today);

        const thisWeek: typeof upcomingData = [];
        const thisMonth: typeof upcomingData = [];
        const futureMonths: Map<string, typeof upcomingData> = new Map();

        upcomingData.forEach(tx => {
            // Parse the transaction date
            let txDate: Date | null = null;

            // Check if it's ISO format (YYYY-MM-DD)
            if (tx.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                txDate = new Date(tx.date + 'T00:00:00');
            } else {
                txDate = parseLocalizedDate(tx.date);
            }

            if (!txDate) return;
            txDate.setHours(0, 0, 0, 0);

            const txDateIso = toIsoDateString(txDate);
            const endOfWeekIso = toIsoDateString(endOfWeek);
            const endOfMonthIso = toIsoDateString(endOfMonth);

            if (txDateIso <= endOfWeekIso) {
                thisWeek.push(tx);
            } else if (txDateIso <= endOfMonthIso) {
                thisMonth.push(tx);
            } else {
                // Group by future month
                const txMonth = txDate.getMonth();
                const txYear = txDate.getFullYear();
                const monthKey = `${txYear}-${String(txMonth).padStart(2, '0')}`;

                if (!futureMonths.has(monthKey)) {
                    futureMonths.set(monthKey, []);
                }
                futureMonths.get(monthKey)!.push(tx);
            }
        });

        // Convert future months map to sorted array
        const futureMonthsArray = Array.from(futureMonths.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, txs]) => {
                const [year, month] = key.split('-').map(Number);
                return { year, month, transactions: txs };
            });

        return { thisWeek, thisMonth, futureMonths: futureMonthsArray };
    }, [upcomingData]);

    const { totalIncome, totalExpense } = useMemo(() => {
        let inc = 0;
        let exp = 0;

        upcomingData.forEach(tx => {
            const amountInDisplay = tx.amount * rates[currency];
            if (tx.type === 'income') {
                inc += amountInDisplay;
            } else {
                exp += amountInDisplay;
            }
        });

        return { totalIncome: inc, totalExpense: exp };
    }, [upcomingData, currency, rates]);

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        let date: Date | null = null;

        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            date = new Date(dateStr + 'T00:00:00');
        } else {
            date = parseLocalizedDate(dateStr);
        }

        if (!date) return dateStr;

        return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });
    };

    // Render a transaction group
    const renderTransactionGroup = (
        title: string,
        icon: React.ReactNode,
        txList: typeof upcomingData
    ) => {
        if (txList.length === 0) return null;

        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-4">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    {icon}
                    <h2 className="font-semibold text-text-light dark:text-text-dark">
                        {title}
                    </h2>
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {txList.length} {language === 'tr' ? 'işlem' : 'item(s)'}
                    </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {txList.map((tx, index) => {
                        const category = getCategoryByName(tx.category);
                        const Icon = getIconComponent(category?.icon || 'Tag');
                        const displayAmount = tx.amount * rates[currency];

                        return (
                            <div key={`${tx.id || index}-${tx.date}`} className="p-3 sm:p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${tx.type === 'income'
                                        ? 'bg-success/10 text-success'
                                        : 'bg-danger/10 text-danger'
                                        }`}>
                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm sm:text-base text-text-light dark:text-text-dark">
                                            {tx.name}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                                {formatDate(tx.date)}
                                            </p>
                                            {tx.recurrence && tx.recurrence !== 'once' && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${tx.recurrence === 'yearly'
                                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                                        : tx.recurrence === 'monthly'
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                                    }`}>
                                                    {tx.recurrence === 'yearly'
                                                        ? (language === 'tr' ? 'Yıllık' : 'Yearly')
                                                        : tx.recurrence === 'monthly'
                                                            ? (language === 'tr' ? 'Aylık' : 'Monthly')
                                                            : (language === 'tr' ? 'Günlük' : 'Daily')
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={`text-right font-semibold text-sm sm:text-base ${tx.type === 'income' ? 'text-success' : 'text-danger'
                                    }`}>
                                    {tx.type === 'income' ? '+' : '-'}{formatAmount(displayAmount)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const hasAnyTransactions = upcomingData.length > 0;

    return (
        <div className="space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark">
                {t('upcomingTransactions')}
            </h1>

            {/* Summary Boxes */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Income Box */}
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="p-2 sm:p-3 rounded-xl bg-success/10 text-success">
                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-0.5">
                                {language === 'tr' ? 'Beklenen Gelir' : 'Expected Income'}
                            </p>
                            <h3 className="text-lg sm:text-2xl font-bold text-text-light dark:text-text-dark">
                                {formatAmount(totalIncome)}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Expense Box */}
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="p-2 sm:p-3 rounded-xl bg-danger/10 text-danger">
                            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-0.5">
                                {language === 'tr' ? 'Beklenen Gider' : 'Expected Expense'}
                            </p>
                            <h3 className="text-lg sm:text-2xl font-bold text-text-light dark:text-text-dark">
                                {formatAmount(totalExpense)}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grouped Transaction Lists */}
            {!hasAnyTransactions ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{language === 'tr' ? 'Yaklaşan işlem bulunmuyor' : 'No upcoming transactions'}</p>
                </div>
            ) : (
                <>
                    {renderTransactionGroup(
                        language === 'tr' ? 'Bu Hafta' : 'This Week',
                        <Clock className="w-5 h-5 text-warning" />,
                        groupedTransactions.thisWeek
                    )}

                    {renderTransactionGroup(
                        language === 'tr' ? 'Bu Ay' : 'This Month',
                        <Calendar className="w-5 h-5 text-primary" />,
                        groupedTransactions.thisMonth
                    )}

                    {groupedTransactions.futureMonths.map(({ year, month, transactions: txs }) => {
                        const monthDate = new Date(year, month, 1);
                        const monthName = monthDate.toLocaleDateString(
                            language === 'tr' ? 'tr-TR' : 'en-US',
                            { month: 'long', year: 'numeric' }
                        );
                        // Capitalize first letter
                        const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

                        return renderTransactionGroup(
                            formattedMonthName,
                            <Calendar className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />,
                            txs
                        );
                    })}
                </>
            )}
        </div>
    );
}

