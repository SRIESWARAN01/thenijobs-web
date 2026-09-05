'use client';

import type { ReactNode } from 'react';
import { Search, MapPin, X, SlidersHorizontal } from 'lucide-react';

interface LocationSelect {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

interface StickySearchBarProps {
  searchId?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  location?: LocationSelect;
  filterActiveCount?: number;
  filterOpen?: boolean;
  onFilterClick: () => void;
  extraActions?: ReactNode;
  /** Optional panel rendered below the bar row, e.g. an inline expandable filter drawer. */
  children?: ReactNode;
  /** Aligns the bar with the page's own content width. Defaults to the wider (3-column) layouts. */
  maxWidthClassName?: string;
}

/**
 * Canonical sticky search bar — search input + optional location dropdown share one
 * bordered control, plus a Filters button with an active-count badge. Used identically
 * on the Business directory and Jobs pages so both feel like one system.
 */
export default function StickySearchBar({
  searchId,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  location,
  filterActiveCount = 0,
  filterOpen = false,
  onFilterClick,
  extraActions,
  children,
  maxWidthClassName = 'max-w-7xl',
}: StickySearchBarProps) {
  return (
    <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm px-4 sm:px-6 py-3">
      <div className={`${maxWidthClassName} mx-auto flex flex-wrap gap-2`}>
        <div className="flex-[1_1_260px] flex items-stretch bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-300 transition-colors">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 min-w-0">
            <Search size={15} className="text-slate-500 flex-shrink-0" />
            <input
              id={searchId}
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              type="text"
              placeholder={searchPlaceholder}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="canonical-search-field flex-1 min-w-0 bg-transparent text-base sm:text-sm text-gray-900 placeholder-gray-400 outline-none"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="tap-target-auto shrink-0 w-5 h-5 flex items-center justify-center text-slate-500 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
          {location && (
            <>
              <div className="w-px my-2 bg-gray-200 shrink-0" />
              <div className="flex items-center gap-1.5 px-3 py-2.5 shrink-0">
                <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                <select
                  value={location.value}
                  onChange={e => location.onChange(e.target.value)}
                  className="canonical-search-field bg-transparent text-base sm:text-sm text-gray-700 outline-none pr-1 w-16 cursor-pointer"
                >
                  {location.options.map(opt => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {extraActions}

        <button
          type="button"
          onClick={onFilterClick}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
            filterOpen || filterActiveCount > 0
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filters</span>
          {filterActiveCount > 0 && (
            <span
              className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
              style={{ background: '#2563EB' }}
            >
              {filterActiveCount}
            </span>
          )}
        </button>
      </div>

      {children && <div className={`${maxWidthClassName} mx-auto mt-3`}>{children}</div>}
    </div>
  );
}
