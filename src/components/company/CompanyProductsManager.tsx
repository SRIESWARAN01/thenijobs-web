'use client';

import { useState } from 'react';
import { ProductItem } from '@/lib/types';
import { hasFeaturePermission } from '@/lib/plans';
import {
  Package, Plus, Trash2, Edit3, ImagePlus, Lock, Sparkles,
  Phone, MessageCircle, Check, X, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

interface CompanyProductsManagerProps {
  products: ProductItem[];
  planSlug?: string;
  onChange: (products: ProductItem[]) => void;
}

export default function CompanyProductsManager({
  products = [],
  planSlug = 'free',
  onChange,
}: CompanyProductsManagerProps) {
  const isEnabled = hasFeaturePermission(planSlug, 'productsListing');
  const toast = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<ProductItem>>({
    name: '',
    description: '',
    price: undefined,
    priceRange: '',
    category: '',
    imageUrl: '',
    features: [''],
    keywords: [],
    websiteUrl: '',
    whatsappEnquiry: true,
  });

  const handleSaveProduct = () => {
    if (!form.name?.trim()) {
      toast.warning('Please enter a product name.');
      return;
    }

    const cleanFeatures = (form.features || []).filter(f => f.trim() !== '');

    if (editingId) {
      const updated = products.map(p =>
        p.id === editingId
          ? { ...p, ...form, features: cleanFeatures, id: editingId } as ProductItem
          : p
      );
      onChange(updated);
    } else {
      const newItem: ProductItem = {
        id: Date.now().toString(),
        name: form.name.trim(),
        description: form.description || '',
        price: form.price,
        priceRange: form.priceRange || '',
        category: form.category || 'General',
        imageUrl: form.imageUrl || '',
        features: cleanFeatures,
        whatsappEnquiry: form.whatsappEnquiry !== false,
      };
      onChange([...products, newItem]);
    }

    resetForm();
  };

  const handleEdit = (p: ProductItem) => {
    setEditingId(p.id);
    setForm(p);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this product?')) {
      onChange(products.filter(p => p.id !== id));
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      price: undefined,
      priceRange: '',
      category: '',
      imageUrl: '',
      features: [''],
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
        <h3 className="mt-3 text-xl font-bold text-slate-900">Product Catalogue Disabled</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Upgrade to our <strong className="text-slate-900 font-semibold">Standard Package (₹480/yr)</strong> or higher to showcase products, price ranges, features, and receive direct WhatsApp customer enquiries.
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
            <Package size={20} className="text-blue-600" /> Products Catalogue ({products.length})
          </h3>
          <p className="text-xs text-slate-500">Showcase products with pricing, photos, and direct WhatsApp lead buttons</p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowAddForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
        >
          <Plus size={15} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Add / Edit Form Modal / Panel */}
      {showAddForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h4>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Product Name *</label>
              <input
                type="text"
                value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Product name"
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Price (₹) / Price Range</label>
              <input
                type="text"
                value={form.priceRange || (form.price ? `₹${form.price}` : '')}
                onChange={e => setForm({ ...form, priceRange: e.target.value })}
                placeholder="Price or price range"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Product Image URL</label>
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
            <label className="text-xs font-semibold text-slate-700 block mb-1">Product Description</label>
            <textarea
              rows={3}
              value={form.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Provide key details about this product..."
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
                placeholder="toys, kids, education"
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
              onClick={handleSaveProduct}
              className="px-4 py-1.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Save Product
            </button>
          </div>
        </div>
      )}

      {/* Product List Grid */}
      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-400">
          <Package size={32} className="mx-auto mb-2 text-slate-300" />
          No products added yet. Click &quot;Add Product&quot; to build your catalogue.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 hover:shadow-md transition-all relative group">
              <div className="aspect-video rounded-xl bg-slate-100 overflow-hidden relative">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Package size={32} />
                  </div>
                )}
                {p.category && (
                  <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {p.category}
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">{p.priceRange || (p.price ? `₹${p.price}` : 'Price on Enquiry')}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description || 'No description provided.'}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
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
