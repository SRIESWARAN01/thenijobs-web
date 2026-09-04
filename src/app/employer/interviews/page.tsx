'use client';

import { useState } from 'react';
import {
  Calendar, Video, Phone, MapPin, Clock, Plus, CheckCircle, XCircle,
  Send, Loader2, Users2, Check, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, createNotification } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: '#FFFBEB', text: '#D97706', label: 'Upcoming Scheduled' },
  completed: { bg: '#ECFDF5', text: '#059669', label: 'Completed' },
  cancelled: { bg: '#FEF2F2', text: '#DC2626', label: 'Cancelled' },
  no_show:   { bg: '#FEF2F2', text: '#DC2626', label: 'No-Show' },
};

const modeIcons: Record<string, typeof Video> = {
  video: Video,
  phone: Phone,
  'in-person': MapPin,
  'in_person': MapPin,
  office: MapPin,
};

export default function InterviewsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch interviews
  const { data: interviews, loading: interviewsLoading } = useCollection<any>('interviews', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  const handleUpdateStatus = async (interviewId: string, status: string, seekerId: string, jobTitle: string) => {
    setActionLoading(interviewId);
    try {
      await updateDocument('interviews', interviewId, { status });
      
      await createNotification({
        userId: seekerId,
        type: 'interview',
        title: `Interview Update: ${status.toUpperCase()} 📅`,
        message: `Your interview for "${jobTitle}" has been marked as ${status}.`,
        actionUrl: '/seeker/interviews'
      });

      toast.success(`Interview marked as ${status}`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendReminder = async (interviewId: string, candidateName: string, date: string, time: string, seekerId: string, jobTitle: string) => {
    setActionLoading(interviewId + '_remind');
    try {
      await createNotification({
        userId: seekerId,
        type: 'interview',
        title: 'Interview Reminder! ⏰',
        message: `Friendly reminder of your interview for "${jobTitle}" scheduled on ${date} at ${time}.`,
        actionUrl: '/seeker/interviews'
      });
      toast.success('Reminder notification sent to candidate.');
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
      <div className="flex flex-col items-center justify-center min-h-96 py-20 text-center px-4 font-outfit">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-200 shadow-xs">
          <Calendar size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Company Profile</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
          Please register your company profile first to view and schedule candidate interviews.
        </p>
        <Link href="/employer/company-profile" className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Interview Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Schedule, track, and update candidate interview sessions</p>
        </div>
        <Link
          href="/employer/candidates"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus size={16} /> Schedule from Candidates
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-blue-600 animate-spin" />
          <p className="text-xs text-gray-500 font-semibold">Loading interviews...</p>
        </div>
      ) : (
        <>
          {/* KPI Stats matching Dashboard standard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { label: 'Total Scheduled', count: interviews.length, icon: Calendar, bg: '#EFF6FF', color: '#2563EB' },
              { label: 'Upcoming', count: upcoming.length, icon: Clock, bg: '#FFFBEB', color: '#D97706' },
              { label: 'Completed', count: past.filter(i => i.status === 'completed').length, icon: CheckCircle, bg: '#ECFDF5', color: '#059669' },
              { label: 'No-Shows / Cancelled', count: past.filter(i => i.status === 'no_show' || i.status === 'cancelled').length, icon: XCircle, bg: '#FEF2F2', color: '#DC2626' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: s.bg }}>
                      <Icon size={20} style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900">{s.count}</p>
                      <p className="text-xs text-gray-500 font-bold">{s.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 p-1.5 rounded-2xl bg-gray-100/80 overflow-x-auto no-scrollbar w-fit">
            {[
              { label: 'All Interviews', value: 'all' },
              { label: 'Upcoming', value: 'upcoming' },
              { label: 'Past & Completed', value: 'past' },
            ].map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  tab === t.value ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Interview Cards List */}
          <div className="space-y-3.5">
            {filtered.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-xs space-y-3">
                <Calendar size={36} className="mx-auto text-slate-500" />
                <p className="text-sm font-bold text-gray-700">No interviews found</p>
                <p className="text-xs text-slate-500">Interviews scheduled via the Candidates tab will show here.</p>
              </div>
            ) : (
              filtered.map(interview => {
                const modeLower = (interview.mode || 'phone').toLowerCase();
                const ModeIcon = modeIcons[modeLower] || Calendar;
                const isReminding = actionLoading === interview.id + '_remind';
                const isUpdating = actionLoading === interview.id;
                const st = STATUS_STYLES[interview.status || 'scheduled'] || STATUS_STYLES.scheduled;

                return (
                  <div
                    key={interview.id}
                    className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      interview.status === 'scheduled' ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 font-black text-base flex items-center justify-center shrink-0 border border-blue-100">
                        {interview.seekerName?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-gray-900">{interview.seekerName || 'Candidate'}</h3>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold"
                            style={{ background: st.bg, color: st.text }}
                          >
                            {st.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          Role: <span className="font-bold text-gray-900">{interview.jobTitle}</span>
                        </p>
                        <div className="flex items-center gap-3 pt-1 text-xs text-gray-600 flex-wrap font-medium">
                          <span className="flex items-center gap-1">
                            <Clock size={13} className="text-slate-500" /> {interview.date} at {interview.time}
                          </span>
                          <span className="flex items-center gap-1 text-blue-700 font-bold">
                            <ModeIcon size={13} /> {interview.mode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap justify-between md:justify-end border-t md:border-0 border-gray-100 pt-3 md:pt-0">
                      {interview.status === 'scheduled' && (
                        <>
                          <button
                            type="button"
                            disabled={isReminding}
                            onClick={() => handleSendReminder(interview.id, interview.seekerName, interview.date, interview.time, interview.seekerId, interview.jobTitle)}
                            className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 border border-blue-200 transition-colors cursor-pointer"
                          >
                            <Send size={13} /> {isReminding ? 'Sending...' : 'Remind'}
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(interview.id, 'completed', interview.seekerId, interview.jobTitle)}
                            className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <CheckCircle size={13} /> Mark Done
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(interview.id, 'no_show', interview.seekerId, interview.jobTitle)}
                            className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 border border-red-200 transition-colors cursor-pointer"
                          >
                            <XCircle size={13} /> No-Show
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
