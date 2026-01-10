/**
 * ToastContainer - Global UI component for toast notifications
 * 
 * Mounted once in App.tsx, subscribes to ToastManager and renders all active toasts.
 * Handles animations, auto-dismiss, and click-to-dismiss.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Info, Sparkles, X } from 'lucide-react';
import { ToastManager, Toast, ToastType } from '../../utils/ToastManager';

interface ToastItemProps {
    toast: Toast;
    onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
    const [isPaused, setIsPaused] = useState(false);

    // Icon mapping
    const icons: Record<ToastType, React.ReactNode> = {
        success: <CheckCircle2 className="w-6 h-6 fill-[#58CC02] text-white" />,
        error: <XCircle className="w-6 h-6 fill-[#FF4B4B] text-white" />,
        info: <Info className="w-6 h-6 fill-[#1CB0F6] text-white" />,
        achievement: <Sparkles className="w-6 h-6 text-white" />
    };

    // Style mapping (Duolingo-inspired)
    const typeStyles: Record<ToastType, string> = {
        success: 'bg-white text-[#58CC02] border-4 border-[#58CC02]',
        error: 'bg-white text-[#FF4B4B] border-4 border-[#FF4B4B]',
        info: 'bg-white text-[#1CB0F6] border-4 border-[#1CB0F6]',
        achievement: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-2xl'
    };

    return (
        <div
            className={`
        ${typeStyles[toast.type]}
        px-6 py-4 rounded-2xl shadow-2xl
        flex items-center gap-3
        animate-in slide-in-from-bottom-5 duration-300
        hover:scale-105 transition-transform
        cursor-pointer
        max-w-[400px] w-[90vw]
        relative
      `}
            onClick={() => onDismiss(toast.id)}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            role="alert"
            aria-live="polite"
        >
            {/* Icon */}
            <div className="flex-shrink-0">
                {icons[toast.type]}
            </div>

            {/* Message */}
            <span className={`
        font-black text-lg flex-1
        ${toast.type === 'achievement' ? 'text-white' : 'text-[#4B4B4B]'}
      `}>
                {toast.message}
            </span>

            {/* Close button (subtle) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(toast.id);
                }}
                className={`
          flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity
          ${toast.type === 'achievement' ? 'text-white' : 'text-current'}
        `}
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Achievement shimmer effect */}
            {toast.type === 'achievement' && (
                <div
                    className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite'
                    }}
                />
            )}

            {/* Add shimmer keyframes */}
            <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        // Subscribe to ToastManager
        const unsubscribe = ToastManager.subscribe(setToasts);

        // Cleanup on unmount
        return unsubscribe;
    }, []);

    // Don't render container if no toasts
    if (toasts.length === 0) {
        return null;
    }

    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 space-y-3 pointer-events-none"
            aria-label="Notifications"
        >
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastItem
                        toast={toast}
                        onDismiss={(id) => ToastManager.remove(id)}
                    />
                </div>
            ))}
        </div>
    );
};

// Add shimmer animation to global CSS if not already present
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
