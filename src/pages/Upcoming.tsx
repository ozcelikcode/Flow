import { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useTransactions } from '../context/TransactionContext';
import { useCategories } from '../context/CategoryContext';
import { getUpcomingTransactions } from '../services/subscriptionService';
import * as LucideIcons from 'lucide-react';
import { Wallet, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const getIconComponent = (iconName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Tag;
};

export default function Upcoming() {
    const { transactions } = useTransactions();
    const { currency, rates, language, t } = useSettings();
    const { getCategoryByName } = useCategories();

    const upcomingData = useMemo(() => {
        return getUpcomingTransactions(transactions);
    }, [transactions]);

    const { totalIncome, totalExpense } = useMemo(() => {
        let inc = 0;
        let exp = 0;

        upcomingData.forEach(tx => {
            // Convert amount to display currency
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
        return new Date(dateStr).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mb-6">
                {t('upcomingTransactions')}
            </h1>

            {/* Summary Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Income Box */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 rounded-xl bg-success/10 text-success">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                                {t('expectedIncome') || (language === 'tr' ? 'Beklenen Gelir' : 'Expected Income')}
                            </p>
                            <h3 className="text-2xl font-bold text-text-light dark:text-text-dark">
                                {formatAmount(totalIncome)}
                            </h3>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                                {t('forThisMonth') || (language === 'tr' ? 'Bu ay için' : 'For this month')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Expense Box */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-danger/5 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 rounded-xl bg-danger/10 text-danger">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                                {t('expectedExpense') || (language === 'tr' ? 'Beklenen Gider' : 'Expected Expense')}
                            </p>
                            <h3 className="text-2xl font-bold text-text-light dark:text-text-dark">
                                {formatAmount(totalExpense)}
                            </h3>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                                {t('forThisMonth') || (language === 'tr' ? 'Bu ay için' : 'For this month')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-text-light dark:text-text-dark">
                        {t('thisMonthsTransactions') || (language === 'tr' ? 'Bu Ayın İşlemleri' : 'This Month\'s Transactions')}
                    </h2>
                </div>

                {upcomingData.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>{t('noUpcomingTransactions') || (language === 'tr' ? 'Yaklaşan işlem bulunmuyor' : 'No upcoming transactions')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {upcomingData.map((tx, index) => {
                            const category = getCategoryByName(tx.category);
                            const Icon = getIconComponent(category?.icon || 'Tag');
                            const displayAmount = tx.amount * rates[currency];

                            return (
                                <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl ${tx.type === 'income'
                                                ? 'bg-success/10 text-success'
                                                : 'bg-danger/10 text-danger'
                                            }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-text-light dark:text-text-dark">
                                                {tx.name}
                                            </h4>
                                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                {formatDate(tx.date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`text-right font-semibold ${tx.type === 'income' ? 'text-success' : 'text-danger'
                                        }`}>
                                        {tx.type === 'income' ? '+' : '-'}{formatAmount(displayAmount)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
