'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Star, CheckCircle, Trash2, Loader2, MessageSquare, Filter,
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { approveProductReview, deleteProductReview } from '@/lib/firebase/shopService';
import type { ProductReview } from '@/lib/types';

// ─── inline star renderer ────────────────────────────────────────────────────

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}
        />
      ))}
      <span className="ml-1 text-xs text-gray-400">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date | undefined | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function truncate(text: string, len = 80): string {
  return text.length > len ? `${text.slice(0, len)}…` : text;
}

type FilterType = 'all' | 'pending' | 'approved';

const FILTER_LABELS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
];

// ─── status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ isApproved }: { isApproved: boolean }) {
  return isApproved ? (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400">
      Approved
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400">
      Pending
    </span>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch ALL reviews directly from Firestore (no productId filter)
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'productReviews'),
        orderBy('createdAt', 'desc'),
      );
      const snap = await getDocs(q);
      const data: ProductReview[] = snap.docs.map((d) => {
        const raw = d.data();
        // Normalise Firestore Timestamp → JS Date
        const normalise = (val: unknown): Date =>
          val instanceof Date
            ? val
            : typeof val === 'object' && val !== null && 'toDate' in val
            ? (val as { toDate: () => Date }).toDate()
            : new Date();
        return {
          id: d.id,
          productId: raw['productId'] ?? '',
          customerId: raw['customerId'] ?? '',
          customerName: raw['customerName'] ?? 'Anonymous',
          rating: raw['rating'] ?? 0,
          comment: raw['comment'] ?? '',
          isApproved: raw['isApproved'] ?? false,
          createdAt: normalise(raw['createdAt']),
        } satisfies ProductReview;
      });
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // ── filtered list ──
  const filtered = useMemo(() => {
    if (filter === 'pending') return reviews.filter((r) => !r.isApproved);
    if (filter === 'approved') return reviews.filter((r) => r.isApproved);
    return reviews;
  }, [reviews, filter]);

  // ── approve ──
  async function handleApprove(id: string) {
    setApprovingId(id);
    try {
      await approveProductReview(id);
      await fetchReviews();
    } catch (err) {
      console.error('Failed to approve review:', err);
    } finally {
      setApprovingId(null);
    }
  }

  // ── delete ──
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteProductReview(id);
      setConfirmDeleteId(null);
      await fetchReviews();
    } catch (err) {
      console.error('Failed to delete review:', err);
    } finally {
      setDeletingId(null);
    }
  }

  // ── summary counts ──
  const pendingCount = reviews.filter((r) => !r.isApproved).length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">
            Product Reviews Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Moderate and manage customer product reviews.
          </p>
        </div>
        {/* Summary badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {pendingCount} Pending
          </span>
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {approvedCount} Approved
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] w-fit border border-white/[0.06]">
        {FILTER_LABELS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filter === f.value
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <MessageSquare size={16} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Reviews</h2>
            <p className="text-[10px] text-gray-500">{filtered.length} shown</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-violet-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <MessageSquare size={36} className="text-gray-600" />
            <p className="text-gray-400 text-sm">No reviews in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {[
                    'Customer', 'Product ID', 'Rating',
                    'Comment', 'Status', 'Date', 'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((review) => (
                  <tr
                    key={review.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Customer */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-500/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-white">
                            {review.customerName?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <span className="font-medium text-white max-w-[120px] truncate">
                          {review.customerName}
                        </span>
                      </div>
                    </td>
                    {/* Product ID */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-500 max-w-[120px] truncate block">
                        {review.productId || '—'}
                      </span>
                    </td>
                    {/* Rating */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StarRating rating={review.rating} />
                    </td>
                    {/* Comment */}
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="text-gray-400 text-xs leading-relaxed">
                        {truncate(review.comment)}
                      </p>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge isApproved={review.isApproved} />
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400 text-xs">
                      {formatDate(review.createdAt)}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {/* Approve (only if pending) */}
                        {!review.isApproved && (
                          <button
                            onClick={() => handleApprove(review.id)}
                            disabled={approvingId === review.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                            title="Approve"
                          >
                            {approvingId === review.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <CheckCircle size={12} />
                            )}
                            Approve
                          </button>
                        )}
                        {/* Delete */}
                        {confirmDeleteId === review.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(review.id)}
                              disabled={deletingId === review.id}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all disabled:opacity-50"
                            >
                              {deletingId === review.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                'Yes'
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.06] text-gray-400 hover:bg-white/[0.1] transition-all"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(review.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
