'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

/**
 * The list-page control bar: search, filters, trailing actions, and a bulk bar
 * that replaces the row once something is selected.
 *
 * Mobile behaviour is the point. Search takes the full width on its own line;
 * the filter row scrolls horizontally instead of wrapping into a four-line
 * stack that pushes the data off the screen.
 */
export function Toolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  actions,
  selectedCount = 0,
  bulkActions,
  onClearSelection,
  className,
}: {
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  selectedCount?: number;
  bulkActions?: React.ReactNode;
  onClearSelection?: () => void;
  className?: string;
}) {
  if (selectedCount > 0 && bulkActions) {
    return (
      <div
        className={cn(
          'flex flex-col gap-3 rounded-2xl border border-blue-200 bg-[#EFF6FF] p-3 sm:flex-row sm:items-center sm:justify-between',
          className,
        )}
      >
        <div className="flex items-center gap-2">
          {onClearSelection && (
            <Button size="icon" variant="ghost" onClick={onClearSelection} aria-label="Clear selection">
              <X size={15} />
            </Button>
          )}
          <p className="text-xs font-semibold text-[#1E40AF] sm:text-sm">
            {selectedCount} selected
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{bulkActions}</div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3', className)}>
      {onSearchChange && (
        <div className="relative flex-1 lg:max-w-md">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            /* 16px on phones: anything smaller makes iOS Safari zoom on focus. */
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
          />
        </div>
      )}

      {filters && (
        <div className="-mx-4 overflow-x-auto px-4 pb-0.5 lg:mx-0 lg:overflow-visible lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-2 lg:w-auto lg:flex-wrap">{filters}</div>
        </div>
      )}

      {actions && (
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">{actions}</div>
      )}
    </div>
  );
}

/** A select styled to match the toolbar. Native on purpose: on a phone the OS
 *  picker beats every custom dropdown for reach and accessibility. */
export function FilterSelect({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  label: string;
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-10 shrink-0 cursor-pointer rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
        value && value !== 'all' && 'border-blue-300 bg-[#EFF6FF] text-[#1E40AF]',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
