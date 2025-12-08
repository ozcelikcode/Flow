import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Transaction } from '../types';
import { processSubscriptions } from '../services/subscriptionService';

interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    deleteTransaction: (id: string) => void;
    updateTransaction: (id: string, updatedTx: Partial<Omit<Transaction, 'id'>>) => void;
    reorderTransactions: (newTransactions: Transaction[]) => void;
    processSubscriptionUpdates: () => void;
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

    // Process subscriptions on mount and periodically
    const processSubscriptionUpdates = useCallback(() => {
        const { updated, hasChanges } = processSubscriptions(transactions);
        if (hasChanges) {
            setTransactions(updated);
        }
    }, [transactions]);

    // Check subscriptions on mount and every hour
    useEffect(() => {
        processSubscriptionUpdates();

        const interval = setInterval(() => {
            processSubscriptionUpdates();
        }, 60 * 60 * 1000); // Check every hour

        return () => clearInterval(interval);
    }, []); // Only run on mount

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
        <TransactionContext.Provider value={{
            transactions,
            addTransaction,
            deleteTransaction,
            updateTransaction,
            reorderTransactions,
            processSubscriptionUpdates
        }}>
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
