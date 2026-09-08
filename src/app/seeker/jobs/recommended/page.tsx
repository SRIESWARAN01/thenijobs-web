'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, limit as fbLimit } from 'firebase/firestore';
import { Sparkles, MapPin, Briefcase, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { applyToJob } from '@/lib/firebase/firestoreService';
import { rankJobsForSeeker, type JobMatchResult } from '@/lib/ai/jobMatching';
import { PageHeader, PageShell, Card, CardBody, Button, EmptyState, Skeleton } from '@/components/dashboard';
import { useToast } from '@/contexts/ToastContext';

const CANDIDATE_LIMIT = 300;
const SHOW_TOP_N = 30;

interface CandidateJob {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  district: string;
  jobType: string;
  skills: string[];
  category: string;
}

/**
 * AI-MATCH-1. The match score comes from `scoreJobForSeeker` (src/lib/ai/jobMatching.ts) -- a
 * pure function over real profile/job fields, never an AI call. AI is not involved anywhere on
 * this page. Nothing is ever applied automatically: `applyToJob` (the same function the seeker's
 * own manual "Apply" button already uses) is called ONLY from `handleConfirmApply`, itself only
 * reachable after the seeker has selected jobs AND clicked "Confirm & Apply" in the review modal.
 */
export default function RecommendedJobsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { data: profile, loading: profileLoading } = useDocument<any>('seekerProfiles', user?.uid);

  const [jobs, setJobs] = useState<CandidateJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadJobs() {
      setJobsLoading(true);
      try {
        const q = query(
          collection(db, 'jobs'),
          where('isActive', '==', true),
          where('status', '==', 'active'),
          fbLimit(CANDIDATE_LIMIT)
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        setJobs(snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || 'Untitled role',
            companyId: data.companyId || '',
            companyName: data.companyName || data.company || 'Company',
            district: data.district || '',
            jobType: data.jobType || data.type || '',
            skills: Array.isArray(data.skills) ? data.skills : [],
            category: data.category || '',
          };
        }));
      } catch (err) {
        console.error('[RecommendedJobs] failed to load jobs:', err);
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    }
    loadJobs();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadApplied() {
      if (!user?.uid) return;
      try {
        const q = query(collection(db, 'applications'), where('seekerId', '==', user.uid));
        const snap = await getDocs(q);
        if (cancelled) return;
        setAppliedJobIds(new Set(snap.docs.map((d) => d.data().jobId).filter(Boolean)));
      } catch (err) {
        console.error('[RecommendedJobs] failed to load existing applications:', err);
      }
    }
    loadApplied();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const ranked: Array<JobMatchResult & { job: CandidateJob }> = useMemo(() => {
    if (!profile) return [];
    const candidates = jobs.filter((j) => !appliedJobIds.has(j.id));
    const seekerShape = {
      skills: (profile.skills || []).map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean),
      district: profile.district || '',
      jobTypePreference: profile.jobTypePreference || [],
      experience: profile.experience || [],
    };
    const results = rankJobsForSeeker(candidates, seekerShape);
    const byId = new Map(candidates.map((j) => [j.id, j]));
    return results
      .map((r) => ({ ...r, job: byId.get(r.jobId)! }))
      .filter((r) => r.job)
      .slice(0, SHOW_TOP_N);
  }, [jobs, appliedJobIds, profile]);

  const toggleOne = (jobId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId); else next.add(jobId);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(ranked.map((r) => r.jobId)));
  const deselectAll = () => setSelectedIds(new Set());

  const openConfirmForSelected = () => {
    if (selectedIds.size === 0) {
      toast.warning('Select at least one job first.');
      return;
    }
    setConfirmOpen(true);
  };

  const openConfirmForAll = () => {
    if (ranked.length === 0) return;
    setSelectedIds(new Set(ranked.map((r) => r.jobId)));
    setConfirmOpen(true);
  };

  const handleConfirmApply = async () => {
    if (!user?.uid) return;
    const targets = ranked.filter((r) => selectedIds.has(r.jobId));
    if (targets.length === 0) return;

    setApplying(true);
    let succeeded = 0;
    let failed = 0;
    for (const target of targets) {
      try {
        await applyToJob({
          jobId: target.job.id,
          jobTitle: target.job.title,
          companyId: target.job.companyId,
          companyName: target.job.companyName,
          seekerId: user.uid,
          seekerName: profile?.name || user.displayName || 'Job Seeker',
          seekerEmail: profile?.email || user.email || '',
          seekerPhone: profile?.phone || '',
        });
        succeeded += 1;
      } catch (err) {
        console.error('[RecommendedJobs] apply failed for', target.job.id, err);
        failed += 1;
      }
    }
    setApplying(false);
    setConfirmOpen(false);
    setSelectedIds(new Set());
    setAppliedJobIds((prev) => {
      const next = new Set(prev);
      targets.forEach((t) => next.add(t.job.id));
      return next;
    });

    if (succeeded > 0 && failed === 0) {
      toast.success(`Applied to ${succeeded} job${succeeded > 1 ? 's' : ''}.`);
    } else if (succeeded > 0 && failed > 0) {
      toast.warning(`Applied to ${succeeded}, ${failed} failed. Please retry the failed ones.`);
    } else {
      toast.error('Could not submit any applications. Please try again.');
    }
  };

  const selectedTargets = ranked.filter((r) => selectedIds.has(r.jobId));
  const loading = profileLoading || jobsLoading;

  return (
    <PageShell className="max-w-4xl">
      <PageHeader
        title="Recommended jobs"
        description="Matched to your real skills, district, job-type preference and experience -- a real calculated score, never an AI-invented number. Nothing is ever applied without your confirmation."
        breadcrumbs={[{ label: 'Seeker', href: '/seeker/dashboard' }, { label: 'Browse Jobs', href: '/seeker/jobs' }, { label: 'Recommended' }]}
      />

      {loading && (
        <Card><CardBody className="space-y-3 py-6"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardBody></Card>
      )}

      {!loading && !profile && (
        <EmptyState
          icon={AlertTriangle}
          title="Complete your profile first"
          description="Add your skills, district and job-type preference so we can compute a real match score."
          action={<Button variant="primary" onClick={() => router.push('/seeker/profile')}>Go to Profile</Button>}
        />
      )}

      {!loading && profile && ranked.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="No active jobs to show right now"
          description="Check back soon, or browse all jobs directly."
          action={<Button variant="secondary" onClick={() => router.push('/seeker/jobs')}>Browse Jobs</Button>}
        />
      )}

      {!loading && profile && ranked.length > 0 && (
        <>
          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Sparkles size={14} className="text-blue-600" />
                <span>{ranked.length} matched job{ranked.length !== 1 ? 's' : ''} · {selectedIds.size} selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={selectedIds.size === ranked.length ? deselectAll : selectAll}>
                  {selectedIds.size === ranked.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button variant="secondary" onClick={openConfirmForSelected} disabled={selectedIds.size === 0}>
                  Apply Selected ({selectedIds.size})
                </Button>
                <Button variant="primary" onClick={openConfirmForAll}>Apply to All</Button>
              </div>
            </CardBody>
          </Card>

          <div className="space-y-2.5">
            {ranked.map((r) => (
              <Card key={r.jobId}>
                <CardBody className="flex items-start gap-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.jobId)}
                    onChange={() => toggleOne(r.jobId)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    aria-label={`Select ${r.job.title} at ${r.job.companyName}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{r.job.title}</h3>
                      <span className="shrink-0 text-xs font-bold text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">{r.score}% match</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{r.job.companyName}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                      {r.job.district && <span className="flex items-center gap-1"><MapPin size={11} /> {r.job.district}</span>}
                      {r.job.jobType && <span className="flex items-center gap-1"><Briefcase size={11} /> {r.job.jobType}</span>}
                    </div>
                    {r.reasons.length > 0 && (
                      <p className="text-[11px] text-slate-400 mt-1.5">{r.reasons[0]}</p>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => !applying && setConfirmOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="p-6 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Confirm {selectedTargets.length} application{selectedTargets.length !== 1 ? 's' : ''}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Nothing is submitted until you click Confirm & Apply below. Each application uses your current profile and resume, same as applying manually.
              </p>
            </div>
            <div className="px-6 overflow-y-auto flex-1 space-y-2">
              {selectedTargets.map((r) => (
                <div key={r.jobId} className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{r.job.title}</p>
                    <p className="text-[11px] text-slate-500">{r.job.companyName}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-blue-600">{r.score}%</span>
                </div>
              ))}
            </div>
            <div className="p-6 pt-4 flex items-center justify-end gap-2 border-t border-slate-100 mt-2">
              <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={applying}>Cancel</Button>
              <Button variant="primary" onClick={handleConfirmApply} loading={applying}>
                <CheckCircle2 size={14} /> Confirm & Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
