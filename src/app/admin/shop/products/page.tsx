'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight,
  Package, Star, AlertTriangle, CheckCircle, Loader2, ShoppingBag,
} from 'lucide-react';
import {
  getProducts,
  updateProduct,
  deleteProduct,
} from '@/lib/firebase/shopService';
import type { Product } from '@/lib/types';
import { SHOP_PRODUCT_CATEGORIES } from '@/lib/types';

// ── Helpers ────────────────────────────────────────────────────────────────────

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
};

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  const colors = colorMap[color] ?? colorMap.violet;
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center`}>
          <Icon size={20} className={colors.text} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white font-outfit">{value.toLocaleString('en-IN')}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/[0.04]">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-white/[0.06] rounded shimmer" />
        </td>
      ))}
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts({});
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = {
    total: products.length,
    active: products.filter((p) => p.isActive).length,
    featured: products.filter((p) => p.isFeatured).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.isActive) ||
      (statusFilter === 'inactive' && !p.isActive);
    return matchSearch && matchCategory && matchStatus;
  });

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleToggleActive = async (product: Product) => {
    setActionLoading(product.id);
    try {
      await updateProduct(product.id, { isActive: !product.isActive });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p))
      );
    } catch (err) {
      console.error('Toggle error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) return;
    setActionLoading(product.id);
    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Product Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your shop inventory</p>
        </div>
        <Link href="/admin/shop/products/new" className="btn-gradient px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold w-fit">
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={stats.total} icon={ShoppingBag} color="violet" />
        <StatCard label="Active" value={stats.active} icon={CheckCircle} color="emerald" />
        <StatCard label="Featured" value={stats.featured} icon={Star} color="amber" />
        <StatCard label="Out of Stock" value={stats.outOfStock} icon={AlertTriangle} color="rose" />
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, tag…"
            className="search-input w-full pl-10 px-4 py-2.5"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="search-input px-4 py-2.5 min-w-[160px]"
        >
          {SHOP_PRODUCT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="search-input px-4 py-2.5 min-w-[140px]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Package size={16} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Products</h2>
              <p className="text-[10px] text-gray-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Product</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Category</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Price</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Stock</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500">Featured</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Package size={36} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                      {products.length === 0 ? 'No products yet. Add your first product!' : 'No products match your filters.'}
                    </p>
                    {products.length === 0 && (
                      <Link href="/admin/shop/products/new" className="mt-4 inline-flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold">
                        <Plus size={16} /> Add Product
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    {/* Product info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover bg-white/[0.04] flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                            <Package size={16} className="text-gray-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-[180px]">{product.name}</p>
                          {product.tags && product.tags.length > 0 && (
                            <p className="text-[10px] text-gray-500 truncate max-w-[180px]">{product.tags.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        {product.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-white">₹{product.price.toLocaleString('en-IN')}</p>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <p className="text-[10px] text-gray-500 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</p>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${product.stock === 0 ? 'text-rose-400' : product.stock <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {product.stock}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        product.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Featured */}
                    <td className="px-4 py-3">
                      {product.isFeatured ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                          <Star size={12} className="fill-amber-400" /> Featured
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        {actionLoading === product.id ? (
                          <Loader2 size={16} className="text-violet-400 animate-spin" />
                        ) : (
                          <>
                            {/* Edit */}
                            <Link
                              href={`/admin/shop/products/${product.id}/edit`}
                              className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                              title="Edit product"
                            >
                              <Pencil size={14} />
                            </Link>

                            {/* Toggle Active */}
                            <button
                              onClick={() => handleToggleActive(product)}
                              className={`p-2 rounded-lg transition-colors ${
                                product.isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                  : 'bg-white/[0.04] text-gray-500 hover:bg-white/[0.08] hover:text-gray-300'
                              }`}
                              title={product.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {product.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                              title="Delete product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
