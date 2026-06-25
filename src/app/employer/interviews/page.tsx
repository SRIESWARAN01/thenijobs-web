'use client';

import { useState } from 'react';
import { Calendar, Video, Phone, MapPin, Clock, Plus, CheckCircle, XCircle, Send, Loader2, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, createNotification } from '@/lib/firebase/firestoreService';
import { where, orderBy } from 'firebase/firestore';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  scheduled: 'bg-amber-500/10 text-amber-400',
  completed: 'bg-emerald-500/10 text-emerald-400',
  cancelled: 'bg-rose-500/10 text-rose-400',
  no_show: 'bg-rose-500/10 text-rose-400'
};

const modeIcons: Record<string, typeof Video> = {
  video: Video,
  phone: Phone,
  'in-person': MapPin,
  'in_person': MapPin,
  office: MapPin
};

export default function InterviewsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
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
      
      // Notify candidate
      await createNotification({
        userId: seekerId,
        type: 'interview',
        title: `Interview Update: ${status.toUpperCase()} 📅`,
        message: `Your interview for "${jobTitle}" has been marked as ${status}.`,
        actionUrl: '/seeker/interviews',
      });

      alert(`Interview marked as ${status}`);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
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
        actionUrl: '/seeker/interviews',
      });
      alert('Reminder notification sent to candidate.');
    } catch (err) {
      console.error(err);
      alert('Failed to send reminder');
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'C';
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
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit">
        <Calendar size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-white">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to view and manage interviews.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Interview Management</h1>
          <p className="text-sm text-gray-400 mt-1">Schedule and manage candidate interviews</p>
        </div>
        <Link
          href="/employer/candidates"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Schedule Interview
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading interviews...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { l: 'Total Interviews', v: interviews.length },
              { l: 'Upcoming Scheduled', v: upcoming.length },
              { l: 'Completed', v: past.filter(i => i.status === 'completed').length },
              { l: 'No-Shows', v: past.filter(i => i.status === 'no_show').length }
            ].map(s => (
              <div key={s.l} className="glass-card rounded-2xl p-4">
                <p className="text-2xl font-bold text-white font-outfit">{s.v}</p>
                <p className="text-xs text-gray-500 mt-1">{s.l}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {['all', 'upcoming', 'past'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  tab === t
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map(interview => {
              const modeLower = (interview.mode || 'phone').toLowerCase();
              const ModeIcon = modeIcons[modeLower] || Calendar;
              const isReminding = actionLoading === interview.id + '_remind';
              const isUpdating = actionLoading === interview.id;

              return (
                <div
                  key={interview.id}
                  className={`glass-card rounded-2xl p-5 transition-all hover:border-white/15 ${
                    interview.status === 'scheduled' ? 'border-l-2 border-l-amber-500/50' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">{getInitials(interview.seekerName)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{interview.seekerName || 'Candidate'}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          statusColors[interview.status || 'scheduled']
                        }`}>
                          {(interview.status || 'scheduled').replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">For: <span className="text-gray-400">{interview.jobTitle}</span></p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Clock size={12} /> {interview.date}, {interview.time}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-cyan-400">
                          <ModeIcon size={12} /> {interview.mode}
                        </span>
                      </div>
                      {interview.notes && <p className="text-[10px] text-gray-600 mt-2 italic">Notes: {interview.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isUpdating || isReminding ? (
                        <Loader2 size={16} className="text-cyan-400 animate-spin" />
                      ) : (
                        interview.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(interview.id, 'completed', interview.seekerId, interview.jobTitle)}
                              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              title="Mark Complete"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(interview.id, 'cancelled', interview.seekerId, interview.jobTitle)}
                              className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                              title="Cancel"
                            >
                              <XCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleSendReminder(
                                interview.id,
                                interview.seekerName,
                                interview.date,
                                interview.time,
                                interview.seekerId,
                                interview.jobTitle
                              )}
                              className="p-2 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                              title="Send Reminder Alert"
                            >
                              <Send size={14} />
                            </button>
                          </>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Calendar size={32} className="text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No interviews scheduled</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
