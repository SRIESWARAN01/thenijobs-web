'use client';

import { useState } from 'react';
import { CompanyReview } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { createDocument } from '@/lib/firebase/firestoreService';
import {
  Star, ThumbsUp, MessageSquare, Send, CheckCircle2,
  ShieldCheck, AlertCircle, X, Sparkles, Filter, User
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

interface CompanyReviewsSectionProps {
  companyId: string;
  companyName: string;
  reviews: CompanyReview[];
  averageRating?: number;
  onReviewSubmitted?: () => void;
}

export default function CompanyReviewsSection({
  companyId,
  companyName,
  reviews = [],
  averageRating = 0,
  onReviewSubmitted,
}: CompanyReviewsSectionProps) {
  const { user } = useAuth();
  const toast = useToast();

  const [showWriteModal, setShowWriteModal] = useState(false);
  const [filterSort, setFilterSort] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [submitting, setSubmitting] = useState(false);

  // Form state for Write a Review
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  // Approved reviews filter
  const approvedReviews = reviews.filter(r => r.status === 'approved' || !r.status);

  // Sort reviews
  const sortedReviews = [...approvedReviews].sort((a, b) => {
    if (filterSort === 'highest') return b.rating - a.rating;
    if (filterSort === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0).getTime() -
           new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0).getTime();
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.warning('Please sign in as a Job Seeker to submit a review.');
      return;
    }
    if (!content.trim()) {
      toast.warning('Please write your review feedback.');
      return;
    }

    setSubmitting(true);
    try {
      await createDocument('reviews', {
        companyId,
        userId: user.uid,
        userName: user.displayName || 'Job Seeker',
        userPhotoUrl: user.photoURL || '',
        rating,
        title: title.trim() || 'Work Experience Review',
        content: content.trim(),
        status: 'pending', // Requires admin approval
        createdAt: new Date(),
      });

      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        setShowWriteModal(false);
        setTitle('');
        setContent('');
        setRating(5);
        if (onReviewSubmitted) onReviewSubmitted();
      }, 2500);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-outfit">
      {/* Overview & Rating Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Average Rating Score */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <span className="text-2xl font-black">{averageRating.toFixed(1)}</span>
              <div className="flex text-amber-500">
                <Star size={10} className="fill-amber-500" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Candidate & Employee Reviews
              </h3>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={16}
                    className={star <= Math.round(averageRating) ? 'fill-amber-400 text-amber-600' : 'text-slate-300'}
                  />
                ))}
                <span className="ml-2 text-xs font-semibold text-slate-600">
                  {approvedReviews.length} Verified {approvedReviews.length === 1 ? 'Review' : 'Reviews'}
                </span>
              </div>
            </div>
          </div>

          {/* Action & Filter Buttons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Filter size={13} className="text-slate-500" />
              <select
                value={filterSort}
                onChange={e => setFilterSort(e.target.value as any)}
                className="bg-transparent border-none outline-none font-semibold text-slate-800 cursor-pointer"
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>

            {user ? (
              <button
                type="button"
                onClick={() => setShowWriteModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
              >
                <Star size={14} className="fill-white" />
                <span>Write a Review</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-600 hover:text-white transition-all"
              >
                <span>Sign in to Review</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Review List */}
      {sortedReviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
          <MessageSquare size={32} className="mx-auto mb-2 text-slate-300" />
          No verified reviews yet. Be the first candidate to share your experience with {companyName}!
        </div>
      ) : (
        <div className="space-y-4">
          {sortedReviews.map(r => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs hover:border-slate-300 transition-all">
              {/* Header: User & Rating */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-100 overflow-hidden">
                    {r.userPhotoUrl ? (
                      <img src={r.userPhotoUrl} alt={r.userName} className="w-full h-full object-cover" />
                    ) : (
                      r.userName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      {r.userName}
                      {r.isVerifiedSeeker === true && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          <ShieldCheck size={11} /> Verified Candidate
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString('en-IN') : 'Recently'}
                    </p>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1 border border-amber-200/60">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={12}
                      className={star <= r.rating ? 'fill-amber-400 text-amber-600' : 'text-slate-300'}
                    />
                  ))}
                  <span className="ml-1 text-xs font-bold text-amber-700">{r.rating}.0</span>
                </div>
              </div>

              {/* Title & Comment */}
              <div>
                {r.title && <h5 className="text-xs font-bold text-slate-800 mb-1">&quot;{r.title}&quot;</h5>}
                <p className="text-xs text-slate-600 leading-relaxed">{r.content}</p>
              </div>

              {/* Company Reply Box */}
              {r.companyReply && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 mt-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[11px]">
                    <MessageSquare size={13} />
                    <span>Company Response:</span>
                  </div>
                  <p className="text-slate-700 pl-4 border-l-2 border-blue-400 italic">
                    &quot;{r.companyReply.replyText}&quot;
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Write Review Interactive Modal */}
      {showWriteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in font-outfit">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Star size={18} className="text-amber-500 fill-amber-500" /> Write a Review for {companyName}
              </h3>
              <button onClick={() => setShowWriteModal(false)} className="text-slate-500 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {successMsg ? (
              <div className="py-8 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-base font-bold text-slate-900">Review Submitted!</h4>
                <p className="text-xs text-slate-500">Your review is submitted for admin moderation and will appear publicly once approved.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* 1-5 Star Interactive Selector */}
                <div>
                  <label htmlFor="company-companyreviewssection-your-rating-onmouseenter-onmouseleave-cl" className="text-xs font-semibold text-slate-700 block mb-1">Your Rating *</label>
                  <div className="flex items-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          size={26}
                          className={(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-600' : 'text-slate-300'}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-amber-600">
                      {hoverRating || rating} out of 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Review Headline</label>
                  <input id="company-companyreviewssection-your-rating-onmouseenter-onmouseleave-cl"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Write a review title"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="company-companyreviewssection-your-experience-feedback" className="text-xs font-semibold text-slate-700 block mb-1">Your Experience / Feedback *</label>
                  <textarea id="company-companyreviewssection-your-experience-feedback"
                    rows={4}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Share your work experience, hiring process, or overall feedback about this company..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200 text-[11px] text-slate-500">
                  <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>Submitted reviews undergo admin moderation to maintain genuine community standards.</span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowWriteModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
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
