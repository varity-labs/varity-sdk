'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

const TOAST_DURATION = 4000;
const MAX_VISIBLE = 3;

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  createdAt: number;
  exiting?: boolean;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

const TOAST_STYLES: Record<ToastType, { border: string; bg: string; text: string; iconColor: string }> = {
  success: { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-800', iconColor: 'text-green-600' },
  error: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-800', iconColor: 'text-red-600' },
  info: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-800', iconColor: 'text-blue-600' },
};

const TOAST_ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const PROGRESS_COLORS: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const style = TOAST_STYLES[toast.type];
  const Icon = TOAST_ICONS[toast.type];

  return (
    <div
      className={`relative overflow-hidden rounded-lg border shadow-lg transition-all duration-300 ${style.border} ${style.bg} ${style.text} ${
        toast.exiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={{
        animation: toast.exiting ? undefined : 'toast-enter 0.3s ease-out',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon className={`h-5 w-5 shrink-0 ${style.iconColor}`} />
        <p className="flex-1 text-sm font-medium">{toast.message}</p>
        <button
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded p-0.5 hover:bg-black/5 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5">
        <div
          className={`h-full ${PROGRESS_COLORS[toast.type]} opacity-40`}
          style={{
            animation: `toast-progress ${TOAST_DURATION}ms linear`,
            animationFillMode: 'forwards',
          }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    // Start exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts((prev) => {
      const next = [...prev, { id, type, message, createdAt: Date.now() }];
      // Keep only MAX_VISIBLE most recent
      if (next.length > MAX_VISIBLE) {
        return next.slice(next.length - MAX_VISIBLE);
      }
      return next;
    });
    setTimeout(() => dismiss(id), TOAST_DURATION);
  }, [dismiss]);

  const success = useCallback((message: string) => addToast('success', message), [addToast]);
  const error = useCallback((message: string) => addToast('error', message), [addToast]);
  const info = useCallback((message: string) => addToast('info', message), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
