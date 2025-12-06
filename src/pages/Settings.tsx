import { useState } from 'react';

export default function Settings() {
    const [currency, setCurrency] = useState('USD');
    const [theme, setTheme] = useState('light'); // Mock state, actual theme toggle needs global context or DOM manipulation

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6">
                Settings
            </h2>

            <div className="flex flex-col gap-6 max-w-2xl text-text-light dark:text-text-dark">
                {/* Appearance */}
                <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Theme</p>
                            <p className="text-sm text-text-secondary-light">Customize how the app looks on your device</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => handleThemeChange('light')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'light' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary-light'}`}
                            >
                                Light
                            </button>
                            <button
                                onClick={() => handleThemeChange('dark')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-slate-700 text-primary shadow-sm' : 'text-text-secondary-light'}`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>
                </section>

                {/* Preferences */}
                <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Preferences</h3>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Currency</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="TRY">TRY (₺)</option>
                            </select>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
