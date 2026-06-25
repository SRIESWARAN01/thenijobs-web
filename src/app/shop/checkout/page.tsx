'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Loader2,
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useShopAuth } from '@/hooks/useShopAuth';
import { createOrder } from '@/lib/firebase/shopService';
import { WHATSAPP_BUSINESS_NUMBER, SHOP_NAME } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface StoredCoupon {
  code: string;
  discountAmount: number;
}

interface CustomerForm {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function readStoredCoupon(): StoredCoupon | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('thenijobs_shop_coupon');
    if (!raw) return null;
    return JSON.parse(raw) as StoredCoupon;
  } catch {
    return null;
  }
}

function buildWhatsAppMessage(
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  coupon: StoredCoupon | null,
  form: CustomerForm,
): string {
  const itemLines = items
    .map((i) => `• ${i.name} x${i.quantity} — ₹${(i.price * i.quantity).toFixed(2)}`)
    .join('\n');

  const couponLine = coupon
    ? `\nCoupon: ${coupon.code} (−₹${coupon.discountAmount.toFixed(2)})`
    : '';

  const msg = [
    `Hello ${SHOP_NAME}! I'd like to place an order:`,
    '',
    '*Order Details:*',
    itemLines,
    couponLine,
    '',
    `*Total: ₹${total.toFixed(2)}*`,
    '',
    `*Customer:* ${form.fullName}`,
    `*Phone:* ${form.phone}`,
    `*Address:* ${form.address}`,
    form.notes ? `*Notes:* ${form.notes}` : '',
  ]
    .filter((line) => line !== null)
    .join('\n');

  return msg;
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkout Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { items, cartTotal, cartCount, clearCart } = useCart();
  const { shopUser, shopUserProfile, loading: authLoading } = useShopAuth();

  const [coupon, setCoupon] = useState<StoredCoupon | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [form, setForm] = useState<CustomerForm>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<CustomerForm>>({});

  // ── Read coupon + redirect guards ────────────────────────────────────────

  useEffect(() => {
    setCoupon(readStoredCoupon());
  }, []);

  useEffect(() => {
    if (!authLoading && !shopUser) {
      router.replace('/shop/login?redirect=/shop/checkout');
    }
  }, [authLoading, shopUser, router]);

  useEffect(() => {
    if (!authLoading && items.length === 0 && !orderSuccess) {
      router.replace('/shop/cart');
    }
  }, [authLoading, items.length, orderSuccess, router]);

  // ── Pre-fill from shopUserProfile ────────────────────────────────────────

  useEffect(() => {
    if (shopUserProfile) {
      setForm((prev) => ({
        ...prev,
        fullName: shopUserProfile.fullName || prev.fullName,
        email: shopUserProfile.email || prev.email,
        phone: shopUserProfile.phone || prev.phone,
      }));
    }
  }, [shopUserProfile]);

  // ── Derived values ────────────────────────────────────────────────────────

  const subtotal = cartTotal;
  const discountAmount = coupon?.discountAmount ?? 0;
  const total = Math.max(0, subtotal - discountAmount);

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Partial<CustomerForm> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.phone.trim()) errs.phone = 'Mobile number is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, '')))
      errs.phone = 'Enter a valid 10-digit mobile number';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address';
    if (!form.address.trim()) errs.address = 'Delivery address is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // ── Place order ──────────────────────────────────────────────────────────

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    if (!shopUser) return;

    setPlacing(true);
    try {
      const orderId = await createOrder({
        customerId: shopUser.uid,
        customerName: form.fullName,
        customerEmail: form.email,
        customerPhone: form.phone,
        customerAddress: form.address,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        subtotal,
        couponCode: coupon?.code,
        discountAmount,
        totalAmount: total,
        status: 'pending',
        notes: form.notes || undefined,
      });

      // Build WhatsApp deep-link
      const message = buildWhatsAppMessage(items, total, coupon, form);
      const encoded = encodeURIComponent(message);
      const waUrl = `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encoded}`;

      // Clear cart + coupon
      clearCart();
      localStorage.removeItem('thenijobs_shop_coupon');

      setOrderSuccess(true);

      // Open WhatsApp in new tab (user gesture context)
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      // Navigate after short delay so user sees success state
      setTimeout(() => {
        router.push('/shop/account/orders');
      }, 1800);

      void orderId; // used in Firestore; reference suppresses lint
    } catch (err) {
      console.error('[CheckoutPage] createOrder failed:', err);
      setErrors({
        notes: 'Failed to place order. Please try again.',
      });
    } finally {
      setPlacing(false);
    }
  };

  // ── Auth loading ──────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  // ── Order success splash ──────────────────────────────────────────────────

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white font-outfit mb-2">
            Order Placed!
          </h2>
          <p className="text-gray-400 text-sm">
            Redirecting you to WhatsApp and your orders…
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Main checkout form ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a1a] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/shop/cart"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
          <h1 className="text-2xl font-bold text-white font-outfit">
            Checkout
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Complete your details, then confirm via WhatsApp
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6 items-start">

          {/* ─── Left: Customer details form ─── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="glass-card rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-white font-outfit">
                Customer Details
              </h2>

              {/* Full Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                  <User className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Full Name *
                </label>
                <input
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="search-input w-full px-4 py-3"
                />
                {errors.fullName && (
                  <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Mobile Number *
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="search-input w-full px-4 py-3"
                />
                {errors.phone && (
                  <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Email *
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="search-input w-full px-4 py-3"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Delivery Address *
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Full delivery address including street, city, pincode"
                  rows={3}
                  className="search-input w-full px-4 py-3 resize-none"
                />
                {errors.address && (
                  <p className="text-red-400 text-xs mt-1">{errors.address}</p>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Additional Notes{' '}
                  <span className="text-gray-600 font-normal">(optional)</span>
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any special instructions or preferences"
                  rows={2}
                  className="search-input w-full px-4 py-3 resize-none"
                />
                {errors.notes && (
                  <p className="text-red-400 text-xs mt-1">{errors.notes}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* ─── Right: Order summary ─── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Items list */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-base font-bold text-white font-outfit mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-start gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/5">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">
                        {item.name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-white text-xs font-semibold shrink-0">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="gradient-divider my-4" />

              {/* Coupon display */}
              {coupon && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-emerald-400">
                    Coupon ({coupon.code})
                  </span>
                  <span className="text-emerald-400 font-medium">
                    −₹{coupon.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Subtotal */}
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">
                  Subtotal ({cartCount} items)
                </span>
                <span className="text-white">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Total */}
              <div className="flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-white text-lg">
                  ₹{total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* CTA button */}
            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="btn-gradient w-full px-6 py-3.5 flex items-center justify-center gap-2.5 font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed relative z-10"
            >
              {placing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Placing Order…
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  Place Order &amp; Open WhatsApp
                </>
              )}
            </button>

            <p className="text-center text-gray-600 text-xs px-4">
              Your order will be confirmed via WhatsApp by our team.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
