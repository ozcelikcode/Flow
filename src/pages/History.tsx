import { useTransactions } from '../context/TransactionContext';
import { useSettings } from '../context/SettingsContext';
import { ArrowUpCircle, ArrowDownCircle, Wallet, History as HistoryIcon, TrendingUp } from 'lucide-react';
import { parseDate } from '../utils/dateUtils';

export default function History() {
    const { transactions } = useTransactions();
    const { formatAmount, t } = useSettings();

    // Calculate aggregated stats
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const totalSavings = transactions
        .filter(t => t.category.toLowerCase() === 'investment' || t.category.toLowerCase() === 'yatırım')
        .reduce((total, t) => {
            return total + (t.type === 'income' ? t.amount : -t.amount);
        }, 0);

    const netWorth = totalIncome - totalExpense;

    // Group transactions by month
    const groupedTransactions = transactions.reduce((groups, transaction) => {
        const date = parseDate(transaction.date);
        // Handle invalid dates
        if (!date) {
            // Try to parse if it's in a localized format or just fallback to "Unknown"
            // For simplify, we group by the string if date parsing fails, but ideally we use dateUtils
            // We can just use the string prefix if it follows YYYY-MM
            return groups;
        }

        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        if (!groups[monthYear]) {
            groups[monthYear] = {
                monthYear,
                income: 0,
                expense: 0,
                transactions: []
            };
        }

        if (transaction.type === 'income') {
            groups[monthYear].income += transaction.amount;
        } else {
            groups[monthYear].expense += transaction.amount;
        }

        groups[monthYear].transactions.push(transaction);
        return groups;
    }, {} as Record<string, { monthYear: string; income: number; expense: number; transactions: typeof transactions }>);

    const sortedGroups = Object.values(groupedTransactions).sort((a, b) => {
        // Sort by date descending (needs real date object or smart parsing, but for now we rely on insertion order or simple sort)
        // Sort by the date of the first transaction in the group
        const dateA = parseDate(a.transactions[0].date);
        const dateB = parseDate(b.transactions[0].date);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
    });

    return (
        <div className="space-y-6">
            <h2 className="text-text-light dark:text-text-dark text-xl sm:text-[22px] font-bold leading-tight tracking-[-0.015em]">
                {t('historyTitle')}
            </h2>

            {/* Lifetime Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                    <div className="p-3 bg-primary/10 rounded-full text-primary mb-1">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium">{t('netWorth')}</span>
                    <span className="text-2xl font-bold text-text-light dark:text-text-dark">{formatAmount(netWorth)}</span>
                </div>

                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                    <div className="p-3 bg-success/10 rounded-full text-success mb-1">
                        <ArrowUpCircle className="w-6 h-6" />
                    </div>
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium">{t('totalIncome')}</span>
                    <span className="text-2xl font-bold text-success">{formatAmount(totalIncome)}</span>
                </div>

                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                    <div className="p-3 bg-danger/10 rounded-full text-danger mb-1">
                        <ArrowDownCircle className="w-6 h-6" />
                    </div>
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium">{t('totalExpense')}</span>
                    <span className="text-2xl font-bold text-danger">{formatAmount(totalExpense)}</span>
                </div>

                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                    <div className="p-3 bg-warning/10 rounded-full text-warning mb-1">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium">{t('totalSavings')}</span>
                    <span className="text-2xl font-bold text-text-light dark:text-text-dark">{formatAmount(totalSavings)}</span>
                </div>
            </div>

            {/* Monthly History Logs */}
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-text-light dark:text-text-dark flex items-center gap-2">
                    <HistoryIcon className="w-5 h-5" />
                    {t('monthlyHistory')}
                </h3>

                {sortedGroups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sortedGroups.map((group, index) => (
                            <div key={index} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <h4 className="font-bold text-text-light dark:text-text-dark">{group.monthYear}</h4>
                                    <span className={`text-sm font-bold ${group.income - group.expense >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {group.income - group.expense >= 0 ? '+' : ''}{formatAmount(group.income - group.expense)}
                                    </span>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-text-secondary-light dark:text-text-secondary-dark">{t('incomeType')}</span>
                                        <span className="font-medium text-success">{formatAmount(group.income)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-text-secondary-light dark:text-text-secondary-dark">{t('expenseType')}</span>
                                        <span className="font-medium text-danger">{formatAmount(group.expense)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-2">{t('topTransactions')}</p>
                                        <div className="space-y-2">
                                            {group.transactions.slice(0, 3).map(tx => (
                                                <div key={tx.id} className="flex justify-between text-xs">
                                                    <span className="truncate max-w-[150px] text-text-light dark:text-text-dark">{tx.name}</span>
                                                    <span className={tx.type === 'income' ? 'text-success' : 'text-danger'}>
                                                        {tx.type === 'expense' ? '-' : '+'}{formatAmount(tx.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                            {group.transactions.length > 3 && (
                                                <p className="text-[10px] text-center text-text-secondary-light dark:text-text-secondary-dark italic">
                                                    +{group.transactions.length - 3} {t('moreTransactions')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-text-secondary-light dark:text-text-secondary-dark">
                        {t('noData')}
                    </div>
                )}
            </div>
        </div>
    );
}
