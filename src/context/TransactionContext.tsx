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

export function TransactionProvider({ children }: { children: ReactNode }) {
    // Try to load from local storage or use initial empty array
    const [transactions, setTransactions] = useState<Transaction[]>(() => {
        const saved = localStorage.getItem('transactions');
        return saved ? JSON.parse(saved) : [];
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
