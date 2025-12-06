import { useSettings } from '../context/SettingsContext';

export default function Settings() {
    const { theme, setTheme, currency, setCurrency, rates, updateRates, isUpdatingRates } = useSettings();

    return (
        <div className="p-4">
            <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6">
                Settings
            </h2>

            <div className="flex flex-col gap-6 max-w-2xl text-text-light dark:text-text-dark">
                {/* Appearance */}
                <section className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Theme</p>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Customize how the app looks on your device</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                            <button
                                onClick={() => setTheme('light')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'light'
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark'
                                    }`}
                            >
                                Light
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'dark'
                                        ? 'bg-slate-800 text-primary shadow-sm'
                                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark'
                                    }`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>
                </section>

                {/* Currency Preferences */}
                <section className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Currency</h3>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Display Currency</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as 'USD' | 'EUR' | 'TRY')}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="TRY">TRY (₺)</option>
                            </select>
                        </div>

                        {/* Exchange Rates Info */}
                        <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium">Exchange Rates (Base: USD)</p>
                                <button
                                    onClick={updateRates}
                                    disabled={isUpdatingRates}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className={`material-symbols-outlined text-lg ${isUpdatingRates ? 'animate-spin' : ''}`}>
                                        {isUpdatingRates ? 'progress_activity' : 'sync'}
                                    </span>
                                    {isUpdatingRates ? 'Updating...' : 'Update Rates'}
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                                    <p className="text-text-secondary-light dark:text-text-secondary-dark">USD</p>
                                    <p className="font-bold text-text-light dark:text-text-dark">1.00</p>
                                </div>
                                <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                                    <p className="text-text-secondary-light dark:text-text-secondary-dark">EUR</p>
                                    <p className="font-bold text-text-light dark:text-text-dark">{rates.EUR.toFixed(4)}</p>
                                </div>
                                <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                                    <p className="text-text-secondary-light dark:text-text-secondary-dark">TRY</p>
                                    <p className="font-bold text-text-light dark:text-text-dark">{rates.TRY.toFixed(2)}</p>
                                </div>
                            </div>

                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-3 text-center">
                                Last updated: {rates.lastUpdated}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
