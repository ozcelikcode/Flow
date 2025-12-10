import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Transaction } from '../types';
import { processSubscriptions } from '../services/subscriptionService';
import { useAuth } from './AuthContext';

interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    deleteTransaction: (id: string) => void;
    deleteMultipleTransactions: (ids: string[]) => void;
    updateTransaction: (id: string, updatedTx: Partial<Omit<Transaction, 'id'>>) => void;
    reorderTransactions: (newTransactions: Transaction[]) => void;
    processSubscriptionUpdates: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id;

    // Get user-specific storage key
    const getStorageKey = useCallback(() => {
        return userId ? `flow_transactions_${userId}` : 'flow_transactions';
    }, [userId]);

    // Try to load from local storage or use initial empty array
    const [transactions, setTransactions] = useState<Transaction[]>(() => {
        if (!userId) return [];
        const saved = localStorage.getItem(`flow_transactions_${userId}`);
        return saved ? JSON.parse(saved) : [];
    });

    // Reload transactions when user changes
    useEffect(() => {
        if (userId) {
            const key = getStorageKey();
            const saved = localStorage.getItem(key);
            setTransactions(saved ? JSON.parse(saved) : []);
        } else {
            setTransactions([]);
        }
    }, [userId, getStorageKey]);

    // Save to user-specific storage
    useEffect(() => {
        if (userId) {
            localStorage.setItem(getStorageKey(), JSON.stringify(transactions));
        }
    }, [transactions, userId, getStorageKey]);

    // Process subscriptions on mount and periodically
    const processSubscriptionUpdates = useCallback(() => {
        const { updated, hasChanges } = processSubscriptions(transactions);
        if (hasChanges) {
            setTransactions(updated);
        }
    }, [transactions]);

    // Check subscriptions on mount and every hour
    useEffect(() => {
        if (userId) {
            processSubscriptionUpdates();

            const interval = setInterval(() => {
                processSubscriptionUpdates();
            }, 60 * 60 * 1000); // Check every hour

            return () => clearInterval(interval);
        }
    }, [userId]); // Only run when user changes

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

    const deleteMultipleTransactions = (ids: string[]) => {
        setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
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
            deleteMultipleTransactions,
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
