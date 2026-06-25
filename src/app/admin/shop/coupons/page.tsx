'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Tag, Plus, X, Copy, Check, Pencil, Trash2,
  ToggleLeft, ToggleRight, ChevronDown, Loader2, AlertTriangle,
} from 'lucide-react';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '@/lib/firebase/shopService';
import type { Coupon } from '@/lib/types';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(date: Date | undefined | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function isExpired(date: Date | undefined | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

function toInputDate(date: Date | undefined | null): string {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── blank form state ────────────────────────────────────────────────────────

interface CouponFormState {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: string;
  minOrderAmount: string;
  maxUses: string;
  expiresAt: string;
  description: string;
  isActive: boolean;
}

const BLANK_FORM: CouponFormState = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxUses: '',
  expiresAt: '',
  description: '',
  isActive: true,
};

function couponToForm(c: Coupon): CouponFormState {
  return {
    code: c.code,
    discountType: c.discountType,
    discountValue: String(c.discountValue),
    minOrderAmount: String(c.minOrderAmount),
    maxUses: String(c.maxUses),
    expiresAt: toInputDate(c.expiresAt),
    description: c.description ?? '',
    isActive: c.isActive,
  };
}

// ─── status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ coupon }: { coupon: Coupon }) {
  if (isExpired(coupon.expiresAt)) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-500/15 text-gray-400">
        Expired
      </span>
    );
  }
  if (coupon.isActive) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400">
        Active
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400">
      Inactive
    </span>
  );
}

// ─── inline coupon form ───────────────────────────────────────────────────────

