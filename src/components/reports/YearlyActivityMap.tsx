import { useState, useMemo } from 'react';
import type { Transaction } from '../../types';

interface YearlyActivityMapProps {
    transactions: Transaction[];
    formatAmount: (amount: number) => string;
    t: (key: any) => string;
    language: 'en' | 'tr';
    rate: number;
}

interface DayData {
    date: string;
    income: number;
    expense: number;
    net: number;
    status: 'positive' | 'negative' | 'neutral' | 'empty';
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const DAYS_EN = ['Mon', 'Wed', 'Fri'];
const DAYS_TR = ['Pzt', 'Çar', 'Cum'];

// Parse localized date string to Date object
function parseLocalizedDate(dateStr: string): Date | null {
    // Try direct parsing first
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date;
    }

    // Handle Turkish format: "8 Ara 2025" or "6 Ara 2025"
    const trMonths: Record<string, number> = {
        'Oca': 0, 'Şub': 1, 'Mar': 2, 'Nis': 3, 'May': 4, 'Haz': 5,
        'Tem': 6, 'Ağu': 7, 'Eyl': 8, 'Eki': 9, 'Kas': 10, 'Ara': 11
    };

    // Pattern: "8 Ara 2025" or "Dec 8, 2025"
    const trMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (trMatch) {
        const day = parseInt(trMatch[1]);
        const monthStr = trMatch[2];
        const year = parseInt(trMatch[3]);

        const month = trMonths[monthStr];
        if (month !== undefined) {
            return new Date(year, month, day);
        }
    }

    // Pattern: "Dec 8, 2025" (English format)
    const enMonths: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    const enMatch = dateStr.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (enMatch) {
        const monthStr = enMatch[1];
        const day = parseInt(enMatch[2]);
        const year = parseInt(enMatch[3]);

        const month = enMonths[monthStr];
        if (month !== undefined) {
            return new Date(year, month, day);
        }
    }

    return null;
}

