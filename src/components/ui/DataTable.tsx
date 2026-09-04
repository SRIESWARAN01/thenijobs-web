'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, Eye, Pencil, Trash2, Inbox,
} from 'lucide-react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

/* ── Types ── */
export interface DataTableColumn<T = Record<string, unknown>> {
  key: string; label: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  sortable?: boolean; width?: string;
}
export interface DataTableFilter { key: string; label: string; options: { label: string; value: string }[]; }
export interface DataTableAction<T = Record<string, unknown>> { icon: 'view' | 'edit' | 'delete'; label: string; onClick: (row: T, index: number) => void; variant?: 'default' | 'danger'; }
export interface DataTableBulkAction { label: string; onClick: (selectedIndices: number[]) => void; variant?: 'default' | 'danger'; }
export interface DataTablePagination { page: number; pageSize: number; total: number; onPageChange: (page: number) => void; }
export interface DataTableProps<T = Record<string, unknown>> {
  columns: DataTableColumn<T>[]; data: T[]; searchable?: boolean; searchPlaceholder?: string;
  filters?: DataTableFilter[]; actions?: DataTableAction<T>[]; onRowClick?: (row: T, index: number) => void;
  loading?: boolean; emptyMessage?: string; pagination?: DataTablePagination;
  bulkActions?: DataTableBulkAction[]; className?: string;
}

const ACTION_ICONS = { view: Eye, edit: Pencil, delete: Trash2 };
type SortDir = 'asc' | 'desc' | null;

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function ShimmerRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-gray-50">
          {Array.from({ length: cols + 1 }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <div className="h-3.5 rounded bg-gray-100 animate-pulse" style={{ width: c === 0 ? 18 : `${60 + Math.random() * 30}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, searchable = false, searchPlaceholder = 'Search…',
  filters = [], actions = [], onRowClick, loading = false,
  emptyMessage = 'No data found', pagination, bulkActions = [], className = '',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const hasBulk = bulkActions.length > 0;

  const filteredData = useMemo(() => {
    let result = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(row => columns.some(col => {
        const val = getNestedValue(row, col.key);
        return val != null && String(val).toLowerCase().includes(q);
      }));
    }
    for (const [key, value] of Object.entries(filterValues)) {
      if (value) result = result.filter(row => String(getNestedValue(row, key)) === value);
    }
    return result;
  }, [data, search, filterValues, columns]);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(null); setSortDir(null); }
    } else { setSortKey(key); setSortDir('asc'); }
  }, [sortKey, sortDir]);

  const allSelected = sortedData.length > 0 && selected.size === sortedData.length;
  const someSelected = selected.size > 0 && !allSelected;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(sortedData.map((_, i) => i)));
  const toggleRow = (index: number) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(index)) { next.delete(index); } else { next.add(index); }
    return next;
  });
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;

  const selectCls = "flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=indeterminate]:bg-blue-600 data-[state=indeterminate]:border-blue-600 transition-all";

  return (
    <div className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm ${className}`}>
      {/* Toolbar */}
      {(searchable || filters.length > 0 || (hasBulk && selected.size > 0)) && (
        <div className="px-4 md:px-5 py-3.5 border-b border-gray-50 flex flex-wrap items-center gap-3" style={{ background: '#F8FAFC' }}>
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all" />
            </div>
          )}
          {filters.map(filter => (
            <select key={filter.key} value={filterValues[filter.key] ?? ''} onChange={e => setFilterValues(prev => ({ ...prev, [filter.key]: e.target.value }))}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl text-gray-600 appearance-none cursor-pointer focus:outline-none focus:border-blue-400 transition-all min-w-[120px]">
              <option value="">{filter.label}</option>
              {filter.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          ))}
          {hasBulk && selected.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-500 font-medium">{selected.size} selected</span>
              {bulkActions.map((action, i) => (
                <button key={i} onClick={() => action.onClick(Array.from(selected))}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    action.variant === 'danger' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}>
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {hasBulk && (
                <th className="w-12 px-4 py-3">
                  <Checkbox.Root checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={toggleAll} className={selectCls}>
                    <Checkbox.Indicator><Check className="w-2.5 h-2.5 text-white" /></Checkbox.Indicator>
                  </Checkbox.Root>
                </th>
              )}
              {columns.map(col => (
                <th key={col.key}
                  className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500 ${col.sortable ? 'cursor-pointer select-none hover:text-gray-800' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}>
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key
                        ? sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-500" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                        : <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </span>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="w-28 px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <ShimmerRows cols={columns.length + (actions.length > 0 ? 1 : 0)} />
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasBulk ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-200">
                    <Inbox className="w-10 h-10" strokeWidth={1.2} />
                    <p className="text-sm text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr key={rowIndex} onClick={() => onRowClick?.(row, rowIndex)}
                  className={`border-t border-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} hover:bg-blue-50/30`}>
                  {hasBulk && (
                    <td className="w-12 px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <Checkbox.Root checked={selected.has(rowIndex)} onCheckedChange={() => toggleRow(rowIndex)} className={selectCls}>
                        <Checkbox.Indicator><Check className="w-2.5 h-2.5 text-white" /></Checkbox.Indicator>
                      </Checkbox.Root>
                    </td>
                  )}
                  {columns.map(col => {
                    const cellValue = getNestedValue(row, col.key);
                    return (
                      <td key={col.key} className="px-4 py-3.5 text-gray-700" style={{ width: col.width }}>
                        {col.render ? col.render(cellValue, row, rowIndex) : (cellValue != null ? String(cellValue) : '—')}
                      </td>
                    );
                  })}
                  {actions.length > 0 && (
                    <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        {actions.map((action, ai) => {
                          const ActionIcon = ACTION_ICONS[action.icon];
                          return (
                            <button key={ai} onClick={() => action.onClick(row, rowIndex)} title={action.label}
                              className={`p-1.5 rounded-lg transition-all ${
                                action.variant === 'danger'
                                  ? 'text-slate-500 hover:text-red-500 hover:bg-red-50'
                                  : 'text-slate-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}>
                              <ActionIcon className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-4 md:px-5 py-3 border-t border-gray-50 flex items-center justify-between text-xs text-slate-500" style={{ background: '#F8FAFC' }}>
          <span>
            {pagination.total === 0 ? 'No results' : `${(pagination.page - 1) * pagination.pageSize + 1}–${Math.min(pagination.page * pagination.pageSize, pagination.total)} of ${pagination.total}`}
          </span>
          <div className="flex items-center gap-1">
            <button disabled={pagination.page <= 1} onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (pagination.page <= 3) pageNum = i + 1;
              else if (pagination.page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = pagination.page - 2 + i;
              return (
                <button key={pageNum} onClick={() => pagination.onPageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                    pagination.page === pageNum ? 'text-white' : 'text-slate-500 hover:bg-gray-100 hover:text-gray-700'
                  }`} style={pagination.page === pageNum ? { background: '#2563EB' } : {}}>
                  {pageNum}
                </button>
              );
            })}
            <button disabled={pagination.page >= totalPages} onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
