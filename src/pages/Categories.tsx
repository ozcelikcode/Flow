import { useState } from 'react';
import { useCategories } from '../context/CategoryContext';
import { useSettings } from '../context/SettingsContext';
import type { Category } from '../types';
import * as LucideIcons from 'lucide-react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

// Available icons for selection - expanded list
const AVAILABLE_ICONS = [
    // Food & Lifestyle
    'UtensilsCrossed', 'Coffee', 'Wine', 'Pizza', 'Cookie', 'Apple', 'Beef',
    // Transportation
    'Car', 'Bus', 'Train', 'Plane', 'Bike', 'Ship', 'Fuel', 'Truck',
    // Entertainment
    'Gamepad2', 'Film', 'Music', 'Tv', 'Headphones', 'Ticket', 'Dice1',
    // Shopping
    'ShoppingBag', 'ShoppingCart', 'Store', 'Package', 'Gift', 'Tag',
    // Finance
    'Banknote', 'CreditCard', 'Wallet', 'PiggyBank', 'DollarSign', 'Receipt', 'Calculator',
    // Work
    'Briefcase', 'Laptop', 'Monitor', 'Keyboard', 'Building', 'Building2',
    // Health
    'Heart', 'HeartPulse', 'Pill', 'Stethoscope', 'Dumbbell', 'Activity',
    // Education
    'GraduationCap', 'Book', 'BookOpen', 'Pencil', 'Library', 'School',
    // Tech
    'Smartphone', 'Phone', 'Wifi', 'Globe', 'Cloud', 'Database',
    // Home
    'Home', 'Sofa', 'Lamp', 'Key', 'Lock', 'Wrench', 'Hammer',
    // Nature
    'Leaf', 'Trees', 'Sun', 'Moon', 'Snowflake', 'Umbrella', 'Droplet', 'Flame',
    // Other
    'TrendingUp', 'TrendingDown', 'RefreshCw', 'MoreHorizontal', 'Star', 'Award', 'Zap',
    'Camera', 'Image', 'Video', 'Mic', 'Sparkles', 'PartyPopper'
];

// Get icon component by name
const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Tag;
};

