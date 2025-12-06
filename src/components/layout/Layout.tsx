import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

interface LayoutProps {
    children: ReactNode;
    onAddTransactionClick?: () => void;
}

export default function Layout({ children, onAddTransactionClick }: LayoutProps) {
    const { t } = useSettings();

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden font-display bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
            <div className="flex flex-row min-h-screen">
                {/* SideNavBar */}
                <div className="flex flex-col justify-between bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 w-64 p-4 sticky top-0 h-screen">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3 items-center mb-4">
                            <div className="bg-primary/20 rounded-full size-10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-text-light dark:text-text-dark text-base font-medium leading-normal">{t('myWallet')}</h1>
                                <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-normal leading-normal">
                                    {t('personalFinance')}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <NavItem icon="dashboard" label={t('dashboard')} to="/" />
                            <NavItem icon="receipt_long" label={t('transactions')} to="/transactions" />
                            <NavItem icon="pie_chart" label={t('reports')} to="/reports" />
                            <NavItem icon="settings" label={t('settings')} to="/settings" />
                        </div>
                    </div>
                    <button
                        onClick={onAddTransactionClick}
                        className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        <span className="truncate">{t('addTransaction')}</span>
                    </button>
                </div>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    <div className="layout-content-container flex flex-col max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

function NavItem({ icon, label, to }: { icon: string; label: string; to: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive
                    ? 'bg-primary/10 dark:bg-primary/20'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <span
                        className={`material-symbols-outlined text-2xl ${isActive ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'
                            }`}
                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                        {icon}
                    </span>
                    <p
                        className={`text-sm font-medium leading-normal ${isActive ? 'text-primary' : 'text-text-light dark:text-text-dark'
                            }`}
                    >
                        {label}
                    </p>
                </>
            )}
        </NavLink>
    );
}
