import { useTransactions } from '../context/TransactionContext';
import { useSettings } from '../context/SettingsContext';
import { Link } from 'react-router-dom';
import StatsCard from '../components/dashboard/StatsCard';
import TransactionTable from '../components/dashboard/TransactionTable';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

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

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <>
            {/* PageHeading */}
            <div className="flex flex-wrap justify-between gap-3 p-4 mb-4">
                <div className="flex min-w-72 flex-col gap-3">
                    <p className="text-text-light dark:text-text-dark text-4xl font-black leading-tight tracking-[-0.033em]">
                        {t('welcomeBack')}
                    </p>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-base font-normal leading-normal">
                        {t('financialSummary')}
                    </p>
                </div>
            </div>

            {/* Main Stats */}
            <div className="flex flex-wrap gap-6 p-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                {/* Quick Stats */}
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">insights</span>
                        {t('quickStats')}
                    </h3>
                    <div className="space-y-4">
                        {/* Avg Monthly Expense */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-xl">trending_down</span>
                                </div>
                                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('avgMonthlyExpense')}</span>
                            </div>
                            <span className="font-bold text-text-light dark:text-text-dark">{formatAmount(avgExpense)}</span>
                        </div>

                        {/* Top Category */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-warning text-xl">category</span>
                                </div>
                                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('topCategory')}</span>
                            </div>
                            <span className="font-bold text-text-light dark:text-text-dark">
                                {topCategory ? translateCategory(topCategory[0]) : t('noData')}
                            </span>
                        </div>

                        {/* Transaction Count */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-success text-xl">receipt_long</span>
                                </div>
                                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('transactionCount')}</span>
                            </div>
                            <span className="font-bold text-text-light dark:text-text-dark">{transactions.length}</span>
                        </div>
                    </div>
                </div>

                {/* Category Distribution Mini Chart */}
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">pie_chart</span>
                            {t('categoryDistribution')}
                        </h3>
                        <Link
                            to="/reports"
                            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                        >
                            {t('viewReports')}
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </Link>
                    </div>

                    {categoryData.length > 0 ? (
                        <div className="flex items-center gap-4">
                            <div className="w-32 h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={50}
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
                            <div className="flex-1 space-y-2">
                                {categoryData.slice(0, 4).map((cat, index) => (
                                    <div key={cat.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="text-text-secondary-light dark:text-text-secondary-dark truncate max-w-[120px]">
                                                {cat.name}
                                            </span>
                                        </div>
                                        <span className="font-medium text-text-light dark:text-text-dark">
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
            <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-4">
                {t('recentTransactions')}
            </h2>
            <TransactionTable transactions={transactions.slice(0, 5)} />
        </>
    );
}
