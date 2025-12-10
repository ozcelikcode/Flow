import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { validateUsername, validatePassword } from '../services/authService';
import { UserPlus, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { language } = useSettings();
    const { showToast } = useToast();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const errorMessages: Record<string, { en: string; tr: string }> = {
        usernameLength: { en: 'Username must be 3-20 characters', tr: 'Kullanıcı adı 3-20 karakter olmalı' },
        usernameAlphanumeric: { en: 'Username can only contain letters and numbers', tr: 'Kullanıcı adı sadece harf ve rakam içerebilir' },
        usernameReserved: { en: 'This username is not available', tr: 'Bu kullanıcı adı kullanılamaz' },
        usernameTaken: { en: 'Username already exists', tr: 'Kullanıcı adı zaten mevcut' },
        passwordLength: { en: 'Password must be at least 8 characters', tr: 'Şifre en az 8 karakter olmalı' },
        passwordUppercase: { en: 'Password must contain at least 1 uppercase letter', tr: 'Şifre en az 1 büyük harf içermeli' },
        passwordLowercase: { en: 'Password must contain at least 1 lowercase letter', tr: 'Şifre en az 1 küçük harf içermeli' },
        passwordNumber: { en: 'Password must contain at least 1 number', tr: 'Şifre en az 1 rakam içermeli' },
        passwordMismatch: { en: 'Passwords do not match', tr: 'Şifreler eşleşmiyor' },
    };

    // Real-time password strength indicators
    const passwordChecks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            const msg = errorMessages[usernameValidation.error || ''];
            setError(msg ? msg[language] : usernameValidation.error || '');
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            const msg = errorMessages[passwordValidation.error || ''];
            setError(msg ? msg[language] : passwordValidation.error || '');
            return;
        }

        if (password !== confirmPassword) {
            setError(errorMessages.passwordMismatch[language]);
            return;
        }

        setIsLoading(true);

        const result = await register(username, password);

        if (result.success) {
            showToast(
                language === 'tr'
                    ? 'Hesabınız başarıyla oluşturuldu!'
                    : 'Your account has been created successfully!',
                'success'
            );
            navigate('/login');
        } else {
            const msg = errorMessages[result.error || ''];
            setError(msg ? msg[language] : (result.error || 'Unknown error'));
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="w-full max-w-md">
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-success/80 text-white mb-4">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">
                        {language === 'tr' ? 'Kayıt Ol' : 'Register'}
                    </h1>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
                        {language === 'tr' ? 'Yeni hesap oluşturun' : 'Create a new account'}
                    </p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-danger/10 text-danger rounded-xl text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                            {language === 'tr' ? 'Kullanıcı Adı' : 'Username'}
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder={language === 'tr' ? 'Kullanıcı adınız' : 'Your username'}
                                required
                                autoComplete="username"
                                maxLength={20}
                            />
                        </div>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                            {language === 'tr' ? 'Sadece harf ve rakam, 3-20 karakter' : 'Letters and numbers only, 3-20 characters'}
                        </p>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                            {language === 'tr' ? 'Şifre' : 'Password'}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        {/* Password Strength Indicators */}
                        {password && (
                            <div className="mt-2 space-y-1">
                                {[
                                    { key: 'length', label: language === 'tr' ? 'En az 8 karakter' : 'At least 8 characters' },
                                    { key: 'uppercase', label: language === 'tr' ? 'En az 1 büyük harf' : 'At least 1 uppercase' },
                                    { key: 'lowercase', label: language === 'tr' ? 'En az 1 küçük harf' : 'At least 1 lowercase' },
                                    { key: 'number', label: language === 'tr' ? 'En az 1 rakam' : 'At least 1 number' },
                                ].map(check => (
                                    <div key={check.key} className={`flex items-center gap-1.5 text-xs ${passwordChecks[check.key as keyof typeof passwordChecks] ? 'text-success' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        {check.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                            {language === 'tr' ? 'Şifre Tekrar' : 'Confirm Password'}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                            />
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-xs text-danger mt-1">
                                {errorMessages.passwordMismatch[language]}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-success hover:bg-success/90 disabled:bg-success/50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                {language === 'tr' ? 'Kayıt Ol' : 'Create Account'}
                            </>
                        )}
                    </button>

                    {/* Login Link */}
                    <p className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark pt-2">
                        {language === 'tr' ? 'Zaten hesabınız var mı?' : 'Already have an account?'}{' '}
                        <Link to="/login" className="text-primary hover:underline font-medium">
                            {language === 'tr' ? 'Giriş Yap' : 'Sign In'}
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
