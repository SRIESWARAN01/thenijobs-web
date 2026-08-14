'use client';

import { useState } from 'react';
import { CompanyReview } from '@/lib/types';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';
import {
  MessageSquare, Star, CheckCircle, XCircle, Eye, ShieldAlert,
  Loader2, Trash2, Check, X, Filter
} from 'lucide-react';

export default function AdminReviewsPage() {
  const { data: reviews, loading, refresh } = useCollection<CompanyReview>('reviews');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const toast = useToast();

  const filtered = reviews.filter(r => {
    if (filterStatus === 'pending') return r.status === 'pending';
    if (filterStatus === 'approved') return r.status === 'approved';
    if (filterStatus === 'rejected') return r.status === 'rejected';
    return true;
  });

  const handleApprove = async (id: string) => {
    try {
      await updateDocument('reviews', id, { status: 'approved' });
      toast.success('Review approved and published.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve review.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDocument('reviews', id, { status: 'rejected' });
      toast.success('Review rejected.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject review.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this review?')) {
      try {
        await deleteDocument('reviews', id);
        toast.success('Review deleted.');
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Moderation Queue</h1>
          <p className="text-xs text-slate-500 mt-1">Approve, reject, or moderate user reviews submitted for companies</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
            <Filter size={13} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold text-slate-800 cursor-pointer"
            >
              <option value="all">All Statuses ({reviews.length})</option>
              <option value="pending">Pending ({reviews.filter(r => r.status === 'pending').length})</option>
              <option value="approved">Approved ({reviews.filter(r => r.status === 'approved').length})</option>
              <option value="rejected">Rejected ({reviews.filter(r => r.status === 'rejected').length})</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-xs text-slate-400">
          <Loader2 size={24} className="animate-spin text-blue-600 mr-2" /> Loading review queue...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-xs text-slate-400">
          <MessageSquare size={36} className="mx-auto mb-2 text-slate-300" />
          No reviews found in this moderation view.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{r.userName}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      r.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : r.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {r.status || 'PENDING'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Company ID: {r.companyId} | {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString('en-IN') : 'Recently'}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-amber-700">{r.rating}.0</span>
                </div>
              </div>

              <div>
                {r.title && <h5 className="text-xs font-bold text-slate-800 mb-1">&quot;{r.title}&quot;</h5>}
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{r.content}</p>
              </div>

              {r.adminNote && (
                <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  ⚠️ Note: {r.adminNote}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {r.status !== 'approved' && (
                  <button
                    onClick={() => handleApprove(r.id)}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
                  >
                    <Check size={13} /> Approve
                  </button>
                )}

                {r.status !== 'rejected' && (
                  <button
                    onClick={() => handleReject(r.id)}
                    className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 shadow-xs"
                  >
                    <X size={13} /> Reject
                  </button>
                )}

                <button
                  onClick={() => handleDelete(r.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white transition-all"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
