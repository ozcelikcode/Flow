import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (variant) {
            case 'danger':
                return <AlertCircle className="w-6 h-6 text-danger" />;
            case 'warning':
                return <AlertTriangle className="w-6 h-6 text-warning" />;
            case 'info':
                return <Info className="w-6 h-6 text-primary" />;
        }
    };

    const getButtonColor = () => {
        switch (variant) {
            case 'danger':
                return 'bg-danger hover:bg-danger/90 text-white';
            case 'warning':
                return 'bg-warning hover:bg-warning/90 text-white';
            case 'info':
                return 'bg-primary hover:bg-primary/90 text-white';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                <div className="p-6">
                    <div className="flex gap-4 items-start">
                        <div className={`p-3 rounded-full shrink-0 ${variant === 'danger' ? 'bg-danger/10' :
                            variant === 'warning' ? 'bg-warning/10' : 'bg-primary/10'
                            }`}>
                            {getIcon()}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2">
                                {title}
                            </h3>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors shadow-sm ${getButtonColor()}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
