import { useTransactions } from '../context/TransactionContext';
import { useSettings } from '../context/SettingsContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Reports() {
    const { transactions } = useTransactions();
    const { theme, t } = useSettings();

    // Aggregate Data
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const data = [
        { name: t('incomeType'), value: income },
        { name: t('expenseType'), value: expense },
    ];

    const categoryData = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const existing = acc.find(c => c.name === t.category);
            if (existing) {
                existing.value += t.amount;
            } else {
                acc.push({ name: t.category, value: t.amount });
            }
            return acc;
        }, [] as { name: string; value: number }[]);

    const COLORS = ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

    // Dark mode colors
    const axisColor = theme === 'dark' ? '#a1a1aa' : '#64748b';
    const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
    const tooltipBorder = theme === 'dark' ? '#334155' : '#e2e8f0';
    const tooltipText = theme === 'dark' ? '#f1f5f9' : '#1e293b';

    return (
        <div className="p-4">
            <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6">
                {t('financialReports')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm focus:outline-none" style={{ outline: 'none' }}>
                    <h3 className="text-lg font-semibold mb-4 text-text-light dark:text-text-dark">{t('incomeVsExpense')}</h3>
                    <div className="h-64" style={{ outline: 'none' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} style={{ outline: 'none' }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke={axisColor} />
                                <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor }} />
                                <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: tooltipBg,
                                        borderColor: tooltipBorder,
                                        color: tooltipText,
                                        borderRadius: '8px',
                                        outline: 'none'
                                    }}
                                    itemStyle={{ color: tooltipText }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="#6366f1"
                                    radius={[4, 4, 0, 0]}
                                    style={{ outline: 'none' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm focus:outline-none" style={{ outline: 'none' }}>
                    <h3 className="text-lg font-semibold mb-4 text-text-light dark:text-text-dark">{t('expenseByCategory')}</h3>
                    <div className="h-64" style={{ outline: 'none' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart style={{ outline: 'none' }}>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
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
                                        outline: 'none'
                                    }}
                                    itemStyle={{ color: tooltipText }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
