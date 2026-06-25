'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import CouponInput from '@/components/shop/CouponInput';

// ─────────────────────────────────────────────────────────────────────────────
// Cart Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const { items, cartTotal, cartCount, updateQuantity, removeFromCart, loading } =
    useCart();

  const [couponCode, setCouponCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const subtotal = cartTotal;
  const total = Math.max(0, subtotal - discountAmount);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCouponApply = (code: string, discount: number) => {
    setCouponCode(code);
    setDiscountAmount(discount);
    // Persist for checkout page
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'thenijobs_shop_coupon',
        JSON.stringify({ code, discountAmount: discount }),
      );
    }
  };

  const handleCouponRemove = () => {
    setCouponCode('');
    setDiscountAmount(0);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('thenijobs_shop_coupon');
    }
  };

  const handleCheckout = () => {
    router.push('/shop/checkout');
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse mb-8" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-white/5 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/5 rounded w-3/4" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="glass-card rounded-2xl p-5 animate-pulse h-fit">
              <div className="space-y-4">
                <div className="h-5 bg-white/5 rounded w-1/2" />
                <div className="h-10 bg-white/5 rounded" />
                <div className="h-12 bg-white/5 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white font-outfit mb-3">
            Your cart is empty
          </h2>
          <p className="text-gray-400 mb-8">
            Your cart is empty. Start shopping!
          </p>
          <Link
            href="/shop"
            className="btn-gradient px-8 py-3 inline-flex items-center gap-2 font-semibold relative z-10"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Products
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Main cart view ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a1a] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-white font-outfit">
            Your Cart{' '}
            <span className="text-gray-400 font-normal text-lg">
              ({cartCount} {cartCount === 1 ? 'item' : 'items'})
            </span>
          </h1>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* ─────────────── Left: Cart items ─────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.div
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <div className="flex gap-4">
                    {/* Product image */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Product details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm leading-snug truncate">
                        {item.name}
                      </h3>
                      <p className="text-purple-400 font-bold mt-1">
                        ₹{item.price.toFixed(2)}
                      </p>

                      {/* Quantity + remove row */}
                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1 glass-card rounded-xl px-1 py-1">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-white text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stock}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Line total */}
                          <span className="text-white font-bold text-sm">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                          {/* Remove button */}
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Stock warning */}
                      {item.quantity >= item.stock && (
                        <p className="text-amber-400 text-xs mt-1">
                          Max stock reached ({item.stock})
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Continue shopping link */}
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* ─────────────── Right: Order Summary ─────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl p-5 space-y-5 sticky top-24"
          >
            <h2 className="text-lg font-bold text-white font-outfit">
              Order Summary
            </h2>

            {/* Coupon input */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400 font-medium">
                  Coupon Code
                </span>
              </div>
              <CouponInput
                cartTotal={subtotal}
                onApply={handleCouponApply}
                onRemove={handleCouponRemove}
                appliedCode={couponCode || undefined}
              />
            </div>

            {/* Divider */}
            <div className="gradient-divider" />

            {/* Price breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Subtotal ({cartCount} items)
                </span>
                <span className="text-white font-medium">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400">
                    Discount ({couponCode})
                  </span>
                  <span className="text-emerald-400 font-medium">
                    −₹{discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="gradient-divider" />

              <div className="flex justify-between">
                <span className="text-white font-bold">Total</span>
                <span className="text-white font-bold text-lg">
                  ₹{total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={handleCheckout}
              className="btn-gradient w-full px-6 py-3 flex items-center justify-center gap-2 font-semibold text-sm relative z-10"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Trust badge */}
            <p className="text-center text-gray-600 text-xs">
              🔒 Secure order via WhatsApp
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
