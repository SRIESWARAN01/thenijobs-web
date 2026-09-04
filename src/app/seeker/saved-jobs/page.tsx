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
import { useToast } from '@/contexts/ToastContext';
import {
  ActionMenu, Button, DataTable, PageHeader, PageShell, Pill, Stat, StatGrid,
  ViewToggle, useViewMode,
  type ActionItem, type Column,
} from '@/components/dashboard';

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
  const toast = useToast();

  const { data: savedJobs, loading } = useCollection<SavedJobDoc>('savedJobs', [
    where('userId', '==', uid || ''),
    orderBy('savedAt', 'desc'),
  ], { skip: !uid });

  const [view, setView] = useViewMode('seeker-saved-jobs', 'table');
  const now = Date.now();
  const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
  const closingSoonCount = savedJobs.filter((item) => isClosingSoon(item, now, sevenDaysFromNow)).length;

  const handleDelete = async (savedId: string) => {
    if (!confirm('Remove this job from your saved list?')) return;
    try {
      await deleteDoc(doc(db, 'savedJobs', savedId));
    } catch (err) {
      console.error('Failed to remove saved job:', err);
      toast.error('Failed to remove saved job.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-gray-900">
        <Loader2 size={36} className="mb-4 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500">Loading saved jobs...</p>
      </div>
    );
  }

  const columns: Column<SavedJobDoc>[] = [
    {
      key: 'jobTitle',
      header: 'Job',
      card: 'title',
      sortValue: item => item.jobTitle ?? '',
      render: item => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-slate-900">{item.jobTitle || 'Job title'}</span>
            {isClosingSoon(item, now, sevenDaysFromNow) && <Pill tone="warning">Closing soon</Pill>}
          </div>
          <span className="block truncate text-xs text-slate-500">{item.companyName || 'Company'}</span>
        </div>
      ),
    },
    {
      key: 'district',
      header: 'Location',
      sortValue: item => item.district ?? '',
      render: item => (
        <span className="inline-flex items-center gap-1">
          <MapPin size={11} className="text-slate-400" aria-hidden /> {item.district || 'Theni'}
        </span>
      ),
    },
    {
      key: 'jobType',
      header: 'Type',
      hideBelow: 'lg',
      sortValue: item => item.jobType ?? '',
      render: item => (item.jobType || 'full time').replace(/_/g, ' '),
    },
    {
      key: 'salary',
      header: 'Salary',
      hideBelow: 'xl',
      sortValue: item => item.salaryMin ?? 0,
      render: item => item.salaryMin
        ? `₹${item.salaryMin.toLocaleString('en-IN')} – ₹${item.salaryMax?.toLocaleString('en-IN') ?? '—'}/mo`
        : 'Not stated',
    },
    {
      key: 'expiresAt',
      header: 'Deadline',
      sortValue: item => item.expiresAt?.seconds ?? Number.MAX_SAFE_INTEGER,
      render: item => {
        if (!item.expiresAt?.seconds) return <span className="text-slate-300">&mdash;</span>;
        const closing = isClosingSoon(item, now, sevenDaysFromNow);
        const label = new Date(item.expiresAt.seconds * 1000)
          .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        return <span className={closing ? 'font-semibold text-amber-700' : ''}>{label}</span>;
      },
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Saved jobs"
        description="Keep promising jobs in one place and apply before the deadline passes."
        actions={
          <>
            <ViewToggle value={view} onChange={setView} />
            <Link href="/jobs">
              <Button variant="primary"><Briefcase size={15} /> Browse jobs</Button>
            </Link>
          </>
        }
      />

      <StatGrid columns={3}>
        <Stat label="Saved jobs" value={savedJobs.length} icon={Bookmark} tone="violet" hint="Ready to apply" />
        <Stat label="Closing soon" value={closingSoonCount} icon={Calendar} tone="amber" hint="Next 7 days" />
        <Stat
          label="High match"
          value={savedJobs.filter((job) => (job.score || 0) >= 80).length}
          icon={Star}
          tone="emerald"
          hint="80% and above"
        />
      </StatGrid>

      <DataTable
        label="Saved jobs"
        view={view}
        gridColumns={2}
        columns={columns}
        rows={savedJobs}
        getRowId={item => item.id}
        emptyIcon={Bookmark}
        emptyTitle="No saved jobs yet"
        emptyDescription="Explore open positions and use the bookmark button to save them here."
        emptyAction={
          <Link href="/jobs">
            <Button variant="primary">Browse jobs</Button>
          </Link>
        }
        rowActions={item => {
          const items: ActionItem[] = [
            { label: 'Apply for this job', icon: Send, tone: 'success', href: `/jobs/${item.jobId}` },
            { label: 'Remove from saved', icon: Trash2, tone: 'danger', separatorBefore: true, onClick: () => handleDelete(item.id) },
          ];
          return <ActionMenu label={`Actions for ${item.jobTitle ?? 'saved job'}`} items={items} />;
        }}
      />
    </PageShell>
  );
}
