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

    // Generate data for the current year (January 1 to December 31)
    const { stats, weekColumns } = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const yearStart = new Date(currentYear, 0, 1); // January 1st
        const yearEnd = new Date(currentYear, 11, 31); // December 31st
        yearStart.setHours(0, 0, 0, 0);
        yearEnd.setHours(23, 59, 59, 999);

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

        // Generate all days for the year
        const allDays: DayData[] = [];
        let positiveDays = 0;
        let negativeDays = 0;

        const currentDate = new Date(yearStart);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        while (currentDate <= yearEnd) {
            const dateKey = toLocalDateKey(currentDate);
            const dayTransactions = transactionsByDate.get(dateKey);
            const isFuture = currentDate > today;

            let status: DayData['status'] = isFuture ? 'empty' : 'empty';
            let income = 0;
            let expense = 0;

            if (dayTransactions && !isFuture) {
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

        // Organize into weeks (columns) - weeks start on Monday
        const weeks: DayData[][] = [];
        let currentWeek: DayData[] = [];

        // Get the day of week for January 1st (0 = Sunday, 1 = Monday, etc.)
        const firstDayOfWeek = yearStart.getDay();
        // Convert to Monday-based index (Monday = 0, Sunday = 6)
        const startDayIndex = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        // First week: fill with null for days before Jan 1
        for (let i = 0; i < startDayIndex; i++) {
            currentWeek.push(null as any); // Will be filtered out in render
        }

        allDays.forEach(day => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });

        // Push remaining days (last week, no padding needed)
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

    const getCellColor = (day: DayData) => {
        if (day.status === 'empty' || day.status === 'neutral') {
            if (day.status === 'neutral') return 'bg-slate-400 dark:bg-slate-500 hover:bg-slate-500 dark:hover:bg-slate-400';
            return 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700';
        }

        const amount = Math.abs(day.net / rate);
        const isPositive = day.net > 0;

        if (isPositive) {
            if (amount < 50) return 'bg-green-100 hover:bg-green-200';
            if (amount < 100) return 'bg-green-200 hover:bg-green-300';
            if (amount < 250) return 'bg-green-300 hover:bg-green-400';
            if (amount < 500) return 'bg-green-400 hover:bg-green-500';
            if (amount < 1000) return 'bg-green-500 hover:bg-green-600';
            if (amount < 2000) return 'bg-green-600 hover:bg-green-700';
            return 'bg-green-700 hover:bg-green-800';
        } else {
            if (amount < 50) return 'bg-red-100 hover:bg-red-200';
            if (amount < 100) return 'bg-red-200 hover:bg-red-300';
            if (amount < 250) return 'bg-red-300 hover:bg-red-400';
            if (amount < 500) return 'bg-red-400 hover:bg-red-500';
            if (amount < 1000) return 'bg-red-500 hover:bg-red-600';
            if (amount < 2000) return 'bg-red-600 hover:bg-red-700';
            return 'bg-red-700 hover:bg-red-800';
        }
    };

    // Calculate month positions for labels
    const monthPositions = useMemo(() => {
        const positions: { month: string; position: number }[] = [];
        let currentMonth = -1;

        weekColumns.forEach((week, weekIndex) => {
            week.forEach(day => {
                if (day && day.date) {
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
                <div className="w-full">
                    {/* Month Labels */}
                    <div className="flex mb-2 ml-10">
                        {monthPositions.map((pos, idx) => {
                            const nextPos = monthPositions[idx + 1]?.position || weekColumns.length;
                            const width = ((nextPos - pos.position) / weekColumns.length) * 100;
                            return (
                                <div
                                    key={idx}
                                    className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark"
                                    style={{ width: `${width}%` }}
                                >
                                    {pos.month}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex">
                        {/* Day Labels */}
                        <div className="flex flex-col gap-[3px] mr-2 text-[11px] text-text-secondary-light dark:text-text-secondary-dark w-8 shrink-0">
                            {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                                <div key={dayIdx} className="h-3 sm:h-4 flex items-center justify-end pr-1">
                                    {dayIdx % 2 === 0 && days[Math.floor(dayIdx / 2)]}
                                </div>
                            ))}
                        </div>

                        {/* Grid - fills remaining width */}
                        <div className="flex-1 grid gap-[2px] sm:gap-[3px]" style={{ gridTemplateColumns: `repeat(${weekColumns.length}, 1fr)` }}>
                            {weekColumns.map((week, weekIdx) => (
                                <div key={weekIdx} className="flex flex-col gap-[2px] sm:gap-[3px]">
                                    {week.map((day, dayIdx) => (
                                        day ? (
                                            <div
                                                key={`${weekIdx}-${dayIdx}`}
                                                className={`aspect-square w-full min-h-3 sm:min-h-4 rounded-sm cursor-pointer transition-colors ${getCellColor(day)}`}
                                                onMouseEnter={(e) => handleMouseEnter(day, e)}
                                                onMouseLeave={handleMouseLeave}
                                            />
                                        ) : (
                                            <div
                                                key={`${weekIdx}-${dayIdx}`}
                                                className="aspect-square w-full min-h-3 sm:min-h-4"
                                            />
                                        )
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-3 text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                <span className="mr-1">{language === 'tr' ? 'Harcama (Az → Çok)' : 'Expense (Less → More)'}</span>
                <div className="flex gap-0.5">
                    <div className="w-[10px] h-[10px] rounded-sm bg-red-100"></div>
                    <div className="w-[10px] h-[10px] rounded-sm bg-red-300"></div>
                    <div className="w-[10px] h-[10px] rounded-sm bg-red-500"></div>
                    <div className="w-[10px] h-[10px] rounded-sm bg-red-700"></div>
                </div>

                <span className="mx-2">|</span>

                <span className="mr-1">{language === 'tr' ? 'Gelir (Az → Çok)' : 'Income (Less → More)'}</span>
                <div className="flex gap-0.5">
                    <div className="w-[10px] h-[10px] rounded-sm bg-green-100"></div>
                    <div className="w-[10px] h-[10px] rounded-sm bg-green-300"></div>
                    <div className="w-[10px] h-[10px] rounded-sm bg-green-500"></div>
                    <div className="w-[10px] h-[10px] rounded-sm bg-green-700"></div>
                </div>
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
