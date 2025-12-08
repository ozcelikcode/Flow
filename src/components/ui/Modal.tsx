import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom sm:zoom-in duration-200 border-t sm:border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-surface-dark z-10">
                    <h3 className="text-lg sm:text-xl font-bold text-text-light dark:text-text-dark">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                    </button>
                </div>
                <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(95vh-72px)] sm:max-h-[calc(90vh-80px)]">
                    {children}
                </div>
            </div>
        </div>
    );
}
