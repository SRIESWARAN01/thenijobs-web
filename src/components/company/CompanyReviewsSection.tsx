'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Star, MessageSquare, ThumbsUp, ChevronRight,
  User, Calendar, Loader2, Plus, X, Send, AlertCircle
} from 'lucide-react';
import {
  collection, query, where, orderBy, limit,
  getDocs, addDoc, serverTimestamp, doc, updateDoc, increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';

interface Review {
  id: string;
  reviewerName: string;
  reviewerPhoto?: string;
  reviewerId?: string;
  rating: number;
  text: string;
  targetName?: string;
  targetId?: string;
  companyId?: string;
  status?: string;
  helpful?: number;
  createdAt?: any;
}

interface CompanyReviewsSectionProps {
  companyId: string;
  companyName: string;
  companySlug?: string;
  /** Show full expanded list or compact preview */
  mode?: 'preview' | 'full';
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= rating ? 'text-amber-400' : 'text-gray-700'}
          fill={i <= rating ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  );
}

function InteractiveStar({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={(hover || value) >= i ? 'text-amber-400' : 'text-gray-600'}
            fill={(hover || value) >= i ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, onHelpful }: { review: Review; onHelpful: (id: string) => void }) {
  const formatDate = (val: any) => {
    if (!val) return '';
    try {
      const d = val?.toDate ? val.toDate() : new Date(val);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  const initials = review.reviewerName
    ? review.reviewerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AN';

  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {review.reviewerPhoto ? (
          <img src={review.reviewerPhoto} alt={review.reviewerName} className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-500/40 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-white">{review.reviewerName || 'Anonymous'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <StarRating rating={review.rating} size={12} />
                <span className="text-[10px] text-amber-400 font-bold">{review.rating}.0</span>
              </div>
            </div>
            {review.createdAt && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500 shrink-0">
                <Calendar size={9} />
                {formatDate(review.createdAt)}
              </span>
            )}
          </div>

          {review.text && (
            <p className="mt-2 text-sm text-gray-300 leading-relaxed">{review.text}</p>
          )}

          <button
            onClick={() => onHelpful(review.id)}
            className="mt-2.5 flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-emerald-400 transition-colors"
          >
            <ThumbsUp size={11} />
            Helpful {review.helpful ? `(${review.helpful})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyReviewsSection({
  companyId,
  companyName,
  companySlug,
  mode = 'preview',
}: CompanyReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Write review form state
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState('');

  // Stats
  const [avgRating, setAvgRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const previewLimit = mode === 'preview' ? 3 : 50;

  useEffect(() => {
    let cancelled = false;
    async function loadReviews() {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'reviews'),
          where('companyId', '==', companyId),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(previewLimit)
        );
        const snap = await getDocs(q);
        if (cancelled) return;

        const loaded: Review[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
        setReviews(loaded);

        // Compute average
        if (loaded.length > 0) {
          const sum = loaded.reduce((acc, r) => acc + (r.rating || 0), 0);
          setAvgRating(Math.round((sum / loaded.length) * 10) / 10);
        }

        // Get total count (all approved)
        const countQ = query(
          collection(db, 'reviews'),
          where('companyId', '==', companyId),
          where('status', '==', 'approved')
        );
        const countSnap = await getDocs(countQ);
        if (!cancelled) setTotalCount(countSnap.size);
      } catch (err) {
        // If index not ready, fall back to no-filter query
        try {
          const fallbackQ = query(
            collection(db, 'reviews'),
            where('companyId', '==', companyId),
            limit(previewLimit)
          );
          const snap = await getDocs(fallbackQ);
          if (!cancelled) {
            const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
            setReviews(loaded);
            setTotalCount(loaded.length);
          }
        } catch { /* silent */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadReviews();
    return () => { cancelled = true; };
  }, [companyId, previewLimit]);

  const handleHelpful = async (reviewId: string) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), { helpful: increment(1) });
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful: (r.helpful || 0) + 1 } : r));
    } catch { /* silent */ }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRating === 0) { setSubmitError('Please select a rating'); return; }
    if (newText.trim().length < 10) { setSubmitError('Review must be at least 10 characters'); return; }
    setSubmitError('');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        companyId,
        targetId: companyId,
        targetName: companyName,
        targetType: 'business',
        reviewerId: user?.uid || null,
        reviewerName: user?.displayName || 'Anonymous',
        reviewerPhoto: user?.photoURL || null,
        rating: newRating,
        text: newText.trim(),
        status: 'pending', // pending admin approval
        helpful: 0,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setShowWriteForm(false);
      setNewRating(0);
      setNewText('');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const reviewsPageHref = companySlug
    ? `/company/${companySlug}/reviews`
    : `/company/${companyId}/reviews`;

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Star size={15} className="text-amber-400 fill-amber-400/30" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-outfit">Reviews & Ratings</h3>
            {totalCount > 0 && (
              <p className="text-[11px] text-gray-500">{totalCount} review{totalCount !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowWriteForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold hover:bg-violet-500/20 transition-all"
        >
          <Plus size={13} />
          Write a Review
        </button>
      </div>

      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex-wrap sm:flex-nowrap">
          {/* Big avg */}
          <div className="text-center shrink-0 flex flex-col items-center justify-center min-w-[80px]">
            <p className="text-4xl font-black text-white font-outfit">{avgRating}</p>
            <StarRating rating={Math.round(avgRating)} size={14} />
            <p className="text-[10px] text-gray-500 mt-1">{totalCount} review{totalCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 space-y-1.5 min-w-[140px]">
            {dist.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-3 text-right shrink-0">{star}</span>
                <Star size={9} className="text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 w-5 shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write Review Form */}
      {showWriteForm && (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-violet-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">Write a Review</p>
            <button onClick={() => setShowWriteForm(false)} className="text-gray-500 hover:text-white transition-colors p-1">
              <X size={15} />
            </button>
          </div>
          <form onSubmit={handleSubmitReview} className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-2">Your Rating *</p>
              <InteractiveStar value={newRating} onChange={setNewRating} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Your Review *</p>
              <textarea
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder={`Share your experience with ${companyName}...`}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-violet-500/40 focus:bg-white/[0.06] outline-none transition-all resize-none"
              />
              <p className="text-[10px] text-gray-600 mt-1">{newText.length}/500 chars · Minimum 10</p>
            </div>
            {submitError && (
              <div className="flex items-center gap-2 text-rose-400 text-xs">
                <AlertCircle size={12} /> {submitError}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <p className="text-[10px] text-gray-600">Reviews are pending approval before publishing.</p>
          </form>
        </div>
      )}

      {/* Submitted success */}
      {submitted && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          ✅ Thank you! Your review has been submitted for approval.
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="text-violet-400 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-3">
            <MessageSquare size={20} className="text-gray-600" />
          </div>
          <p className="text-sm text-gray-400 font-medium">No reviews yet</p>
          <p className="text-xs text-gray-600 mt-1">Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} onHelpful={handleHelpful} />
          ))}
        </div>
      )}

      {/* View More button — only in preview mode when there are more */}
      {mode === 'preview' && totalCount > 3 && (
        <Link
          href={reviewsPageHref}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm font-semibold text-gray-300 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all"
        >
          View all {totalCount} reviews
          <ChevronRight size={16} />
        </Link>
      )}
    </section>
  );
}