export default function Categories() {
    const { categories, addCategory, updateCategory, deleteCategory, getCategoryDisplayName } = useCategories();
    const { t, language } = useSettings();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Form state
    const [formNameEn, setFormNameEn] = useState('');
    const [formNameTr, setFormNameTr] = useState('');
    const [formIcon, setFormIcon] = useState('Tag');
    const [formDescEn, setFormDescEn] = useState('');
    const [formDescTr, setFormDescTr] = useState('');
    const [formType, setFormType] = useState<'income' | 'expense' | 'both'>('expense');

    const resetForm = () => {
        setFormNameEn('');
        setFormNameTr('');
        setFormIcon('Tag');
        setFormDescEn('');
        setFormDescTr('');
        setFormType('expense');
    };

    const openAddModal = () => {
        resetForm();
        setIsAddModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setFormNameEn(category.nameEn);
        setFormNameTr(category.nameTr);
        setFormIcon(category.icon);
        setFormDescEn(category.descriptionEn || '');
        setFormDescTr(category.descriptionTr || '');
        setFormType(category.type);
        setEditingCategory(category);
    };

    const handleSave = () => {
        if (!formNameEn.trim() || !formNameTr.trim()) return;

        if (editingCategory) {
            updateCategory(editingCategory.id, {
                name: formNameEn,
                nameEn: formNameEn,
                nameTr: formNameTr,
                icon: formIcon,
                descriptionEn: formDescEn,
                descriptionTr: formDescTr,
                type: formType
            });
            setEditingCategory(null);
        } else {
            addCategory({
                name: formNameEn,
                nameEn: formNameEn,
                nameTr: formNameTr,
                icon: formIcon,
                descriptionEn: formDescEn,
                descriptionTr: formDescTr,
                type: formType
            });
            setIsAddModalOpen(false);
        }
        resetForm();
    };

    const handleDelete = (id: string) => {
        deleteCategory(id);
        setDeleteConfirm(null);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setEditingCategory(null);
        resetForm();
    };

    const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');
    const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'both');

    const typeLabels = {
        expense: language === 'tr' ? 'Gider' : 'Expense',
        income: language === 'tr' ? 'Gelir' : 'Income',
        both: language === 'tr' ? 'Her İkisi' : 'Both'
    };

    const getDescription = (cat: Category) => {
        return language === 'tr' ? cat.descriptionTr : cat.descriptionEn;
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-text-light dark:text-text-dark text-xl sm:text-[22px] font-bold leading-tight tracking-[-0.015em]">
                    {t('categories')}
                </h2>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    {t('addCategory')}
                </button>
            </div>

            {/* Expense Categories */}
            <div className="mb-8">
                <h3 className="text-base font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-danger"></span>
                    {t('expenseCategories')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {expenseCategories.map(category => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            displayName={getCategoryDisplayName(category, language)}
                            description={getDescription(category)}
                            onEdit={() => openEditModal(category)}
                            onDelete={() => setDeleteConfirm(category.id)}
                            typeLabels={typeLabels}
                            t={t}
                        />
                    ))}
                </div>
            </div>

            {/* Income Categories */}
            <div>
                <h3 className="text-base font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success"></span>
                    {t('incomeCategories')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {incomeCategories.map(category => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            displayName={getCategoryDisplayName(category, language)}
                            description={getDescription(category)}
                            onEdit={() => openEditModal(category)}
                            onDelete={() => setDeleteConfirm(category.id)}
                            typeLabels={typeLabels}
                            t={t}
                        />
                    ))}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {(isAddModalOpen || editingCategory) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-surface-dark z-10">
                            <h3 className="text-lg font-bold text-text-light dark:text-text-dark">
                                {editingCategory ? t('editCategory') : t('addCategory')}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Names Section */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* English Name */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                                        🇬🇧 {language === 'tr' ? 'İngilizce İsim' : 'English Name'} <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formNameEn}
                                        onChange={(e) => setFormNameEn(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                        placeholder="Food & Drink"
                                    />
                                </div>

                                {/* Turkish Name */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                                        🇹🇷 {language === 'tr' ? 'Türkçe İsim' : 'Turkish Name'} <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formNameTr}
                                        onChange={(e) => setFormNameTr(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                        placeholder="Yiyecek ve İçecek"
                                    />
                                </div>
                            </div>

                            {/* Descriptions Section */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* English Description */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                                        🇬🇧 {language === 'tr' ? 'İngilizce Açıklama' : 'English Description'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formDescEn}
                                        onChange={(e) => setFormDescEn(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                        placeholder="Restaurants, groceries"
                                    />
                                </div>

                                {/* Turkish Description */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                                        🇹🇷 {language === 'tr' ? 'Türkçe Açıklama' : 'Turkish Description'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formDescTr}
                                        onChange={(e) => setFormDescTr(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                        placeholder="Restoranlar, market"
                                    />
                                </div>
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                                    {t('categoryType')}
                                </label>
                                <div className="flex gap-2">
                                    {(['expense', 'income', 'both'] as const).map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormType(type)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${formType === type
                                                ? type === 'expense'
                                                    ? 'bg-danger/10 text-danger border border-danger/20'
                                                    : type === 'income'
                                                        ? 'bg-success/10 text-success border border-success/20'
                                                        : 'bg-primary/10 text-primary border border-primary/20'
                                                : 'bg-slate-100 dark:bg-slate-800 text-text-secondary-light dark:text-text-secondary-dark border border-transparent'
                                                }`}
                                        >
                                            {typeLabels[type]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Icon Selection */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                                    {t('categoryIcon')}
                                </label>
                                <div className="grid grid-cols-10 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                    {AVAILABLE_ICONS.map(iconName => {
                                        const IconComp = getIconComponent(iconName);
                                        return (
                                            <button
                                                key={iconName}
                                                type="button"
                                                onClick={() => setFormIcon(iconName)}
                                                className={`p-2 rounded-lg transition-colors ${formIcon === iconName
                                                    ? 'bg-primary text-white'
                                                    : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-text-secondary-light dark:text-text-secondary-dark'
                                                    }`}
                                                title={iconName}
                                            >
                                                <IconComp className="w-4 h-4" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Preview Section */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                                    {language === 'tr' ? 'Önizleme' : 'Preview'}
                                </label>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formType === 'expense' ? 'bg-danger/10' : formType === 'income' ? 'bg-success/10' : 'bg-primary/10'
                                        }`}>
                                        {(() => {
                                            const IconComp = getIconComponent(formIcon);
                                            return <IconComp className={`w-5 h-5 ${formType === 'expense' ? 'text-danger' : formType === 'income' ? 'text-success' : 'text-primary'
                                                }`} />;
                                        })()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 text-sm flex-wrap">
                                            <span className="font-medium text-text-light dark:text-text-dark">
                                                🇬🇧 {formNameEn || 'English'}
                                            </span>
                                            <span className="text-text-secondary-light dark:text-text-secondary-dark">|</span>
                                            <span className="font-medium text-text-light dark:text-text-dark">
                                                🇹🇷 {formNameTr || 'Türkçe'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate mt-0.5">
                                            {(language === 'tr' ? formDescTr : formDescEn) || (language === 'tr' ? 'Açıklama' : 'Description')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!formNameEn.trim() || !formNameTr.trim()}
                                    className="flex-1 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    {t('save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2">
                            {t('deleteCategory')}
                        </h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                            {t('deleteCategoryConfirm')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-text-light dark:text-text-dark font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 py-2 rounded-lg bg-danger text-white font-medium hover:bg-danger/90 transition-colors"
                            >
                                {t('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface CategoryCardProps {
    category: Category;
    displayName: string;
    description?: string;
    onEdit: () => void;
    onDelete: () => void;
    typeLabels: Record<string, string>;
    t: (key: any) => string;
}

function CategoryCard({ category, displayName, description, onEdit, onDelete, typeLabels, t }: CategoryCardProps) {
    const IconComp = getIconComponent(category.icon);

    return (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3 group hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${category.type === 'income' ? 'bg-success/10' : category.type === 'expense' ? 'bg-danger/10' : 'bg-primary/10'
                }`}>
                <IconComp className={`w-5 h-5 ${category.type === 'income' ? 'text-success' : category.type === 'expense' ? 'text-danger' : 'text-primary'
                    }`} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-text-light dark:text-text-dark truncate">{displayName}</p>
                    {category.isCustom && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                            {t('custom')}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate mt-0.5">
                        {description}
                    </p>
                )}
                <p className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark mt-1">
                    {typeLabels[category.type]}
                </p>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onEdit}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-text-secondary-light dark:text-text-secondary-dark transition-colors"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                {category.isCustom && (
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-lg hover:bg-danger/10 text-danger transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
