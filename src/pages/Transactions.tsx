import { useState } from 'react';
import { useTransactions } from '../context/TransactionContext';
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

export default function TransactionsPage() {
    const { transactions, reorderTransactions, deleteTransaction, updateTransaction } = useTransactions();
    const [editingId, setEditingId] = useState<string | null>(null);

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

    return (
        <div className="p-4">
            <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6">
                All Transactions
            </h2>
            <p className="text-sm text-text-secondary-light mb-4">
                Drag rows to reorder. Click Edit to modify details.
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
                        {transactions.map((transaction) => (
                            <SortableItem
                                key={transaction.id}
                                transaction={transaction}
                                onDelete={deleteTransaction}
                                isEditing={editingId === transaction.id}
                                onEdit={() => setEditingId(transaction.id)}
                                onSave={(updates) => {
                                    updateTransaction(transaction.id, updates);
                                    setEditingId(null);
                                }}
                                onCancelEdit={() => setEditingId(null)}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}

interface SortableItemProps {
    transaction: Transaction;
    onDelete: (id: string) => void;
    isEditing: boolean;
    onEdit: () => void;
    onSave: (updates: Partial<Transaction>) => void;
    onCancelEdit: () => void;
}

function SortableItem({ transaction, onDelete, isEditing, onEdit, onSave, onCancelEdit }: SortableItemProps) {
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

    const [editName, setEditName] = useState(transaction.name);
    const [editAmount, setEditAmount] = useState(transaction.amount.toString());

    const handleSave = () => {
        onSave({ name: editName, amount: parseFloat(editAmount) });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
            <div className="flex items-center gap-4 flex-1">
                <button {...attributes} {...listeners} className="cursor-grab touch-none p-2 text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">drag_indicator</span>
                </button>

                {isEditing ? (
                    <div className="flex gap-2 flex-1 items-center">
                        <input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        />
                        <input
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                            className="border rounded px-2 py-1 w-24"
                            type="number"
                        />
                    </div>
                ) : (
                    <div className="flex-1">
                        <p className="font-medium text-text-light dark:text-text-dark">{transaction.name}</p>
                        <p className="text-sm text-text-secondary-light">{transaction.date} • {transaction.category}</p>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                {!isEditing && (
                    <span className={`font-bold ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                        {transaction.type === 'expense' ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                    </span>
                )}

                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} className="text-success hover:bg-success/10 p-1 rounded">
                                <span className="material-symbols-outlined">check</span>
                            </button>
                            <button onClick={onCancelEdit} className="text-text-secondary-light hover:bg-slate-100 p-1 rounded">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={onEdit} className="text-primary hover:bg-primary/10 p-1 rounded">
                                <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button onClick={() => onDelete(transaction.id)} className="text-danger hover:bg-danger/10 p-1 rounded">
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
