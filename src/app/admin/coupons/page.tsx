'use client';

import { useState } from 'react';
import { useCollection } from '@/hooks/useFirestore';
import { createDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';
import {
  Ticket, Plus, Search, Edit3, Trash2, Copy,
  Calendar, Users, Percent, DollarSign, Loader2,
  CheckCircle, XCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { matchesSearch } from '@/lib/search';
import { Modal } from '@/components/ui/Modal';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  description: string;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  applicablePlans: string[];
  isActive: boolean;
  createdAt: any;
}

const PLAN_OPTIONS = ['basic', 'premium', 'enterprise'];

export default function AdminCouponsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'flat'>('percentage');
  const [value, setValue] = useState(10);
  const [description, setDescription] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [usageLimit, setUsageLimit] = useState(100);
  const [applicablePlans, setApplicablePlans] = useState<string[]>(['basic', 'premium', 'enterprise']);

  const { data: coupons, loading } = useCollection<Coupon>('coupons');

  const filtered = coupons.filter((c) =>
    !search || matchesSearch(search, [c.code, c.description])
  );

  const resetForm = () => {
    setCode('');
    setType('percentage');
    setValue(10);
    setDescription('');
    setValidFrom('');
    setValidUntil('');
    setUsageLimit(100);
    setApplicablePlans(['basic', 'premium', 'enterprise']);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    // Auto-generate code
    setCode(`TNJ${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    setShowModal(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setCode(coupon.code);
    setType(coupon.type);
    setValue(coupon.value);
    setDescription(coupon.description);
    setValidFrom(coupon.validFrom || '');
    setValidUntil(coupon.validUntil || '');
    setUsageLimit(coupon.usageLimit);
    setApplicablePlans(coupon.applicablePlans || []);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!code.trim()) return alert('Coupon code is required');
    setSaving(true);
    try {
      const data = {
        code: code.trim().toUpperCase(),
        type,
        value,
        description: description.trim(),
        validFrom,
        validUntil,
        usageLimit,
        applicablePlans,
        isActive: true,
      };

      if (editing) {
        await updateDocument('coupons', editing.id, data);
      } else {
        await createDocument('coupons', { ...data, usedCount: 0 });
      }

      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save coupon:', err);
      alert('Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    await updateDocument('coupons', coupon.id, { isActive: !coupon.isActive });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await deleteDocument('coupons', id);
  };

  const copyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    alert('Coupon code copied!');
  };

  const activeCoupons = coupons.filter((c) => c.isActive);
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket size={22} className="text-amber-400" />
            Coupon Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">Create and manage discount coupons for subscription plans</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={14} /> Create Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{coupons.length}</p>
          <p className="text-[10px] text-gray-500 mt-1">Total Coupons</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{activeCoupons.length}</p>
          <p className="text-[10px] text-gray-500 mt-1">Active</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{totalRedemptions}</p>
          <p className="text-[10px] text-gray-500 mt-1">Redemptions</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search coupons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input w-full pl-11 pr-4 py-3 text-sm"
        />
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="text-amber-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Ticket size={32} className="text-gray-500 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No coupons found. Create your first coupon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((coupon) => (
            <div key={coupon.id} className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${coupon.isActive ? 'bg-amber-500/15' : 'bg-gray-500/15'}`}>
                    {coupon.type === 'percentage' ? (
                      <Percent size={18} className={coupon.isActive ? 'text-amber-400' : 'text-gray-500'} />
                    ) : (
                      <DollarSign size={18} className={coupon.isActive ? 'text-amber-400' : 'text-gray-500'} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded">{coupon.code}</code>
                      <button onClick={() => copyCode(coupon.code)} className="text-gray-500 hover:text-white transition-colors">
                        <Copy size={12} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {coupon.type === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleActive(coupon)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {coupon.isActive ? (
                    <ToggleRight size={22} className="text-emerald-400" />
                  ) : (
                    <ToggleLeft size={22} className="text-gray-500" />
                  )}
                </button>
              </div>

              {coupon.description && (
                <p className="text-xs text-gray-400 mb-3">{coupon.description}</p>
              )}

              <div className="flex items-center gap-4 text-[10px] text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Users size={10} /> {coupon.usedCount || 0}/{coupon.usageLimit} used</span>
                {coupon.validUntil && (
                  <span className="flex items-center gap-1"><Calendar size={10} /> Until {coupon.validUntil}</span>
                )}
              </div>

              <div className="flex items-center gap-1 flex-wrap mb-3">
                {coupon.applicablePlans?.map((plan) => (
                  <span key={plan} className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[9px] font-bold capitalize">{plan}</span>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(coupon)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-gray-400 text-[10px] font-bold hover:text-white hover:bg-white/[0.1] transition-all flex items-center gap-1"
                >
                  <Edit3 size={10} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] font-bold hover:bg-rose-500/20 transition-all flex items-center gap-1"
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editing ? 'Edit Coupon' : 'Create Coupon'}
      >
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Coupon Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="TNJSAVE20"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-amber-500/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Discount Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'percentage' | 'flat')}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/40"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">
                {type === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                min={1}
                max={type === 'percentage' ? 100 : 99999}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Usage Limit</label>
              <input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
                min={1}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/40"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Special launch discount..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Valid From</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/40"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Applicable Plans</label>
            <div className="flex gap-2">
              {PLAN_OPTIONS.map((plan) => (
                <button
                  key={plan}
                  onClick={() => {
                    setApplicablePlans((prev) =>
                      prev.includes(plan)
                        ? prev.filter((p) => p !== plan)
                        : [...prev, plan]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    applicablePlans.includes(plan)
                      ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                      : 'text-gray-500 hover:text-white border border-white/10 hover:bg-white/[0.04]'
                  }`}
                >
                  {plan}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !code.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            {saving ? 'Saving...' : editing ? 'Update Coupon' : 'Create Coupon'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
