import type { Transaction } from '../types';

/**
 * Checks if a subscription needs to be updated based on current date
 * and updates the period and amount if necessary
 */
export function checkAndUpdateSubscription(transaction: Transaction): Transaction {
    if (!transaction.recurrence || transaction.recurrence === 'once') {
        return transaction;
    }

    if (!transaction.isActive || !transaction.nextBillingDate) {
        return transaction;
    }

    const now = new Date();
    const nextBilling = new Date(transaction.nextBillingDate);

    // Check if we've passed the billing date
    if (now >= nextBilling) {
        const updatedTransaction = { ...transaction };
        const currentPeriod = transaction.currentPeriod || 1;
        const newPeriod = currentPeriod + 1;

        // Update to next period
        updatedTransaction.currentPeriod = newPeriod;

        // Check if there's a price tier for the new period
        if (transaction.priceTiers && transaction.priceTiers.length > 0) {
            const newPriceTier = transaction.priceTiers.find(t => t.periodNumber === newPeriod);
            if (newPriceTier) {
                updatedTransaction.amount = newPriceTier.amount;
            }
        }

        // Calculate next billing date
        const newNextBilling = new Date(nextBilling);
        switch (transaction.recurrence) {
            case 'daily':
                newNextBilling.setDate(newNextBilling.getDate() + 1);
                break;
            case 'monthly':
                newNextBilling.setMonth(newNextBilling.getMonth() + 1);
                break;
            case 'yearly':
                newNextBilling.setFullYear(newNextBilling.getFullYear() + 1);
                break;
        }
        updatedTransaction.nextBillingDate = newNextBilling.toISOString().split('T')[0];

        return updatedTransaction;
    }

    return transaction;
}

/**
 * Check all transactions and update subscriptions that need updating
 */
export function processSubscriptions(transactions: Transaction[]): {
    updated: Transaction[];
    hasChanges: boolean;
} {
    let hasChanges = false;
    const updated = transactions.map(tx => {
        const updatedTx = checkAndUpdateSubscription(tx);
        if (updatedTx !== tx) {
            hasChanges = true;
        }
        return updatedTx;
    });

    return { updated, hasChanges };
}

/**
 * Get subscription status info for display
 */
export function getSubscriptionInfo(transaction: Transaction, language: 'en' | 'tr'): {
    isSubscription: boolean;
    recurrenceLabel: string;
    currentPeriod: number;
    nextBillingDate: string | null;
    nextPeriodPrice: number | null;
    isActive: boolean;
} {
    const isSubscription = transaction.recurrence && transaction.recurrence !== 'once';

    const recurrenceLabels = {
        en: { daily: 'Daily', monthly: 'Monthly', yearly: 'Yearly', once: 'One Time' },
        tr: { daily: 'Günlük', monthly: 'Aylık', yearly: 'Yıllık', once: 'Tek Seferlik' }
    };

    const recurrenceLabel = recurrenceLabels[language][transaction.recurrence || 'once'];
    const currentPeriod = transaction.currentPeriod || 1;

    // Check for next period price
    let nextPeriodPrice: number | null = null;
    if (transaction.priceTiers && transaction.priceTiers.length > 0) {
        const nextTier = transaction.priceTiers.find(t => t.periodNumber === currentPeriod + 1);
        if (nextTier) {
            nextPeriodPrice = nextTier.amount;
        }
    }

    return {
        isSubscription: !!isSubscription,
        recurrenceLabel,
        currentPeriod,
        nextBillingDate: transaction.nextBillingDate || null,
        nextPeriodPrice,
        isActive: transaction.isActive !== false
    };
}
