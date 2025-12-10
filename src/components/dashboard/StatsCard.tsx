import type { ReactNode } from 'react';

interface StatsCardProps {
    title: string;
    amount: string;
    change: string;
    trend: 'up' | 'down';
    trendColor?: 'success' | 'danger';
    icon?: ReactNode;
}

export default function StatsCard({ title, amount, change, trend, trendColor, icon }: StatsCardProps) {
    const colorClass = trendColor ? `text-${trendColor}` : (trend === 'up' ? 'text-success' : 'text-danger');

    return (
        <div className="flex flex-col gap-1.5 sm:gap-2 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-2">
                {icon && (
                    <div className="text-primary">
                        {icon}
                    </div>
                )}
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs sm:text-sm lg:text-base font-medium leading-normal">
                    {title}
                </p>
            </div>
            <p className="text-text-light dark:text-text-dark tracking-light text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
                {amount}
            </p>
            <p className={`${colorClass} text-xs sm:text-sm lg:text-base font-medium leading-normal`}>
                {change}
            </p>
        </div>
    );
}
