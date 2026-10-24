'use client';

import { useState, useRef } from 'react';
import { ProductItem } from '@/lib/types';
import { canAddProduct, getPlanLimits, formatLimit, isUnlimited } from '@/lib/plans';
import {
  Package, Plus, Trash2, Edit3, ImagePlus, Lock, Sparkles,
  Phone, MessageCircle, Check, X, ShieldAlert, ExternalLink, Eye, ArrowRight,
  Upload, Image as ImageIcon, Loader2, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { requestAIService } from '@/lib/ai/aiClient';
import { useUploadFile } from '@/hooks/useStorage';
import { optimizeImageForUpload, validateImageFile } from '@/lib/storage/imageOptimizer';

interface CompanyProductsManagerProps {
  products: ProductItem[];
  planSlug?: string;
  companyName?: string;
  companySlug?: string;
  phone?: string;
  whatsapp?: string;
  district?: string;
  companyId?: string;
  onChange: (products: ProductItem[]) => void;
}

const PRODUCT_UNITS = [
  'Piece / Item', 'Kg', 'Grams', 'Box', 'Pack', 'Liter', 'Meter', 'Set', 'Ton', 'Pair', 'Dozen'
];

export default function CompanyProductsManager({
  products = [],
  planSlug = 'free',
  companyName = 'Company',
  companySlug = '',
  phone = '9360519460',
  whatsapp = '9360519460',
  district = 'Theni',
  companyId = '',
  onChange,
}: CompanyProductsManagerProps) {
  const toast = useToast();
  const { user } = useAuth();
  const quota = canAddProduct(planSlug, products.length);
  const maxLimit = quota.limit;
  const isLimitReached = !quota.allowed;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Storage upload hook for product images
  const { uploadFile, progress: uploadProgress, loading: uploading } = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [urlDraft, setUrlDraft] = useState('');

  const [form, setForm] = useState<Partial<ProductItem>>({
    name: '',
    description: '',
    price: undefined,
    priceRange: '',
    unit: 'Piece / Item',
    availability: 'in_stock',
    category: '',
    imageUrl: '',
    features: [''],
    keywords: [],
    websiteUrl: '',
    whatsappEnquiry: true,
    featured: false,
  });

  // Handle product image upload
  const handleProductFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file, { maxBytes: 10 * 1024 * 1024, label: 'Product Image' });
      toast.info('Compressing and optimizing product image…');
      const optimized = await optimizeImageForUpload(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
        maxInputBytes: 10 * 1024 * 1024,
        label: 'Product Image',
      });

      const effectiveCompanyId = companyId || 'general';
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
      const storagePath = `companies/${effectiveCompanyId}/products/${Date.now()}_${safeName}.webp`;

      const downloadUrl = await uploadFile(optimized, storagePath);
      setForm(prev => ({
        ...prev,
        imageUrl: downloadUrl,
      }));
      setUrlDraft(downloadUrl);
      toast.success('Product image uploaded successfully!');
    } catch (err: any) {
      console.error('[Product image upload error]', err);
      toast.error('Upload Error', err?.message || 'Could not upload product image.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
        unit: form.unit || 'Piece / Item',
        availability: form.availability || 'in_stock',
        category: form.category || 'General',
        imageUrl: form.imageUrl || '',
        features: cleanFeatures,
        websiteUrl: form.websiteUrl || '',
        whatsappEnquiry: form.whatsappEnquiry !== false,
        featured: form.featured === true,
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
      unit: p.unit || 'Piece / Item',
      availability: p.availability || 'in_stock',
      features: p.features && p.features.length > 0 ? p.features : ['']
    });
    setUrlDraft(p.imageUrl || '');
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
      unit: 'Piece / Item',
      availability: 'in_stock',
      category: '',
      imageUrl: '',
      features: [''],
      keywords: [],
      websiteUrl: '',
      whatsappEnquiry: true,
      featured: false,
    });
    setUrlDraft('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleGenerateDescription = async () => {
    if (!form.name?.trim() || aiGenerating) return;
    setAiGenerating(true);
    try {
      const res = await requestAIService<{ description?: string }>({
        feature: 'service_product_description',
        userId: user?.uid,
        userRole: 'COMPANY',
        payload: {
          companyName,
          category: form.category || 'General',
          district,
          keyDetails: `${form.name}${form.priceRange ? ` -- ${form.priceRange}` : ''}`,
          contentType: 'service_product_description',
        },
      });

      if (!res.success || !res.data?.description) {
        toast.error(res.error || 'AI is temporarily unavailable. Please try again.');
        return;
      }

      setForm(f => ({ ...f, description: res.data!.description! }));
      toast.success('AI draft generated. Review and edit before saving.');
    } catch {
      toast.error('AI is temporarily unavailable. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const testWhatsAppOrder = (item: ProductItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.thenijobs.com';
    const pageUrl = companySlug ? `${origin}/company/${companySlug}` : `${origin}/marketplace`;
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
            {maxLimit === 0
              ? 'Product catalogue is not included in Basic. Upgrade to Standard (20 products) or higher to showcase items.'
              : isUnlimited(maxLimit)
              ? `Unlimited product catalogue enabled (${products.length} active products listed).`
              : isLimitReached
              ? `You have reached your plan limit of ${maxLimit} products. Upgrade to list more.`
              : `You have ${quota.remaining} product listings remaining (${products.length}/${maxLimit} used).`}
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
              <label htmlFor="company-companyproductsmanager-product-name" className="text-xs font-bold text-gray-700 block mb-1">Product Name *</label>
              <input id="company-companyproductsmanager-product-name"
                type="text"
                value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Pure Theni Cardamom 1kg / PVC Pipes"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label htmlFor="company-companyproductsmanager-category-group" className="text-xs font-bold text-gray-700 block mb-1">Category / Group</label>
              <input id="company-companyproductsmanager-category-group"
                type="text"
                value={form.category || ''}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Agriculture / Spices / Electronics"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label htmlFor="company-companyproductsmanager-price-or-price-range" className="text-xs font-bold text-gray-700 block mb-1">Price (₹) or Price Range</label>
              <input id="company-companyproductsmanager-price-or-price-range"
                type="text"
                value={form.priceRange || (form.price ? `₹${form.price}` : '')}
                onChange={e => {
                  const val = e.target.value;
                  const num = Number(val.replace(/[^0-9]/g, ''));
                  setForm({ ...form, priceRange: val, price: isNaN(num) || num === 0 ? undefined : num });
                }}
                placeholder="e.g. ₹1,200 or ₹500 - ₹1,500"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Unit / Pack</label>
                <select
                  value={form.unit || 'Piece / Item'}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
                >
                  {PRODUCT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Availability</label>
                <select
                  value={form.availability || 'in_stock'}
                  onChange={e => setForm({ ...form, availability: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="available">Available</option>
                  <option value="made_to_order">Made to Order</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Product Image: Upload or Direct URL */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">Product Image</label>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                      imageInputMode === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                      imageInputMode === 'url' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {imageInputMode === 'upload' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleProductFileSelect}
                      disabled={uploading}
                      className="hidden"
                      id="company-product-file-input"
                    />
                    <label
                      htmlFor="company-product-file-input"
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        uploading
                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-400'
                          : 'bg-white border-blue-300 hover:border-blue-500 text-blue-700 hover:bg-blue-50/40'
                      }`}
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-blue-600" />
                          <span className="text-xs font-semibold text-gray-700">
                            Optimizing &amp; Uploading WebP ({uploadProgress}%)…
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          <span className="text-xs font-bold">
                            {form.imageUrl ? 'Change Product Image' : 'Click to Upload Product Image (JPG, PNG, WebP up to 10MB)'}
                          </span>
                        </>
                      )}
                    </label>

                    {form.imageUrl && (
                      <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden shrink-0 bg-slate-100 relative">
                        <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px]"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Uploaded images are automatically compressed to fast-loading WebP for optimal performance on mobile.
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="company-companyproductsmanager-product-image-url"
                    type="url"
                    value={form.imageUrl || ''}
                    onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/product.jpg"
                    className="flex-1 px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
                  />
                  {form.imageUrl && (
                    <div className="w-10 h-10 rounded-xl border border-gray-200 overflow-hidden shrink-0 bg-slate-100">
                      <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="company-companyproductsmanager-product-website-url-optional" className="text-xs font-bold text-gray-700 block mb-1">Product / Website URL (Optional)</label>
              <input id="company-companyproductsmanager-product-website-url-optional"
                type="url"
                value={form.websiteUrl || ''}
                onChange={e => setForm({ ...form, websiteUrl: e.target.value })}
                placeholder="https://yourcompany.com/product-link"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="company-companyproductsmanager-product-description" className="text-xs font-bold text-gray-700">Product Description</label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={!form.name?.trim() || aiGenerating}
                  aria-label="Generate product description with AI"
                  title={!form.name?.trim() ? 'Add a product name first' : 'Generate a draft description with AI'}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Sparkles size={12} /> {aiGenerating ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
              <textarea id="company-companyproductsmanager-product-description"
                rows={3}
                value={form.description || ''}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe product quality, dimensions, specifications, bulk order discounts..."
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium resize-none leading-relaxed"
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
                    aria-label={`Feature #${i + 1} (e.g. 100% Organic, 1 Year Warranty, Same Day Delivery)`} placeholder={`Feature #${i + 1} (e.g. 100% Organic, 1 Year Warranty, Same Day Delivery)`}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-base sm:text-xs text-gray-900 outline-none font-medium"
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
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 text-xs font-bold text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.featured === true}
                  onChange={e => setForm({ ...form, featured: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <Sparkles size={14} className="text-amber-500" />
                <span>Mark as Featured (shown first in the Marketplace)</span>
              </label>
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
          {products.map(p => {
            const detailHref = companySlug && p.id ? `/marketplace/product/${companySlug}/${p.id}` : null;
            return (
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
                    {p.price ? `₹${Number(p.price).toLocaleString('en-IN')}${p.unit ? ` / ${p.unit}` : ''}` : p.priceRange || 'Price on Enquiry'}
                  </span>
                  {p.availability && (
                    <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-white/90 backdrop-blur-md text-slate-900 shadow-xs">
                      {p.availability.replace(/_/g, ' ')}
                    </span>
                  )}
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

              {/* Card Footer: View Public Listing & Test WhatsApp */}
              <div className="p-4 pt-0 border-t border-gray-50 mt-2 space-y-2">
                {detailHref && (
                  <Link
                    href={detailHref}
                    target="_blank"
                    className="w-full py-1.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink size={12} /> View on Marketplace
                  </Link>
                )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
