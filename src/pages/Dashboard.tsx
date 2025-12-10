import { useTransactions } from '../context/TransactionContext';
import { useSettings } from '../context/SettingsContext';
import StatsCard from '../components/dashboard/StatsCard';
import TransactionTable from '../components/dashboard/TransactionTable';
import {
    TrendingDown,
    FolderOpen,
    RefreshCw,
    CreditCard,
    FileText,
    BarChart3,
    Calendar
} from 'lucide-react';
import { parseDate } from '../utils/dateUtils';

export default function Dashboard() {
    const { transactions } = useTransactions();
    const { formatAmount, t, translateCategory } = useSettings();

    // Calculate dynamic stats
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const currentBalance = totalIncome - totalExpense;

    // Quick stats calculations
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    // Calculate average monthly expense (group by month, then average)
    const expenseByMonth = expenseTransactions.reduce((acc, t) => {
        // Extract month-year from date string
        const date = parseDate(t.date);
        let monthKey = t.date.substring(0, 7); // Default fallback

        if (date) {
            monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        }

        acc[monthKey] = (acc[monthKey] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

    const monthlyTotals = Object.values(expenseByMonth);
    const avgExpense = monthlyTotals.length > 0
        ? monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length
        : 0;

    // Top spending category
    const categoryTotals = expenseTransactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    // Subscription stats - only expense subscriptions
    const activeSubscriptions = transactions.filter(t =>
        t.type === 'expense' &&
        t.recurrence &&
        t.recurrence !== 'once' &&
        t.isActive !== false
    );
    const subscriptionCount = activeSubscriptions.length;

    // Calculate total monthly subscription cost (only daily and monthly - exclude yearly)
    const monthlySubscriptionCost = activeSubscriptions
        .filter(sub => sub.recurrence === 'daily' || sub.recurrence === 'monthly')
        .reduce((total, sub) => {
            let monthlyCost = sub.amount;
            if (sub.recurrence === 'daily') {
                monthlyCost = sub.amount * 30;
            }
            return total + monthlyCost;
        }, 0);

    // This month's expense (from 1st of current month to end of month)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month

    const thisMonthExpense = expenseTransactions.reduce((total, t) => {
        const date = parseDate(t.date);
        if (date && date >= currentMonthStart && date <= currentMonthEnd) {
            return total + t.amount;
        }
        return total;
    }, 0);

    // Total savings (investment category only)
    const totalSavings = transactions
        .filter(t => t.category.toLowerCase() === 'investment' || t.category.toLowerCase() === 'yatırım')
        .reduce((total, t) => {
            // Income in investment = savings, expense in investment = withdrawal
            return total + (t.type === 'income' ? t.amount : -t.amount);
        }, 0);

    return (
        <>
            {/* PageHeading */}
            <div className="flex flex-wrap justify-between gap-3 mb-4">
                <div className="flex min-w-0 flex-col gap-2">
                    <p className="text-text-light dark:text-text-dark text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
                        {t('welcomeBack')}
                    </p>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm sm:text-base font-normal leading-normal">
                        {t('financialSummary')}
                    </p>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    title={t('totalBalance')}
                    amount={formatAmount(currentBalance)}
                    change={t('basedOnTransactions')}
                    trend={currentBalance >= 0 ? 'up' : 'down'}
                    trendColor={currentBalance >= 0 ? undefined : 'danger'}
                />
                <StatsCard
                    title={t('income')}
                    amount={formatAmount(totalIncome)}
                    change={t('basedOnTransactions')}
                    trend="up"
                />
                <StatsCard
                    title={t('expense')}
                    amount={formatAmount(totalExpense)}
                    change={t('basedOnTransactions')}
                    trend="down"
                    trendColor="danger"
                />
                <StatsCard
                    title={t('totalSavings')}
                    amount={formatAmount(totalSavings)}
                    change={t('basedOnTransactions')}
                    trend={totalSavings >= 0 ? 'up' : 'down'}
                    trendColor={totalSavings >= 0 ? 'success' : 'danger'}
                />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-6 mb-6">
                {/* Quick Stats */}
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        {t('quickStats')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {/* Avg Expense */}
                        <div className="flex flex-col p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                </div>
                                <span className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">{t('avgMonthlyExpense')}</span>
                            </div>
                            <span className="font-bold text-sm sm:text-base text-text-light dark:text-text-dark">{formatAmount(avgExpense)}</span>
                        </div>

                        {/* Top Category */}
                        <div className="flex flex-col p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-warning/10 flex items-center justify-center">
                                    <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning" />
                                </div>
                                <span className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">{t('topCategory')}</span>
                            </div>
                            <span className="font-bold text-sm sm:text-base text-text-light dark:text-text-dark truncate">
                                {topCategory ? translateCategory(topCategory[0]) : t('noData')}
                            </span>
                        </div>

                        {/* Active Subscriptions */}
                        <div className="flex flex-col p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                                </div>
                                <span className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">{t('activeSubscriptions')}</span>
                            </div>
                            <span className="font-bold text-sm sm:text-base text-text-light dark:text-text-dark">{subscriptionCount}</span>
                        </div>

                        {/* Monthly Subscription Cost */}
                        <div className="flex flex-col p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-danger/10 flex items-center justify-center">
                                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-danger" />
                                </div>
                                <span className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">{t('totalSubscriptionCost')}</span>
                            </div>
                            <span className="font-bold text-sm sm:text-base text-danger">{formatAmount(monthlySubscriptionCost)}</span>
                        </div>

                        {/* This Month Expense */}
                        <div className="flex flex-col p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                                </div>
                                <span className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">{t('thisMonthExpense')}</span>
                            </div>
                            <span className="font-bold text-sm sm:text-base text-orange-500">{formatAmount(thisMonthExpense)}</span>
                        </div>

                        {/* Transaction Count */}
                        <div className="flex flex-col p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-success/10 flex items-center justify-center">
                                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
                                </div>
                                <span className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">{t('transactionCount')}</span>
                            </div>
                            <span className="font-bold text-sm sm:text-base text-text-light dark:text-text-dark">{transactions.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <h2 className="text-text-light dark:text-text-dark text-lg sm:text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3">
                {t('recentTransactions')}
            </h2>
            <TransactionTable transactions={transactions.slice(0, 10)} />
        </>
    );
}
