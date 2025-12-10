import { useState, useMemo, useEffect } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { useSettings } from '../context/SettingsContext';
import { useCategories } from '../context/CategoryContext';
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
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Transaction } from '../types';
import TransactionModal from '../components/dashboard/TransactionModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { getSubscriptionInfo } from '../services/subscriptionService';
import { GripVertical, Pencil, List, LayoutGrid, X, CheckSquare, Square, Trash2 } from 'lucide-react';

export default function TransactionsPage() {
    const { transactions, reorderTransactions, deleteTransaction, updateTransaction } = useTransactions();
    const { t, formatAmount, translateCategory, language } = useSettings();
    const { categories, getCategoryDisplayName } = useCategories();
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
        return (localStorage.getItem('transactionViewMode') as 'list' | 'grid') || 'list';
    });
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Fast sensors for instant drag response
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // Very short distance for instant activation
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100, // Shorter delay for mobile
                tolerance: 3,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Get unique categories from transactions
    const transactionCategories = useMemo(() => {
        const categorySet = new Set(transactions.map(t => t.category));
        return Array.from(categorySet);
    }, [transactions]);

    // Filter transactions by selected category
    const filteredTransactions = useMemo(() => {
        if (!selectedCategory) return transactions;
        return transactions.filter(t => t.category === selectedCategory);
    }, [transactions, selectedCategory]);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const [previewIds, setPreviewIds] = useState<string[]>([]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedIds([]);
                setLastSelectedId(null);
                setPreviewIds([]);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') {
                setPreviewIds([]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // ... existing sensors ...

    // ... existing transactionCategories ...

    // ... existing filteredTransactions ...

    const handleItemHover = (id: string, e: React.MouseEvent) => {
        if (e.shiftKey && lastSelectedId) {
            const lastIndex = filteredTransactions.findIndex(t => t.id === lastSelectedId);
            const currentIndex = filteredTransactions.findIndex(t => t.id === id);

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                const rangeIds = filteredTransactions.slice(start, end + 1).map(t => t.id);
                // Exclude already selected ones if you want "add to selection" preview,
                // but usually preview shows the whole range including what's already selected.
                // However, standard Windows explorer usually just highlights the range.
                // We will just show the rangeIds.
                setPreviewIds(rangeIds);
            }
        } else {
            if (previewIds.length > 0) setPreviewIds([]);
        }
    };

    const handleTransactionClick = (e: React.MouseEvent, id: string) => {
        // Prevent selection when clicking on buttons/inputs if any
        // e.stopPropagation() should be called by the child if needed, but here we assume the click is valid

        let newSelectedIds = [...selectedIds];

        if (e.ctrlKey || e.metaKey) {
            // Toggle selection
            if (newSelectedIds.includes(id)) {
                newSelectedIds = newSelectedIds.filter(selectedId => selectedId !== id);
            } else {
                newSelectedIds.push(id);
                setLastSelectedId(id);
            }
        } else if (e.shiftKey && lastSelectedId) {
            // Range selection
            // We need to find indices in the CURRENT filtered list
            const lastIndex = filteredTransactions.findIndex(t => t.id === lastSelectedId);
            const currentIndex = filteredTransactions.findIndex(t => t.id === id);

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                const rangeIds = filteredTransactions.slice(start, end + 1).map(t => t.id);

                // Add unique ids from range
                const uniqueIds = new Set([...newSelectedIds, ...rangeIds]);
                newSelectedIds = Array.from(uniqueIds);
            }
        } else {
            // Single selection without modifier keys
            if (newSelectedIds.includes(id) && newSelectedIds.length === 1) {
                // Already selected sole item, keep it.
                // Optional: Deselect? No, standard is keep.
                newSelectedIds = [id]; // Ensure only this one
            } else {
                newSelectedIds = [id];
            }
            setLastSelectedId(id);
        }

        setSelectedIds(newSelectedIds);
        setPreviewIds([]); // Clear preview on click
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredTransactions.map(t => t.id));
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        // ... existing handleDragEnd ...
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

    const handleSave = (updatedData: Omit<Transaction, 'id'>) => {
        if (editingTransaction) {
            updateTransaction(editingTransaction.id, updatedData);
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

    const handleBulkDelete = () => {
        setIsConfirmModalOpen(true);
    };

    const confirmBulkDelete = () => {
        selectedIds.forEach(id => deleteTransaction(id));
        setSelectedIds([]);
        setLastSelectedId(null);
        setIsConfirmModalOpen(false);
    };

    const handleCloseModal = () => {
        setEditingTransaction(null);
        setIsModalOpen(false);
    };

    const toggleViewMode = (mode: 'list' | 'grid') => {
        setViewMode(mode);
        localStorage.setItem('transactionViewMode', mode);
    };

    const getCategoryLabel = (categoryName: string) => {
        const cat = categories.find(c => c.name === categoryName);
        if (cat) {
            return getCategoryDisplayName(cat, language);
        }
        return translateCategory(categoryName);
    };

    return (
        <div>
            <div className="flex items-center justify-between pb-4 sm:pb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                    <h2 className="text-text-light dark:text-text-dark text-xl sm:text-[22px] font-bold leading-tight tracking-[-0.015em]">
                        {t('allTransactions')}
                    </h2>
                    {filteredTransactions.length > 0 && (
                        <button
                            onClick={toggleSelectAll}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            {selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">{t('selectAll') || 'Select All'}</span>
                            {selectedIds.length > 0 && (
                                <span className="ml-1 text-primary font-bold">({selectedIds.length})</span>
                            )}
                        </button>
                    )}

                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs sm:text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('deleteSelected') || 'Delete'}</span>
                        </button>
                    )}
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => toggleViewMode('list')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list'
                            ? 'bg-white dark:bg-surface-dark text-primary shadow-sm'
                            : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark'
                            }`}
                    >
                        <List className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('listView')}</span>
                    </button>
                    <button
                        onClick={() => toggleViewMode('grid')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid'
                            ? 'bg-white dark:bg-surface-dark text-primary shadow-sm'
                            : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark'
                            }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('gridView')}</span>
                    </button>
                </div>
            </div>

            {/* Category Filter */}
            {transactionCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!selectedCategory
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        {language === 'tr' ? 'Tümü' : 'All'} ({transactions.length})
                    </button>
                    {transactionCategories.map(cat => {
                        const count = transactions.filter(t => t.category === cat).length;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${selectedCategory === cat
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {getCategoryLabel(cat)}
                                <span className="opacity-70">({count})</span>
                                {selectedCategory === cat && <X className="w-3 h-3" />}
                            </button>
                        );
                    })}
                </div>
            )}

            {viewMode === 'list' && !selectedCategory && (
                <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                    {t('dragToReorder')}
                </p>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={filteredTransactions}
                    strategy={viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy}
                >
                    {viewMode === 'list' ? (
                        <div className="flex flex-col gap-2 sm:gap-3">
                            {filteredTransactions.length === 0 ? (
                                <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
                                    {t('noTransactions')}
                                </div>
                            ) : (
                                filteredTransactions.map((transaction) => (
                                    <SortableListItem
                                        key={transaction.id}
                                        transaction={transaction}
                                        onEdit={() => handleEdit(transaction)}
                                        formatAmount={formatAmount}
                                        translateCategory={translateCategory}
                                        language={language}
                                        t={t}
                                        isDraggable={!selectedCategory}
                                        isSelected={selectedIds.includes(transaction.id)}
                                        isPreviewSelected={previewIds.includes(transaction.id)}
                                        onSelect={(e) => handleTransactionClick(e, transaction.id)}
                                        onHover={(e) => handleItemHover(transaction.id, e)}
                                    />
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {filteredTransactions.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
                                    {t('noTransactions')}
                                </div>
                            ) : (
                                filteredTransactions.map((transaction) => (
                                    <SortableGridItem
                                        key={transaction.id}
                                        transaction={transaction}
                                        onEdit={() => handleEdit(transaction)}
                                        formatAmount={formatAmount}
                                        translateCategory={translateCategory}
                                        language={language}
                                        isDraggable={!selectedCategory}
                                        isSelected={selectedIds.includes(transaction.id)}
                                        isPreviewSelected={previewIds.includes(transaction.id)}
                                        onSelect={(e) => handleTransactionClick(e, transaction.id)}
                                        onHover={(e) => handleItemHover(transaction.id, e)}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </SortableContext>
            </DndContext>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                onDelete={handleDelete}
                editTransaction={editingTransaction}
            />

            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmBulkDelete}
                title={t('deleteTitle')}
                message={t('deleteConfirm', { count: selectedIds.length.toString() })}
                confirmText={t('deleteSelected')}
                cancelText={t('cancel')}
                variant="danger"
            />
        </div>
    );
}

interface ListItemProps {
    transaction: Transaction;
    onEdit: () => void;
    formatAmount: (amount: number) => string;
    translateCategory: (category: string) => string;
    language: 'en' | 'tr';
    t: (key: any) => string;
    isDraggable: boolean;
    isSelected: boolean;
    isPreviewSelected?: boolean;
    onSelect: (e: React.MouseEvent) => void;
    onHover?: (e: React.MouseEvent) => void;
}

function SortableListItem({ transaction, onEdit, formatAmount, translateCategory, language, t, isDraggable, isSelected, isPreviewSelected, onSelect, onHover }: ListItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: transaction.id, disabled: !isDraggable });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    const subInfo = getSubscriptionInfo(transaction, language);

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            onMouseEnter={onHover}
            className={`flex items-start sm:items-center justify-between p-3 sm:p-4 bg-white dark:bg-surface-dark rounded-xl border shadow-sm gap-2 sm:gap-4 cursor-pointer transition-colors ${isSelected
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : isPreviewSelected
                    ? 'border-primary/50 bg-primary/5 dark:bg-primary/5'
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary/50'
                }`}
        >
            <div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <div className="mt-1 sm:mt-0 text-text-secondary-light dark:text-text-secondary-dark shrink-0">
                    {isSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
                </div>

                {isDraggable && (
                    <button
                        {...attributes}
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-grab touch-none p-1 sm:p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 shrink-0 mt-1 sm:mt-0"
                    >
                        <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                )}

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
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    className="text-primary hover:bg-primary/10 p-1.5 sm:p-2 rounded-lg transition-colors"
                >
                    <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>
        </div>
    );
}

interface GridItemProps {
    transaction: Transaction;
    onEdit: () => void;
    formatAmount: (amount: number) => string;
    translateCategory: (category: string) => string;
    language: 'en' | 'tr';
    isDraggable: boolean;
    isSelected: boolean;
    isPreviewSelected?: boolean;
    onSelect: (e: React.MouseEvent) => void;
    onHover?: (e: React.MouseEvent) => void;
}

function SortableGridItem({ transaction, onEdit, formatAmount, translateCategory, language, isDraggable, isSelected, isPreviewSelected, onSelect, onHover }: GridItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging
    } = useSortable({ id: transaction.id, disabled: !isDraggable });

    // Instant transform without slow transition
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : 'transform 100ms ease',
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 'auto',
        scale: isDragging ? '1.02' : '1',
        cursor: isDraggable ? (isDragging ? 'grabbing' : 'grab') : 'default',
    };

    const subInfo = getSubscriptionInfo(transaction, language);

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            onMouseEnter={onHover}
            className={`rounded-xl border p-4 group relative select-none cursor-pointer ${isDragging
                ? 'border-primary shadow-xl bg-white dark:bg-surface-dark'
                : isSelected
                    ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                    : isPreviewSelected
                        ? 'border-primary/50 bg-primary/5 dark:bg-primary/5 shadow-sm'
                        : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-primary/30'
                }`}
        >
            {/* Drag Handle Overlay */}
            {isDraggable && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute inset-0 z-0"
                    onClick={(e) => e.stopPropagation()} // Prevent selection when dragging? No, usually distinct.
                // Actually, if we use inset-0 for listeners, it covers everything.
                // To handle click selection, we need to ensure the click passes through or is handled.
                // If dnd-kit consumes the event, onClick on parent might not fire.
                // But dnd-kit usually allows clicks.
                // However, placing listeners on a covering div blocks access to buttons underneath unless z-index managed.
                // Let's attach listeners to the CARD itself (as before), but separate onClick.
                // The previous code had listeners on the div directly.
                // I removed listeners from the main div in this replacement, but added this overlay.
                // WAIT. If I want the whole card draggable AND clickable...
                // Standard dnd-kit: attach listeners to the element.
                // Clicking without dragging triggers onClick.
                // So I should attach listeners to the main div as before.
                />
            )}

            {/* Reverting to attaching listeners to main div for simplicity, but careful with click */}

            {/* Selection Checkbox */}
            <div className="absolute top-3 right-3 z-10 text-text-secondary-light dark:text-text-secondary-dark">
                {isSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 opacity-0 group-hover:opacity-50" />}
            </div>

            {/* Content with z-index to sit above drag listeners if any, or just normal flow */}
            <div className="relative z-10 pointer-events-none">
                {/* Pointer events none to let clicks pass to main div? 
                    But buttons need pointer-events-auto.
                */}

                {/* Amount Header */}
                <div className={`text-lg sm:text-xl font-bold mb-2 ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    {transaction.type === 'expense' ? '-' : '+'}{formatAmount(transaction.amount)}
                </div>

                {/* Name */}
                <p className="font-medium text-sm text-text-light dark:text-text-dark truncate mb-1">
                    {transaction.name}
                </p>

                {/* Category */}
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate mb-2">
                    {translateCategory(transaction.category)}
                </p>

                {/* Date & Badge */}
                <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark">
                        {transaction.date.split(',')[0]}
                    </p>
                    {subInfo.isSubscription && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${subInfo.isActive
                            ? 'bg-primary/10 text-primary'
                            : 'bg-slate-200 dark:bg-slate-700 text-text-secondary-light dark:text-text-secondary-dark'
                            }`}>
                            {subInfo.recurrenceLabel}
                        </span>
                    )}
                </div>
            </div>

            {/* Edit Button - stops drag propagation */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="relative z-20 mt-3 w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-primary text-xs font-medium flex items-center justify-center gap-1 hover:bg-primary/5 active:bg-primary/10 transition-colors cursor-pointer"
            >
                <Pencil className="w-3 h-3" />
                {language === 'tr' ? 'Düzenle' : 'Edit'}
            </button>
        </div>
    );
}
