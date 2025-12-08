import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import {
    LayoutDashboard,
    Receipt,
    PieChart,
    Settings,
    Plus,
    Wallet,
    Menu,
    X,
    Tag
} from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
    onAddTransactionClick?: () => void;
}

export default function Layout({ children, onAddTransactionClick }: LayoutProps) {
    const { t } = useSettings();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleNavClick = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden font-display bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 rounded-full size-8 flex items-center justify-center">
                        <Wallet className="text-primary w-4 h-4" />
                    </div>
                    <h1 className="text-text-light dark:text-text-dark text-base font-semibold">{t('myWallet')}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onAddTransactionClick}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-6 h-6 text-text-light dark:text-text-dark" />
                        ) : (
                            <Menu className="w-6 h-6 text-text-light dark:text-text-dark" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <div className={`lg:hidden fixed top-0 right-0 h-full w-64 bg-white dark:bg-surface-dark z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <div className="p-4 pt-16">
                    <div className="flex flex-col gap-2">
                        <NavItem icon={LayoutDashboard} label={t('dashboard')} to="/" onClick={handleNavClick} />
                        <NavItem icon={Receipt} label={t('transactions')} to="/transactions" onClick={handleNavClick} />
                        <NavItem icon={PieChart} label={t('reports')} to="/reports" onClick={handleNavClick} />
                        <NavItem icon={Tag} label={t('categories')} to="/categories" onClick={handleNavClick} />
                        <NavItem icon={Settings} label={t('settings')} to="/settings" onClick={handleNavClick} />
                    </div>
                </div>
            </div>

            <div className="flex flex-row min-h-screen">
                {/* Desktop SideNavBar */}
                <div className="hidden lg:flex flex-col justify-between bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 w-64 p-4 fixed top-0 left-0 h-screen z-40">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3 items-center mb-4">
                            <div className="bg-primary/20 rounded-full size-10 flex items-center justify-center">
                                <Wallet className="text-primary w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-text-light dark:text-text-dark text-base font-medium leading-normal">{t('myWallet')}</h1>
                                <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-normal leading-normal">
                                    {t('personalFinance')}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <NavItem icon={LayoutDashboard} label={t('dashboard')} to="/" />
                            <NavItem icon={Receipt} label={t('transactions')} to="/transactions" />
                            <NavItem icon={PieChart} label={t('reports')} to="/reports" />
                            <NavItem icon={Tag} label={t('categories')} to="/categories" />
                            <NavItem icon={Settings} label={t('settings')} to="/settings" />
                        </div>
                    </div>
                    <button
                        onClick={onAddTransactionClick}
                        className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="truncate">{t('addTransaction')}</span>
                    </button>
                </div>

                {/* Main Content */}
                <main className="flex-1 pt-16 lg:pt-0 lg:ml-64">
                    <div className="layout-content-container flex flex-col max-w-7xl mx-auto p-4 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

interface NavItemProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    to: string;
    onClick?: () => void;
}

function NavItem({ icon: Icon, label, to, onClick }: NavItemProps) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive
                    ? 'bg-primary/10 dark:bg-primary/20'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <Icon
                        className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}
                    />
                    <p
                        className={`text-sm font-medium leading-normal ${isActive ? 'text-primary' : 'text-text-light dark:text-text-dark'}`}
                    >
                        {label}
                    </p>
                </>
            )}
        </NavLink>
    );
}
