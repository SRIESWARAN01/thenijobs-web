'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, MessageCircle } from 'lucide-react';
import { getOrderById } from '@/lib/firebase/shopService';
import { WHATSAPP_BUSINESS_NUMBER } from '@/lib/types';
import OrderStatusTimeline from '@/components/shop/OrderStatusTimeline';
import type { Order } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  shipped: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function OrderDetailPageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getOrderById(id);
        setOrder(data as Order | null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center gap-4">
        <Package size={40} className="text-gray-600" />
        <p className="text-gray-400">Order not found.</p>
        <Link href="/shop/account" className="btn-gradient px-6 py-2.5 text-sm">Back to Account</Link>
      </div>
    );
  }

  const waMessage = encodeURIComponent(
    `Hello THENIJOBS Store! I need help with my order #${id.slice(-8).toUpperCase()}.`,
  );
  const orderDate = order.createdAt instanceof Date
    ? order.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-[#0a0a1a] pb-16">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back + Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/shop/account" className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white font-outfit">Order #{id.slice(-8).toUpperCase()}</h1>
            <p className="text-gray-500 text-sm">{orderDate}</p>
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[order.status] || ''}`}>
            {order.status}
          </span>
        </div>

        {/* Timeline */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <h2 className="text-base font-semibold text-white mb-4">Order Status</h2>
          <OrderStatusTimeline status={order.status} />
        </div>

        {/* Items */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <h2 className="text-base font-semibold text-white mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.06] last:border-0">
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} width={48} height={48} className="w-12 h-12 object-cover rounded-xl bg-white/[0.05]" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center">
                      <Package size={18} className="text-gray-600" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <div className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-white">₹{(item.price * item.quantity).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span><span>₹{order.subtotal.toLocaleString()}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                <span>-₹{order.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/[0.06]">
              <span>Total</span><span>₹{order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="glass-card rounded-2xl p-6 mb-4">
          <h2 className="text-base font-semibold text-white mb-3">Delivery Details</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex gap-2"><span className="text-gray-500 w-24">Name</span><span className="text-white">{order.customerName}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24">Phone</span><span className="text-white">{order.customerPhone}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24">Email</span><span className="text-white">{order.customerEmail}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24">Address</span><span className="text-white">{order.customerAddress}</span></div>
            {order.notes && <div className="flex gap-2"><span className="text-gray-500 w-24">Notes</span><span className="text-white">{order.notes}</span></div>}
          </div>
        </div>

        {/* WhatsApp Support */}
        <a
          href={`https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
        >
          <MessageCircle size={18} /> WhatsApp Support
        </a>
      </div>
    </div>
  );
}
