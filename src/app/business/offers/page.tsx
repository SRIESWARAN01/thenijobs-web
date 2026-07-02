'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { createDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';
import { where, orderBy } from 'firebase/firestore';
import {
  Megaphone, Plus, Edit3, Trash2, Calendar,
  Percent, Tag, Loader2, Eye, EyeOff, Building2
} from 'lucide-react';
import Link from 'next/link';

interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'flat' | 'special';
  discountValue: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: any;
}

export default function BusinessOffersPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat' | 'special'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // Fetch company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];

  // Fetch offers
  const { data: offers, loading: offersLoading } = useCollection<Offer>('businessOffers', [
    where('companyId', '==', company?.id || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !company?.id });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setValidFrom('');
    setValidUntil('');
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !company) return;
    setSaving(true);
    try {
      const data = {
        companyId: company.id,
        companyName: company.name,
        title: title.trim(),
        description: description.trim(),
        discountType,
        discountValue,
        validFrom,
        validUntil,
        isActive: true,
      };

      if (editing) {
        await updateDocument('businessOffers', editing.id, data);
      } else {
        await createDocument('businessOffers', data);
      }
      resetForm();
    } catch (err) {
      console.error('Failed to save offer:', err);
      alert('Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  const toggleOffer = async (offer: Offer) => {
    await updateDocument('businessOffers', offer.id, { isActive: !offer.isActive });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this offer?')) return;
    await deleteDocument('businessOffers', id);
  };

  if (companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-white">
        <Loader2 size={36} className="text-orange-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <Building2 size={48} className="text-gray-500 mb-4" />
        <h2 className="text-lg font-semibold">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Setup your company profile first to create offers.</p>
        <Link href="/business/company-profile" className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold hover:opacity-90 transition-opacity">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag size={22} className="text-orange-400" />
            Promotional Offers
          </h1>
          <p className="text-sm text-gray-400 mt-1">Create deals and offers for your customers</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={14} /> Create Offer
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-5 space-y-4 animate-fade-in-up">
          <h3 className="text-sm font-bold text-white">{editing ? 'Edit Offer' : 'New Promotional Offer'}</h3>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Offer Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Summer Sale - 20% Off!"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/40"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your offer..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40"
              >
                <option value="percentage">Percentage Off</option>
                <option value="flat">Flat Discount (₹)</option>
                <option value="special">Special Offer</option>
              </select>
            </div>
            {discountType !== 'special' && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">
                  {discountType === 'percentage' ? 'Discount %' : 'Amount (₹)'}
                </label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  min={1}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Valid From</label>
              <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Valid Until</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40" />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-xs hover:opacity-90 disabled:opacity-40 flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? 'Saving...' : editing ? 'Update Offer' : 'Create Offer'}
            </button>
            <button onClick={resetForm} className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-gray-400 text-xs font-medium hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Offers List */}
      {offersLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="text-orange-400 animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Megaphone size={32} className="text-gray-500 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No offers yet. Create your first promotional offer!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div key={offer.id} className={`glass-card rounded-2xl p-5 hover:border-white/15 transition-all ${!offer.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{offer.title}</h3>
                    {offer.discountType === 'percentage' && (
                      <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[10px] font-bold">
                        {offer.discountValue}% OFF
                      </span>
                    )}
                    {offer.discountType === 'flat' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                        ₹{offer.discountValue} OFF
                      </span>
                    )}
                  </div>
                  {offer.description && <p className="text-xs text-gray-400">{offer.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                    {offer.validFrom && <span className="flex items-center gap-1"><Calendar size={10} /> {offer.validFrom}</span>}
                    {offer.validUntil && <span>— {offer.validUntil}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleOffer(offer)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all">
                    {offer.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => { setEditing(offer); setTitle(offer.title); setDescription(offer.description); setDiscountType(offer.discountType); setDiscountValue(offer.discountValue); setValidFrom(offer.validFrom); setValidUntil(offer.validUntil); setShowForm(true); }}
                    className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(offer.id)} className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
