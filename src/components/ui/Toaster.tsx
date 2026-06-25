'use client';

import React, { createContext, useState, useCallback, useEffect } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  toast: (msg: Omit<ToastMessage, 'id'>) => void;
  toasts: ToastMessage[];
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(({ title, description, variant = 'info', duration = 4000 }: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant, duration }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Intercept native window.alert to automatically show a beautiful toast
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert;
      window.alert = (message: string) => {
        const lower = String(message).toLowerCase();
        let variant: 'success' | 'error' | 'warning' | 'info' = 'info';
        let title = 'Notification';
        
        if (
          lower.includes('success') || 
          lower.includes('complete') || 
          lower.includes('saved') || 
          lower.includes('sent') || 
          lower.includes('approved') || 
          lower.includes('submitted') ||
          lower.includes('updated') ||
          lower.includes('verified')
        ) {
          variant = 'success';
          title = 'Success';
        } else if (
          lower.includes('fail') || 
          lower.includes('error') || 
          lower.includes('unable') || 
          lower.includes('invalid') || 
          lower.includes('denied') || 
          lower.includes('not found') || 
          lower.includes('must') || 
          lower.includes('required') ||
          lower.includes('failed')
        ) {
          variant = 'error';
          title = 'Error';
        } else if (
          lower.includes('warning') || 
          lower.includes('attention') || 
          lower.includes('coming soon') || 
          lower.includes('limit reached') || 
          lower.includes('already') ||
          lower.includes('please')
        ) {
          variant = 'warning';
          title = 'Warning';
        }
        
        toast({
          title,
          description: String(message),
          variant,
        });
      };
      
      return () => {
        window.alert = originalAlert;
      };
    }
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        
        {toasts.map((t) => {
          let Icon = Info;
          let variantClasses = 'bg-[#0d0d20] border-white/[0.08] text-white';
          
          if (t.variant === 'success') {
            Icon = CheckCircle;
            variantClasses = 'bg-[#0a201d]/90 border-emerald-500/30 text-emerald-300';
          } else if (t.variant === 'error') {
            Icon = AlertCircle;
            variantClasses = 'bg-[#250d18]/90 border-rose-500/30 text-rose-300';
          } else if (t.variant === 'warning') {
            Icon = AlertTriangle;
            variantClasses = 'bg-[#251f0d]/90 border-amber-500/30 text-amber-300';
          } else {
            variantClasses = 'bg-[#0d0d20]/90 border-white/[0.08] text-white';
          }

          return (
            <ToastPrimitive.Root
              key={t.id}
              duration={t.duration}
              onOpenChange={(open) => {
                if (!open) dismiss(t.id);
              }}
              className={`flex w-full max-w-sm items-center gap-3 rounded-2xl border p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 ${variantClasses}`}
            >
              <div className={`p-1.5 rounded-xl ${t.variant === 'success' ? 'bg-emerald-500/10' : t.variant === 'error' ? 'bg-rose-500/10' : t.variant === 'warning' ? 'bg-amber-500/10' : 'bg-white/5'}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                {t.title && <ToastPrimitive.Title className="text-xs font-bold font-outfit">{t.title}</ToastPrimitive.Title>}
                {t.description && (
                  <ToastPrimitive.Description className="text-[11px] opacity-80 mt-0.5 leading-snug font-outfit">
                    {t.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close className="text-gray-500 hover:text-white transition-colors cursor-pointer p-1">
                <X size={14} />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
