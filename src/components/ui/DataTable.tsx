'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Inbox,
} from 'lucide-react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DataTableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableFilter {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface DataTableAction<T = Record<string, unknown>> {
  icon: 'view' | 'edit' | 'delete';
  label: string;
  onClick: (row: T, index: number) => void;
  variant?: 'default' | 'danger';
}

export interface DataTableBulkAction {
  label: string;
  onClick: (selectedIndices: number[]) => void;
  variant?: 'default' | 'danger';
}

export interface DataTablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  actions?: DataTableAction<T>[];
  onRowClick?: (row: T, index: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  pagination?: DataTablePagination;
  bulkActions?: DataTableBulkAction[];
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const ACTION_ICONS = {
  view: Eye,
  edit: Pencil,
  delete: Trash2,
};

type SortDir = 'asc' | 'desc' | null;

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function renderCellContent<T extends Record<string, unknown>>(
  col: DataTableColumn<T>,
  row: T,
  index: number,
) {
  const cellValue = getNestedValue(row, col.key);
  return col.render
    ? col.render(cellValue, row, index)
    : (cellValue != null ? String(cellValue) : '-');
}

/* ------------------------------------------------------------------ */
/*  Shimmer rows                                                       */
/* ------------------------------------------------------------------ */

function ShimmerRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-white/[0.03]">
          {Array.from({ length: cols + 1 }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <div
                className="h-3.5 rounded bg-white/[0.06] shimmer"
                style={{ width: c === 0 ? 18 : `${60 + Math.random() * 30}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = false,
  searchPlaceholder = 'Search…',
  filters = [],
  actions = [],
  onRowClick,
  loading = false,
  emptyMessage = 'No data found',
  pagination,
  bulkActions = [],
  className = '',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const hasBulk = bulkActions.length > 0;

  /* ---- Filter + search ---- */
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const val = getNestedValue(row, col.key);
          return val != null && String(val).toLowerCase().includes(q);
        }),
      );
    }

    // Filters
    for (const [key, value] of Object.entries(filterValues)) {
      if (value) {
        result = result.filter((row) => String(getNestedValue(row, key)) === value);
      }
    }

    return result;
  }, [data, search, filterValues, columns]);

  /* ---- Sort ---- */
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  /* ---- Sort handler ---- */
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        if (sortDir === 'asc') setSortDir('desc');
        else if (sortDir === 'desc') {
          setSortKey(null);
          setSortDir(null);
        }
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey, sortDir],
  );

  /* ---- Selection ---- */
  const allSelected = sortedData.length > 0 && selected.size === sortedData.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sortedData.map((_, i) => i)));
    }
  };

  const toggleRow = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  /* ---- Pagination ---- */
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;

  return (
    <div className={`glass-card rounded-2xl overflow-hidden ${className}`}>
      {/* ---- Toolbar ---- */}
      {(searchable || filters.length > 0 || (hasBulk && selected.size > 0)) && (
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-5">
          {/* Search */}
          {searchable && (
            <div className="relative w-full min-w-0 sm:max-w-sm sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="search-input w-full pl-9 pr-4 py-2 text-sm"
              />
            </div>
          )}

          {/* Filters */}
          {filters.map((filter) => (
            <select
              key={filter.key}
              value={filterValues[filter.key] ?? ''}
              onChange={(e) =>
                setFilterValues((prev) => ({ ...prev, [filter.key]: e.target.value }))
              }
              className="search-input w-full px-3 py-2 text-sm bg-white/[0.04] sm:w-auto sm:min-w-[120px]
                appearance-none cursor-pointer"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {/* Bulk actions */}
          {hasBulk && selected.size > 0 && (
            <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
              <span className="text-xs text-white/40">{selected.size} selected</span>
              {bulkActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => action.onClick(Array.from(selected))}
                  className={`min-h-9 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors
                    ${
                      action.variant === 'danger'
                        ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                        : 'text-white/70 bg-white/[0.06] hover:bg-white/[0.1]'
                    }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- Mobile card rows ---- */}
      <div className="space-y-3 p-3 sm:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <div className="h-4 w-2/3 rounded bg-white/[0.06] shimmer" />
              <div className="mt-3 h-3 w-full rounded bg-white/[0.06] shimmer" />
              <div className="mt-2 h-3 w-4/5 rounded bg-white/[0.06] shimmer" />
            </div>
          ))
        ) : sortedData.length === 0 ? (
          <div className="py-12 text-center">
            <div className="flex flex-col items-center gap-3 text-white/30">
              <Inbox className="w-10 h-10" strokeWidth={1.2} />
              <p className="text-sm">{emptyMessage}</p>
            </div>
          </div>
        ) : (
          sortedData.map((row, rowIndex) => {
            const rowKey = String(row.id || row.uid || row._id || row.key || rowIndex);
            return (
              <article
                key={rowKey}
                onClick={() => onRowClick?.(row, rowIndex)}
                className={`rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                  hover:bg-purple-500/[0.04]`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                      {columns[0]?.label ?? 'Item'}
                    </p>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {columns[0] ? renderCellContent(columns[0], row, rowIndex) : `Row ${rowIndex + 1}`}
                    </div>
                  </div>

                  {hasBulk && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox.Root
                        checked={selected.has(rowIndex)}
                        onCheckedChange={() => toggleRow(rowIndex)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20
                          bg-white/[0.04] data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600
                          transition-colors"
                      >
                        <Checkbox.Indicator>
                          <Check className="w-4 h-4 text-white" />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                    </div>
                  )}
                </div>

                {columns.length > 1 && (
                  <dl className="mt-3 space-y-2 border-t border-white/[0.05] pt-3">
                    {columns.slice(1).map((col) => (
                      <div key={col.key} className="grid grid-cols-[6.5rem_1fr] gap-3 text-xs">
                        <dt className="text-white/35">{col.label}</dt>
                        <dd className="min-w-0 text-right text-white/75">
                          {renderCellContent(col, row, rowIndex)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                {actions.length > 0 && (
                  <div
                    className="mt-4 flex flex-wrap justify-end gap-2 border-t border-white/[0.05] pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actions.map((action, ai) => {
                      const ActionIcon = ACTION_ICONS[action.icon];
                      return (
                        <button
                          key={ai}
                          onClick={() => action.onClick(row, rowIndex)}
                          title={action.label}
                          className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors
                            ${
                              action.variant === 'danger'
                                ? 'text-rose-300 bg-rose-500/10 hover:bg-rose-500/20'
                                : 'text-white/70 bg-white/[0.06] hover:bg-white/[0.1]'
                            }`}
                        >
                          <ActionIcon className="w-4 h-4" />
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* ---- Table ---- */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-white/[0.06]">
              {/* Checkbox col */}
              {hasBulk && (
                <th className="w-12 px-4 py-3 sticky left-0 bg-[rgba(10,10,26,0.95)] z-10">
                  <Checkbox.Root
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleAll}
                    className="flex h-4 w-4 items-center justify-center rounded border border-white/20
                      bg-white/[0.04] data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600
                      data-[state=indeterminate]:bg-purple-600 data-[state=indeterminate]:border-purple-600
                      transition-colors"
                  >
                    <Checkbox.Indicator>
                      <Check className="w-3 h-3 text-white" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                </th>
              )}

              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40
                    ${col.sortable ? 'cursor-pointer select-none hover:text-white/60' : ''}
                    first:sticky first:left-0 first:bg-[rgba(10,10,26,0.95)] first:z-10`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="inline-flex flex-col">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-purple-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 text-white/20" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}

              {/* Actions header */}
              {actions.length > 0 && (
                <th className="w-28 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/40">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <ShimmerRows cols={columns.length + (actions.length > 0 ? 1 : 0)} />
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasBulk ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3 text-white/30">
                    <Inbox className="w-10 h-10" strokeWidth={1.2} />
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => {
                const rowKey = String(row.id || row.uid || row._id || row.key || rowIndex);
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row, rowIndex)}
                    className={`border-b border-white/[0.03] transition-colors
                      ${onRowClick ? 'cursor-pointer' : ''}
                      hover:bg-purple-500/[0.04]`}
                  >
                    {/* Checkbox */}
                    {hasBulk && (
                      <td
                        className="w-12 px-4 py-3 sticky left-0 bg-[rgba(10,10,26,0.95)] z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox.Root
                          checked={selected.has(rowIndex)}
                          onCheckedChange={() => toggleRow(rowIndex)}
                          className="flex h-4 w-4 items-center justify-center rounded border border-white/20
                            bg-white/[0.04] data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600
                            transition-colors"
                        >
                          <Checkbox.Indicator>
                            <Check className="w-3 h-3 text-white" />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                      </td>
                    )}

                    {/* Data cells */}
                    {columns.map((col) => {
                      return (
                        <td
                          key={col.key}
                          className="px-4 py-3 text-white/80
                            first:sticky first:left-0 first:bg-[rgba(10,10,26,0.95)] first:z-10"
                          style={{ width: col.width }}
                        >
                          {renderCellContent(col, row, rowIndex)}
                        </td>
                      );
                    })}

                    {/* Actions */}
                    {actions.length > 0 && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          {actions.map((action, ai) => {
                            const ActionIcon = ACTION_ICONS[action.icon];
                            return (
                              <button
                                key={ai}
                                onClick={() => action.onClick(row, rowIndex)}
                                title={action.label}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors
                                  ${
                                    action.variant === 'danger'
                                      ? 'text-white/30 hover:text-rose-400 hover:bg-rose-500/10'
                                      : 'text-white/30 hover:text-white/70 hover:bg-white/[0.06]'
                                  }`}
                              >
                                <ActionIcon className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ---- Pagination ---- */}
      {pagination && (
        <div className="flex flex-col gap-3 border-t border-white/[0.06] px-4 py-3 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <span>
            {pagination.total === 0
              ? 'No results'
              : `${(pagination.page - 1) * pagination.pageSize + 1}–${Math.min(
                  pagination.page * pagination.pageSize,
                  pagination.total,
                )} of ${pagination.total}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/[0.06] disabled:opacity-30
                disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`h-9 w-9 rounded-lg text-xs font-medium transition-colors
                    ${
                      pagination.page === pageNum
                        ? 'bg-purple-600 text-white'
                        : 'text-white/40 hover:bg-white/[0.06] hover:text-white/70'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/[0.06] disabled:opacity-30
                disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
