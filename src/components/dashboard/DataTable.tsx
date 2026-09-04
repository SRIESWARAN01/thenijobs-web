'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Inbox, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CardRole = 'title' | 'subtitle' | 'field' | 'hidden';
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

export interface Column<T> {
  /** Stable key. Also the sort key. */
  key: string;
  header: string;
  /** Cell content. Defaults to `String(row[key])` when the row is index-able. */
  render?: (row: T) => React.ReactNode;
  /** Return a comparable value to make the column sortable. */
  sortValue?: (row: T) => string | number | null | undefined;
  align?: 'left' | 'center' | 'right';
  /** Applied to the `<th>` so column widths stay stable while data loads. */
  width?: string;
  /**
   * Where this column goes in the mobile card. `title` is the headline,
   * `subtitle` sits under it, `field` becomes a label/value row, `hidden`
   * is dropped on phones. Defaults to `field`.
   */
  card?: CardRole;
  /** Drop the column from the *table* below this breakpoint. */
  hideBelow?: Breakpoint;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  /** Rows to draw as skeletons while `loading`. */
  skeletonRows?: number;
  onRowClick?: (row: T) => void;
  /** Rendered at the end of each table row and at the foot of each card. */
  rowActions?: (row: T) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: React.ReactNode;
  /** Selection. Provide both to enable checkboxes. */
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Sticky header inside the table's own scroll container. */
  stickyHeader?: boolean;
  dense?: boolean;
  className?: string;
  /** Caption for assistive technology. */
  label?: string;
}

const HIDE_BELOW: Record<Breakpoint, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
};

const ALIGN: Record<'left' | 'center' | 'right', string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function defaultRender<T>(row: T, key: string): React.ReactNode {
  const v = (row as Record<string, unknown>)[key];
  if (v === null || v === undefined || v === '') return <span className="text-slate-300">—</span>;
  if (typeof v === 'string' || typeof v === 'number') return v;
  return null;
}

/* ------------------------------------------------------------------ */
/*  Checkbox — native input, so it is keyboard and screen-reader sound */
/* ------------------------------------------------------------------ */

function SelectBox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate) && !checked;
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="tap-target-auto h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading = false,
  skeletonRows = 6,
  onRowClick,
  rowActions,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyIcon = Inbox,
  emptyAction,
  selectedIds,
  onSelectionChange,
  stickyHeader = true,
  dense = false,
  className,
  label,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const selectable = Boolean(selectedIds && onSelectionChange);
  const selected = React.useMemo(() => new Set(selectedIds ?? []), [selectedIds]);

  const sorted = React.useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    });
  }, [rows, sortKey, sortDir, columns]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortKey(null);
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const allIds = React.useMemo(() => sorted.map(getRowId), [sorted, getRowId]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = allIds.some((id) => selected.has(id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : allIds);
  };
  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange([...next]);
  };

  const cardCols = React.useMemo(() => {
    const titleCol = columns.find((c) => c.card === 'title') ?? columns[0];
    const subtitleCol = columns.find((c) => c.card === 'subtitle');
    const fieldCols = columns.filter(
      (c) => c !== titleCol && c !== subtitleCol && c.card !== 'hidden',
    );
    return { titleCol, subtitleCol, fieldCols };
  }, [columns]);

  /* ---------------- loading ---------------- */
  if (loading) {
    return (
      <div className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white', className)}>
        {/* phone */}
        <div className="divide-y divide-slate-100 md:hidden">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="space-y-2.5 p-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
        {/* desktop */}
        <div className="hidden md:block">
          <div className="flex gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
            {columns.map((c) => (
              <Skeleton key={c.key} className="h-3 flex-1" />
            ))}
          </div>
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-slate-50 px-5 py-4">
              {columns.map((c) => (
                <Skeleton key={c.key} className="h-3.5 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- empty ---------------- */
  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }

  const pad = dense ? 'px-3 py-2.5' : 'px-4 py-3.5 sm:px-5';

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white', className)}>
      {/* ---------- Phone: cards ---------- */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {sorted.map((row) => {
          const id = getRowId(row);
          const { titleCol, subtitleCol, fieldCols } = cardCols;
          const clickable = Boolean(onRowClick);
          return (
            <li key={id} className={cn(selected.has(id) && 'bg-blue-50/40')}>
              <div
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => onRowClick!(row) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick!(row);
                        }
                      }
                    : undefined
                }
                className={cn('p-4', clickable && 'cursor-pointer active:bg-slate-50')}
              >
                <div className="flex items-start gap-3">
                  {selectable && (
                    <div className="pt-0.5">
                      <SelectBox
                        checked={selected.has(id)}
                        onChange={() => toggleOne(id)}
                        label={`Select row ${id}`}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">
                      {titleCol
                        ? (titleCol.render?.(row) ?? defaultRender(row, titleCol.key))
                        : null}
                    </div>
                    {subtitleCol && (
                      <div className="mt-0.5 text-xs text-slate-500">
                        {subtitleCol.render?.(row) ?? defaultRender(row, subtitleCol.key)}
                      </div>
                    )}
                    {fieldCols.length > 0 && (
                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                        {fieldCols.map((c) => (
                          <div key={c.key} className="min-w-0">
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              {c.header}
                            </dt>
                            <dd className="mt-0.5 truncate text-xs font-medium text-slate-700">
                              {c.render?.(row) ?? defaultRender(row, c.key)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </div>
                {rowActions && (
                  <div
                    className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {rowActions(row)}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* ---------- Tablet and up: table ---------- */}
      <div className="hidden md:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left">
            {label && <caption className="sr-only">{label}</caption>}
            <thead
              className={cn(
                'bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500',
                stickyHeader && 'sticky top-0 z-10',
              )}
            >
              <tr>
                {selectable && (
                  <th scope="col" className={cn('w-10', pad)}>
                    <SelectBox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                      label="Select all rows"
                    />
                  </th>
                )}
                {columns.map((c) => {
                  const sortable = Boolean(c.sortValue);
                  const active = sortKey === c.key;
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      style={c.width ? { width: c.width } : undefined}
                      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                      className={cn(
                        'font-semibold whitespace-nowrap',
                        pad,
                        ALIGN[c.align ?? 'left'],
                        c.hideBelow && HIDE_BELOW[c.hideBelow],
                        c.className,
                      )}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className="tap-target-auto inline-flex items-center gap-1 rounded transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          {c.header}
                          {active ? (
                            sortDir === 'asc' ? (
                              <ArrowUp size={12} className="text-blue-600" />
                            ) : (
                              <ArrowDown size={12} className="text-blue-600" />
                            )
                          ) : (
                            <ChevronsUpDown size={12} className="text-slate-300" />
                          )}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
                {rowActions && (
                  <th scope="col" className={cn('text-right font-semibold', pad)}>
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((row) => {
                const id = getRowId(row);
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer',
                      selected.has(id) ? 'bg-blue-50/50' : 'hover:bg-slate-50/70',
                    )}
                  >
                    {selectable && (
                      <td className={pad}>
                        <SelectBox
                          checked={selected.has(id)}
                          onChange={() => toggleOne(id)}
                          label={`Select row ${id}`}
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          'text-sm text-slate-700 align-middle',
                          pad,
                          ALIGN[c.align ?? 'left'],
                          c.hideBelow && HIDE_BELOW[c.hideBelow],
                          c.className,
                        )}
                      >
                        {c.render?.(row) ?? defaultRender(row, c.key)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className={cn('text-right', pad)} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">{rowActions(row)}</div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
