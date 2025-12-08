import { useState } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { useSettings } from '../context/SettingsContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    TouchSensor,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Transaction } from '../types';
import TransactionModal from '../components/dashboard/TransactionModal';
import { getSubscriptionInfo } from '../services/subscriptionService';
import { GripVertical, Pencil } from 'lucide-react';

export default function TransactionsPage() {
    const { transactions, reorderTransactions, deleteTransaction, updateTransaction } = useTransactions();
    const { t, formatAmount, translateCategory, language } = useSettings();
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = transactions.findIndex((t) => t.id === active.id);
            const newIndex = transactions.findIndex((t) => t.id === over.id);
            reorderTransactions(arrayMove(transactions, oldIndex, newIndex));
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleSave = (updates: Omit<Transaction, 'id'>) => {
        if (editingTransaction) {
            updateTransaction(editingTransaction.id, updates);
        }
        setEditingTransaction(null);
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (editingTransaction) {
            deleteTransaction(editingTransaction.id);
        }
        setEditingTransaction(null);
        setIsModalOpen(false);
    };

    const handleCloseModal = () => {
        setEditingTransaction(null);
        setIsModalOpen(false);
    };

    return (
        <div>
            <h2 className="text-text-light dark:text-text-dark text-xl sm:text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4 sm:pb-6">
                {t('allTransactions')}
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                {t('dragToReorder')}
            </p>

            <div className="flex flex-col gap-2 sm:gap-3">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={transactions}
                        strategy={verticalListSortingStrategy}
                    >
                        {transactions.length === 0 ? (
                            <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
                                {t('noTransactions')}
                            </div>
                        ) : (
                            transactions.map((transaction) => (
                                <SortableItem
                                    key={transaction.id}
                                    transaction={transaction}
                                    onEdit={() => handleEdit(transaction)}
                                    formatAmount={formatAmount}
                                    translateCategory={translateCategory}
                                    language={language}
                                    t={t}
                                />
                            ))
                        )}
                    </SortableContext>
                </DndContext>
            </div>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                onDelete={handleDelete}
                editTransaction={editingTransaction}
            />
        </div>
    );
}

interface SortableItemProps {
    transaction: Transaction;
    onEdit: () => void;
    formatAmount: (amount: number) => string;
    translateCategory: (category: string) => string;
    language: 'en' | 'tr';
    t: (key: any) => string;
}

function SortableItem({ transaction, onEdit, formatAmount, translateCategory, language, t }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: transaction.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const subInfo = getSubscriptionInfo(transaction, language);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-start sm:items-center justify-between p-3 sm:p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-2 sm:gap-4"
        >
            <div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab touch-none p-1 sm:p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 shrink-0 mt-1 sm:mt-0"
                >
                    <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <p className="font-medium text-sm sm:text-base text-text-light dark:text-text-dark truncate">{transaction.name}</p>
                        {subInfo.isSubscription && (
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium shrink-0 ${subInfo.isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-slate-200 dark:bg-slate-700 text-text-secondary-light dark:text-text-secondary-dark'
                                }`}>
                                {subInfo.recurrenceLabel}
                            </span>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                        <span className="hidden sm:inline">{transaction.date} • </span>
                        <span className="sm:hidden">{transaction.date.split(',')[0]} • </span>
                        {translateCategory(transaction.category)}
                    </p>
                    {subInfo.isSubscription && subInfo.nextPeriodPrice && (
                        <p className="text-[10px] sm:text-xs text-warning mt-1">
                            {t('priceWillChange')} {formatAmount(subInfo.nextPeriodPrice)}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <div className="text-right">
                    <span className={`font-bold text-sm sm:text-base ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                        {transaction.type === 'expense' ? '-' : '+'}{formatAmount(transaction.amount)}
                    </span>
                    {subInfo.isSubscription && (
                        <p className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark hidden sm:block">
                            {t('currentPeriod')}: {subInfo.currentPeriod}
                        </p>
                    )}
                </div>

                <button
                    onClick={onEdit}
                    className="text-primary hover:bg-primary/10 p-1.5 sm:p-2 rounded-lg transition-colors"
                >
                    <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>
        </div>
    );
}
