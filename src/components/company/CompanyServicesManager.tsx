'use client';

import { useState } from 'react';
import { ServiceItem } from '@/lib/types';
import { hasFeaturePermission } from '@/lib/plans';
import {
  Wrench, Plus, Trash2, Edit3, Lock, Sparkles,
  Phone, MessageCircle, Check, X
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

interface CompanyServicesManagerProps {
  services: (ServiceItem | string)[];
  planSlug?: string;
  onChange: (services: ServiceItem[]) => void;
}

export default function CompanyServicesManager({
  services = [],
  planSlug = 'free',
  onChange,
}: CompanyServicesManagerProps) {
  const isEnabled = hasFeaturePermission(planSlug, 'servicesListing');
  const toast = useToast();

  // Normalize string[] or ServiceItem[] to ServiceItem[]
  const normalizedServices: ServiceItem[] = services.map((s, idx) => {
    if (typeof s === 'string') {
      return { id: `svc_${idx}`, name: s, category: 'Services', startingPrice: undefined };
    }
    return s;
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<ServiceItem>>({
    name: '',
    description: '',
    startingPrice: undefined,
    priceRange: '',
    category: '',
    imageUrl: '',
    details: [''],
    keywords: [],
    websiteUrl: '',
    whatsappEnquiry: true,
  });

  const handleSaveService = () => {
    if (!form.name?.trim()) {
      toast.warning('Please enter a service name.');
      return;
    }

    const cleanDetails = (form.details || []).filter(d => d.trim() !== '');

    if (editingId) {
      const updated = normalizedServices.map(s =>
        s.id === editingId
          ? { ...s, ...form, details: cleanDetails, id: editingId } as ServiceItem
          : s
      );
      onChange(updated);
    } else {
      const newItem: ServiceItem = {
        id: Date.now().toString(),
        name: form.name.trim(),
        description: form.description || '',
        startingPrice: form.startingPrice,
        priceRange: form.priceRange || '',
        category: form.category || 'Professional Services',
        imageUrl: form.imageUrl || '',
        details: cleanDetails,
        whatsappEnquiry: form.whatsappEnquiry !== false,
      };
      onChange([...normalizedServices, newItem]);
    }

    resetForm();
  };

  const handleEdit = (s: ServiceItem) => {
    setEditingId(s.id);
    setForm(s);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this service?')) {
      onChange(normalizedServices.filter(s => s.id !== id));
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      startingPrice: undefined,
      priceRange: '',
      category: '',
      imageUrl: '',
      details: [''],
      keywords: [],
      websiteUrl: '',
      whatsappEnquiry: true,
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  if (!isEnabled) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-500/5 via-white to-amber-500/10 p-8 text-center shadow-md font-outfit">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-500/30">
          <Lock size={32} />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
          <Sparkles size={13} /> Premium Feature
        </span>
        <h3 className="mt-3 text-xl font-bold text-slate-900">Services Catalogue Disabled</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Upgrade to our <strong className="text-slate-900 font-semibold">Standard Package (₹480/yr)</strong> or higher to list professional services, starting prices, service details, and accept WhatsApp lead enquiries.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/employer/subscription"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
          >
            <span>Upgrade Subscription</span>
            <Sparkles size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wrench size={20} className="text-blue-600" /> Services Directory ({normalizedServices.length})
          </h3>
          <p className="text-xs text-slate-500">List commercial, industrial, or local business services with starting prices and detail points</p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowAddForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
        >
          <Plus size={15} />
          <span>Add Service</span>
        </button>
      </div>

      {/* Add / Edit Form Modal / Panel */}
      {showAddForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">
              {editingId ? 'Edit Service' : 'Add New Service'}
            </h4>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Service Name *</label>
              <input
                type="text"
                value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Service name"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
              <input
                type="text"
                value={form.category || ''}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="Category"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Starting Price (₹) / Price Range</label>
              <input
                type="text"
                value={form.priceRange || (form.startingPrice ? `From ₹${form.startingPrice}` : '')}
                onChange={e => setForm({ ...form, priceRange: e.target.value })}
                placeholder="Price or price range"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Service Banner Image URL</label>
              <input
                type="url"
                value={form.imageUrl || ''}
                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Service Description</label>
            <textarea
              rows={3}
              value={form.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your service, process, and guarantees..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Keywords (comma-separated)</label>
              <input
                type="text"
                value={(form.keywords || []).join(', ')}
                onChange={e => setForm({ ...form, keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                placeholder="plumbing, repair, maintenance"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Website URL</label>
              <input
                type="url"
                value={form.websiteUrl || ''}
                onChange={e => setForm({ ...form, websiteUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveService}
              className="px-4 py-1.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Save Service
            </button>
          </div>
        </div>
      )}

      {/* Services List Grid */}
      {normalizedServices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-400">
          <Wrench size={32} className="mx-auto mb-2 text-slate-300" />
          No services added yet. Click &quot;Add Service&quot; to list your offerings.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {normalizedServices.map(s => (
            <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 hover:shadow-md transition-all relative group">
              <div className="aspect-video rounded-xl bg-slate-100 overflow-hidden relative">
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Wrench size={32} />
                  </div>
                )}
                {s.category && (
                  <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {s.category}
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{s.name}</h4>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">{s.priceRange || (s.startingPrice ? `Starting ₹${s.startingPrice}` : 'Price on Request')}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description || 'No description provided.'}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => handleEdit(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
