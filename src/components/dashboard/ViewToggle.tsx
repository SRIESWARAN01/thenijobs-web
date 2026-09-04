'use client';

import * as React from 'react';
import { LayoutGrid, Table2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ViewMode = 'table' | 'grid';

/**
 * Remembers the operator's table/grid choice per list page.
 *
 * The value is read in an effect rather than during render: this app is a
 * static export, so the first paint is prerendered HTML with no access to
 * localStorage, and seeding state from it directly would hydrate a different
 * tree than the server produced.
 */
export function useViewMode(storageKey: string, initial: ViewMode = 'table') {
  const [view, setView] = React.useState<ViewMode>(initial);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`thenijobs:view:${storageKey}`);
      if (saved === 'table' || saved === 'grid') setView(saved);
    } catch {
      // Private windows and blocked site-data throw on access; the default stands.
    }
  }, [storageKey]);

  const update = React.useCallback((next: ViewMode) => {
    setView(next);
    try {
      window.localStorage.setItem(`thenijobs:view:${storageKey}`, next);
    } catch {
      // Not being able to remember the choice must not break changing it.
    }
  }, [storageKey]);

  return [view, update] as const;
}

/**
 * Segmented table/grid switch.
 *
 * Hidden below md, where the choice is meaningless — a table cannot be read on
 * a 375px screen, so DataTable renders cards there regardless of this setting.
 */
export function ViewToggle({
  value,
  onChange,
  className,
}: {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
  className?: string;
}) {
  const options: { id: ViewMode; label: string; icon: typeof Table2 }[] = [
    { id: 'table', label: 'Table view', icon: Table2 },
    { id: 'grid', label: 'Grid view', icon: LayoutGrid },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Result layout"
      className={cn('hidden shrink-0 items-center gap-1 rounded-xl bg-slate-100 p-1 md:inline-flex', className)}
    >
      {options.map(o => {
        const Icon = o.icon;
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => onChange(o.id)}
            className={cn(
              'inline-flex h-8 w-9 items-center justify-center rounded-lg transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              active ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            <Icon size={15} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
