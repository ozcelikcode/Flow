import type { Transaction } from '../types';

/**
 * Checks if a subscription needs to be updated based on current date
 * and updates the period and amount if necessary
 */
export function checkAndUpdateSubscription(transaction: Transaction): Transaction {
    // If not a recurring transaction, return checks
    if (!transaction.recurrence || transaction.recurrence === 'once') {
        return transaction;
    }

    if (!transaction.isActive || !transaction.nextBillingDate) {
        return transaction;
    }

    const now = new Date();
    const nextBilling = new Date(transaction.nextBillingDate);

    // Check if end date is passed
    if (transaction.endDate) {
        const endDate = new Date(transaction.endDate);
        if (now > endDate) {
            return {
                ...transaction,
                isActive: false
            };
        }
    }

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
    endDate?: string;
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
        isActive: transaction.isActive !== false,
        endDate: transaction.endDate
    };
}

/**
 * Get upcoming transactions for the current month
 */
export function getUpcomingTransactions(transactions: Transaction[]): Transaction[] {
    const upcoming: Transaction[] = [];
    const now = new Date();
    // Start from today
    const startOfPeriod = now;
    // Go until end of current month
    const endOfPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    transactions.forEach(transaction => {
        // Skip non-recurring/inactive/ended transactions
        if (!transaction.recurrence || transaction.recurrence === 'once' || transaction.isActive === false) return;
        if (!transaction.nextBillingDate) return;

        // Check against end date
        if (transaction.endDate) {
            const endDate = new Date(transaction.endDate);
            if (now > endDate) return;
        }

        const nextDate = new Date(transaction.nextBillingDate);

        // If next billing date is within this month (and in future/today)
        if (nextDate >= startOfPeriod && nextDate <= endOfPeriod) {
            // Check if end date permits this instance
            if (transaction.endDate) {
                const endDate = new Date(transaction.endDate);
                if (nextDate > endDate) return;
            }

            // Clone and set the date to the next billing date for display
            upcoming.push({
                ...transaction,
                date: nextDate.toISOString().split('T')[0] // Use YYYY-MM-DD for upcoming display
            });
        }
    });

    return upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
