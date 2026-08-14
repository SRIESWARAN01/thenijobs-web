'use client';

import React, { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000. 0 = persist until dismissed
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => string;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
    setToasts([]);
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>): string => {
    const id = Math.random().toString(36).slice(2);
    const duration = opts.duration ?? 4000;
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]); // max 5 toasts

    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) =>
    toast({ type: 'success', title, message }), [toast]);

  const error = useCallback((title: string, message?: string) =>
    toast({ type: 'error', title, message, duration: 6000 }), [toast]);

  const info = useCallback((title: string, message?: string) =>
    toast({ type: 'info', title, message }), [toast]);

  const warning = useCallback((title: string, message?: string) =>
    toast({ type: 'warning', title, message, duration: 5000 }), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, info, warning, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// ─── UI ───────────────────────────────────────────────────────────────────────

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string; Icon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> }> = {
  success: { bg: '#F0FDF4', border: '#86EFAC', icon: '#16A34A', Icon: CheckCircle },
  error:   { bg: '#FEF2F2', border: '#FCA5A5', icon: '#DC2626', Icon: AlertCircle },
  info:    { bg: '#EFF6FF', border: '#93C5FD', icon: '#2563EB', Icon: Info },
  warning: { bg: '#FFFBEB', border: '#FCD34D', icon: '#D97706', Icon: AlertTriangle },
};

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 w-[340px] max-w-[calc(100vw-2rem)]"
    >
      {toasts.map(t => {
        const s = TOAST_STYLES[t.type];
        const Icon = s.Icon;
        return (
          <div
            key={t.id}
            role="alert"
            className="flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-lg border text-sm"
            style={{
              background: s.bg,
              borderColor: s.border,
              animation: 'slideInRight 0.25s ease-out',
            }}
          >
            <Icon size={18} style={{ color: s.icon }} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 leading-snug">{t.title}</p>
              {t.message && (
                <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 mt-0.5"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
