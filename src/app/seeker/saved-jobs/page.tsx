'use client';

import Link from 'next/link';
import {
  Banknote,
  Bell,
  Bookmark,
  Briefcase,
  Calendar,
  Loader2,
  MapPin,
  Send,
  Star,
  Trash2,
} from 'lucide-react';
import { doc, deleteDoc, orderBy, where } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';

interface SavedJobDoc {
  id: string;
  jobId: string;
  jobTitle?: string;
  companyName?: string;
  description?: string;
  district?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  score?: number;
  skills?: string[];
  expiresAt?: { seconds: number };
}

function isClosingSoon(item: SavedJobDoc, now: number, sevenDaysFromNow: number) {
  if (!item.expiresAt?.seconds) return false;
  const expiresMs = item.expiresAt.seconds * 1000;
  return expiresMs > now && expiresMs <= sevenDaysFromNow;
}

export default function SavedJobsPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  const { data: savedJobs, loading } = useCollection<SavedJobDoc>('savedJobs', [
    where('userId', '==', uid || ''),
    orderBy('savedAt', 'desc'),
  ], { skip: !uid });

  const now = Date.now();
  const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
  const closingSoonCount = savedJobs.filter((item) => isClosingSoon(item, now, sevenDaysFromNow)).length;

  const metrics = [
    { label: 'Saved Jobs', value: savedJobs.length, description: 'Ready to apply', icon: Bookmark, color: 'violet' },
    { label: 'Closing Soon', value: closingSoonCount, description: 'Next 7 days', icon: Calendar, color: 'amber' },
    { label: 'High Match', value: savedJobs.filter((job) => (job.score || 0) >= 80).length, description: '80% and above', icon: Star, color: 'emerald' },
    { label: 'Alerts Linked', value: 0, description: 'Matched alerts', icon: Bell, color: 'cyan' },
  ];

  const handleDelete = async (savedId: string) => {
    if (!confirm('Remove this job from your saved list?')) return;
    try {
      await deleteDoc(doc(db, 'savedJobs', savedId));
    } catch (err) {
      console.error('Failed to remove saved job:', err);
      alert('Failed to remove saved job.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-white">
        <Loader2 size={36} className="mb-4 animate-spin text-emerald-400" />
        <p className="text-sm text-gray-400">Loading saved jobs...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6 font-outfit text-white">
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-400">Shortlist</p>
            <h1 className="mt-1 text-2xl font-bold text-white font-outfit">Saved Jobs</h1>
            <p className="mt-1 text-sm text-gray-400">Keep promising jobs in one place and apply before deadlines pass.</p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Briefcase size={16} />
            Browse Jobs
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold text-white font-outfit">{metric.value}</p>
                  <p className="mt-1 text-xs font-medium text-gray-400">{metric.label}</p>
                  <p className="mt-1 text-[10px] text-gray-600">{metric.description}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
                  <Icon size={18} className="text-violet-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {savedJobs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
            <Bookmark size={24} className="text-violet-400" />
          </div>
          <h2 className="text-base font-semibold text-white">No saved jobs yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">Explore open positions and click the bookmark button to save them here.</p>
          <Link
            href="/jobs"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/[0.08]"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {savedJobs.map((item) => {
            const expiresDate = item.expiresAt?.seconds
              ? new Date(item.expiresAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : null;
            const closingSoon = isClosingSoon(item, now, sevenDaysFromNow);

            return (
              <div key={item.id} className="glass-card rounded-2xl p-5 transition-all hover:border-white/15">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-white">{item.jobTitle || 'Job Title'}</h2>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        closingSoon
                          ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                          : 'border-violet-500/20 bg-violet-500/10 text-violet-400'
                      }`}>
                        {closingSoon ? 'Closing Soon' : 'Saved'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">{item.companyName || 'Company Name'}</p>
                    <p className="mt-2 line-clamp-2 text-xs text-gray-500">{item.description || 'No description provided for this job.'}</p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1"><MapPin size={12} /> {item.district || 'Theni'}</span>
                      <span className="inline-flex items-center gap-1"><Briefcase size={12} /> {item.jobType || 'Full time'}</span>
                      {item.salaryMin && (
                        <span className="inline-flex items-center gap-1">
                          <Banknote size={12} />
                          Rs. {item.salaryMin.toLocaleString('en-IN')} - Rs. {item.salaryMax?.toLocaleString('en-IN')}/month
                        </span>
                      )}
                      {expiresDate && <span className={closingSoon ? 'font-semibold text-amber-400' : ''}>Deadline: {expiresDate}</span>}
                    </div>

                    {item.skills && item.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.skills.map((skill) => (
                          <span key={skill} className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[10px] text-gray-400">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto sm:flex-col sm:items-end">
                    <Link
                      href={`/jobs/detail?id=${encodeURIComponent(item.jobId)}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
                    >
                      <Send size={12} />
                      Apply
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/20"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
