'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Filter, ExternalLink, Check, ChevronDown } from 'lucide-react';
import { getOrders, updateOrderStatus } from '@/lib/firebase/shopService';
import type { Order, OrderStatus } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  shipped: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<Record<string, OrderStatus>>({});

  async function load() {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data as Order[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleStatusUpdate(orderId: string) {
    const newStatus = pendingStatus[orderId];
    if (!newStatus) return;
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit gradient-text">Order Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track all customer orders</p>
        </div>
        <ShoppingBag size={28} className="text-violet-400" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, colorClass: { hover: 'hover:border-gray-500/30', active: 'border-gray-500/40', text: 'text-white' } },
          { label: 'Pending', value: stats.pending, colorClass: { hover: 'hover:border-amber-500/30', active: 'border-amber-500/40', text: 'text-amber-400' } },
          { label: 'Processing', value: stats.processing, colorClass: { hover: 'hover:border-blue-500/30', active: 'border-blue-500/40', text: 'text-blue-400' } },
          { label: 'Shipped', value: stats.shipped, colorClass: { hover: 'hover:border-violet-500/30', active: 'border-violet-500/40', text: 'text-violet-400' } },
          { label: 'Delivered', value: stats.delivered, colorClass: { hover: 'hover:border-emerald-500/30', active: 'border-emerald-500/40', text: 'text-emerald-400' } },
        ].map(({ label, value, colorClass }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(label === 'Total' ? 'all' : label.toLowerCase() as OrderStatus)}
            className={`glass-card rounded-xl p-4 text-left transition-all ${colorClass.hover} ${
              (statusFilter === label.toLowerCase() || (statusFilter === 'all' && label === 'Total')) ? colorClass.active : ''
            }`}
          >
            <div className={`text-xl font-bold ${colorClass.text}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <Filter size={14} className="text-gray-500" />
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${statusFilter === 'all' ? 'bg-violet-600 text-white' : 'bg-white/[0.05] text-gray-400 hover:text-white'}`}
          >
            All Orders
          </button>
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap ${statusFilter === s ? 'bg-violet-600 text-white' : 'bg-white/[0.05] text-gray-400 hover:text-white'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="premium-card rounded-xl h-16 shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Order ID', 'Customer', 'Items', 'Total', 'Coupon', 'WhatsApp', 'Date', 'Status', 'Update', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const orderDate = order.createdAt instanceof Date
                    ? order.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : '—';
                  const currentPending = pendingStatus[order.id] || order.status;

                  return (
                    <tr key={order.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">#{order.id.slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-3">
                        <div className="text-white font-semibold text-xs">{order.customerName}</div>
                        <div className="text-gray-500 text-xs">{order.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3 text-white font-semibold text-xs">₹{order.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {order.couponCode ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs">{order.couponCode}</span>
                        ) : <span className="text-gray-600 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${order.whatsappSent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'}`}>
                          {order.whatsappSent ? '✓ Sent' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{orderDate}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[order.status] || ''}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="relative">
                            <select
                              value={currentPending}
                              onChange={(e) => setPendingStatus((p) => ({ ...p, [order.id]: e.target.value as OrderStatus }))}
                              className="text-xs bg-white/[0.05] border border-white/[0.1] text-white rounded-lg px-2 py-1.5 appearance-none pr-6 cursor-pointer"
                            >
                              {ORDER_STATUSES.map((s) => <option key={s} value={s} className="bg-[#0d0d20] capitalize">{s}</option>)}
                            </select>
                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                          </div>
                          <button
                            onClick={() => handleStatusUpdate(order.id)}
                            disabled={updatingId === order.id || currentPending === order.status}
                            className="p-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 disabled:opacity-40 transition-all"
                          >
                            {updatingId === order.id ? (
                              <span className="w-3 h-3 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin block" />
                            ) : <Check size={12} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/shop/orders/${order.id}`} className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white inline-flex transition-all">
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
