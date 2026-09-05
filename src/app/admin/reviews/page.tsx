'use client';

import { useState } from 'react';
import { CompanyReview } from '@/lib/types';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';
import { Check, CheckCircle, Clock, Loader2, MessageSquare, Star, Trash2, X, XCircle } from 'lucide-react';
import {
  Button, Card, EmptyState, FilterSelect, PageHeader, PageShell, Pill, Stat, StatGrid, Toolbar,
  type PillTone,
} from '@/components/dashboard';

const STATUS_TONE: Record<string, PillTone> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
};

export default function AdminReviewsPage() {
  const { data: reviews, loading } = useCollection<CompanyReview>('reviews');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const toast = useToast();

  const filtered = reviews.filter(r => {
    if (filterStatus === 'pending') return r.status === 'pending';
    if (filterStatus === 'approved') return r.status === 'approved';
    if (filterStatus === 'rejected') return r.status === 'rejected';
    return true;
  });

  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const approvedCount = reviews.filter(r => r.status === 'approved').length;
  const rejectedCount = reviews.filter(r => r.status === 'rejected').length;

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
        toast.error('Failed to delete review.');
      }
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Review moderation queue"
        description="Approve, reject or remove reviews submitted for companies."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Reviews' }]}
      />

      <StatGrid columns={4}>
        <Stat label="All reviews" value={reviews.length} icon={MessageSquare} tone="blue" loading={loading} />
        <Stat label="Pending" value={pendingCount} icon={Clock} tone="amber" loading={loading} />
        <Stat label="Approved" value={approvedCount} icon={CheckCircle} tone="emerald" loading={loading} />
        <Stat label="Rejected" value={rejectedCount} icon={XCircle} tone="rose" loading={loading} />
      </StatGrid>

      <Toolbar
        filters={
          <FilterSelect
            label="Moderation status"
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { label: `All statuses (${reviews.length})`, value: 'all' },
              { label: `Pending (${pendingCount})`, value: 'pending' },
              { label: `Approved (${approvedCount})`, value: 'approved' },
              { label: `Rejected (${rejectedCount})`, value: 'rejected' },
            ]}
          />
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 size={30} className="animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading review queue…</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews in this view"
          description="Change the moderation filter to see reviews in another state."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <Card key={r.id} className="space-y-3 p-4 transition-colors hover:border-slate-300 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{r.userName || 'Anonymous'}</h3>
                    <Pill tone={STATUS_TONE[r.status ?? 'pending'] ?? 'warning'} dot>
                      {r.status || 'pending'}
                    </Pill>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Company {r.companyId} ·{' '}
                    {r.createdAt?.seconds
                      ? new Date(r.createdAt.seconds * 1000).toLocaleDateString('en-IN')
                      : 'Recently'}
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-xl border border-amber-200 bg-[#FFFBEB] px-2.5 py-1">
                  <Star size={13} className="fill-amber-500 text-amber-500" aria-hidden />
                  <span className="text-xs font-bold text-[#92400E]">{r.rating}.0</span>
                </span>
              </div>

              <div>
                {r.title && <h4 className="mb-1 text-sm font-semibold text-slate-800">&ldquo;{r.title}&rdquo;</h4>}
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  {r.content}
                </p>
              </div>

              {r.adminNote && (
                <p className="rounded-lg border border-amber-200 bg-[#FFFBEB] p-2 text-xs text-[#92400E]">
                  Note: {r.adminNote}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                {r.status !== 'approved' && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(r.id)}
                    className="border-0 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Check size={13} /> Approve
                  </Button>
                )}
                {r.status !== 'rejected' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReject(r.id)}
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    <X size={13} /> Reject
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDelete(r.id)}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 size={13} /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
