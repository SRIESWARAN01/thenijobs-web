'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart, Tag } from 'lucide-react';

// ─────────────────────────────────── Types ───────────────────────────────────

export interface ProductCardProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isFeatured: boolean;
}

interface ProductCardProps {
  product: ProductCardProduct;
  onAddToCart?: (id: string) => void;
}

// ──────────────────────────── Star Rating Helper ──────────────────────────────

function StarDisplay({ rating, maxRating = 5 }: { rating: number; maxRating?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of ${maxRating} stars`}>
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <span
            key={i}
            className="text-sm leading-none select-none"
            style={{ color: filled || half ? '#f59e0b' : '#374151' }}
          >
            {half ? '½' : '★'}
          </span>
        );
      })}
    </div>
  );
}

// ─────────────────────────── Discount Calculator ──────────────────────────────

function calcDiscount(price: number, original: number): number {
  if (original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

// ──────────────────────────────── Component ──────────────────────────────────

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const {
    id,
    name,
    price,
    originalPrice,
    images,
    category,
    rating,
    reviewCount,
    stock,
    isFeatured,
  } = product;

  const [imgError, setImgError] = useState(false);
  const isOutOfStock = stock === 0;
  const discount = originalPrice ? calcDiscount(price, originalPrice) : 0;
  const displayImage = !imgError && images.length > 0 ? images[0] : null;

  const handleAddToCart = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isOutOfStock && onAddToCart) {
        onAddToCart(id);
      }
    },
    [id, isOutOfStock, onAddToCart],
  );

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Link href={`/shop/products/${id}`} className="block h-full focus:outline-none group">
        <article className="premium-card flex flex-col h-full overflow-hidden animate-fade-in-up">
          {/* ── Image wrapper ────────────────────────────────────────────── */}
          <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-white/5">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Tag className="w-12 h-12 text-white/20" />
              </div>
            )}

            {/* Out-of-stock overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-t-2xl backdrop-blur-sm">
                <span className="text-white font-semibold text-sm tracking-widest uppercase px-3 py-1.5 border border-white/20 rounded-full bg-black/40">
                  Out of Stock
                </span>
              </div>
            )}

            {/* Featured badge */}
            {isFeatured && (
              <span className="absolute top-2.5 left-2.5 badge-featured text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full z-10">
                ✦ Featured
              </span>
            )}

            {/* Discount badge */}
            {discount > 0 && !isOutOfStock && (
              <span className="absolute top-2.5 right-2.5 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full z-10">
                -{discount}%
              </span>
            )}
          </div>

          {/* ── Card body ────────────────────────────────────────────────── */}
          <div className="flex flex-col flex-1 gap-2.5 p-4">
            {/* Category pill */}
            <span className="inline-block self-start text-[10px] font-semibold uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full">
              {category}
            </span>

            {/* Product name */}
            <h3 className="text-white font-semibold text-sm leading-snug font-outfit line-clamp-2">
              {name}
            </h3>

            {/* Star rating */}
            <div className="flex items-center gap-1.5">
              <StarDisplay rating={rating} />
              <span className="text-gray-400 text-xs">({reviewCount.toLocaleString()})</span>
            </div>

            {/* Spacer to push price + button to the bottom */}
            <div className="flex-1" />

            {/* Price row */}
            <div className="flex items-baseline gap-2">
              <span className="text-white font-bold text-base">
                ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-gray-500 text-xs line-through">
                  ₹{originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </span>
              )}
            </div>

            {/* Add to Cart button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              aria-label={isOutOfStock ? 'Out of stock' : `Add ${name} to cart`}
              className={[
                'btn-gradient w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 relative z-10',
                isOutOfStock
                  ? 'opacity-40 cursor-not-allowed pointer-events-none'
                  : 'hover:shadow-lg hover:shadow-violet-500/25',
              ].join(' ')}
            >
              <ShoppingCart className="w-4 h-4 flex-shrink-0" />
              <span>{isOutOfStock ? 'Unavailable' : 'Add to Cart'}</span>
            </button>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
