'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Calendar, CheckCircle, Clock, Loader2, MapPin, Phone, Plus, Send, Video, XCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, createNotification } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import {
  Button, Card, EmptyState, PageHeader, PageShell, Pill, Stat, StatGrid, Tabs,
  type PillTone,
} from '@/components/dashboard';

const STATUS_STYLES: Record<string, { tone: PillTone; label: string }> = {
  scheduled: { tone: 'warning', label: 'Upcoming' },
  completed: { tone: 'success', label: 'Completed' },
  cancelled: { tone: 'danger', label: 'Cancelled' },
  no_show:   { tone: 'danger', label: 'No-show' },
};

const modeIcons: Record<string, LucideIcon> = {
  video: Video,
  phone: Phone,
  'in-person': MapPin,
  'in_person': MapPin,
  office: MapPin,
};

interface CompanyDoc { id: string; name?: string }
interface InterviewDoc {
  id: string;
  seekerName?: string;
  seekerId?: string;
  jobTitle?: string;
  date?: string;
  time?: string;
  mode?: string;
  status?: string;
}

export default function InterviewsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<CompanyDoc>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch interviews
  const { data: interviews, loading: interviewsLoading } = useCollection<InterviewDoc>('interviews', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  const handleUpdateStatus = async (interviewId: string, status: string, seekerId: string, jobTitle: string) => {
    setActionLoading(interviewId);
    try {
      await updateDocument('interviews', interviewId, { status });

      await createNotification({
        userId: seekerId,
        type: 'interview',
        title: `Interview update: ${status}`,
        message: `Your interview for "${jobTitle}" has been marked as ${status}.`,
        actionUrl: '/seeker/interviews'
      });

      toast.success(`Interview marked as ${status}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendReminder = async (interviewId: string, date: string, time: string, seekerId: string, jobTitle: string) => {
    setActionLoading(interviewId + '_remind');
    try {
      await createNotification({
        userId: seekerId,
        type: 'interview',
        title: 'Interview reminder',
        message: `Friendly reminder of your interview for "${jobTitle}" scheduled on ${date} at ${time}.`,
        actionUrl: '/seeker/interviews'
      });
      toast.success('Reminder sent to the candidate.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send reminder');
    } finally {
      setActionLoading(null);
    }
  };

  const upcoming = interviews.filter(i => i.status === 'scheduled');
  const past = interviews.filter(i => i.status !== 'scheduled');

  const filtered = tab === 'upcoming'
    ? upcoming
    : tab === 'past'
      ? past
      : interviews;

  const loading = companyLoading || interviewsLoading;

  if (!companyId && !companyLoading) {
    return (
      <PageShell>
        <EmptyState
          icon={Calendar}
          title="No company profile yet"
          description="Register your company profile to view and schedule candidate interviews."
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
        title="Interview management"
        description="Schedule, track and update candidate interview sessions."
        breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Interviews' }]}
        actions={
          <Link href="/employer/candidates">
            <Button variant="primary"><Plus size={16} /> Schedule from candidates</Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 size={30} className="animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading interviews…</p>
        </div>
      ) : (
        <>
          <StatGrid columns={4}>
            <Stat label="Total scheduled" value={interviews.length} icon={Calendar} tone="blue" />
            <Stat label="Upcoming" value={upcoming.length} icon={Clock} tone="amber" />
            <Stat label="Completed" value={past.filter(i => i.status === 'completed').length} icon={CheckCircle} tone="emerald" />
            <Stat
              label="No-shows / cancelled"
              value={past.filter(i => i.status === 'no_show' || i.status === 'cancelled').length}
              icon={XCircle}
              tone="rose"
            />
          </StatGrid>

          <Tabs
            label="Interview filter"
            value={tab}
            onChange={(id) => setTab(id as 'all' | 'upcoming' | 'past')}
            tabs={[
              { id: 'all', label: 'All interviews', count: interviews.length },
              { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
              { id: 'past', label: 'Past & completed', count: past.length },
            ]}
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No interviews found"
              description="Interviews scheduled from the Candidates tab will appear here."
            />
          ) : (
            <div className="space-y-3.5">
              {filtered.map(interview => {
                const modeLower = (interview.mode || 'phone').toLowerCase();
                const ModeIcon = modeIcons[modeLower] || Calendar;
                const isReminding = actionLoading === interview.id + '_remind';
                const isUpdating = actionLoading === interview.id;
                const st = STATUS_STYLES[interview.status || 'scheduled'] || STATUS_STYLES.scheduled;

                return (
                  <Card
                    key={interview.id}
                    className={`flex flex-col justify-between gap-4 p-4 transition-shadow hover:shadow-md sm:p-5 md:flex-row md:items-center ${
                      interview.status === 'scheduled' ? 'border-amber-300 bg-amber-50/30' : ''
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3.5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-[#EFF6FF] text-base font-bold text-[#1E40AF]">
                        {interview.seekerName?.[0]?.toUpperCase() || 'C'}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{interview.seekerName || 'Candidate'}</h3>
                          <Pill tone={st.tone} dot>{st.label}</Pill>
                        </div>
                        <p className="text-xs text-slate-500">
                          Role: <span className="font-semibold text-slate-900">{interview.jobTitle || 'Not specified'}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-medium text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock size={13} className="text-slate-400" aria-hidden />
                            {interview.date || 'Date TBC'}{interview.time ? ` at ${interview.time}` : ''}
                          </span>
                          {interview.mode && (
                            <span className="flex items-center gap-1 font-semibold text-blue-700">
                              <ModeIcon size={13} aria-hidden /> {interview.mode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {interview.status === 'scheduled' && (
                      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 md:flex md:shrink-0 md:border-0 md:pt-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={isReminding}
                          onClick={() => handleSendReminder(
                            interview.id,
                            interview.date ?? '',
                            interview.time ?? '',
                            interview.seekerId ?? '',
                            interview.jobTitle ?? '',
                          )}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          {!isReminding && <Send size={13} />} Remind
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(interview.id, 'completed', interview.seekerId ?? '', interview.jobTitle ?? '')}
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <CheckCircle size={13} /> Done
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(interview.id, 'no_show', interview.seekerId ?? '', interview.jobTitle ?? '')}
                          className="border-rose-200 text-rose-700 hover:bg-rose-50"
                        >
                          <XCircle size={13} /> No-show
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
