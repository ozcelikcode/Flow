import type { Transaction } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface TransactionTableProps {
    transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
    const { formatAmount, t } = useSettings();

    return (
        <div className="px-4 pb-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                            <th className="px-4 py-3 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{t('nameColumn')}</th>
                            <th className="px-4 py-3 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{t('categoryColumn')}</th>
                            <th className="px-4 py-3 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{t('dateColumn')}</th>
                            <th className="px-4 py-3 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark text-right">{t('amountColumn')}</th>
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
                                        <p className="font-medium text-text-light dark:text-text-dark">{transaction.name}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary/10 text-secondary">
                                            {transaction.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                        {transaction.date}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <p className={`font-bold ${transaction.type === 'income' ? 'text-success' : 'text-text-light dark:text-text-dark'}`}>
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
