'use client';

import React, { useState } from 'react';
import { Tag, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { validateCoupon } from '@/lib/firebase/shopService';

// ─────────────────────────────────── Props ───────────────────────────────────

interface CouponInputProps {
  cartTotal: number;
  onApply: (code: string, discountAmount: number) => void;
  onRemove?: () => void;
  appliedCode?: string;
}

// ────────────────────────────────── Component ─────────────────────────────────

export default function CouponInput({
  cartTotal,
  onApply,
  onRemove,
  appliedCode,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a coupon code.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await validateCoupon(code.trim(), cartTotal);
      if (result.valid && result.coupon) {
        setSuccess(
          result.coupon.discountType === 'percentage'
            ? `${result.coupon.discountValue}% off applied!`
            : `₹${result.discountAmount.toFixed(2)} off applied!`,
        );
        onApply(code.trim().toUpperCase(), result.discountAmount);
      } else {
        setError(result.errorMessage ?? 'Invalid coupon code.');
      }
    } catch {
      setError('Failed to validate coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setError(null);
    setSuccess(null);
    onRemove?.();
  };

  // ── If a coupon is already applied, show the applied state ─────────────────
  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-emerald-400 text-sm font-medium truncate">
            &ldquo;{appliedCode}&rdquo; applied
          </span>
        </div>
        <button
          onClick={handleRemove}
          className="text-gray-400 hover:text-red-400 transition-colors shrink-0"
          aria-label="Remove coupon"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
              setSuccess(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder="Enter coupon code"
            className="search-input w-full pl-9 pr-4 py-2.5 text-sm"
            aria-label="Coupon code"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="btn-gradient px-4 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 relative z-10"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </button>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-red-400 text-xs">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-1.5 text-emerald-400 text-xs">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          {success}
        </p>
      )}
    </div>
  );
}
