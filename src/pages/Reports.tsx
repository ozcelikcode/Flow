import { useTransactions } from '../context/TransactionContext';
import { useSettings } from '../context/SettingsContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Grid3X3 } from 'lucide-react';
import YearlyActivityMap from '../components/reports/YearlyActivityMap';
import { parseLocalizedDate as parseDate, toLocalDateKey } from '../utils/dateUtils';

export default function Reports() {
    const { transactions } = useTransactions();
    const { theme, t, translateCategory, formatAmount, rates, currency, language } = useSettings();

    // Get conversion rate for selected currency
    const rate = rates[currency];

    // Aggregate Data - convert to selected currency
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) * rate;
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) * rate;

    const data = [
        { name: t('incomeType'), value: income, color: '#10b981' },
        { name: t('expenseType'), value: expense, color: '#ef4444' },
    ];

    const categoryData = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const translatedCategory = translateCategory(t.category);
            const existing = acc.find(c => c.name === translatedCategory);
            const convertedAmount = t.amount * rate;
            if (existing) {
                existing.value += convertedAmount;
            } else {
                acc.push({ name: translatedCategory, value: convertedAmount });
            }
            return acc;
        }, [] as { name: string; value: number }[]);



    // Generate current month's daily spending data (1st to today)
    const generateDailySpendingData = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();

        const monthDays: { date: string; amount: number; displayDate: string }[] = [];

        // From 1st of current month to today (inclusive)
        for (let day = 1; day <= currentDay; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = toLocalDateKey(date);
            const displayDate = day.toString();

            monthDays.push({
                date: dateStr,
                displayDate,
                amount: 0
            });
        }

        // Aggregate expenses by date
        transactions
            .filter(tx => tx.type === 'expense')
            .forEach(tx => {
                const txDate = parseDate(tx.date);
                if (txDate) {
                    const txDateStr = toLocalDateKey(txDate);
                    const dayData = monthDays.find(d => d.date === txDateStr);
                    if (dayData) {
                        dayData.amount += tx.amount * rate;
                    }
                }
            });

        return monthDays;
    };

    const dailySpendingData = generateDailySpendingData();
    const maxDailySpending = Math.max(...dailySpendingData.map(d => d.amount), 0);
    const daysWithData = dailySpendingData.filter(d => d.amount > 0).length || 1;
    const avgDailySpending = dailySpendingData.reduce((sum, d) => sum + d.amount, 0) / daysWithData;

    // Get current month name
    const currentMonthName = new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' });

    const COLORS = ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

    // Dark mode colors
    const axisColor = theme === 'dark' ? '#a1a1aa' : '#64748b';
    const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
    const tooltipBorder = theme === 'dark' ? '#334155' : '#e2e8f0';
    const tooltipText = theme === 'dark' ? '#f1f5f9' : '#1e293b';
    const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';

    // Currency symbol for Y-axis
    const currencySymbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        TRY: '₺'
    };
    const currencySymbol = currencySymbols[currency];

    // Custom Y-axis tick formatter
    const formatYAxis = (value: number) => {
        if (value >= 1000) {
            return `${currencySymbol}${(value / 1000).toFixed(1)}k`;
        }
        return `${currencySymbol}${value.toFixed(0)}`;
    };

    // Custom tooltip formatter
    const formatTooltipValue = (value: number) => {
        return formatAmount(value / rate);
    };

    // Custom bar shape to show different colors
    const CustomBar = (props: any) => {
        const { x, y, width, height, payload } = props;
        const barColor = payload.color;
        return (
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={barColor}
                rx={4}
                ry={4}
            />
        );
    };

    // Custom tooltip component for better styling
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div
                    className="px-3 py-2 rounded-lg shadow-xl border pointer-events-none"
                    style={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        minWidth: '120px',
                        maxWidth: '200px',
                        zIndex: 100,
                    }}
                >
                    {label && <p className="text-xs font-medium mb-1" style={{ color: axisColor }}>{label}</p>}
                    <p className="text-sm font-bold" style={{ color: tooltipText }}>
                        {payload[0].name && <span className="font-normal text-xs mr-1">{payload[0].name}:</span>}
                        {formatTooltipValue(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    const netBalance = income - expense;
    const isProfit = netBalance >= 0;

    return (
        <div>
            <h2 className="text-text-light dark:text-text-dark text-xl sm:text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4 sm:pb-6">
                {t('financialReports')}
            </h2>

            {/* Yearly Activity Map - GitHub Style */}
            <div className="bg-white dark:bg-surface-dark p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-text-light dark:text-text-dark flex items-center gap-2">
                        <Grid3X3 className="w-5 h-5 text-primary" />
                        {t('yearlyActivityMap')}
                    </h3>
                </div>
                <YearlyActivityMap
                    transactions={transactions}
                    formatAmount={formatAmount}
                    t={t}
                    language={language}
                    rate={rate}
                />
            </div>

            {/* Daily Spending Trend - Full Width */}
            <div className="bg-white dark:bg-surface-dark p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-text-light dark:text-text-dark flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        {t('dailySpendingTrend')}
                    </h3>
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full capitalize">
                        {currentMonthName}
                    </span>
                </div>

                {/* Stats Summary */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {language === 'tr' ? 'Ort. Günlük' : 'Avg. Daily'}:
                        </span>
                        <span className="text-xs font-bold text-text-light dark:text-text-dark">
                            {formatAmount(avgDailySpending / rate)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-danger"></div>
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {language === 'tr' ? 'Maks' : 'Max'}:
                        </span>
                        <span className="text-xs font-bold text-danger">
                            {formatAmount(maxDailySpending / rate)}
                        </span>
                    </div>
                </div>

                <div className="h-48 sm:h-64 min-w-0" style={{ minHeight: '192px' }}>
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                        <AreaChart data={dailySpendingData}>
                            <defs>
                                <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} vertical={false} />
                            <XAxis
                                dataKey="displayDate"
                                stroke={axisColor}
                                tick={{ fill: axisColor, fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                tickMargin={5}
                            />
                            <YAxis
                                stroke={axisColor}
                                tick={{ fill: axisColor, fontSize: 10 }}
                                tickFormatter={formatYAxis}
                                tickLine={false}
                                axisLine={false}
                                width={45}
                            />
                            <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="url(#colorSpending)"
                                dot={false}
                                activeDot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 overflow-hidden">
                {/* Income vs Expense Chart */}
                <div className="bg-white dark:bg-surface-dark p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-text-light dark:text-text-dark">{t('incomeVsExpense')}</h3>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 sm:gap-6 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-success"></div>
                            <span className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('incomeType')}</span>
                            <span className="text-xs sm:text-sm font-bold text-success">{formatAmount(income / rate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-danger"></div>
                            <span className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('expenseType')}</span>
                            <span className="text-xs sm:text-sm font-bold text-danger">{formatAmount(expense / rate)}</span>
                        </div>
                    </div>

                    <div className="h-48 sm:h-56 min-w-0" style={{ minHeight: '192px' }}>
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke={axisColor} />
                                <XAxis
                                    dataKey="name"
                                    stroke={axisColor}
                                    tick={{ fill: axisColor, fontSize: 12 }}
                                />
                                <YAxis
                                    stroke={axisColor}
                                    tick={{ fill: axisColor, fontSize: 12 }}
                                    tickFormatter={formatYAxis}
                                    width={50}
                                />
                                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} cursor={false} />
                                <Bar
                                    dataKey="value"
                                    shape={<CustomBar />}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Balance Summary */}
                    <div className={`mt-4 p-2.5 sm:p-3 rounded-lg ${isProfit ? 'bg-success/10' : 'bg-danger/10'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isProfit ? (
                                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-danger" />
                                )}
                                <span className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                    {isProfit ? (t('incomeType') + ' > ' + t('expenseType')) : (t('expenseType') + ' > ' + t('incomeType'))}
                                </span>
                            </div>
                            <span className={`font-bold text-sm sm:text-base ${isProfit ? 'text-success' : 'text-danger'}`}>
                                {isProfit ? '+' : '-'}{formatAmount(Math.abs(netBalance) / rate)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Expense by Category Chart */}
                <div className="bg-white dark:bg-surface-dark p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-text-light dark:text-text-dark">{t('expenseByCategory')}</h3>

                    {categoryData.length > 0 ? (
                        <>
                            <div className="h-48 sm:h-56 min-w-0" style={{ minHeight: '192px' }}>
                                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={55}
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
                                        <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Category Legend */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                                {categoryData.map((cat, index) => (
                                    <div key={cat.name} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                                        <div
                                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark truncate flex-1">
                                            {cat.name}
                                        </span>
                                        <span className="text-[10px] sm:text-xs font-bold text-text-light dark:text-text-dark shrink-0">
                                            {formatAmount(cat.value / rate)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-48 sm:h-56 flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark">
                            {t('noData')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
