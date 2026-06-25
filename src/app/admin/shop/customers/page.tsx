'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, Search, ShoppingBag, DollarSign, UserCheck,
  Loader2, ExternalLink, TrendingUp, Calendar,
} from 'lucide-react';
import { getShopCustomers } from '@/lib/firebase/shopService';
import type { ShopCustomer } from '@/lib/firebase/shopService';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date | undefined | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function isWithinLastNDays(date: Date, days: number): boolean {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  return date >= threshold;
}

// ─── stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, suffix = '',
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: 'violet' | 'cyan' | 'emerald' | 'amber';
  suffix?: string;
}) {
  const colorMap = {
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  };
  const c = colorMap[color];
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
        <Icon size={18} className={c.text} />
      </div>
      <p className="text-2xl font-bold text-white font-outfit">
        {value}{suffix}
      </p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [customers, setCustomers] = useState<ShopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getShopCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // ── derived stats ──
  const stats = useMemo(() => {
    const total = customers.length;
    const newThisWeek = customers.filter((c) =>
      isWithinLastNDays(c.lastOrderAt, 7),
    ).length;
    const activeToday = customers.filter((c) =>
      isWithinLastNDays(c.lastOrderAt, 1),
    ).length;
    return { total, newThisWeek, activeToday };
  }, [customers]);

  // ── filtered list ──
  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const term = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(term) ||
        c.customerEmail.toLowerCase().includes(term) ||
        c.customerPhone?.toLowerCase().includes(term),
    );
  }, [customers, search]);

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-outfit">Customer Management</h1>
        <p className="text-sm text-gray-400 mt-1">
          View and manage all shop customers.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Customers" value={stats.total} icon={Users} color="violet" />
        <StatCard label="Active Today" value={stats.activeToday} icon={UserCheck} color="emerald" />
        <StatCard label="New This Week" value={stats.newThisWeek} icon={TrendingUp} color="cyan" />
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Users size={16} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">All Customers</h2>
              <p className="text-[10px] text-gray-500">
                {filtered.length} of {customers.length}
              </p>
            </div>
          </div>
          {/* Search */}
          <div className="relative sm:w-72">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone…"
              className="search-input w-full pl-9 pr-4 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-violet-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users size={36} className="text-gray-600" />
            <p className="text-gray-400 text-sm">
              {search ? 'No customers match your search.' : 'No customers yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {[
                    'Customer', 'Email', 'Phone',
                    'Last Order', 'Orders', 'Total Spent', 'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((customer) => (
                  <tr
                    key={customer.customerId}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Name */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-500/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {customer.customerName?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <span className="font-medium text-white truncate max-w-[140px]">
                          {customer.customerName || '—'}
                        </span>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap max-w-[180px]">
                      <span className="truncate block">{customer.customerEmail || '—'}</span>
                    </td>
                    {/* Phone */}
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {customer.customerPhone || '—'}
                    </td>
                    {/* Last Order */}
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-gray-600" />
                        {formatDate(customer.lastOrderAt)}
                      </div>
                    </td>
                    {/* Order Count */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-xs font-semibold">
                        {customer.orderCount}
                      </span>
                    </td>
                    {/* Total Spent */}
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-emerald-400">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/admin/shop/orders?customerId=${customer.customerId}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all"
                      >
                        <ShoppingBag size={12} />
                        View Orders
                        <ExternalLink size={10} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
