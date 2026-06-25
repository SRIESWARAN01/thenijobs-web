'use client';

import { useState } from 'react';
import {
  Star, Search, ChevronDown, CheckCircle, XCircle,
  Flag, Trash2, MessageSquare, Clock, AlertTriangle,
  ThumbsUp, ThumbsDown, Building2, Briefcase, Wrench, Loader2
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';

// ===== TYPES =====
interface ReviewDoc {
  id: string;
  reviewerName: string;
  rating: number;
  text: string;
  targetName: string;
  targetType: 'business' | 'employer' | 'service';
  createdAt?: any;
  status?: 'approved' | 'pending' | 'flagged';
  helpful?: number;
  unhelpful?: number;
  flagReason?: string;
}

// ===== CONSTANTS =====
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  approved: { label: 'Approved', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  pending: { label: 'Pending', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  flagged: { label: 'Flagged', bg: 'bg-rose-500/15', text: 'text-rose-400' },
};

const TARGET_CONFIG: Record<string, { label: string; icon: typeof Building2; bg: string; text: string }> = {
  business: { label: 'Business', icon: Building2, bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  employer: { label: 'Employer', icon: Briefcase, bg: 'bg-violet-500/10', text: 'text-violet-400' },
  service: { label: 'Service', icon: Wrench, bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

const TABS = ['All', 'Pending', 'Flagged', 'Business Reviews', 'Employer Reviews', 'Service Reviews'] as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'text-amber-400' : 'text-gray-700'}
          fill={i <= rating ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { data: reviews, loading } = useCollection<ReviewDoc>('reviews');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'RE';
  };

  const filteredReviews = reviews.filter((review) => {
    const reviewerName = review.reviewerName || 'Anonymous';
    const targetName = review.targetName || 'Unknown';
    const text = review.text || '';
    const matchSearch = reviewerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      text.toLowerCase().includes(searchQuery.toLowerCase());
    
    const reviewStatus = review.status || 'pending';
    const targetType = review.targetType || 'business';

    const matchTab = activeTab === 'All' ||
      (activeTab === 'Pending' && reviewStatus === 'pending') ||
      (activeTab === 'Flagged' && reviewStatus === 'flagged') ||
      (activeTab === 'Business Reviews' && targetType === 'business') ||
      (activeTab === 'Employer Reviews' && targetType === 'employer') ||
      (activeTab === 'Service Reviews' && targetType === 'service');
    
    return matchSearch && matchTab;
  });

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDocument('reviews', id, { status: 'approved' });
    } catch (err) {
      console.error('Approve review error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlag = async (id: string) => {
    const reason = window.prompt('Enter flag/report reason:');
    if (reason === null) return;
    setActionLoading(id);
    try {
      await updateDocument('reviews', id, { status: 'flagged', flagReason: reason });
    } catch (err) {
      console.error('Flag review error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    setActionLoading(id);
    try {
      await deleteDocument('reviews', id);
    } catch (err) {
      console.error('Delete review error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Dynamic metrics
  const totalCount = reviews.length;
  const pendingCount = reviews.filter((r) => (r.status || 'pending') === 'pending').length;
  const flaggedCount = reviews.filter((r) => r.status === 'flagged').length;
  const avgRating = totalCount > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalCount).toFixed(1) : '0.0';

  const stats = [
    { label: 'Total Reviews', value: totalCount, icon: MessageSquare, color: 'violet' },
    { label: 'Pending Moderation', value: pendingCount, icon: Clock, color: 'amber' },
    { label: 'Flagged', value: flaggedCount, icon: Flag, color: 'rose' },
    { label: 'Average Rating', value: avgRating, icon: Star, color: 'cyan', isStar: true },
  ];

  const statColorMap: Record<string, { bg: string; text: string }> = {
    violet: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    rose: { bg: 'bg-rose-500/15', text: 'text-rose-400' },
    cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Reviews & Ratings</h1>
          <p className="text-sm text-gray-400 mt-1">Moderate reviews and manage platform ratings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const colors = statColorMap[stat.color];
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4 hover:border-white/[0.15] transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Icon size={18} className={colors.text} fill={stat.isStar ? 'currentColor' : 'none'} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white font-outfit">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search reviews..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input w-full pl-10 pr-4 py-2.5 text-sm"
        />
      </div>

      {/* Review Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading reviews from Firestore...</p>
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const reviewStatus = review.status || 'pending';
            const statusCfg = STATUS_CONFIG[reviewStatus];
            const targetType = review.targetType || 'business';
            const targetCfg = TARGET_CONFIG[targetType] || TARGET_CONFIG.business;
            const TargetIcon = targetCfg.icon;
            const initials = getInitials(review.reviewerName);

            return (
              <div
                key={review.id}
                className={`glass-card rounded-2xl p-5 hover:border-white/[0.15] transition-all ${reviewStatus === 'flagged' ? 'border-rose-500/25' : ''
                  }`}
              >
                {/* Review Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{review.reviewerName || 'Anonymous'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={review.rating || 5} />
                        <span className="text-xs text-gray-500">·</span>
                        <span className="text-xs text-gray-500">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text}`}>
                      {reviewStatus === 'flagged' && <AlertTriangle size={10} className="mr-1" />}
                      {statusCfg.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${targetCfg.bg} ${targetCfg.text}`}>
                      <TargetIcon size={10} />
                      {targetCfg.label}
                    </span>
                  </div>
                </div>

                {/* Target */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs text-gray-500">Reviewing:</span>
                  <span className="text-xs font-semibold text-white">{review.targetName || 'Unknown Target'}</span>
                </div>

                {/* Review Text */}
                <p className="text-sm text-gray-300 leading-relaxed mb-3">{review.text}</p>

                {/* Flag Reason */}
                {review.flagReason && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/15 mb-3">
                    <AlertTriangle size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-rose-300">{review.flagReason}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <ThumbsUp size={12} /> {review.helpful || 0}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <ThumbsDown size={12} /> {review.unhelpful || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {actionLoading === review.id ? (
                      <Loader2 size={16} className="text-violet-400 animate-spin" />
                    ) : (
                      <>
                        {reviewStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(review.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button
                              onClick={() => handleDelete(review.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleFlag(review.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                          title="Flag Review"
                        >
                          <Flag size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Delete Review"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
            <MessageSquare size={28} className="text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-400">No reviews found</p>
          <p className="text-xs text-gray-600 mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
