'use client';

import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from './Skeleton';

export type StatTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';

const TONE: Record<StatTone, { bg: string; fg: string }> = {
  blue: { bg: 'bg-blue-50', fg: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', fg: 'text-amber-600' },
  rose: { bg: 'bg-rose-50', fg: 'text-rose-600' },
  violet: { bg: 'bg-violet-50', fg: 'text-violet-600' },
  slate: { bg: 'bg-slate-100', fg: 'text-slate-600' },
};

export interface StatProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  /** Percentage change. Positive renders green with an up arrow. */
  delta?: number;
  deltaLabel?: string;
  hint?: string;
  loading?: boolean;
  className?: string;
}

export function Stat({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  delta,
  deltaLabel,
  hint,
  loading,
  className,
}: StatProps) {
  const t = TONE[tone];
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
          {label}
        </p>
        {Icon && (
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9', t.bg)}>
            <Icon size={16} className={t.fg} aria-hidden />
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="mt-2.5 h-7 w-20" />
      ) : (
        <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-2xl">
          {value}
        </p>
      )}
      {(delta !== undefined || hint) && !loading && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {delta !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[11px] font-semibold',
                delta >= 0 ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(delta)}%
            </span>
          )}
          {(deltaLabel || hint) && (
            <span className="text-[11px] text-slate-400">{deltaLabel ?? hint}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Two columns on a phone, not four. A four-up stat row at 375px produces ~80px
 * tiles whose numbers wrap — the single most common defect across these pages.
 */
export function StatGrid({
  columns = 4,
  className,
  children,
}: {
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: React.ReactNode;
}) {
  const map: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  };
  return <div className={cn('grid gap-3 sm:gap-4', map[columns], className)}>{children}</div>;
}