interface CouponFormProps {
  initial: CouponFormState;
  onSave: (data: CouponFormState) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function CouponForm({ initial, onSave, onCancel, saving }: CouponFormProps) {
  const [form, setForm] = useState<CouponFormState>(initial);

  const set = (key: keyof CouponFormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave(form);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card rounded-2xl p-6 space-y-5 border border-violet-500/20"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Coupon Code */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Coupon Code *
          </label>
          <input
            required
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="SAVE20"
            className="search-input w-full px-4 py-3 font-mono tracking-widest"
          />
        </div>

        {/* Expiry Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Expiry Date *
          </label>
          <input
            required
            type="date"
            value={form.expiresAt}
            onChange={(e) => set('expiresAt', e.target.value)}
            className="search-input w-full px-4 py-3"
          />
        </div>

        {/* Discount Type */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Discount Type *
          </label>
          <div className="flex gap-4">
            {(['percentage', 'flat'] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="discountType"
                  value={type}
                  checked={form.discountType === type}
                  onChange={() => set('discountType', type)}
                  className="accent-violet-500"
                />
                <span className="text-sm text-gray-300">
                  {type === 'percentage' ? 'Percentage (%)' : 'Flat Amount (₹)'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Discount Value */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Discount Value * {form.discountType === 'percentage' ? '(%)' : '(₹)'}
          </label>
          <input
            required
            type="number"
            min="0"
            step="any"
            value={form.discountValue}
            onChange={(e) => set('discountValue', e.target.value)}
            placeholder={form.discountType === 'percentage' ? '20' : '100'}
            className="search-input w-full px-4 py-3"
          />
        </div>

        {/* Min Order */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Minimum Order Amount (₹) *
          </label>
          <input
            required
            type="number"
            min="0"
            step="any"
            value={form.minOrderAmount}
            onChange={(e) => set('minOrderAmount', e.target.value)}
            placeholder="500"
            className="search-input w-full px-4 py-3"
          />
        </div>

        {/* Max Uses */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Maximum Uses *
          </label>
          <input
            required
            type="number"
            min="1"
            value={form.maxUses}
            onChange={(e) => set('maxUses', e.target.value)}
            placeholder="100"
            className="search-input w-full px-4 py-3"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Description (optional)
          </label>
          <input
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Brief description of this coupon"
            className="search-input w-full px-4 py-3"
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set('isActive', !form.isActive)}
            className="flex items-center gap-2 text-sm text-gray-300"
          >
            {form.isActive ? (
              <ToggleRight size={24} className="text-emerald-400" />
            ) : (
              <ToggleLeft size={24} className="text-gray-500" />
            )}
            <span>{form.isActive ? 'Active' : 'Inactive'}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="btn-gradient px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : null}
          Save Coupon
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  // ── copy code ──
  async function handleCopy(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  }

  // ── create ──
  async function handleCreate(form: CouponFormState) {
    setSaving(true);
    try {
      await createCoupon({
        code: form.code,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minOrderAmount: parseFloat(form.minOrderAmount),
        maxUses: parseInt(form.maxUses, 10),
        expiresAt: new Date(form.expiresAt),
        description: form.description || undefined,
        isActive: form.isActive,
      });
      setShowCreate(false);
      await fetchCoupons();
    } catch (err) {
      console.error('Failed to create coupon:', err);
    } finally {
      setSaving(false);
    }
  }

  // ── update ──
  async function handleUpdate(id: string, form: CouponFormState) {
    setSaving(true);
    try {
      await updateCoupon(id, {
        code: form.code,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minOrderAmount: parseFloat(form.minOrderAmount),
        maxUses: parseInt(form.maxUses, 10),
        expiresAt: new Date(form.expiresAt),
        description: form.description || undefined,
        isActive: form.isActive,
      });
      setEditingId(null);
      await fetchCoupons();
    } catch (err) {
      console.error('Failed to update coupon:', err);
    } finally {
      setSaving(false);
    }
  }

  // ── delete ──
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteCoupon(id);
      setConfirmDeleteId(null);
      await fetchCoupons();
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    } finally {
      setDeletingId(null);
    }
  }

  // ── toggle active ──
  async function handleToggleActive(coupon: Coupon) {
    setTogglingId(coupon.id);
    try {
      await updateCoupon(coupon.id, { isActive: !coupon.isActive });
      await fetchCoupons();
    } catch (err) {
      console.error('Failed to toggle coupon:', err);
    } finally {
      setTogglingId(null);
    }
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Coupon Management</h1>
          <p className="text-sm text-gray-400 mt-1">
            Create and manage discount coupons for your shop.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate((v) => !v); setEditingId(null); }}
          className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 self-start"
        >
          {showCreate ? <X size={16} /> : <Plus size={16} />}
          {showCreate ? 'Cancel' : 'Create Coupon'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <CouponForm
          initial={BLANK_FORM}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
          saving={saving}
        />
      )}

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Tag size={16} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">All Coupons</h2>
            <p className="text-[10px] text-gray-500">{coupons.length} total</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-violet-400 animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Tag size={36} className="text-gray-600" />
            <p className="text-gray-400 text-sm">No coupons yet. Create your first one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Expiry', 'Status', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {coupons.map((coupon) => (
                  <>
                    <tr
                      key={coupon.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Code */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white tracking-wide">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopy(coupon.code)}
                            className="text-gray-600 hover:text-violet-400 transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check size={13} className="text-emerald-400" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </td>
                      {/* Type */}
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                        {coupon.discountType === 'percentage' ? 'Percentage' : 'Flat'}
                      </td>
                      {/* Value */}
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-white">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : `₹${coupon.discountValue}`}
                      </td>
                      {/* Min Order */}
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                        ₹{coupon.minOrderAmount}
                      </td>
                      {/* Uses */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-white">{coupon.usedCount}</span>
                        <span className="text-gray-600">/{coupon.maxUses}</span>
                      </td>
                      {/* Expiry */}
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                        {formatDate(coupon.expiresAt)}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge coupon={coupon} />
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingId(editingId === coupon.id ? null : coupon.id);
                              setShowCreate(false);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          {/* Toggle Active */}
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            disabled={togglingId === coupon.id}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all disabled:opacity-50"
                            title={coupon.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {togglingId === coupon.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : coupon.isActive ? (
                              <ToggleRight size={14} className="text-emerald-400" />
                            ) : (
                              <ToggleLeft size={14} />
                            )}
                          </button>
                          {/* Delete */}
                          {confirmDeleteId === coupon.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(coupon.id)}
                                disabled={deletingId === coupon.id}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all disabled:opacity-50"
                              >
                                {deletingId === coupon.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : 'Yes'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.06] text-gray-400 hover:bg-white/[0.1] transition-all"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(coupon.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Inline Edit Row */}
                    {editingId === coupon.id && (
                      <tr key={`edit-${coupon.id}`}>
                        <td colSpan={8} className="px-4 py-4 bg-white/[0.02]">
                          <CouponForm
                            initial={couponToForm(coupon)}
                            onSave={(form) => handleUpdate(coupon.id, form)}
                            onCancel={() => setEditingId(null)}
                            saving={saving}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
