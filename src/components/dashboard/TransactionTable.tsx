import type { Transaction } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface TransactionTableProps {
    transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
    const { formatAmount, t, translateCategory } = useSettings();

    return (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Mobile View - Card Style */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.length === 0 ? (
                    <div className="p-6 text-center text-text-secondary-light dark:text-text-secondary-dark text-sm">
                        {t('noTransactionsFound')}
                    </div>
                ) : (
                    transactions.map((transaction) => (
                        <div key={transaction.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-text-light dark:text-text-dark truncate">{transaction.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                                        {translateCategory(transaction.category)}
                                    </span>
                                    <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark">
                                        {transaction.date.split(',')[0]}
                                    </span>
                                </div>
                            </div>
                            <p className={`font-bold text-sm shrink-0 ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                {transaction.type === 'expense' ? '-' : '+'}{formatAmount(transaction.amount)}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop View - Table Style */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[500px] border-collapse text-left">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                            <th className="px-4 py-3 text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{t('nameColumn')}</th>
                            <th className="px-4 py-3 text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{t('categoryColumn')}</th>
                            <th className="px-4 py-3 text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hidden md:table-cell">{t('dateColumn')}</th>
                            <th className="px-4 py-3 text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark text-right">{t('amountColumn')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                                    {t('noTransactionsFound')}
                                </td>
                            </tr>
                        ) : (
                            transactions.map((transaction) => (
                                <tr
                                    key={transaction.id}
                                    className="group border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors last:border-0"
                                >
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-sm text-text-light dark:text-text-dark">{transaction.name}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                                            {translateCategory(transaction.category)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary-light dark:text-text-secondary-dark hidden md:table-cell">
                                        {transaction.date}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <p className={`font-bold text-sm ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                            {transaction.type === 'expense' ? '-' : '+'}{formatAmount(transaction.amount)}
                                        </p>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
