import type { Transaction } from '../types';
import { parseLocalizedDate } from '../utils/dateUtils';

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
    // Use parseLocalizedDate to handle stored localized formats
    // nextBillingDate is usually ISO (YYYY-MM-DD) from system calculation, 
    // but safer to handle consistently if it ever changes.
    // Actually nextBillingDate is set via toISOString().split('T')[0] in this file, so it IS standard YYYY-MM-DD.
    // But transaction.date is localized.

    // For nextBillingDate, standard new Date is fine as it's ISO.
    const nextBilling = new Date(transaction.nextBillingDate);

    // Reset time components for accurate date comparison
    now.setHours(0, 0, 0, 0);
    nextBilling.setHours(0, 0, 0, 0);

    // Check if end date is passed
    if (transaction.endDate) {
        // endDate is from input type="date", so it is YYYY-MM-DD
        const endDate = new Date(transaction.endDate);
        endDate.setHours(0, 0, 0, 0);
        if (now > endDate) {
            return {
                ...transaction,
                isActive: false
            };
        }
    }

    // Check if we've passed the billing date
    // We only update if 'now' is strictly AFTER the billing date (i.e., billing date was yesterday or earlier)
    // This allows transactions due 'Today' to remain visible as 'Upcoming' until the day is over.
    if (now > nextBilling) {
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
        const nextBillingDateObj = new Date(transaction.nextBillingDate);
        const newNextBilling = new Date(nextBillingDateObj);

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
 * Get upcoming transactions (both recurring and future one-time)
 * Uses accurate string comparison for dates to avoid timezone issues.
 */
export function getUpcomingTransactions(transactions: Transaction[]): Transaction[] {
    const upcoming: Transaction[] = [];

    // Get Local Date String for Today: YYYY-MM-DD
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    transactions.forEach(transaction => {
        // Skip explicitly inactive transactions
        if (transaction.isActive === false) return;

        // 1. Check strict future/present date of the original transaction (One-time or first occurrence)
        // transaction.date is localized, must parse
        const parsedDate = parseLocalizedDate(transaction.date);
        let parsedTxDateIso = '';

        if (parsedDate) {
            // Convert parsed date to ISO YYYY-MM-DD for comparison
            const pYear = parsedDate.getFullYear();
            const pMonth = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const pDay = String(parsedDate.getDate()).padStart(2, '0');
            parsedTxDateIso = `${pYear}-${pMonth}-${pDay}`;

            // Check if strictly greater than today (strictly future)
            if (parsedTxDateIso > todayStr) {
                upcoming.push(transaction);
            }
        }

        // 2. Check Recurring Next Billing
        if (transaction.recurrence && transaction.recurrence !== 'once') {
            const nextBilling = transaction.nextBillingDate;

            if (nextBilling) {
                // Check End Date Constraints
                if (transaction.endDate) {
                    // end date is YYYY-MM-DD
                    // If end date is in the past, subscription is effectively over
                    if (transaction.endDate < todayStr) return;
                    // If next billing is after end date, don't show it
                    if (nextBilling > transaction.endDate) return;
                }

                // If next billing is strictly in future (tomorrow or later)
                if (nextBilling > todayStr) {
                    // Avoid duplicates: 
                    // If nextBilling is the SAME as the transaction.date (start date), 
                    // and we already added it above (because it's > todayStr), don't add again.
                    // We compare nextBilling (ISO) with parsedTxDateIso (ISO)
                    if (nextBilling !== parsedTxDateIso) {
                        upcoming.push({
                            ...transaction,
                            date: nextBilling // nextBilling is already ISO YYYY-MM-DD
                        });
                    }
                }
            }
        }
    });

    // Sort by date ascending
    return upcoming.sort((a, b) => {
        // Normalize for sorting
        const getDateIso = (dateStr: string) => {
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
            const p = parseLocalizedDate(dateStr);
            if (p) {
                return `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, '0')}-${String(p.getDate()).padStart(2, '0')}`;
            }
            return dateStr;
        };
        const dateA = getDateIso(a.date);
        const dateB = getDateIso(b.date);
        return dateA.localeCompare(dateB);
    });
}
