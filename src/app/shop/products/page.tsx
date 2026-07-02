'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, ChevronDown } from 'lucide-react';
import { getProducts } from '@/lib/firebase/shopService';
import { SHOP_PRODUCT_CATEGORIES } from '@/lib/types';
import type { Product } from '@/lib/types';
import ProductCard from '@/components/shop/ProductCard';
import { useCart } from '@/contexts/CartContext';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [displayCount, setDisplayCount] = useState(12);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getProducts({ isActive: true });
        setProducts(data as Product[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const applyFilters = useCallback(() => {
    let result = [...products];
    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
      );
    }
    if (sortOrder === 'asc') result.sort((a, b) => a.price - b.price);
    else if (sortOrder === 'desc') result.sort((a, b) => b.price - a.price);
    setFiltered(result);
  }, [products, selectedCategory, searchQuery, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (val) params.set('q', val); else params.delete('q');
      router.replace(`/shop/products?${params.toString()}`);
    }, 400);
    setSearchTimeout(t);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const params = new URLSearchParams(searchParams.toString());
    if (cat && cat !== 'All') params.set('category', cat); else params.delete('category');
    router.replace(`/shop/products?${params.toString()}`);
  };

  const handleAddToCart = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    addToCart({ productId: product.id, name: product.name, price: product.price, image: product.images[0], stock: product.stock });
  };

  const visibleProducts = filtered.slice(0, displayCount);
  const hasMore = filtered.length > displayCount;

  return (
    <div className="min-h-screen bg-[#0a0a1a] pb-16">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0d0d20]/80 backdrop-blur-xl sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search products..."
                className="search-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
              {searchQuery && (
                <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Sort */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="search-input pl-4 pr-10 py-2.5 text-sm appearance-none cursor-pointer"
              >
                <option value="default">Default Sort</option>
                <option value="asc">Price: Low to High</option>
                <option value="desc">Price: High to Low</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 pb-1">
            {SHOP_PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white font-outfit">
            {selectedCategory !== 'All' ? selectedCategory : 'All Products'}
            {!loading && <span className="text-sm font-normal text-gray-500 ml-2">({filtered.length} items)</span>}
          </h1>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={() => { handleSearchChange(''); handleCategoryChange('All'); }}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="premium-card rounded-2xl overflow-hidden">
                <div className="aspect-square bg-white/[0.06] shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-white/[0.06] rounded shimmer" />
                  <div className="h-3 w-2/3 bg-white/[0.06] rounded shimmer" />
                  <div className="h-5 w-1/3 bg-white/[0.06] rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No products found</h3>
            <p className="text-gray-500 text-sm mb-6">Try adjusting your search or filters</p>
            <button onClick={() => { handleSearchChange(''); handleCategoryChange('All'); }} className="btn-gradient px-6 py-3 text-sm font-semibold">
              Clear Filters
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && visibleProducts.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={() => setDisplayCount((c) => c + 12)}
                  className="btn-outline-glass px-8 py-3 text-sm font-semibold"
                >
                  Load More ({filtered.length - displayCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
