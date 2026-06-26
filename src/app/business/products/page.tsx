'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where, orderBy } from 'firebase/firestore';
import {
  Plus, Edit2, Trash2, Loader2, Search, Image as ImageIcon,
  Tag, Box, Check, X, Sparkles, DollarSign, Eye, EyeOff, Upload,
  Lock, ChevronRight, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { createProduct, updateProduct, deleteProduct } from '@/lib/firebase/shopService';
import { useUploadFile } from '@/hooks/useStorage';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import { getCompanyActivePlan } from '@/lib/subscriptions';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptionPlans';

interface ProductDoc {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  tags?: string[];
  companyId: string;
}

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function BusinessProductsPage() {
  const { user } = useAuth();
  const { uploadFile } = useUploadFile();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  
  // Upload State
  const [imageUploading, setImageUploading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDoc | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    stock: 0,
    category: '',
    imageUrl: '',
    tagsString: '',
    isActive: true,
    isFeatured: false,
  });

  // 1. Fetch company profile
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // Compute active subscription plan badge (free, basic / Standard, premium)
  const subscriptionBadge = getCompanyActivePlan(company);

  // 2. Fetch products
  const { data: products, loading: productsLoading } = useCollection<any>('products', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  const limit = SUBSCRIPTION_PLANS.find(p => p.slug === subscriptionBadge)?.productLimit ?? 0;
  const reachedLimit = limit !== -1 && products.length >= limit;

  const handleOpenAddModal = () => {
    if (limit === 0) {
      alert('Product Catalog is not available on the Free plan. Please upgrade to a Standard or Premium plan to add products.');
      return;
    }
    if (reachedLimit) {
      alert(`Product limit reached. Your ${subscriptionBadge === 'free' ? 'Free' : subscriptionBadge === 'basic' ? 'Standard' : subscriptionBadge === 'premium' ? 'Premium' : 'Enterprise'} plan allows a maximum of ${limit} product(s). Please delete existing products or upgrade.`);
      return;
    }
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      originalPrice: 0,
      stock: 0,
      category: '',
      imageUrl: '',
      tagsString: '',
      isActive: true,
      isFeatured: false,
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file format. Please upload JPG, PNG, or WEBP images only.');
      return;
    }

    setCropFile(file);
    setShowCropper(true);
    if (e.target) e.target.value = '';
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    if (limit === 0) {
      alert('Product Catalog is not available on the Free plan. Please upgrade to a Standard or Premium plan to import products.');
      return;
    }
    if (reachedLimit) {
      alert(`Limit reached. You already have ${products.length} products (max ${limit} for your plan). Please delete existing products or upgrade.`);
      return;
    }

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length <= 1) {
          alert("CSV file is empty or has no data rows.");
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = headers.indexOf('name');
        const descIndex = headers.indexOf('description');
        const priceIndex = headers.indexOf('price');
        const origPriceIndex = headers.indexOf('originalprice');
        const stockIndex = headers.indexOf('stock');
        const catIndex = headers.indexOf('category');
        const imgIndex = headers.indexOf('imageurl');
        const tagsIndex = headers.indexOf('tags');

        if (nameIndex === -1 || priceIndex === -1 || stockIndex === -1 || catIndex === -1) {
          alert("CSV must contain 'name', 'price', 'stock', and 'category' headers.");
          return;
        }

        let successCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          if (products.length + successCount >= limit) {
            alert(`Reached product limit of ${limit}. Stopped importing.`);
            break;
          }

          // Parse CSV line taking care of quoted columns
          const cols: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let c = 0; c < line.length; c++) {
            const char = line[c];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cols.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          cols.push(current.trim());

          const name = cols[nameIndex]?.replace(/^"|"$/g, '').trim();
          const description = descIndex !== -1 ? cols[descIndex]?.replace(/^"|"$/g, '').trim() : '';
          const price = Number(cols[priceIndex]);
          const originalPrice = origPriceIndex !== -1 && cols[origPriceIndex] ? Number(cols[origPriceIndex]) : undefined;
          const stock = Number(cols[stockIndex]);
          const category = cols[catIndex]?.replace(/^"|"$/g, '').trim() || 'General';
          const imageUrl = imgIndex !== -1 ? cols[imgIndex]?.replace(/^"|"$/g, '').trim() : '';
          const tags = tagsIndex !== -1 && cols[tagsIndex]
            ? cols[tagsIndex].replace(/^"|"$/g, '').split(';').map(t => t.trim()).filter(Boolean)
            : [];

          if (!name || isNaN(price) || isNaN(stock)) continue;

          await createProduct({
            name,
            description,
            price,
            originalPrice,
            stock,
            category,
            images: imageUrl ? [imageUrl] : [],
            isActive: true,
            isFeatured: false,
            tags,
            companyId,
          });
          successCount++;
        }
        alert(`Successfully imported ${successCount} products!`);
      } catch (err) {
        console.error(err);
        alert("Failed to parse or import CSV. Please ensure the format is correct.");
      } finally {
        setImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleOpenEditModal = (product: ProductDoc) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || 0,
      stock: product.stock,
      category: product.category,
      imageUrl: product.images?.[0] || '',
      tagsString: product.tags?.join(', ') || '',
      isActive: product.isActive,
      isFeatured: product.isFeatured || false,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    
    // Check Plan Limits
    if (!editingProduct) {
      if (products.length >= limit) {
        const planName = subscriptionBadge === 'free' ? 'Free' : subscriptionBadge === 'basic' ? 'Standard' : subscriptionBadge === 'premium' ? 'Premium' : 'Enterprise';
        alert(`Limit reached! Your ${planName} plan allows a maximum of ${limit} product(s). Please delete existing products or upgrade.`);
        return;
      }
    }

    setActionLoading('save');
    try {
      const tags = formData.tagsString
        ? formData.tagsString.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      
      const payload: any = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        stock: Number(formData.stock),
        category: formData.category,
        images: formData.imageUrl ? [formData.imageUrl] : [],
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        tags,
        companyId,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        alert('Product updated successfully!');
      } else {
        await createProduct(payload);
        alert('Product created successfully!');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save product');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setActionLoading(id);
    try {
      await deleteProduct(id);
      alert('Product deleted successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to delete product');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (product: ProductDoc) => {
    setActionLoading(product.id + '_status');
    try {
      await updateProduct(product.id, { isActive: !product.isActive });
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const categories = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));

  const filtered = products.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const loading = companyLoading || productsLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <Box size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to add and manage your products/services.</p>
        <Link href="/business/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  const planLabel = subscriptionBadge === 'free' ? 'Free Plan' : subscriptionBadge === 'basic' ? 'Standard Plan (Blue Tick)' : 'Premium Plan (Yellow/Gold Tick)';

  if (subscriptionBadge === 'free') {
    return (
      <div className="space-y-6 font-outfit text-white">
        <h1 className="text-2xl font-bold">Products & Services</h1>
        <p className="text-sm text-gray-400 mt-1">E-Commerce storefront listing for your business</p>
        
        <div className="bg-gradient-to-br from-[#0e0a16] via-[#060814] to-[#04050a] border border-white/5 rounded-3xl p-8 max-w-2xl mx-auto text-center space-y-6 shadow-2xl relative overflow-hidden mt-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-amber-450">
            <Lock size={28} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Products & Storefront Catalog Locked</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Showcasing your product inventory and enabling WhatsApp checkout is exclusive to Standard (20 products) and Premium (100 products) subscribers.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/employer/subscription" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">
              Upgrade Subscription Plan <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products & Services</h1>
          <p className="text-sm text-gray-400 mt-1">Manage listings, prices, stock levels, and features</p>
          {!loading && (
            <p className="text-xs text-emerald-400 font-semibold mt-1">
              Active: {products.length} / {limit} products showcase limit ({planLabel})
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm font-semibold hover:bg-white/[0.04] transition-all cursor-pointer">
            {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {importing ? 'Importing...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
              disabled={importing}
            />
          </label>
          <button
            onClick={handleOpenAddModal}
            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity ${reachedLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={reachedLimit}
          >
            <Plus size={16} /> Add Product / Service
          </button>
        </div>
      </div>

      {reachedLimit && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs text-amber-300 font-semibold flex items-center gap-2">
          <ShieldAlert size={14} className="text-amber-400" />
          Product limit reached ({products.length}/{limit}). Please delete existing products or upgrade to Premium.
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading products...</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/40 outline-none transition-all"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-4 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-emerald-500/40 outline-none transition-all cursor-pointer bg-[#0a0a1a]"
            >
              <option value="all">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Product Grid */}
          {filtered.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Box size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No products or services found.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product: ProductDoc) => (
                <div key={product.id} className="glass-card rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/10 transition-all flex flex-col">
                  {/* Image Area */}
                  <div className="h-44 relative bg-slate-900 flex items-center justify-center border-b border-white/[0.06]">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-gray-700" />
                    )}
                    {product.isFeatured && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-500 text-[10px] font-bold text-white flex items-center gap-1">
                        <Sparkles size={10} /> Featured
                      </span>
                    )}
                    <button
                      onClick={() => handleToggleStatus(product)}
                      disabled={actionLoading === product.id + '_status'}
                      className={`absolute top-2 left-2 p-1.5 rounded-lg backdrop-blur-md transition-all ${
                        product.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                      title={product.isActive ? 'Hide Listing' : 'Make Listing Live'}
                    >
                      {actionLoading === product.id + '_status' ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : product.isActive ? (
                        <Eye size={12} />
                      ) : (
                        <EyeOff size={12} />
                      )}
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                          {product.category || 'General'}
                        </span>
                        <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                      </div>
                      <h3 className="font-bold text-base text-white truncate">{product.name}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{product.description}</p>
                    </div>

                    <div className="flex items-end justify-between pt-2">
                      <div className="space-y-0.5">
                        <div className="text-xs text-gray-500">Price</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg font-black text-white">₹{product.price}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-xs text-gray-500 line-through">₹{product.originalPrice}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="p-2 rounded-lg border border-white/[0.08] hover:border-emerald-500/30 text-gray-400 hover:text-emerald-300 bg-white/[0.02] transition-all"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={actionLoading === product.id}
                          className="p-2 rounded-lg border border-white/[0.08] hover:border-rose-500/30 text-gray-400 hover:text-rose-400 bg-white/[0.02] transition-all"
                          title="Delete"
                        >
                          {actionLoading === product.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e0e22] border border-white/[0.08] rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-400" />
                {editingProduct ? 'Edit Product / Service' : 'Add New Product / Service'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 no-scrollbar">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/45 focus:bg-white/[0.06] outline-none transition-all"
                    placeholder="E.g. Pure Cold Pressed Coconut Oil"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/45 focus:bg-white/[0.06] outline-none transition-all resize-none leading-relaxed"
                    placeholder="Tell customers about the quality, specifications, benefits..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/45 focus:bg-white/[0.06] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.originalPrice}
                    onChange={(e) => setFormData(p => ({ ...p, originalPrice: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/45 focus:bg-white/[0.06] outline-none transition-all"
                    placeholder="Optional retail price"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.stock}
                    onChange={(e) => setFormData(p => ({ ...p, stock: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/45 focus:bg-white/[0.06] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/45 focus:bg-white/[0.06] outline-none transition-all"
                    placeholder="E.g. Food, Handloom, Services"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Product Image</label>
                  <div className="flex gap-3 items-center">
                    <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-xs font-semibold hover:bg-white/[0.04] transition-all cursor-pointer">
                      {imageUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {imageUploading ? 'Uploading...' : 'Upload Image (Max 1MB)'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={imageUploading}
                      />
                    </label>
                    {formData.imageUrl && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-slate-900 flex items-center justify-center">
                        <img src={formData.imageUrl} alt="Preview" className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] text-gray-500 block">Or paste image web link:</span>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(p => ({ ...p, imageUrl: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-gray-600 focus:border-emerald-500/45 focus:bg-white/[0.06] outline-none transition-all mt-1"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tagsString}
                    onChange={(e) => setFormData(p => ({ ...p, tagsString: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/45 focus:bg-white/[0.06] outline-none transition-all"
                    placeholder="oil, pure, organic"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <span className="text-xs font-bold block">Featured Product</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Showcase this item on your homepage banner</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData(p => ({ ...p, isFeatured: e.target.checked }))}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="submit"
                  disabled={actionLoading === 'save'}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading === 'save' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl bg-white/[0.06] text-gray-400 text-xs font-medium hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showCropper && (
        <ImageCropperModal
          open={showCropper}
          onClose={() => {
            setShowCropper(false);
            setCropFile(null);
          }}
          file={cropFile}
          aspectRatio={4/3}
          cropWidth={800}
          cropHeight={600}
          title="Crop Product Image"
          uploadPath={companyId ? `companies/${companyId}/products/product_${Date.now()}` : undefined}
          onUploadComplete={(url) => {
            setFormData(prev => ({ ...prev, imageUrl: url }));
          }}
        />
      )}
    </div>
  );
}
