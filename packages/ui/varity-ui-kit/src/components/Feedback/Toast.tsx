'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export const TOAST_DURATION = 4000;
export const MAX_VISIBLE = 3;

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  createdAt: number;
  exiting?: boolean;
}

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

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: number) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
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
