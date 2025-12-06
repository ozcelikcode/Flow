import type { Transaction } from '../../types';

interface TransactionTableProps {
    transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
    return (
        <div className="px-4 py-3 @container">
            <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <table className="flex-1">
                    <thead>
                        <tr className="bg-white dark:bg-slate-900">
                            <th className="px-4 py-3 text-left text-text-secondary-light dark:text-text-secondary-dark w-[400px] text-sm font-medium leading-normal">
                                Transaction
                            </th>
                            <th className="px-4 py-3 text-left text-text-secondary-light dark:text-text-secondary-dark w-60 text-sm font-medium leading-normal">
                                Category
                            </th>
                            <th className="px-4 py-3 text-left text-text-secondary-light dark:text-text-secondary-dark w-[400px] text-sm font-medium leading-normal">
                                Date
                            </th>
                            <th className="px-4 py-3 text-right text-text-secondary-light dark:text-text-secondary-dark w-[400px] text-sm font-medium leading-normal">
                                Amount
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="border-t border-t-slate-200 dark:border-t-slate-800">
                                <td className="h-[72px] px-4 py-2 w-[400px] text-text-light dark:text-text-dark text-sm font-normal leading-normal">
                                    {tx.name}
                                </td>
                                <td className="h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                                    <span className="inline-flex items-center justify-center overflow-hidden rounded-full h-8 px-3 bg-slate-100 dark:bg-slate-800 text-text-light dark:text-text-dark text-sm font-medium leading-normal">
                                        {tx.category}
                                    </span>
                                </td>
                                <td className="h-[72px] px-4 py-2 w-[400px] text-text-secondary-light dark:text-text-secondary-dark text-sm font-normal leading-normal">
                                    {tx.date}
                                </td>
                                <td className={`h-[72px] px-4 py-2 w-[400px] text-sm font-medium leading-normal text-right ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                    {tx.type === 'expense' ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
