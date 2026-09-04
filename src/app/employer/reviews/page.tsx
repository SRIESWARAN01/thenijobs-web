'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where, orderBy } from 'firebase/firestore';
import { Loader2, MessageSquare, Reply, Star } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, type FirestoreTime } from '@/lib/firestoreTime';
import {
  Button, Card, CardBody, CardHeader, EmptyState, PageHeader, PageShell, Pill, Tabs,
} from '@/components/dashboard';

interface CompanyDoc { id: string; name?: string }

interface ReviewDoc {
  id: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: FirestoreTime;
  replyText?: string;
}

export default function EmployerReviewsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');
  const [replyInput, setReplyInput] = useState<string>('');
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const toast = useToast();

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<CompanyDoc>('companies', [
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
      toast.success('Reply posted successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to post reply');
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
      <PageShell>
        <EmptyState
          icon={Star}
          title="No company profile yet"
          description="Register your company profile to view and respond to customer reviews."
          action={
            <Link href="/employer/company-profile">
              <Button variant="primary">Set up company profile</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Reviews & feedback"
        description="Monitor company ratings and reply to customer feedback."
        breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Reviews' }]}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 size={30} className="animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Loading reviews…</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="space-y-4 sm:space-y-6 lg:col-span-1">
            <Card>
              <CardBody className="space-y-3 text-center">
                <h2 className="text-sm font-semibold text-slate-900">Average rating</h2>
                <p className="text-5xl font-bold tracking-tight text-slate-900">{averageRating}</p>
                <div className="flex items-center justify-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < Math.round(parseFloat(averageRating)) ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}
                      aria-hidden
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500">Based on {totalReviews} review{totalReviews === 1 ? '' : 's'}</p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Rating breakdown" />
              <CardBody className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingCounts[stars - 1];
                  const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="flex w-8 items-center gap-0.5 text-slate-600">
                        {stars} <Star size={10} className="fill-amber-500 text-amber-500" aria-hidden />
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span className="block h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-8 text-right tabular-nums text-slate-500">{count}</span>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <Tabs
              label="Review filter"
              value={activeTab}
              onChange={(id) => setActiveTab(id as 'all' | 'pending' | 'approved')}
              tabs={[
                { id: 'all', label: 'All', count: reviews.length },
                { id: 'pending', label: 'Pending', count: reviews.filter(r => r.status === 'pending').length },
                { id: 'approved', label: 'Approved', count: reviews.filter(r => r.status === 'approved').length },
              ]}
            />

            {filtered.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No reviews found"
                description="Reviews customers leave on your company page will appear here."
              />
            ) : (
              <div className="space-y-4">
                {filtered.map((review) => (
                  <Card key={review.id} className="p-4 transition-colors hover:border-slate-300 sm:p-5">
                    <div className="flex items-start gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-[#EFF6FF] text-xs font-bold text-[#1E40AF]">
                        {getInitials(review.userName)}
                      </span>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-900">{review.userName}</h3>
                            <p className="text-xs text-slate-500">Reviewed {formatDate(review.createdAt)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5`}>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}
                                  aria-hidden
                                />
                              ))}
                            </span>
                            <Pill tone={review.status === 'approved' ? 'success' : review.status === 'pending' ? 'warning' : 'danger'}>
                              {review.status}
                            </Pill>
                          </div>
                        </div>

                        {review.comment && (
                          <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                            {review.comment}
                          </p>
                        )}

                        {review.replyText ? (
                          <div className="space-y-1 rounded-xl border border-violet-200 bg-[#F5F3FF] p-3">
                            <p className="flex items-center gap-1 text-[11px] font-bold text-[#5B21B6]">
                              <Reply size={11} aria-hidden /> Your response
                            </p>
                            <p className="text-xs leading-relaxed text-slate-700">{review.replyText}</p>
                          </div>
                        ) : replyReviewId !== review.id ? (
                          <Button size="sm" variant="secondary" onClick={() => setReplyReviewId(review.id)}>
                            <Reply size={13} /> Reply to review
                          </Button>
                        ) : null}

                        {replyReviewId === review.id && (
                          <div className="space-y-2 pt-1">
                            <label htmlFor={`reply-${review.id}`} className="sr-only">
                              Your response to {review.userName}
                            </label>
                            <textarea
                              id={`reply-${review.id}`}
                              rows={3}
                              placeholder="Write a response…"
                              value={replyInput}
                              onChange={(e) => setReplyInput(e.target.value)}
                              className="w-full resize-none rounded-xl border border-slate-300 p-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="primary"
                                loading={actionLoading === review.id}
                                disabled={!replyInput.trim()}
                                onClick={() => handlePostReply(review.id)}
                              >
                                Send response
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setReplyReviewId(null); setReplyInput(''); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
