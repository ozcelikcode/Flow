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

export default function TransactionsPage() {
    const { transactions, reorderTransactions, deleteTransaction, updateTransaction } = useTransactions();
    const { t, formatAmount } = useSettings();
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
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
        <div className="p-4">
            <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6">
                {t('allTransactions')}
            </h2>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                {t('dragToReorder')}
            </p>

            <div className="flex flex-col gap-2">
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
    t: (key: any) => string;
}

function SortableItem({ transaction, onEdit, formatAmount, t }: SortableItemProps) {
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
            <div className="flex items-center gap-4 flex-1">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab touch-none p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                    <span className="material-symbols-outlined">drag_indicator</span>
                </button>

                <div className="flex-1">
                    <p className="font-medium text-text-light dark:text-text-dark">{transaction.name}</p>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {transaction.date} • {transaction.category}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className={`font-bold ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    {transaction.type === 'expense' ? '-' : '+'}{formatAmount(transaction.amount)}
                </span>

                <button
                    onClick={onEdit}
                    className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"
                >
                    <span className="material-symbols-outlined">{t('edit') === 'Düzenle' ? 'edit' : 'edit'}</span>
                </button>
            </div>
        </div>
    );
}
