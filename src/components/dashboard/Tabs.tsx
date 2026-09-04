'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

/**
 * A horizontally scrollable tab strip.
 *
 * The scroll container is `w-full`, not `w-fit`. A `w-fit` box sizes to its
 * content, so `overflow-x-auto` on it never engages — the strip simply grows
 * past the viewport and drags the whole page sideways with it. The inner row is
 * the `w-max` element instead.
 */
export function Tabs({
  tabs,
  value,
  onChange,
  className,
  label = 'Sections',
}: {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        '-mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-6 lg:mx-0 lg:w-full lg:px-0',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      <div role="tablist" aria-label={label} className="flex w-max gap-1.5 rounded-2xl bg-slate-100 p-1.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = value === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                active ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {Icon && <Icon size={14} aria-hidden />}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                    active ? 'bg-[#EFF6FF] text-[#1E40AF]' : 'bg-slate-200 text-slate-600',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
