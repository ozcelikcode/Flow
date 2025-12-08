import { useTransactions } from '../context/TransactionContext';
import { useSettings } from '../context/SettingsContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function Reports() {
    const { transactions } = useTransactions();
    const { theme, t, translateCategory, formatAmount, rates, currency } = useSettings();

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

    const COLORS = ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

    // Dark mode colors
    const axisColor = theme === 'dark' ? '#a1a1aa' : '#64748b';
    const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
    const tooltipBorder = theme === 'dark' ? '#334155' : '#e2e8f0';
    const tooltipText = theme === 'dark' ? '#f1f5f9' : '#1e293b';

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

    const netBalance = income - expense;
    const isProfit = netBalance >= 0;

    return (
        <div>
            <h2 className="text-text-light dark:text-text-dark text-xl sm:text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4 sm:pb-6">
                {t('financialReports')}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {/* Income vs Expense Chart */}
                <div className="bg-white dark:bg-surface-dark p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm" style={{ outline: 'none' }}>
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

                    <div className="h-48 sm:h-56" style={{ outline: 'none' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} style={{ outline: 'none' }}>
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
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: tooltipBg,
                                        borderColor: tooltipBorder,
                                        color: tooltipText,
                                        borderRadius: '8px',
                                        outline: 'none',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ color: tooltipText }}
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value: number) => [formatTooltipValue(value), '']}
                                />
                                <Bar
                                    dataKey="value"
                                    shape={<CustomBar />}
                                    style={{ outline: 'none' }}
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
                <div className="bg-white dark:bg-surface-dark p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm" style={{ outline: 'none' }}>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-text-light dark:text-text-dark">{t('expenseByCategory')}</h3>

                    {categoryData.length > 0 ? (
                        <>
                            <div className="h-48 sm:h-56" style={{ outline: 'none' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart style={{ outline: 'none' }}>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={65}
                                            paddingAngle={3}
                                            dataKey="value"
                                            stroke="none"
                                            style={{ outline: 'none' }}
                                        >
                                            {categoryData.map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    stroke="none"
                                                    style={{ outline: 'none' }}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: tooltipBg,
                                                borderColor: tooltipBorder,
                                                color: tooltipText,
                                                borderRadius: '8px',
                                                outline: 'none',
                                                fontSize: '12px'
                                            }}
                                            itemStyle={{ color: tooltipText }}
                                            formatter={(value: number) => [formatTooltipValue(value), '']}
                                        />
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
