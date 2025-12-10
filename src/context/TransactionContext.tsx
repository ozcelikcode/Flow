import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Transaction } from '../types';
import { processSubscriptions } from '../services/subscriptionService';
import { useAuth } from './AuthContext';
import { encryptAndSave, loadAndDecrypt } from '../services/cryptoService';

interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    deleteTransaction: (id: string) => void;
    deleteMultipleTransactions: (ids: string[]) => void;
    updateTransaction: (id: string, updatedTx: Partial<Omit<Transaction, 'id'>>) => void;
    reorderTransactions: (newTransactions: Transaction[]) => void;
    processSubscriptionUpdates: () => void;
    isLoading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id;
    const userPassword = user?.passwordHash?.substring(0, 32) || 'default'; // Use part of hash as encryption key

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Get user-specific storage key
    const getStorageKey = useCallback(() => {
        return userId ? `flow_transactions_${userId}` : 'flow_transactions';
    }, [userId]);

    // Load encrypted transactions when user changes
    useEffect(() => {
        const loadData = async () => {
            if (!userId) {
                setTransactions([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const key = getStorageKey();

            try {
                const data = await loadAndDecrypt<Transaction[]>(key, userPassword);
                setTransactions(data || []);
            } catch (error) {
                console.error('Failed to load transactions:', error);
                // Try loading unencrypted data for migration
                const stored = localStorage.getItem(key);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) {
                            setTransactions(parsed);
                        }
                    } catch {
                        setTransactions([]);
                    }
                } else {
                    setTransactions([]);
                }
            }
            setIsLoading(false);
        };

        loadData();
    }, [userId, userPassword, getStorageKey]);

    // Save encrypted transactions
    const saveTransactions = useCallback(async (txs: Transaction[]) => {
        if (!userId) return;

        const key = getStorageKey();
        try {
            await encryptAndSave(key, txs, userPassword);
        } catch (error) {
            console.error('Failed to save transactions:', error);
            // Fallback to unencrypted save
            localStorage.setItem(key, JSON.stringify(txs));
        }
    }, [userId, userPassword, getStorageKey]);

    // Process subscriptions on mount
    const processSubscriptionUpdates = useCallback(() => {
        const { updated, hasChanges } = processSubscriptions(transactions);
        if (hasChanges) {
            setTransactions(updated);
            saveTransactions(updated);
        }
    }, [transactions, saveTransactions]);

    useEffect(() => {
        if (userId && !isLoading && transactions.length > 0) {
            processSubscriptionUpdates();
        }
    }, [userId, isLoading]);

    const addTransaction = async (newTx: Omit<Transaction, 'id'>) => {
        const transaction: Transaction = {
            ...newTx,
            id: Date.now().toString(),
        };
        const newTxs = [transaction, ...transactions];
        setTransactions(newTxs);
        await saveTransactions(newTxs);
    };

    const deleteTransaction = async (id: string) => {
        const newTxs = transactions.filter(t => t.id !== id);
        setTransactions(newTxs);
        await saveTransactions(newTxs);
    };

    const deleteMultipleTransactions = async (ids: string[]) => {
        const newTxs = transactions.filter(t => !ids.includes(t.id));
        setTransactions(newTxs);
        await saveTransactions(newTxs);
    };

    const updateTransaction = async (id: string, updatedTx: Partial<Omit<Transaction, 'id'>>) => {
        const newTxs = transactions.map(t => (t.id === id ? { ...t, ...updatedTx } : t));
        setTransactions(newTxs);
        await saveTransactions(newTxs);
    };

    const reorderTransactions = async (newTransactions: Transaction[]) => {
        setTransactions(newTransactions);
        await saveTransactions(newTransactions);
    };

    return (
        <TransactionContext.Provider value={{
            transactions,
            addTransaction,
            deleteTransaction,
            deleteMultipleTransactions,
            updateTransaction,
            reorderTransactions,
            processSubscriptionUpdates,
            isLoading
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
