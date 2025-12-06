import { useState } from 'react';
import type { Transaction } from '../../types';
import Modal from '../ui/Modal';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (transaction: Omit<Transaction, 'id'>) => void;
}

export default function AddTransactionModal({ isOpen, onClose, onAdd }: AddTransactionModalProps) {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Food & Drink');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<'income' | 'expense'>('expense');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount) return;

        onAdd({
            name,
            amount: parseFloat(amount),
            category,
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            type,
        });

        // Reset logic or rely on unmount
        setName('');
        setAmount('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Transaction">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Type</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'expense'
                                    ? 'bg-danger/10 text-danger border border-danger/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-text-secondary-light border border-transparent'
                                }`}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'income'
                                    ? 'bg-success/10 text-success border border-success/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-text-secondary-light border border-transparent'
                                }`}
                        >
                            Income
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="e.g. Starbucks"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Amount</label>
                    <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="0.00"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option>Food & Drink</option>
                            <option>Transportation</option>
                            <option>Entertainment</option>
                            <option>Shopping</option>
                            <option>Bills</option>
                            <option>Income</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="mt-2 w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-lg transition-colors"
                >
                    Add Transaction
                </button>
            </form>
        </Modal>
    );
}
