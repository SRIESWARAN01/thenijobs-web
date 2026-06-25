'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Clock, CheckCircle2, IndianRupee, LogOut, ChevronRight } from 'lucide-react';
import { useShopAuth } from '@/hooks/useShopAuth';
import { getOrders } from '@/lib/firebase/shopService';
import type { Order } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  shipped: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

type Tab = 'all' | 'pending' | 'delivered';

export default function AccountPage() {
  const router = useRouter();
  const { shopUser, shopUserProfile, logout, loading } = useShopAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  useEffect(() => {
    if (!loading && !shopUser) {
      router.push('/shop/login?redirect=/shop/account');
    }
  }, [shopUser, loading, router]);

  useEffect(() => {
    if (!shopUser) return;
    async function load() {
      setOrdersLoading(true);
      try {
        const data = await getOrders({ customerId: shopUser!.uid });
        setOrders(data as Order[]);
      } catch (err) {
        console.error(err);
      } finally {
        setOrdersLoading(false);
      }
    }
    load();
  }, [shopUser]);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'pending') return o.status === 'pending' || o.status === 'processing';
    if (activeTab === 'delivered') return o.status === 'delivered';
    return true;
  });

  const totalSpent = orders.reduce((s, o) => s + o.totalAmount, 0);
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;

  const initials = (shopUserProfile?.fullName || shopUser?.displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!shopUser) return null;

  return (
    <div className="min-h-screen bg-[#0a0a1a] pb-16">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0d0d20]/60 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-outfit">
                  {shopUserProfile?.fullName || shopUser.displayName || 'My Account'}
                </h1>
                <p className="text-gray-500 text-sm">{shopUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); router.push('/shop'); }}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Total Orders', value: orders.length, icon: Package, colorClass: 'text-violet-400' },
              { label: 'Delivered', value: deliveredCount, icon: CheckCircle2, colorClass: 'text-emerald-400' },
              { label: 'Pending', value: pendingCount, icon: Clock, colorClass: 'text-amber-400' },
              { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: IndianRupee, colorClass: 'text-cyan-400' },
            ].map(({ label, value, icon: Icon, colorClass }) => (
              <div key={label} className="glass-card rounded-xl p-4">
                <Icon size={16} className={`${colorClass} mb-2`} />
                <div className="text-lg font-bold text-white">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'delivered'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? 'bg-violet-600 text-white' : 'bg-white/[0.05] text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All Orders' : tab === 'pending' ? 'Pending / Processing' : 'Delivered'}
            </button>
          ))}
        </div>

        {/* Orders */}
        {ordersLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="premium-card rounded-xl p-5 shimmer h-24" />
            ))}
          </div>
        )}

        {!ordersLoading && filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <Package size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No orders yet.</p>
            <Link href="/shop/products" className="btn-gradient px-6 py-2.5 text-sm font-semibold mt-4 inline-block">
              Start Shopping
            </Link>
          </div>
        )}

        {!ordersLoading && filteredOrders.length > 0 && (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="premium-card rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-gray-500">#{order.id.slice(-8).toUpperCase()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[order.status] || ''}`}>
                      {order.status}
                    </span>
                    {order.couponCode && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                        🏷 {order.couponCode}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 text-sm text-gray-400">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} •{' '}
                    <span className="text-white font-semibold">₹{order.totalAmount.toLocaleString()}</span>
                    {order.discountAmount > 0 && (
                      <span className="text-emerald-400 ml-1 text-xs">(-₹{order.discountAmount})</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {order.createdAt instanceof Date
                      ? order.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </div>
                </div>
                <Link href={`/shop/account/orders/${order.id}`} className="flex-shrink-0 flex items-center gap-1 text-violet-400 hover:text-violet-300 text-sm font-semibold">
                  View <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
