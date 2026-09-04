'use client';

import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** `inline` drops the surface chrome, for use inside a card that already has it. */
  variant?: 'card' | 'inline';
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  variant = 'card',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center sm:py-16',
        variant === 'card' && 'rounded-2xl border border-slate-200 bg-white',
        className,
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <Icon size={22} className="text-slate-400" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-slate-800 sm:text-base">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500 sm:text-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
