import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Transaction } from '../types';

interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    deleteTransaction: (id: string) => void;
    updateTransaction: (id: string, updatedTx: Partial<Omit<Transaction, 'id'>>) => void;
    reorderTransactions: (newTransactions: Transaction[]) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const initialTransactions: Transaction[] = [
    { id: '1', name: 'Spotify Subscription', category: 'Entertainment', date: 'Dec 12, 2023', amount: 10.00, type: 'expense' },
    { id: '2', name: 'Apple Store', category: 'Electronics', date: 'Dec 10, 2023', amount: 999.00, type: 'expense' },
    { id: '3', name: 'Freelance Payment', category: 'Income', date: 'Dec 08, 2023', amount: 1200.00, type: 'income' },
    { id: '4', name: 'Starbucks Coffee', category: 'Food & Drink', date: 'Dec 07, 2023', amount: 5.50, type: 'expense' },
    { id: '5', name: 'Uber Ride', category: 'Transport', date: 'Dec 06, 2023', amount: 15.20, type: 'expense' },
];

export function TransactionProvider({ children }: { children: ReactNode }) {
    // Try to load from local storage or use initial
    const [transactions, setTransactions] = useState<Transaction[]>(() => {
        const saved = localStorage.getItem('transactions');
        return saved ? JSON.parse(saved) : initialTransactions;
    });

    useEffect(() => {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }, [transactions]);

    const addTransaction = (newTx: Omit<Transaction, 'id'>) => {
        const transaction: Transaction = {
            ...newTx,
            id: Date.now().toString(),
        };
        setTransactions(prev => [transaction, ...prev]);
    };

    const deleteTransaction = (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const updateTransaction = (id: string, updatedTx: Partial<Omit<Transaction, 'id'>>) => {
        setTransactions(prev => prev.map(t => (t.id === id ? { ...t, ...updatedTx } : t)));
    };

    const reorderTransactions = (newTransactions: Transaction[]) => {
        setTransactions(newTransactions);
    };

    return (
        <TransactionContext.Provider value={{ transactions, addTransaction, deleteTransaction, updateTransaction, reorderTransactions }}>
            {children}
        </TransactionContext.Provider>
    );
}

export function useTransactions() {
    const context = useContext(TransactionContext);
    if (context === undefined) {
        throw new Error('useTransactions must be used within a TransactionProvider');
    }
    return context;
}
