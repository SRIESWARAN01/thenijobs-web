'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import {
  Box, Loader2, Search, Check, AlertTriangle, AlertOctagon,
  Plus, Minus, ArrowUpDown, TrendingDown, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { updateProduct } from '@/lib/firebase/shopService';

interface ProductDoc {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  isActive: boolean;
  companyId: string;
}

export default function BusinessInventoryPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 1. Fetch company profile
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch products
  const { data: products, loading: productsLoading } = useCollection<any>('products', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  const handleAdjustStock = async (product: ProductDoc, newStock: number) => {
    if (newStock < 0) return;
    setUpdatingId(product.id);
    try {
      await updateProduct(product.id, { stock: newStock });
    } catch (err) {
      console.error(err);
      alert('Failed to update stock quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  const loading = companyLoading || productsLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white animate-fade-in-up">
        <Box size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold animate-pulse">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to manage your catalog inventory.</p>
        <Link href="/business/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  // Calculate Metrics
  const totalSKUs = products.length;
  const totalStock = products.reduce((sum: number, p: any) => sum + (p.stock || 0), 0);
  const outOfStockCount = products.filter((p: any) => (p.stock || 0) === 0).length;
  const lowStockCount = products.filter((p: any) => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;

  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-outfit">Inventory Tracker</h1>
        <p className="text-sm text-gray-400 mt-1">Monitor stock quantities, set warnings, and handle restock orders</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading inventory data...</p>
        </div>
      ) : (
        <>
          {/* Summary Metrics Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card p-5 rounded-2xl border border-white/[0.06] flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold block">Total SKUs</span>
                <span className="text-2xl font-black text-white">{totalSKUs}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <Box size={20} className="text-gray-400" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/[0.06] flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold block">Total Stock Items</span>
                <span className="text-2xl font-black text-white">{totalStock}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <ArrowUpDown size={20} className="text-emerald-400" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/[0.06] flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold block">Low Stock Items</span>
                <span className="text-2xl font-black text-amber-400">{lowStockCount}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/[0.06] flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold block">Out of Stock</span>
                <span className="text-2xl font-black text-rose-500">{outOfStockCount}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <AlertOctagon size={20} className="text-rose-500" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/40 outline-none transition-all"
              />
            </div>
          </div>

          {/* Catalog Stock Levels List */}
          <div className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] text-gray-400 font-semibold text-xs bg-white/[0.02]">
                    <th className="p-4">Product Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock Status</th>
                    <th className="p-4 text-center">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No inventory matches found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((product: ProductDoc) => {
                      const isOut = product.stock === 0;
                      const isLow = product.stock > 0 && product.stock <= 5;
                      
                      return (
                        <tr key={product.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-900 overflow-hidden flex-shrink-0 border border-white/[0.08] flex items-center justify-center">
                                {product.images?.[0] ? (
                                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Box size={18} className="text-gray-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-white block truncate">{product.name}</span>
                                <span className="text-[10px] text-gray-500 block truncate max-w-xs">{product.description}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-xs text-gray-400">{product.category || 'General'}</span>
                          </td>
                          <td className="p-4 font-semibold">
                            ₹{product.price}
                          </td>
                          <td className="p-4">
                            {isOut ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <span className="w-1 h-1 rounded-full bg-rose-400" />
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <span className="w-1 h-1 rounded-full bg-amber-400" />
                                Low Stock ({product.stock})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                In Stock ({product.stock})
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleAdjustStock(product, product.stock - 1)}
                                disabled={updatingId === product.id || product.stock <= 0}
                                className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              
                              {updatingId === product.id ? (
                                <Loader2 size={16} className="text-emerald-400 animate-spin" />
                              ) : (
                                <span className="w-8 text-center text-sm font-bold text-white">
                                  {product.stock}
                                </span>
                              )}

                              <button
                                onClick={() => handleAdjustStock(product, product.stock + 1)}
                                disabled={updatingId === product.id}
                                className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
