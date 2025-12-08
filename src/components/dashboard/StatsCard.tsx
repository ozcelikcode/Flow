interface StatsCardProps {
    title: string;
    amount: string; // Formatted string
    change: string; // e.g. "+2.5% vs last month"
    trend: 'up' | 'down';
    trendColor?: 'success' | 'danger'; // Optional override, otherwise derived from trend
}

export default function StatsCard({ title, amount, change, trend, trendColor }: StatsCardProps) {
    const colorClass = trendColor ? `text-${trendColor}` : (trend === 'up' ? 'text-success' : 'text-danger');

    return (
        <div className="flex flex-col gap-1.5 sm:gap-2 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs sm:text-sm lg:text-base font-medium leading-normal">
                {title}
            </p>
            <p className="text-text-light dark:text-text-dark tracking-light text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
                {amount}
            </p>
            <p className={`${colorClass} text-xs sm:text-sm lg:text-base font-medium leading-normal`}>
                {change}
            </p>
        </div>
    );
}
