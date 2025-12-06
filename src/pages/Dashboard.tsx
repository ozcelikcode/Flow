import { useTransactions } from '../context/TransactionContext';
import StatsCard from '../components/dashboard/StatsCard';
import TransactionTable from '../components/dashboard/TransactionTable';

export default function Dashboard() {
    const { transactions } = useTransactions();

    // Calculate dynamic stats
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

    // Initial balance logic
    const currentBalance = totalIncome - totalExpense;

    return (
        <>
            {/* PageHeading */}
            <div className="flex flex-wrap justify-between gap-3 p-4 mb-4">
                <div className="flex min-w-72 flex-col gap-3">
                    <p className="text-text-light dark:text-text-dark text-4xl font-black leading-tight tracking-[-0.033em]">
                        Welcome back!
                    </p>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-base font-normal leading-normal">
                        Here's a summary of your financial health.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 p-4">
                <StatsCard
                    title="Total Balance"
                    amount={`$${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    change="Based on transactions"
                    trend="up"
                />
                <StatsCard
                    title="Income (This Month)"
                    amount={`$${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    change="Based on transactions"
                    trend="up"
                />
                <StatsCard
                    title="Expense (This Month)"
                    amount={`$${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    change="Based on transactions"
                    trend="down"
                    trendColor="danger"
                />
            </div>

            {/* SectionHeader */}
            <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-8">
                Recent Transactions
            </h2>

            {/* Table - Show only last 5? For now show all or limit */}
            <TransactionTable transactions={transactions.slice(0, 5)} />
        </>
    );
}
