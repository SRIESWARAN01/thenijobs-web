'use client';

import React, {
  use,
  useState,
  useEffect,
  useCallback,
  useTransition,
} from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  MessageCircle,
  Star,
  Minus,
  Plus,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
} from 'lucide-react';

import {
  getProductById,
  getProductReviews,
  addProductReview,
} from '@/lib/firebase/shopService';
import { useCart } from '@/contexts/CartContext';
import { WHATSAPP_BUSINESS_NUMBER } from '@/lib/types';
import type { Product, ProductReview } from '@/lib/types';
import StarRating from '@/components/shop/StarRating';
import { useShopAuth } from '@/hooks/useShopAuth';
import { createRFQ } from '@/lib/firebase/firestoreService';

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton shimmer
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/5 ${className ?? ''}`}
    />
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in-up">
      <SkeletonPulse className="w-28 h-8 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image skeleton */}
        <div className="flex flex-col gap-3">
          <SkeletonPulse className="w-full aspect-square rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonPulse key={i} className="w-20 h-20 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
        {/* Info skeleton */}
        <div className="flex flex-col gap-4">
          <SkeletonPulse className="w-24 h-6 rounded-full" />
          <SkeletonPulse className="w-3/4 h-9" />
          <SkeletonPulse className="w-40 h-6" />
          <SkeletonPulse className="w-32 h-10" />
          <SkeletonPulse className="w-full h-24" />
          <SkeletonPulse className="w-full h-12 rounded-xl" />
          <SkeletonPulse className="w-full h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast notification
// ─────────────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-medium backdrop-blur-md border ${
        type === 'success'
          ? 'bg-emerald-900/80 border-emerald-500/40'
          : 'bg-red-900/80 border-red-500/40'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
      )}
      {message}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Star display (read-only inline)
// ─────────────────────────────────────────────────────────────────────────────

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <Star
            key={i}
            width={size}
            height={size}
            className="flex-shrink-0"
            style={{
              fill: filled ? '#f59e0b' : half ? 'url(#half)' : 'transparent',
              color: filled || half ? '#f59e0b' : '#374151',
            }}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Review card
// ─────────────────────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: ProductReview }) {
  const dateStr = review.createdAt instanceof Date
    ? review.createdAt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-white font-semibold text-sm">{review.customerName}</p>
          {dateStr && <p className="text-gray-500 text-xs mt-0.5">{dateStr}</p>}
        </div>
        <StarDisplay rating={review.rating} size={14} />
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Review form
// ─────────────────────────────────────────────────────────────────────────────

interface ReviewFormProps {
  productId: string;
  customerId: string;
  customerName: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

function ReviewForm({
  productId,
  customerId,
  customerName,
  onSuccess,
  onError,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (rating === 0) {
        onError('Please select a star rating.');
        return;
      }
      if (!comment.trim()) {
        onError('Please write a comment.');
        return;
      }
      startTransition(async () => {
        try {
          await addProductReview({
            productId,
            customerId,
            customerName,
            rating,
            comment: comment.trim(),
          });
          setRating(0);
          setComment('');
          onSuccess();
        } catch (err) {
          console.error('[ReviewForm] submit error:', err);
          onError('Failed to submit review. Please try again.');
        }
      });
    },
    [rating, comment, productId, customerId, customerName, onSuccess, onError],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card rounded-2xl p-5 flex flex-col gap-4"
    >
      <h3 className="text-white font-semibold text-base">Write a Review</h3>

      {/* Star picker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-gray-400 text-xs uppercase tracking-wider font-medium">
          Your Rating
        </label>
        <StarRating
          rating={rating}
          interactive
          onRate={setRating}
          size="lg"
        />
      </div>

      {/* Comment */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="review-comment"
          className="text-gray-400 text-xs uppercase tracking-wider font-medium"
        >
          Your Review
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Share your experience with this product…"
          className="search-input w-full px-4 py-3 resize-none rounded-xl text-sm"
          maxLength={800}
        />
        <p className="text-gray-600 text-xs self-end">{comment.length}/800</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-gradient px-6 py-3 flex items-center justify-center gap-2 rounded-xl font-semibold text-sm disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {isPending ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component client
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductDetailPageClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const { shopUser, shopUserProfile } = useShopAuth();

  // ── Data state ─────────────────────────────────────────────────────────────
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [quantity, setQuantity] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [rfqPhone, setRfqPhone] = useState(shopUser?.phoneNumber || '');
  const [rfqQty, setRfqQty] = useState(1);
  const [rfqDate, setRfqDate] = useState('');
  const [rfqMsg, setRfqMsg] = useState('');
  const [rfqSubmitting, setRfqSubmitting] = useState(false);

  useEffect(() => {
    if (shopUser) {
      setRfqPhone(shopUser.phoneNumber || '');
    }
  }, [shopUser]);

  const handleRfqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !shopUser) return;
    if (!rfqPhone.trim()) {
      showToast('Contact phone is required.', 'error');
      return;
    }

    setRfqSubmitting(true);
    try {
      await createRFQ({
        productId: product.id,
        productName: product.name,
        companyId: product.companyId || '',
        customerId: shopUser.uid,
        customerName: shopUserProfile?.fullName || shopUser.displayName || 'Anonymous',
        customerPhone: rfqPhone,
        customerEmail: shopUser.email || '',
        quantity: Number(rfqQty),
        targetDeliveryDate: rfqDate,
        message: rfqMsg,
      });

      showToast('Bulk quote request sent successfully!', 'success');
      setIsRfqModalOpen(false);
      setRfqMsg('');
      setRfqDate('');
    } catch (err) {
      console.error(err);
      showToast('Failed to submit quote request.', 'error');
    } finally {
      setRfqSubmitting(false);
    }
  };

  // ── Toast state ────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, [setToast]);

  const dismissToast = useCallback(() => setToast(null), [setToast]);

  // ── Fetch product ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingProduct(true);
    setNotFound(false);

    getProductById(id)
      .then((p) => {
        if (cancelled) return;
        if (!p) {
          setNotFound(true);
        } else {
          setProduct(p);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[ProductDetailPage] fetch product error:', err);
        setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingProduct(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ── Fetch reviews ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    setLoadingReviews(true);

    getProductReviews(id)
      .then((r) => {
        if (!cancelled) setReviews(r);
      })
      .catch((err) => {
        console.error('[ProductDetailPage] fetch reviews error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingReviews(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, product]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const hasImages = (product?.images?.length ?? 0) > 0;
  const activeImage =
    hasImages && !imgErrors[activeImageIndex]
      ? product!.images[activeImageIndex]
      : null;

  const isOutOfStock = (product?.stock ?? 0) === 0;
  const maxQty = product?.stock ?? 1;

  const averageRating =
    reviews.length > 0
      ? parseFloat(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
        )
      : 0;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePrevImage = useCallback(() => {
    if (!product) return;
    setActiveImageIndex((i) => (i === 0 ? product.images.length - 1 : i - 1));
  }, [product]);

  const handleNextImage = useCallback(() => {
    if (!product) return;
    setActiveImageIndex((i) => (i === product.images.length - 1 ? 0 : i + 1));
  }, [product]);

  const handleAddToCart = useCallback(() => {
    if (!product || isOutOfStock) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? '',
      stock: product.stock,
      quantity,
    });
    showToast(`${product.name} added to cart!`, 'success');
  }, [product, isOutOfStock, addToCart, quantity, showToast]);

  const handleWhatsApp = useCallback(() => {
    if (!product) return;
    const total = (product.price * quantity).toLocaleString('en-IN');
    const text = encodeURIComponent(
      `Hi! I'd like to buy: ${product.name} (x${quantity}) - ₹${total}`,
    );
    window.open(`https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${text}`, '_blank');
  }, [product, quantity]);

  const handleReviewSuccess = useCallback(() => {
    showToast(
      "Review submitted! It will appear after approval.",
      'success',
    );
    setShowReviewForm(false);
  }, [showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render states
  // ─────────────────────────────────────────────────────────────────────────

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-2">
          <ShoppingBag className="w-12 h-12 text-gray-600" />
        </div>
        <h1 className="text-2xl font-bold text-white font-outfit">Product not found</h1>
        <p className="text-gray-400 max-w-sm">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <button
          type="button"
          onClick={() => router.push('/shop')}
          className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </button>
      </div>
    );
  }

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100,
        )
      : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Back button ─────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* ── Product grid ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start"
        >

          {/* ── LEFT: Image gallery ───────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            {/* Main image */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white/5">
              {activeImage ? (
                <>
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                    onError={() =>
                      setImgErrors((prev) => ({ ...prev, [activeImageIndex]: true }))
                    }
                  />
                  {/* Prev / Next arrows – only show when more than 1 image */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        aria-label="Previous image"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                /* Placeholder when no images */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-violet-900/30 to-indigo-900/30">
                  <ShoppingBag className="w-16 h-16 text-white/20" />
                  <span className="text-gray-500 text-sm">No image available</span>
                </div>
              )}

              {/* Discount badge */}
              {discount > 0 && (
                <span className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Thumbnail strip */}
            {hasImages && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {product.images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImageIndex(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      activeImageIndex === i
                        ? 'border-violet-500 opacity-100'
                        : 'border-transparent opacity-60 hover:opacity-90'
                    }`}
                  >
                    {!imgErrors[i] ? (
                      <Image
                        src={src}
                        alt={`${product.name} thumbnail ${i + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                        onError={() =>
                          setImgErrors((prev) => ({ ...prev, [i]: true }))
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                        <ShoppingBag className="w-6 h-6 text-white/20" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product info panel ─────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Category badge */}
            <span className="inline-block self-start text-xs font-semibold uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
              {product.category}
            </span>

            {/* Product name */}
            <h1 className="text-3xl font-bold text-white font-outfit leading-tight">
              {product.name}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-3">
              <StarDisplay rating={product.rating} size={18} />
              <span className="text-gray-400 text-sm">
                ({product.reviewCount.toLocaleString()} review{product.reviewCount !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold gradient-text">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-gray-500 text-lg line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2">
              {isOutOfStock ? (
                <>
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm font-medium">Out of Stock</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-400 text-sm font-medium">
                    In Stock ({product.stock} left)
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm leading-relaxed">
              {product.description}
            </p>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Quantity selector */}
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm font-medium">Quantity</span>
                <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-white font-semibold text-sm select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    disabled={quantity >= maxQty}
                    aria-label="Increase quantity"
                    className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col gap-3">
              {/* Add to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="btn-gradient w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25"
              >
                <ShoppingCart className="w-5 h-5" />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>

              {/* Buy via WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsApp}
                disabled={isOutOfStock}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-5 h-5" />
                Buy via WhatsApp
              </button>

              {/* Request Bulk / B2B Quote */}
              {product.companyId && (
                <button
                  type="button"
                  onClick={() => {
                    setRfqQty(quantity);
                    setIsRfqModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base border border-white/[0.08] hover:border-emerald-500/30 text-gray-300 hover:text-emerald-300 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200"
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  Request Bulk / B2B Quote
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Reviews section ──────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-14"
          aria-label="Customer reviews"
        >
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white font-outfit">
              Customer Reviews
            </h2>

            {/* Write a review button (logged-in users only) */}
            {shopUser && !showReviewForm && (
              <button
                type="button"
                onClick={() => setShowReviewForm(true)}
                className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 self-start sm:self-auto"
              >
                <Star className="w-4 h-4" />
                Write a Review
              </button>
            )}
          </div>

          {/* Review form */}
          <AnimatePresence>
            {showReviewForm && shopUser && shopUserProfile && (
              <motion.div
                key="review-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <ReviewForm
                  productId={id}
                  customerId={shopUser.uid}
                  customerName={
                    shopUserProfile.fullName ||
                    shopUser.displayName ||
                    'Anonymous'
                  }
                  onSuccess={handleReviewSuccess}
                  onError={(msg) => showToast(msg, 'error')}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Average rating summary */}
          {reviews.length > 0 && (
            <div className="glass-card rounded-2xl p-5 mb-6 flex items-center gap-5">
              <div className="text-center">
                <p className="text-5xl font-bold text-white font-outfit">
                  {averageRating}
                </p>
                <p className="text-gray-400 text-xs mt-1">out of 5</p>
              </div>
              <div className="w-px h-14 bg-white/10" />
              <div className="flex flex-col gap-1">
                <StarDisplay rating={averageRating} size={22} />
                <p className="text-gray-400 text-sm">
                  Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Review list */}
          {loadingReviews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonPulse key={i} className="h-32" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
              <Star className="w-10 h-10 text-gray-600" />
              <p className="text-gray-400 text-sm">
                No approved reviews yet.{' '}
                {shopUser
                  ? 'Be the first to share your experience!'
                  : 'Sign in to write the first review.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </motion.section>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <Toast
            key="toast"
            message={toast.message}
            type={toast.type}
            onDismiss={dismissToast}
          />
        )}
      </AnimatePresence>

      {/* RFQ Modal */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-outfit">
          <div className="bg-[#0e0e22] border border-white/[0.08] rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <Send className="w-5 h-5 text-emerald-400" />
                Request B2B Quote
              </h2>
              <button 
                onClick={() => setIsRfqModalOpen(false)} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {!shopUser ? (
              <div className="p-6 text-center space-y-4">
                <p className="text-sm text-gray-400">You must be logged in to request a quote.</p>
                <button
                  onClick={() => router.push(`/shop/login?redirect=/shop/products/${product.id}`)}
                  className="btn-gradient w-full py-3 rounded-xl font-semibold text-sm"
                >
                  Log In / Sign Up
                </button>
              </div>
            ) : (
              <form onSubmit={handleRfqSubmit} className="p-6 space-y-4 text-left">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Product</label>
                  <input
                    type="text"
                    disabled
                    value={product.name}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rfq-qty" className="text-xs font-semibold text-gray-400 block mb-1">Quantity Needed *</label>
                    <input
                      id="rfq-qty"
                      type="number"
                      required
                      min={1}
                      value={rfqQty}
                      onChange={(e) => setRfqQty(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/40 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="rfq-date" className="text-xs font-semibold text-gray-400 block mb-1">Target Delivery Date</label>
                    <input
                      id="rfq-date"
                      type="date"
                      value={rfqDate}
                      onChange={(e) => setRfqDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/40 outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="rfq-phone" className="text-xs font-semibold text-gray-400 block mb-1">Contact Phone *</label>
                  <input
                    id="rfq-phone"
                    type="tel"
                    required
                    value={rfqPhone}
                    onChange={(e) => setRfqPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/40 outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="rfq-msg" className="text-xs font-semibold text-gray-400 block mb-1">Message / Requirements</label>
                  <textarea
                    id="rfq-msg"
                    rows={3}
                    value={rfqMsg}
                    onChange={(e) => setRfqMsg(e.target.value)}
                    placeholder="E.g., custom branding, bulk packaging details, delivery queries..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/40 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={rfqSubmitting}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {rfqSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {rfqSubmitting ? 'Sending...' : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRfqModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/[0.06] text-gray-400 font-medium text-sm hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
