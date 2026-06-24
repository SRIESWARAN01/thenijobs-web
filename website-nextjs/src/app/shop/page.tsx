'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  ArrowRight,
  MessageCircle,
  Sparkles,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';
import ProductCard from '@/components/shop/ProductCard';
import { getProducts } from '@/lib/firebase/shopService';
import {
  SHOP_PRODUCT_CATEGORIES,
  WHATSAPP_BUSINESS_NUMBER,
  SHOP_NAME,
} from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import type { Product } from '@/lib/types';

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="premium-card overflow-hidden animate-pulse">
      <div className="aspect-square bg-white/[0.04] shimmer" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-16 bg-white/[0.05] rounded-full shimmer" />
        <div className="h-4 w-3/4 bg-white/[0.05] rounded shimmer" />
        <div className="h-3 w-1/2 bg-white/[0.05] rounded shimmer" />
        <div className="h-8 w-full bg-white/[0.05] rounded-xl shimmer mt-2" />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const router = useRouter();
  const { addToCart } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [featured, latest] = await Promise.all([
          getProducts({ isFeatured: true, isActive: true, limitCount: 4 }),
          getProducts({ isActive: true, limitCount: 8 }),
        ]);
        setFeaturedProducts(featured);
        setLatestProducts(latest);
      } catch (err) {
        console.error('[ShopPage] Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/shop/products?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/shop/products');
    }
  }

  function handleAddToCart(productId: string) {
    const product =
      featuredProducts.find((p) => p.id === productId) ??
      latestProducts.find((p) => p.id === productId);
    if (!product) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? '',
      stock: product.stock,
      quantity: 1,
    });
  }

  const waLink = `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(
    `Hi! I'd like to place an order from ${SHOP_NAME}.`,
  )}`;

  return (
    <div className="blob-bg min-h-screen">
      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90" />
        <div className="absolute inset-0 grid-pattern opacity-30" />

        <div className="relative max-w-4xl mx-auto px-4 py-20 sm:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">Local products from Theni</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-outfit font-bold text-white mb-4 leading-tight">
              <span className="gradient-text">{SHOP_NAME}</span>
            </h1>
            <p className="text-gray-400 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
              Premium local products from Theni — discover, shop, and support your community.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="search-input w-full pl-12 pr-4 py-3.5 text-white"
                />
              </div>
              <button type="submit" className="btn-gradient px-6 py-3.5 shrink-0">
                Search
              </button>
            </form>

            <Link href="/shop/products" className="btn-gradient inline-flex items-center gap-2 px-8 py-3.5">
              <ShoppingBag className="w-5 h-5" />
              Browse Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Categories Row ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {SHOP_PRODUCT_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={cat === 'All' ? '/shop/products' : `/shop/products?category=${encodeURIComponent(cat)}`}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/40 hover:bg-purple-500/10 transition-all duration-200 whitespace-nowrap"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white font-outfit">
              ✦ Featured Products
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">Hand-picked local favourites</p>
          </div>
          <Link
            href="/shop/products?featured=true"
            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-10 text-center text-gray-500">
            No featured products yet.
          </div>
        )}
      </section>

      {/* ── All Products ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white font-outfit">Latest Products</h2>
            <p className="text-gray-400 text-sm mt-0.5">Fresh arrivals from local sellers</p>
          </div>
          <Link
            href="/shop/products"
            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : latestProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {latestProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-10 text-center text-gray-500">
            No products available yet. Check back soon!
          </div>
        )}
      </section>

      {/* ── WhatsApp Promo Banner ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 via-emerald-900/10 to-green-900/20 rounded-2xl" />

          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-outfit font-bold text-white mb-3">
              Order via WhatsApp
            </h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Prefer to order directly? Chat with us on WhatsApp for personalised service and
              quick delivery.
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-500 transition-colors duration-200 shadow-lg shadow-green-900/30"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
