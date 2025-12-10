import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border
                            animate-in slide-in-from-right fade-in duration-300
                            ${toast.type === 'success'
                                ? 'bg-success/10 border-success/20 text-success'
                                : toast.type === 'error'
                                    ? 'bg-danger/10 border-danger/20 text-danger'
                                    : 'bg-primary/10 border-primary/20 text-primary'
                            }
                        `}
                    >
                        {toast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
                        {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}

                        <span className="text-sm font-medium">{toast.message}</span>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 p-1 hover:bg-black/10 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
