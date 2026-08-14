'use client';

import { useState } from 'react';
import { CompanyReview } from '@/lib/types';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';
import {
  MessageSquare, Star, Reply, ShieldCheck, Flag, CheckCircle2,
  Clock, AlertCircle, Loader2, Send
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface CompanyReviewsManagerProps {
  companyId: string;
}

export default function CompanyReviewsManager({ companyId }: CompanyReviewsManagerProps) {
  const { data: reviews, loading } = useCollection<CompanyReview>('reviews', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleSendReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await updateDocument('reviews', reviewId, {
        companyReply: {
          replyText: replyText.trim(),
          repliedAt: new Date(),
        },
      });
      setReplyingId(null);
      setReplyText('');
      toast.success('Company response saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save response.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (reviewId: string) => {
    if (confirm('Report this review to platform administrators for policy violation check?')) {
      try {
        await updateDocument('reviews', reviewId, {
          adminNote: 'Reported by company owner for review.',
        });
        toast.success('Review reported to administrators.');
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 font-outfit text-xs text-slate-400">
        <Loader2 size={18} className="animate-spin text-blue-600 mr-2" /> Loading reviews...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare size={20} className="text-blue-600" /> Candidate & Employee Reviews ({reviews.length})
        </h3>
        <p className="text-xs text-slate-500">Read candidate feedback and post official company responses</p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-400">
          <MessageSquare size={32} className="mx-auto mb-2 text-slate-300" />
          No candidate reviews received yet.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{r.userName}</h4>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      r.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : r.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {r.status?.toUpperCase() || 'APPROVED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString('en-IN') : 'Recently'}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-amber-700">{r.rating}.0</span>
                </div>
              </div>

              <div>
                {r.title && <h5 className="text-xs font-bold text-slate-800 mb-1">&quot;{r.title}&quot;</h5>}
                <p className="text-xs text-slate-600">{r.content}</p>
              </div>

              {/* Existing Response */}
              {r.companyReply && (
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3 text-xs space-y-1">
                  <span className="font-bold text-blue-700 text-[11px] block">Your Response:</span>
                  <p className="text-slate-700 italic">&quot;{r.companyReply.replyText}&quot;</p>
                </div>
              )}

              {/* Reply Form / Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleReport(r.id)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-600"
                >
                  <Flag size={12} /> Report Review
                </button>

                <button
                  type="button"
                  onClick={() => { setReplyingId(r.id); setReplyText(r.companyReply?.replyText || ''); }}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-600 hover:text-white transition-all"
                >
                  <Reply size={13} />
                  <span>{r.companyReply ? 'Edit Response' : 'Respond to Review'}</span>
                </button>
              </div>

              {replyingId === r.id && (
                <div className="pt-3 space-y-2 border-t border-slate-100">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write official company response..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setReplyingId(null)} className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSendReply(r.id)}
                      disabled={submitting}
                      className="px-4 py-1 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save Response
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
