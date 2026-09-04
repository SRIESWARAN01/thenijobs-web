'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface FilterBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Scrollable body content. */
  children: ReactNode;
  /** Sticky footer, e.g. an Apply button — stays pinned while the body scrolls. */
  footer?: ReactNode;
}

/**
 * Canonical mobile filter sheet — 90% viewport height, header and footer pinned,
 * only the filter body scrolls. Used wherever a filter set is too large for the
 * inline dropdown panel (see StickySearchBar's `children` slot for the lighter case).
 */
export default function FilterBottomSheet({ open, onClose, title, children, footer }: FilterBottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs animate-vk-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative bg-white w-full rounded-t-3xl shadow-2xl flex flex-col h-[90vh] animate-vk-sheet-up"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tap-target-auto p-1 rounded-xl text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
          {children}
        </div>

        {footer && (
          <div
            className="shrink-0 border-t border-gray-100 px-5 pt-3 bg-white"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.875rem)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
