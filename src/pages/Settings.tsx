import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth, SESSION_DURATIONS, PROFILE_ICONS, type SessionDuration, type ProfileIcon } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RefreshCw, LogOut, Shield, Clock, Edit2, Lock, Check, X, Palette, Languages, Coins, Trash2, AlertTriangle } from 'lucide-react';
import * as Icons from 'lucide-react';

// Icon component that renders a dynamic icon by name
function ProfileIconComponent({ name, className }: { name: string; className?: string }) {
    const IconComponent = (Icons as any)[name];
    if (!IconComponent) return <Icons.User className={className} />;
    return <IconComponent className={className} />;
}

export default function Settings() {
    const { theme, setTheme, currency, setCurrency, rates, updateRates, isUpdatingRates, language, setLanguage, t } = useSettings();
    const { user, logout, sessionDuration, setSessionDuration, updateUserProfile, updatePassword, deleteUserAccount } = useAuth();
    const { showToast } = useToast();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState(user?.displayName || '');
    const [editProfileIcon, setEditProfileIcon] = useState<ProfileIcon>(user?.profileIcon || 'User');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Delete account states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const durationLabels: Record<SessionDuration, { en: string; tr: string }> = {
        '1d': { en: '1 Day', tr: '1 Gün' },
        '7d': { en: '7 Days', tr: '7 Gün' },
        '1m': { en: '1 Month', tr: '1 Ay' },
        '3m': { en: '3 Months', tr: '3 Ay' },
        '6m': { en: '6 Months', tr: '6 Ay' },
        '12m': { en: '12 Months', tr: '12 Ay' },
    };

    const handleLogout = () => {
        logout();
    };

    const handleSaveProfile = async () => {
        const result = await updateUserProfile({
            displayName: editDisplayName,
            profileIcon: editProfileIcon
        });

        if (result.success) {
            showToast(language === 'tr' ? 'Profil güncellendi' : 'Profile updated', 'success');
            setIsEditingProfile(false);
        } else {
            showToast(language === 'tr' ? 'Profil güncellenemedi' : 'Failed to update profile', 'error');
        }
    };

    const handleChangePassword = async () => {
        setPasswordError('');

        if (newPassword !== confirmNewPassword) {
            setPasswordError(language === 'tr' ? 'Şifreler eşleşmiyor' : 'Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError(language === 'tr' ? 'Şifre en az 8 karakter olmalı' : 'Password must be at least 8 characters');
            return;
        }

        const result = await updatePassword(currentPassword, newPassword);

        if (result.success) {
            showToast(language === 'tr' ? 'Şifre değiştirildi' : 'Password changed', 'success');
            setIsChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } else {
            if (result.error === 'wrongPassword') {
                setPasswordError(language === 'tr' ? 'Mevcut şifre yanlış' : 'Current password is wrong');
            } else if (result.error === 'cannotChangeAdminPassword') {
                setPasswordError(language === 'tr' ? 'Admin şifresi değiştirilemez' : 'Admin password cannot be changed');
            } else {
                setPasswordError(language === 'tr' ? 'Şifre değiştirilemedi' : 'Failed to change password');
            }
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteError(language === 'tr' ? 'Şifrenizi girin' : 'Enter your password');
            return;
        }

        setIsDeleting(true);
        setDeleteError('');

        const result = await deleteUserAccount(deletePassword);

        if (result.success) {
            showToast(language === 'tr' ? 'Hesabınız silindi' : 'Your account has been deleted', 'success');
            // User will be redirected to login page automatically
        } else {
            if (result.error === 'wrongPassword') {
                setDeleteError(language === 'tr' ? 'Şifre yanlış' : 'Wrong password');
            } else if (result.error === 'cannotDeleteAdmin') {
                setDeleteError(language === 'tr' ? 'Admin hesabı silinemez' : 'Admin account cannot be deleted');
            } else {
                setDeleteError(language === 'tr' ? 'Hesap silinemedi' : 'Failed to delete account');
            }
            setIsDeleting(false);
        }
    };

    return (
        <div>
            <h2 className="text-text-light dark:text-text-dark text-xl sm:text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4 sm:pb-6">
                {t('settings')}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 text-text-light dark:text-text-dark">
                {/* Left Column */}
                <div className="flex flex-col gap-4 sm:gap-6">
                    {/* Profile Section */}
                    <section className="bg-white dark:bg-surface-dark p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                <ProfileIconComponent name={user?.profileIcon || 'User'} className="w-5 h-5 text-primary" />
                                {language === 'tr' ? 'Profil' : 'Profile'}
                            </h3>
                            {!user?.isAdmin && !isEditingProfile && (
                                <button
                                    onClick={() => {
                                        setEditDisplayName(user?.displayName || '');
                                        setEditProfileIcon(user?.profileIcon || 'User');
                                        setIsEditingProfile(true);
                                    }}
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    {language === 'tr' ? 'Düzenle' : 'Edit'}
                                </button>
                            )}
                        </div>

                        {isEditingProfile ? (
                            <div className="space-y-4">
                                {/* Display Name */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        {language === 'tr' ? 'Görünen Ad' : 'Display Name'}
                                    </label>
                                    <input
                                        type="text"
                                        value={editDisplayName}
                                        onChange={(e) => setEditDisplayName(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-light dark:text-text-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                        maxLength={30}
                                    />
                                </div>

                                {/* Icon Selection */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {language === 'tr' ? 'Profil İkonu' : 'Profile Icon'}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {PROFILE_ICONS.map(iconName => (
                                            <button
                                                key={iconName}
                                                onClick={() => setEditProfileIcon(iconName)}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${editProfileIcon === iconName
                                                    ? 'bg-primary text-white ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-slate-200 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                <ProfileIconComponent name={iconName} className="w-5 h-5" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Save/Cancel Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveProfile}
                                        className="flex-1 py-2 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        {language === 'tr' ? 'Kaydet' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setIsEditingProfile(false)}
                                        className="flex-1 py-2 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-text-light dark:text-text-dark text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        {language === 'tr' ? 'İptal' : 'Cancel'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <ProfileIconComponent name={user?.profileIcon || 'User'} className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{user?.displayName || user?.username}</p>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                        @{user?.username} • {user?.isAdmin
                                            ? (language === 'tr' ? 'Yönetici' : 'Administrator')
                                            : (language === 'tr' ? 'Kullanıcı' : 'User')
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Security / Account */}
                    <section className="bg-white dark:bg-surface-dark p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            {language === 'tr' ? 'Güvenlik' : 'Security'}
                        </h3>

                        {/* Change Password */}
                        {!user?.isAdmin && (
                            <div className="mb-4">
                                {isChangingPassword ? (
                                    <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <div>
                                            <label className="block text-xs font-medium mb-1">
                                                {language === 'tr' ? 'Mevcut Şifre' : 'Current Password'}
                                            </label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">
                                                {language === 'tr' ? 'Yeni Şifre' : 'New Password'}
                                            </label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">
                                                {language === 'tr' ? 'Yeni Şifre Tekrar' : 'Confirm New Password'}
                                            </label>
                                            <input
                                                type="password"
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                            />
                                        </div>
                                        {passwordError && (
                                            <p className="text-xs text-danger">{passwordError}</p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleChangePassword}
                                                className="flex-1 py-2 px-3 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-lg"
                                            >
                                                {language === 'tr' ? 'Değiştir' : 'Change'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsChangingPassword(false);
                                                    setPasswordError('');
                                                    setCurrentPassword('');
                                                    setNewPassword('');
                                                    setConfirmNewPassword('');
                                                }}
                                                className="flex-1 py-2 px-3 bg-slate-200 dark:bg-slate-700 text-xs font-medium rounded-lg"
                                            >
                                                {language === 'tr' ? 'İptal' : 'Cancel'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsChangingPassword(true)}
                                        className="w-full py-2 px-4 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium rounded-lg transition-colors"
                                    >
                                        <Lock className="w-4 h-4" />
                                        {language === 'tr' ? 'Şifre Değiştir' : 'Change Password'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Session Duration */}
                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                <Clock className="w-4 h-4" />
                                {language === 'tr' ? 'Oturum Süresi' : 'Session Duration'}
                            </label>
                            <select
                                value={sessionDuration}
                                onChange={(e) => setSessionDuration(e.target.value as SessionDuration)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            >
                                {(Object.keys(SESSION_DURATIONS) as SessionDuration[]).map(key => (
                                    <option key={key} value={key}>
                                        {durationLabels[key][language]}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                                {language === 'tr'
                                    ? 'Bir sonraki girişte uygulanacak'
                                    : 'Will be applied on next login'
                                }
                            </p>
                        </div>

                        {/* Logout Button */}
                        {showLogoutConfirm ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 py-2 px-4 bg-danger hover:bg-danger/90 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    {language === 'tr' ? 'Evet, Çıkış Yap' : 'Yes, Logout'}
                                </button>
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-2 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-text-light dark:text-text-dark text-sm font-medium rounded-lg transition-colors"
                                >
                                    {language === 'tr' ? 'İptal' : 'Cancel'}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="w-full py-2 px-4 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-text-light dark:text-text-dark text-sm font-medium rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                {language === 'tr' ? 'Çıkış Yap' : 'Logout'}
                            </button>
                        )}
                    </section>

                    {/* Danger Zone - Delete Account */}
                    {!user?.isAdmin && (
                        <section className="bg-white dark:bg-surface-dark p-4 sm:p-6 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm">
                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-danger">
                                <AlertTriangle className="w-5 h-5" />
                                {language === 'tr' ? 'Tehlikeli Bölge' : 'Danger Zone'}
                            </h3>

                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    {language === 'tr'
                                        ? 'Hesabınızı sildiğinizde tüm verileriniz (işlemler, kategoriler, ayarlar) kalıcı olarak silinecektir. Bu işlem geri alınamaz!'
                                        : 'When you delete your account, all your data (transactions, categories, settings) will be permanently deleted. This action cannot be undone!'}
                                </p>
                            </div>

                            {showDeleteConfirm ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-danger">
                                            {language === 'tr' ? 'Onaylamak için şifrenizi girin' : 'Enter your password to confirm'}
                                        </label>
                                        <input
                                            type="password"
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            placeholder={language === 'tr' ? 'Şifreniz' : 'Your password'}
                                            className="w-full px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 text-sm focus:border-danger focus:ring-1 focus:ring-danger outline-none"
                                            disabled={isDeleting}
                                        />
                                    </div>
                                    {deleteError && (
                                        <p className="text-xs text-danger">{deleteError}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={isDeleting}
                                            className="flex-1 py-2 px-4 bg-danger hover:bg-danger/90 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isDeleting ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                            {language === 'tr' ? 'Evet, Hesabımı Sil' : 'Yes, Delete My Account'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setDeletePassword('');
                                                setDeleteError('');
                                            }}
                                            disabled={isDeleting}
                                            className="flex-1 py-2 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-text-light dark:text-text-dark text-sm font-medium rounded-lg transition-colors"
                                        >
                                            {language === 'tr' ? 'İptal' : 'Cancel'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full py-2 px-4 flex items-center justify-center gap-2 bg-danger/10 hover:bg-danger/20 text-danger text-sm font-medium rounded-lg transition-colors border border-danger/30"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {language === 'tr' ? 'Hesabımı Sil' : 'Delete My Account'}
                                </button>
                            )}
                        </section>
                    )}
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4 sm:gap-6">
                    {/* Appearance */}
                    <section className="bg-white dark:bg-surface-dark p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                            <Palette className="w-5 h-5 text-primary" />
                            {t('appearance')}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-medium text-sm sm:text-base">{t('theme')}</p>
                                <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('themeDescription')}</p>
                            </div>
                            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 shrink-0">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${theme === 'light'
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark'
                                        }`}
                                >
                                    {t('light')}
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${theme === 'dark'
                                        ? 'bg-slate-800 text-primary shadow-sm'
                                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark'
                                        }`}
                                >
                                    {t('dark')}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Language */}
                    <section className="bg-white dark:bg-surface-dark p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                            <Languages className="w-5 h-5 text-primary" />
                            {t('language')}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-medium text-sm sm:text-base">{t('language')}</p>
                                <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('languageDescription')}</p>
                            </div>
                            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 shrink-0">
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${language === 'en'
                                        ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark'
                                        }`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => setLanguage('tr')}
                                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${language === 'tr'
                                        ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                                        : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark'
                                        }`}
                                >
                                    Türkçe
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Currency Preferences */}
                    <section className="bg-white dark:bg-surface-dark p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                            <Coins className="w-5 h-5 text-primary" />
                            {t('currency')}
                        </h3>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium mb-1">{t('displayCurrency')}</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value as 'USD' | 'EUR' | 'TRY')}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text-light dark:text-text-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm sm:text-base"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="TRY">TRY (₺)</option>
                                </select>
                            </div>

                            {/* Exchange Rates Info */}
                            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                    <p className="text-xs sm:text-sm font-medium">{t('exchangeRates')}</p>
                                    <button
                                        onClick={updateRates}
                                        disabled={isUpdatingRates}
                                        className="flex items-center justify-center gap-2 px-3 py-1.5 bg-primary text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isUpdatingRates ? 'animate-spin' : ''}`} />
                                        {isUpdatingRates ? t('updating') : t('updateRates')}
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                                    <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                                        <p className="text-text-secondary-light dark:text-text-secondary-dark">USD</p>
                                        <p className="font-bold text-text-light dark:text-text-dark">1.00</p>
                                    </div>
                                    <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                                        <p className="text-text-secondary-light dark:text-text-secondary-dark">EUR</p>
                                        <p className="font-bold text-text-light dark:text-text-dark">{rates.EUR.toFixed(4)}</p>
                                    </div>
                                    <div className="text-center p-2 bg-white dark:bg-slate-800 rounded-lg">
                                        <p className="text-text-secondary-light dark:text-text-secondary-dark">TRY</p>
                                        <p className="font-bold text-text-light dark:text-text-dark">{rates.TRY.toFixed(2)}</p>
                                    </div>
                                </div>

                                <p className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark mt-3 text-center">
                                    {t('lastUpdated')}: {rates.lastUpdated}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
