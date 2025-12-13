import { useState, useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { useSettings } from '../context/SettingsContext';
import { useCategories } from '../context/CategoryContext';
import { TrendingUp, Calendar, DollarSign, Wallet } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

type TimePeriod = 'week' | 'month' | 'year';

export default function IncomePage() {
    const { transactions } = useTransactions();
    const { formatAmount, language, currency } = useSettings();
    const { getCategoryDisplayName, categories } = useCategories();
    const [period, setPeriod] = useState<TimePeriod>('month');

    const incomeTransactions = useMemo(() => transactions.filter(t => t.type === 'income'), [transactions]);

    const getDateRange = () => {
        const now = new Date();
        const start = new Date();
        switch (period) {
            case 'week': start.setDate(now.getDate() - 7); break;
            case 'month': start.setMonth(now.getMonth() - 1); break;
            case 'year': start.setFullYear(now.getFullYear() - 1); break;
        }
        return { start, end: now };
    };

    const parseDate = (dateStr: string): Date => {
        const months: Record<string, number> = {
            'Oca': 0, 'Şub': 1, 'Mar': 2, 'Nis': 3, 'May': 4, 'Haz': 5,
            'Tem': 6, 'Ağu': 7, 'Eyl': 8, 'Eki': 9, 'Kas': 10, 'Ara': 11,
            'Jan': 0, 'Feb': 1, 'March': 2, 'Apr': 3, 'June': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const parts = dateStr.replace(',', '').split(' ');
        if (parts.length >= 3) return new Date(parseInt(parts[2]), months[parts[1]] ?? 0, parseInt(parts[0]));
        return new Date(dateStr);
    };

    const filteredIncome = useMemo(() => {
        const { start, end } = getDateRange();
        return incomeTransactions.filter(t => {
            const date = parseDate(t.date);
            return date >= start && date <= end;
        });
    }, [incomeTransactions, period]);

    const totalIncome = useMemo(() => filteredIncome.reduce((sum, t) => sum + t.amount, 0), [filteredIncome]);
    const averageIncome = useMemo(() => filteredIncome.length === 0 ? 0 : totalIncome / filteredIncome.length, [totalIncome, filteredIncome]);

    const categoryData = useMemo(() => {
        const catMap: Record<string, number> = {};
        filteredIncome.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
        return Object.entries(catMap)
            .map(([name, value]) => {
                const cat = categories.find(c => c.name === name);
                return { name: cat ? getCategoryDisplayName(cat, language) : name, value };
            })
            .sort((a, b) => b.value - a.value).slice(0, 5);
    }, [filteredIncome, categories, getCategoryDisplayName, language]);

    const trendData = useMemo(() => {
        const grouped: Record<string, number> = {};
        filteredIncome.forEach(t => {
            const date = parseDate(t.date);
            const key = period === 'week'
                ? date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short' })
                : period === 'month'
                    ? date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric' })
                    : date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' });
            grouped[key] = (grouped[key] || 0) + t.amount;
        });
        return Object.entries(grouped).map(([name, amount]) => ({ name, amount }));
    }, [filteredIncome, period, language]);

    const COLORS = ['#10B981', '#34D399', '#059669', '#047857', '#064E3B'];
    const periodLabels = { week: language === 'tr' ? 'Hafta' : 'Week', month: language === 'tr' ? 'Ay' : 'Month', year: language === 'tr' ? 'Yıl' : 'Year' };
    const sym = currency === 'TRY' ? '₺' : currency === 'EUR' ? '€' : '$';

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
            {/* Header Section */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                        <Wallet className="w-6 h-6 text-success" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-text-light dark:text-text-dark">{language === 'tr' ? 'Gelir Analizi' : 'Income Analysis'}</h1>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{language === 'tr' ? 'Gelirlerini detaylı incele' : 'Detailed income overview'}</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    {(['week', 'month', 'year'] as TimePeriod[]).map((p) => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${period === p ? 'bg-white dark:bg-surface-dark text-success shadow-sm' : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark'}`}>
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">{language === 'tr' ? 'Toplam Gelir' : 'Total Income'}</p>
                        <p className="text-2xl font-bold text-success">{formatAmount(totalIncome)}</p>
                    </div>
                    <div className="p-3 bg-success/10 rounded-full"><DollarSign className="w-5 h-5 text-success" /></div>
                </div>
                <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">{language === 'tr' ? 'Ortalama' : 'Average'}</p>
                        <p className="text-2xl font-bold text-text-light dark:text-text-dark">{formatAmount(averageIncome)}</p>
                    </div>
                    <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full"><TrendingUp className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" /></div>
                </div>
                <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">{language === 'tr' ? 'İşlem Adedi' : 'Count'}</p>
                        <p className="text-2xl font-bold text-text-light dark:text-text-dark">{filteredIncome.length}</p>
                    </div>
                    <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full"><Calendar className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" /></div>
                </div>
            </div>

            {/* Main Charts Area - Fills remaining height */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Trend Chart (Takes 2/3 width) */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
                    <h3 className="text-base font-semibold text-text-light dark:text-text-dark mb-4">{language === 'tr' ? 'Gelir Trendi' : 'Income Trend'}</h3>
                    <div className="flex-1 min-h-0 w-full">
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${sym}${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
                                    <Tooltip
                                        formatter={(value: number) => [formatAmount(value), language === 'tr' ? 'Gelir' : 'Income']}
                                        contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fill="url(#incomeGradient)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark">
                                {language === 'tr' ? 'Bu dönemde gelir yok' : 'No income in this period'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Pie & Bar Charts (Takes 1/3 width) */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    {/* Top Right: Pie Chart */}
                    <div className="flex-1 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
                        <h3 className="text-base font-semibold text-text-light dark:text-text-dark mb-2">{language === 'tr' ? 'Dağılım' : 'Distribution'}</h3>
                        <div className="flex-1 min-h-0">
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="50%"
                                            outerRadius="80%"
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {categoryData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatAmount(value)} contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-xs text-slate-500">{value}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                    {language === 'tr' ? 'Veri yok' : 'No data'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Right: Bar Chart */}
                    <div className="flex-1 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
                        <h3 className="text-base font-semibold text-text-light dark:text-text-dark mb-2">{language === 'tr' ? 'Kategoriler' : 'Categories'}</h3>
                        <div className="flex-1 min-h-0">
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} width={80} tickLine={false} axisLine={false} />
                                        <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: number) => formatAmount(value)} contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                        <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20}>
                                            {categoryData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                    {language === 'tr' ? 'Veri yok' : 'No data'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
