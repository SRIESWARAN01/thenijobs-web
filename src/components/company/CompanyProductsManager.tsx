'use client';

import { useState } from 'react';
import { ProductItem } from '@/lib/types';
import { hasFeaturePermission } from '@/lib/plans';
import {
  Package, Plus, Trash2, Edit3, ImagePlus, Lock, Sparkles,
  Phone, MessageCircle, Check, X, ShieldAlert, ExternalLink, Eye, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

interface CompanyProductsManagerProps {
  products: ProductItem[];
  planSlug?: string;
  companyName?: string;
  companySlug?: string;
  phone?: string;
  whatsapp?: string;
  district?: string;
  onChange: (products: ProductItem[]) => void;
}

const PLAN_PRODUCT_LIMITS: Record<string, number> = {
  free: 3,
  basic: 5,
  standard: 20,
  premium: 100,
  enterprise: 999
};

export default function CompanyProductsManager({
  products = [],
  planSlug = 'free',
  companyName = 'Company',
  companySlug = '',
  phone = '9360519460',
  whatsapp = '9360519460',
  district = 'Theni',
  onChange,
}: CompanyProductsManagerProps) {
  const toast = useToast();
  const maxLimit = PLAN_PRODUCT_LIMITS[planSlug.toLowerCase()] || 3;
  const isLimitReached = products.length >= maxLimit;

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

    if (!editingId && isLimitReached) {
      toast.error(`Plan Limit Reached (${maxLimit} Products)`, `Your current ${planSlug.toUpperCase()} plan allows up to ${maxLimit} products. Please upgrade to list more.`);
      return;
    }

    const cleanFeatures = (form.features || []).filter(f => f && f.trim() !== '');

    if (editingId) {
      const updated = products.map(p =>
        p.id === editingId
          ? { ...p, ...form, features: cleanFeatures, id: editingId } as ProductItem
          : p
      );
      onChange(updated);
      toast.success('Product updated successfully!');
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
        websiteUrl: form.websiteUrl || '',
        whatsappEnquiry: form.whatsappEnquiry !== false,
      };
      onChange([...products, newItem]);
      toast.success('New product added to your catalogue!');
    }

    resetForm();
  };

  const handleEdit = (p: ProductItem) => {
    setEditingId(p.id);
    setForm({
      ...p,
      features: p.features && p.features.length > 0 ? p.features : ['']
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this product from your catalogue?')) {
      onChange(products.filter(p => p.id !== id));
      toast.info('Product removed.');
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

  const testWhatsAppOrder = (item: ProductItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thenijobs.com';
    const pageUrl = companySlug ? `${origin}/company/${companySlug}` : `${origin}/services`;
    const priceDisplay = item.price ? `₹${item.price.toLocaleString('en-IN')}` : item.priceRange || 'Contact for Price';

    let msg = `🛍️ *NEW PRODUCT ORDER / ENQUIRY*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏢 *Company:* ${companyName}\n`;
    msg += `📦 *Product:* ${item.name}\n`;
    msg += `💰 *Price:* ${priceDisplay}\n`;
    msg += `📍 *Location:* ${district}, Tamil Nadu\n`;
    if (item.imageUrl) msg += `🖼️ *Photo Reference:* ${item.imageUrl}\n`;
    if (item.websiteUrl) msg += `🌐 *Product Link:* ${item.websiteUrl}\n`;
    msg += `🔗 *THENIJOBS Page:* ${pageUrl}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `Hello, I found your listing on THENIJOBS Marketplace and would like to order this item. Please share payment and delivery details.`;

    window.open(`https://wa.me/${(whatsapp || phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 font-outfit">
      {/* Header & Plan Quota */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package size={20} className="text-blue-600" /> Products Catalogue ({products.length} / {maxLimit === 999 ? 'Unlimited' : maxLimit})
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200 uppercase">
              {planSlug} Plan
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isLimitReached
              ? `You have reached your plan limit of ${maxLimit} products. Upgrade to list more.`
              : `You have ${maxLimit - products.length} product listings remaining in your current plan.`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLimitReached && (
            <Link
              href="/employer/subscription"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all"
            >
              <Sparkles size={13} /> Upgrade Plan
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              if (isLimitReached) {
                toast.warning(`Product limit reached (${maxLimit} max). Upgrade plan to add more.`);
                return;
              }
              resetForm();
              setShowAddForm(true);
            }}
            disabled={isLimitReached}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Form Modal / Panel */}
      {showAddForm && (
        <div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-6 space-y-4 animate-fade-in shadow-sm">
          <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Package size={16} className="text-blue-600" />
              {editingId ? 'Edit Product' : 'Add New Product to Catalogue'}
            </h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 font-bold p-1">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Product Name *</label>
              <input
                type="text"
                value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Pure Theni Cardamom 1kg / PVC Pipes"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Category / Group</label>
              <input
                type="text"
                value={form.category || ''}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Agriculture / Spices / Electronics"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Price (₹) or Price Range</label>
              <input
                type="text"
                value={form.priceRange || (form.price ? `₹${form.price}` : '')}
                onChange={e => {
                  const val = e.target.value;
                  const num = Number(val.replace(/[^0-9]/g, ''));
                  setForm({ ...form, priceRange: val, price: isNaN(num) || num === 0 ? undefined : num });
                }}
                placeholder="e.g. ₹1,200 or ₹500 - ₹1,500"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Product Image URL</label>
              <input
                type="url"
                value={form.imageUrl || ''}
                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-700 block mb-1">Product / Website URL (Optional)</label>
              <input
                type="url"
                value={form.websiteUrl || ''}
                onChange={e => setForm({ ...form, websiteUrl: e.target.value })}
                placeholder="https://yourcompany.com/product-link"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-700 block mb-1">Product Description</label>
              <textarea
                rows={3}
                value={form.description || ''}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe product quality, dimensions, specifications, bulk order discounts..."
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-blue-500 font-medium resize-none leading-relaxed"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Key Specifications / Bullet Highlights</label>
              {(form.features || ['']).map((feat, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={feat}
                    onChange={e => {
                      const copy = [...(form.features || [])];
                      copy[i] = e.target.value;
                      setForm({ ...form, features: copy });
                    }}
                    placeholder={`Feature #${i + 1} (e.g. 100% Organic, 1 Year Warranty, Same Day Delivery)`}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none font-medium"
                  />
                  {(form.features || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, features: (form.features || []).filter((_, idx) => idx !== i) })}
                      className="text-gray-400 hover:text-red-600 px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm({ ...form, features: [...(form.features || []), ''] })}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer pt-1"
              >
                <Plus size={13} /> Add Another Specification
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-blue-200/60">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProduct}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              {editingId ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Package size={28} />
          </div>
          <h4 className="text-base font-bold text-gray-900">No Products in Catalogue Yet</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Showcase your retail items, wholesale goods, or manufactured products with pricing and direct WhatsApp orders.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Product Image */}
                <div className="h-44 w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center border-b border-gray-100">
                  {p.imageUrl ? (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center blur-xs opacity-25 scale-105"
                        style={{ backgroundImage: `url(${p.imageUrl})` }}
                      />
                      <img src={p.imageUrl} alt={p.name} className="relative z-10 w-full h-full object-contain object-center p-2" />
                    </>
                  ) : (
                    <div className="text-center text-gray-500 p-4">
                      <Package size={36} className="mx-auto opacity-40 mb-1" />
                      <span className="text-[10px] font-semibold">No Image</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 z-20 px-2.5 py-1 rounded-lg bg-slate-950/85 text-white font-black text-xs shadow-xs border border-white/20">
                    {p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : p.priceRange || 'Price on Enquiry'}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {p.category || 'General'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit product"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 leading-snug">{p.name}</h4>
                  {p.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{p.description}</p>
                  )}
                </div>
              </div>

              {/* Card Footer: 1-Click WhatsApp Test */}
              <div className="p-4 pt-0 border-t border-gray-50 mt-2">
                <button
                  type="button"
                  onClick={() => testWhatsAppOrder(p)}
                  className="w-full py-2 rounded-xl text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  style={{ background: '#25D366' }}
                  title="Test WhatsApp customer order message"
                >
                  <MessageCircle size={13} /> Test WhatsApp Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
