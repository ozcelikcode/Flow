import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, SESSION_DURATIONS, type SessionDuration } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { LogIn, User, Lock, Clock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { t, language } = useSettings();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberDuration, setRememberDuration] = useState<SessionDuration>('7d');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const durationLabels: Record<SessionDuration, { en: string; tr: string }> = {
        '1d': { en: '1 Day', tr: '1 Gün' },
        '7d': { en: '7 Days', tr: '7 Gün' },
        '1m': { en: '1 Month', tr: '1 Ay' },
        '3m': { en: '3 Months', tr: '3 Ay' },
        '6m': { en: '6 Months', tr: '6 Ay' },
        '12m': { en: '12 Months', tr: '12 Ay' },
    };

    const errorMessages: Record<string, { en: string; tr: string }> = {
        wrongCredentials: { en: 'Invalid username or password', tr: 'Geçersiz kullanıcı adı veya şifre' },
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(username, password, rememberDuration);

        if (result.success) {
            navigate('/');
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white mb-4">
                        <LogIn className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">Flow</h1>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
                        {language === 'tr' ? 'Hesabınıza giriş yapın' : 'Sign in to your account'}
                    </p>
                </div>

                {/* Login Form */}
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
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder={language === 'tr' ? 'Kullanıcı adınız' : 'Your username'}
                                required
                                autoComplete="username"
                            />
                        </div>
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
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {/* Remember Duration */}
                    <div>
                        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                            <Clock className="inline w-4 h-4 mr-1" />
                            {language === 'tr' ? 'Beni Hatırla' : 'Remember me for'}
                        </label>
                        <select
                            value={rememberDuration}
                            onChange={(e) => setRememberDuration(e.target.value as SessionDuration)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                            {(Object.keys(SESSION_DURATIONS) as SessionDuration[]).map(key => (
                                <option key={key} value={key}>
                                    {durationLabels[key][language]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                {language === 'tr' ? 'Giriş Yap' : 'Sign In'}
                            </>
                        )}
                    </button>

                    {/* Register Link */}
                    <p className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark pt-2">
                        {language === 'tr' ? 'Hesabınız yok mu?' : "Don't have an account?"}{' '}
                        <Link to="/register" className="text-primary hover:underline font-medium">
                            {language === 'tr' ? 'Kayıt Ol' : 'Register'}
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