// Format date to local date string for comparison (YYYY-MM-DD in local timezone)
function toLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function YearlyActivityMap({
    transactions,
    formatAmount,
    t,
    language,
    rate
}: YearlyActivityMapProps) {
    const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const months = language === 'tr' ? MONTHS_TR : MONTHS_EN;
    const days = language === 'tr' ? DAYS_TR : DAYS_EN;

    // Generate yearly data (last 365 days)
    const { stats, weekColumns } = useMemo(() => {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        yearAgo.setDate(yearAgo.getDate() + 1);
        yearAgo.setHours(0, 0, 0, 0); // Start of day

        // Create a map for quick transaction lookup by date
        const transactionsByDate = new Map<string, { income: number; expense: number }>();

        transactions.forEach(tx => {
            const txDate = parseLocalizedDate(tx.date);
            if (txDate) {
                const dateKey = toLocalDateKey(txDate);
                const existing = transactionsByDate.get(dateKey) || { income: 0, expense: 0 };
                if (tx.type === 'income') {
                    existing.income += tx.amount * rate;
                } else {
                    existing.expense += tx.amount * rate;
                }
                transactionsByDate.set(dateKey, existing);
            }
        });

        // Generate all days
        const allDays: DayData[] = [];
        let positiveDays = 0;
        let negativeDays = 0;

        const currentDate = new Date(yearAgo);
        while (currentDate <= today) {
            const dateKey = toLocalDateKey(currentDate);
            const dayTransactions = transactionsByDate.get(dateKey);

            let status: DayData['status'] = 'empty';
            let income = 0;
            let expense = 0;

            if (dayTransactions) {
                income = dayTransactions.income;
                expense = dayTransactions.expense;
                const net = income - expense;

                if (net > 0) {
                    status = 'positive';
                    positiveDays++;
                } else if (net < 0) {
                    status = 'negative';
                    negativeDays++;
                } else if (income > 0 || expense > 0) {
                    status = 'neutral';
                }
            }

            allDays.push({
                date: dateKey,
                income,
                expense,
                net: income - expense,
                status
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Organize into weeks (columns)
        const weeks: DayData[][] = [];
        let currentWeek: DayData[] = [];

        // Pad the first week with empty days
        const firstDayOfWeek = new Date(yearAgo).getDay();
        const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0
        for (let i = 0; i < paddingDays; i++) {
            currentWeek.push({
                date: '',
                income: 0,
                expense: 0,
                net: 0,
                status: 'empty'
            });
        }

        allDays.forEach(day => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });

        // Push remaining days
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        return {
            stats: { positiveDays, negativeDays },
            weekColumns: weeks
        };
    }, [transactions, rate]);

    const handleMouseEnter = (day: DayData, event: React.MouseEvent) => {
        if (day.date) {
            setHoveredDay(day);
            const rect = (event.target as HTMLElement).getBoundingClientRect();
            setTooltipPosition({
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            });
        }
    };

    const handleMouseLeave = () => {
        setHoveredDay(null);
    };

    const getCellColor = (status: DayData['status']) => {
        switch (status) {
            case 'positive':
                return 'bg-success hover:bg-success/80';
            case 'negative':
                return 'bg-danger hover:bg-danger/80';
            case 'neutral':
                return 'bg-slate-400 dark:bg-slate-500 hover:bg-slate-500 dark:hover:bg-slate-400';
            default:
                return 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700';
        }
    };

    // Calculate month positions for labels
    const monthPositions = useMemo(() => {
        const positions: { month: string; position: number }[] = [];
        let currentMonth = -1;

        weekColumns.forEach((week, weekIndex) => {
            week.forEach(day => {
                if (day.date) {
                    const month = new Date(day.date).getMonth();
                    if (month !== currentMonth) {
                        currentMonth = month;
                        positions.push({ month: months[month], position: weekIndex });
                    }
                }
            });
        });

        return positions;
    }, [weekColumns, months]);

    // Format date for tooltip in localized format
    const formatTooltipDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const dayNames = language === 'tr'
            ? ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const monthNames = language === 'tr' ? MONTHS_TR : MONTHS_EN;

        const dayOfWeek = dayNames[date.getDay()];
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        return `${day} ${month} ${year} ${dayOfWeek}`;
    };

    return (
        <div className="w-full">
            {/* Stats */}
            <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-success"></div>
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {t('positiveDays')}: <span className="font-bold text-success">{stats.positiveDays}</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-danger"></div>
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {t('negativeDays')}: <span className="font-bold text-danger">{stats.negativeDays}</span>
                    </span>
                </div>
            </div>

            {/* Heatmap Container */}
            <div className="overflow-x-auto pb-2">
                <div className="min-w-full">
                    {/* Month Labels */}
                    <div className="flex mb-2 ml-10 relative h-4">
                        {monthPositions.map((pos, idx) => (
                            <div
                                key={idx}
                                className="absolute text-[11px] text-text-secondary-light dark:text-text-secondary-dark"
                                style={{ left: `${pos.position * 16}px` }}
                            >
                                {pos.month}
                            </div>
                        ))}
                    </div>

                    <div className="flex">
                        {/* Day Labels */}
                        <div className="flex flex-col gap-[3px] mr-2 text-[11px] text-text-secondary-light dark:text-text-secondary-dark w-8">
                            {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                                <div key={dayIdx} className="h-[13px] flex items-center justify-end pr-1">
                                    {dayIdx % 2 === 0 && days[Math.floor(dayIdx / 2)]}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="flex gap-[3px] flex-1">
                            {weekColumns.map((week, weekIdx) => (
                                <div key={weekIdx} className="flex flex-col gap-[3px]">
                                    {week.map((day, dayIdx) => (
                                        <div
                                            key={`${weekIdx}-${dayIdx}`}
                                            className={`w-[13px] h-[13px] rounded-sm cursor-pointer transition-colors ${getCellColor(day.status)}`}
                                            onMouseEnter={(e) => handleMouseEnter(day, e)}
                                            onMouseLeave={handleMouseLeave}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1 mt-3 text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                <span>{language === 'tr' ? 'Az' : 'Less'}</span>
                <div className="w-[13px] h-[13px] rounded-sm bg-slate-200 dark:bg-slate-800"></div>
                <div className="w-[13px] h-[13px] rounded-sm bg-slate-400 dark:bg-slate-500"></div>
                <div className="w-[13px] h-[13px] rounded-sm bg-success/50"></div>
                <div className="w-[13px] h-[13px] rounded-sm bg-success"></div>
                <span>{language === 'tr' ? 'Çok' : 'More'}</span>
            </div>

            {/* Tooltip */}
            {hoveredDay && hoveredDay.date && (
                <div
                    className="fixed z-50 px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-lg shadow-xl pointer-events-none"
                    style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <p className="font-bold mb-1">
                        {formatTooltipDate(hoveredDay.date)}
                    </p>
                    {hoveredDay.status === 'empty' ? (
                        <p className="text-slate-400 dark:text-slate-500">{t('noActivity')}</p>
                    ) : (
                        <div className="space-y-0.5">
                            <p className="text-success">
                                {t('incomeLabel')}: {formatAmount(hoveredDay.income / rate)}
                            </p>
                            <p className="text-danger">
                                {t('expenseLabel')}: {formatAmount(hoveredDay.expense / rate)}
                            </p>
                            <p className={hoveredDay.net >= 0 ? 'text-success font-bold' : 'text-danger font-bold'}>
                                {t('netLabel')}: {hoveredDay.net >= 0 ? '+' : ''}{formatAmount(hoveredDay.net / rate)}
                            </p>
                        </div>
                    )}
                    <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
                        <div className="border-8 border-transparent border-t-slate-900 dark:border-t-slate-100"></div>
                    </div>
                </div>
            )}
        </div>
    );
}
