'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where, orderBy } from 'firebase/firestore';
import { Star, MessageSquare, Loader2, Award, Calendar, Reply, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ReviewDoc {
  id: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  replyText?: string;
}

export default function EmployerReviewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');
  const [replyInput, setReplyInput] = useState<string>('');
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch reviews
  const { data: reviews, loading: reviewsLoading } = useCollection<ReviewDoc>('reviews', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !companyId });

  const handlePostReply = async (reviewId: string) => {
    if (!replyInput.trim()) return;
    setActionLoading(reviewId);
    try {
      // Import updateDocument dynamically or just use standard firestore update
      const { updateDocument } = await import('@/lib/firebase/firestoreService');
      await updateDocument('reviews', reviewId, { replyText: replyInput.trim() });
      setReplyInput('');
      setReplyReviewId(null);
      alert('Reply posted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to post reply');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = reviews.filter((r) => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'approved') return r.status === 'approved';
    return true;
  });

  // Calculate stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : '0.0';

  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const idx = Math.min(Math.max(Math.round(r.rating) - 1, 0), 4);
    ratingCounts[idx] += 1;
  });

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'RV';
  };

  const loading = companyLoading || reviewsLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <Star size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-white">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to view and respond to customer reviews.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Reviews & Feedback</h1>
        <p className="text-sm text-gray-400 mt-1">Monitor company ratings and reply to user feedback</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading reviews...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Summary / Breakdown */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card rounded-2xl p-5 text-center space-y-4">
              <h3 className="text-sm font-semibold text-white">Average Rating</h3>
              <div className="flex flex-col items-center justify-center gap-1">
                <span className="text-5xl font-extrabold text-white font-outfit">{averageRating}</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i < Math.round(parseFloat(averageRating));
                    return (
                      <Star
                        key={i}
                        size={18}
                        className={filled ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}
                      />
                    );
                  })}
                </div>
                <span className="text-xs text-gray-500 mt-1">Based on {totalReviews} review(s)</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rating Breakdown</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingCounts[stars - 1];
                  const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="w-8 text-gray-400 flex items-center gap-0.5">{stars} <Star size={10} className="text-amber-400 fill-amber-400" /></span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-gray-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column — Review List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-x-auto no-scrollbar max-w-xs">
              {(['all', 'pending', 'approved'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                    activeTab === t
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <MessageSquare size={32} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No reviews found.</p>
                </div>
              ) : (
                filtered.map((review) => (
                  <div key={review.id} className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{getInitials(review.userName)}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <h4 className="text-sm font-semibold text-white">{review.userName}</h4>
                            <p className="text-[10px] text-gray-500">Reviewed on {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}
                              />
                            ))}
                          </div>
                        </div>

                        {review.comment && (
                          <p className="text-xs text-gray-300 leading-relaxed bg-white/[0.01] p-3 rounded-xl border border-white/[0.04]">{review.comment}</p>
                        )}

                        {/* Reply box */}
                        {review.replyText ? (
                          <div className="bg-[#0e0e22] p-3 rounded-xl border border-violet-500/10 space-y-1">
                            <p className="text-[10px] text-violet-400 font-bold flex items-center gap-1">
                              <Reply size={10} /> Your Response
                            </p>
                            <p className="text-xs text-gray-400 leading-relaxed">{review.replyText}</p>
                          </div>
                        ) : (
                          replyReviewId !== review.id && (
                            <button
                              onClick={() => setReplyReviewId(review.id)}
                              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 pt-1"
                            >
                              <Reply size={10} /> Reply to Review
                            </button>
                          )
                        )}

                        {replyReviewId === review.id && (
                          <div className="pt-2 space-y-2">
                            <textarea
                              rows={3}
                              placeholder="Write a response..."
                              value={replyInput}
                              onChange={(e) => setReplyInput(e.target.value)}
                              className="w-full bg-[#111124] border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/40 focus:outline-none resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handlePostReply(review.id)}
                                disabled={actionLoading === review.id || !replyInput.trim()}
                                className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-[10px] font-bold hover:bg-cyan-500 transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                {actionLoading === review.id ? <Loader2 size={10} className="animate-spin" /> : null}
                                Send Response
                              </button>
                              <button
                                onClick={() => {
                                  setReplyReviewId(null);
                                  setReplyInput('');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-gray-400 text-[10px] font-medium hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
