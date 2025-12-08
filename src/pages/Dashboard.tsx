import { useTransactions } from '../context/TransactionContext';
import { useSettings } from '../context/SettingsContext';
import { Link } from 'react-router-dom';
import StatsCard from '../components/dashboard/StatsCard';
import TransactionTable from '../components/dashboard/TransactionTable';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
    TrendingDown,
    FolderOpen,
    RefreshCw,
    CreditCard,
    FileText,
    ChartPie,
    ArrowRight,
    BarChart3
} from 'lucide-react';

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
    const avgExpense = expenseTransactions.length > 0
        ? expenseTransactions.reduce((acc, t) => acc + t.amount, 0) / expenseTransactions.length
        : 0;

    // Top spending category
    const categoryTotals = expenseTransactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    // Category distribution for mini pie chart
    const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
        name: translateCategory(name),
        value
    }));

    // Subscription stats
    const activeSubscriptions = transactions.filter(t =>
        t.recurrence && t.recurrence !== 'once' && t.isActive !== false
    );
    const subscriptionCount = activeSubscriptions.length;

    // Calculate total monthly subscription cost
    const monthlySubscriptionCost = activeSubscriptions.reduce((total, sub) => {
        let monthlyCost = sub.amount;
        if (sub.recurrence === 'yearly') {
            monthlyCost = sub.amount / 12;
        } else if (sub.recurrence === 'daily') {
            monthlyCost = sub.amount * 30;
        }
        return total + monthlyCost;
    }, 0);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
            </div>

            {/* Quick Stats & Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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

                        {/* Transaction Count - Full Width */}
                        <div className="col-span-2 flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-success/10 flex items-center justify-center">
                                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
                                </div>
                                <span className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('transactionCount')}</span>
                            </div>
                            <span className="font-bold text-sm sm:text-base text-text-light dark:text-text-dark">{transactions.length}</span>
                        </div>
                    </div>
                </div>

                {/* Category Distribution Mini Chart */}
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-text-light dark:text-text-dark flex items-center gap-2">
                            <ChartPie className="w-5 h-5 text-primary" />
                            <span className="hidden sm:inline">{t('categoryDistribution')}</span>
                            <span className="sm:hidden">Categories</span>
                        </h3>
                        <Link
                            to="/reports"
                            className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                        >
                            <span className="hidden sm:inline">{t('viewReports')}</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {categoryData.length > 0 ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-28 h-28 sm:w-32 sm:h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={25}
                                            outerRadius={45}
                                            paddingAngle={3}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {categoryData.map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    stroke="none"
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 w-full space-y-2">
                                {categoryData.slice(0, 4).map((cat, index) => (
                                    <div key={cat.name} className="flex items-center justify-between text-xs sm:text-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div
                                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="text-text-secondary-light dark:text-text-secondary-dark truncate">
                                                {cat.name}
                                            </span>
                                        </div>
                                        <span className="font-medium text-text-light dark:text-text-dark ml-2 shrink-0">
                                            {formatAmount(cat.value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                            {t('noData')}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            <h2 className="text-text-light dark:text-text-dark text-lg sm:text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3">
                {t('recentTransactions')}
            </h2>
            <TransactionTable transactions={transactions.slice(0, 5)} />
        </>
    );
}
