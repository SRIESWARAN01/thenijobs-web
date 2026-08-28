'use client';

import { useState } from 'react';
import {
  Users2, Search, Eye, Download, CheckCircle, XCircle,
  Calendar, Clock, Briefcase, MessageCircle,
  Star, X, Mail, Phone, ExternalLink, Loader2, Save, GraduationCap,
  MapPin, Check, FileText, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { updateApplicationStatus, createDocument, createNotification } from '@/lib/firebase/firestoreService';
import { where, orderBy } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';
import InterviewConfirmedModal from '@/components/ui/InterviewConfirmedModal';

type PipelineStatus = 'all' | 'applied' | 'shortlisted' | 'interview_scheduled' | 'selected' | 'rejected';

const PIPELINE_TABS: { label: string; value: PipelineStatus }[] = [
  { label: 'All Applicants', value: 'all' },
  { label: 'New Applied', value: 'applied' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Interview Scheduled', value: 'interview_scheduled' },
  { label: 'Selected / Hired', value: 'selected' },
  { label: 'Rejected', value: 'rejected' },
];

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  applied:             { bg: '#EFF6FF', color: '#2563EB', label: 'New Applied' },
  shortlisted:         { bg: '#F5F3FF', color: '#7C3AED', label: 'Shortlisted' },
  interview_scheduled: { bg: '#FFFBEB', color: '#D97706', label: 'Interview Scheduled' },
  selected:            { bg: '#ECFDF5', color: '#059669', label: 'Selected / Hired' },
  rejected:            { bg: '#FEF2F2', color: '#DC2626', label: 'Rejected' },
};

function CandidateDetailModal({
  seekerId,
  applicationId,
  currentStatus,
  initialNotes,
  companyId,
  companyName,
  jobId,
  jobTitle,
  seekerName,
  createdAt,
  onClose,
  onNotesUpdated,
  onStatusUpdated
}: {
  seekerId: string;
  applicationId: string;
  currentStatus: string;
  initialNotes?: string;
  companyId: string;
  companyName: string;
  jobId: string;
  jobTitle: string;
  seekerName: string;
  createdAt?: any;
  onClose: () => void;
  onNotesUpdated: (notes: string) => void;
  onStatusUpdated: (status: string) => void;
}) {
  const { data: profile, loading: profileLoading } = useDocument<any>('seekerProfiles', seekerId);
  const { data: userDoc, loading: userLoading } = useDocument<any>('users', seekerId);
  const toast = useToast();

  const [savingNotes, setSavingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(initialNotes || '');
  
  // Interview Form State
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewMode, setInterviewMode] = useState('In-Person (Office)');
  const [scheduling, setScheduling] = useState(false);
  const [confirmedModal, setConfirmedModal] = useState<{
    isOpen: boolean;
    date: string;
    time: string;
    mode: string;
  }>({ isOpen: false, date: '', time: '', mode: '' });

  // 7-Day Overdue Check
  const createdMillis = createdAt?.toMillis ? createdAt.toMillis() : (createdAt ? new Date(createdAt).getTime() : Date.now());
  const isOverdue = (currentStatus === 'applied' || currentStatus === 'under_review') && (Date.now() - createdMillis) > 7 * 86400000;

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateApplicationStatus(applicationId, currentStatus, localNotes);
      onNotesUpdated(localNotes);
      toast.success('Notes updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewDate || !interviewTime) {
      toast.warning('Please fill in both date and time.');
      return;
    }
    setScheduling(true);
    try {
      await createDocument('interviews', {
        companyId,
        companyName,
        seekerId,
        seekerName,
        jobId,
        jobTitle,
        applicationId,
        date: interviewDate,
        time: interviewTime,
        mode: interviewMode,
        status: 'scheduled'
      });

      await updateApplicationStatus(applicationId, 'interview_scheduled');
      onStatusUpdated('interview_scheduled');

      await createNotification({
        userId: seekerId,
        type: 'interview',
        title: 'Interview Scheduled! 📅',
        message: `An interview has been scheduled for "${jobTitle}" on ${interviewDate} at ${interviewTime} via ${interviewMode}.`,
        actionUrl: '/seeker/interviews'
      });

      setShowScheduleForm(false);
      setConfirmedModal({
        isOpen: true,
        date: interviewDate,
        time: interviewTime,
        mode: interviewMode,
      });
      toast.success('Interview scheduled successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to schedule interview');
    } finally {
      setScheduling(false);
    }
  };

  if (profileLoading || userLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-outfit">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={32} />
          <p className="text-xs text-gray-500 font-semibold">Loading applicant profile...</p>
        </div>
      </div>
    );
  }

  const email = profile?.email || userDoc?.email || 'N/A';
  const phone = profile?.phone || userDoc?.phone || 'N/A';
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const cleanWhatsApp = (profile?.whatsapp || profile?.phone || userDoc?.phone || '').replace(/[^0-9]/g, '');
  const experienceList = profile?.experience || [];
  const educationList = profile?.education || [];
  const skillsList = profile?.skills || [];
  const district = profile?.district || userDoc?.district || 'Theni';
  const resumeUrl = profile?.resumeUrl || userDoc?.resumeUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs font-outfit" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-gray-200 animate-fade-in space-y-5" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-700 font-black text-lg flex items-center justify-center border border-blue-200">
              {seekerName[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">{seekerName}</h2>
              <p className="text-xs text-gray-500 font-medium">Applied for: <span className="text-blue-700 font-bold">{jobTitle}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* 7-Day Overdue Banner */}
        {isOverdue && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
            <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-950">⏰ 7-Day Response SLA Overdue</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                This candidate applied over 7 days ago without status progression. Please shortlist, schedule interview, or update status.
              </p>
            </div>
          </div>
        )}

        {/* Quick Contact & Resume Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {cleanPhone && cleanPhone !== 'N/A' && (
            <a
              href={`tel:${cleanPhone}`}
              className="py-2.5 px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-indigo-200"
            >
              <Phone size={14} /> Call Candidate
            </a>
          )}
          {cleanWhatsApp && (
            <a
              href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(`Hi ${seekerName}, this is ${companyName} regarding your job application for "${jobTitle}" on THENIJOBS.`)}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              style={{ background: '#25D366' }}
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
          )}
          {resumeUrl ? (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all text-center"
            >
              <FileText size={14} /> View Resume PDF
            </a>
          ) : (
            <span className="py-2.5 px-3 rounded-2xl bg-gray-50 text-gray-400 text-xs font-medium text-center border border-gray-200">
              No Resume Uploaded
            </span>
          )}
        </div>

        {/* Candidate Bio & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-700">
          <p><span className="text-gray-500 font-medium">District / Location:</span> <strong className="text-gray-900 font-bold block sm:inline sm:ml-1">{district}</strong></p>
          <p><span className="text-gray-500 font-medium">Email:</span> <strong className="text-gray-900 font-bold block sm:inline sm:ml-1 truncate">{email}</strong></p>
          <p><span className="text-gray-500 font-medium">Experience:</span> <strong className="text-gray-900 font-bold block sm:inline sm:ml-1">{profile?.experienceYears || 'Fresher'}</strong></p>
          <p><span className="text-gray-500 font-medium">Highest Education:</span> <strong className="text-gray-900 font-bold block sm:inline sm:ml-1">{profile?.highestDegree || 'Graduate'}</strong></p>
        </div>

        {/* Skills */}
        {skillsList.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-gray-800 block">Skills &amp; Competencies:</span>
            <div className="flex flex-wrap gap-1.5">
              {skillsList.map((s: string, idx: number) => (
                <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interview Scheduling Box */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-600" /> Schedule Interview / Click to Meet
            </h3>
            {currentStatus === 'interview_scheduled' ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] flex items-center gap-1">
                <Check size={12} /> Scheduled
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                {showScheduleForm ? 'Hide Form' : 'Click to Meet / Schedule +'}
              </button>
            )}
          </div>

          {currentStatus === 'interview_scheduled' && !showScheduleForm && (
            <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div>
                <span className="text-emerald-800 font-bold block">✓ Interview round confirmed for this candidate.</span>
                <span className="text-[11px] text-gray-500">{interviewDate} @ {interviewTime} ({interviewMode})</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(`🎉 *INTERVIEW INVITATION — ${companyName}*\n\nDear *${seekerName}*,\n\nWe are pleased to invite you for an interview for the role of *${jobTitle}*.\n\n📅 *Date:* ${interviewDate || 'Upcoming'}\n⏰ *Time:* ${interviewTime || '10:30 AM'}\n💼 *Mode:* ${interviewMode || 'In-Person (Office)'}\n🏢 *Company:* ${companyName}\n\n📍 *Please reply to this message to confirm your attendance.*\n\nBest regards,\n${companyName} Recruitment Team`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#25D366] text-white font-bold flex items-center gap-1 hover:opacity-90 shadow-2xs"
                >
                  <MessageCircle size={13} /> WhatsApp Invite
                </a>
                <Link href="/employer/interviews" className="text-blue-700 font-bold hover:underline flex items-center gap-1">
                  Calendar <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}


          {showScheduleForm && (
            <form onSubmit={handleScheduleInterview} className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={interviewDate}
                    onChange={e => setInterviewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={interviewTime}
                    onChange={e => setInterviewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Interview Mode</label>
                <select
                  value={interviewMode}
                  onChange={e => setInterviewMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 font-medium"
                >
                  <option value="In-Person (Office)">In-Person (Office / Branch)</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Google Meet / Video">Google Meet / Video Call</option>
                  <option value="WhatsApp Video">WhatsApp Video</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={scheduling}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {scheduling ? 'Scheduling...' : 'Confirm & Schedule (One-Time)'}
              </button>
            </form>
          )}
        </div>

        {/* Confirmed Animation Modal */}
        <InterviewConfirmedModal
          isOpen={confirmedModal.isOpen}
          onClose={() => setConfirmedModal(prev => ({ ...prev, isOpen: false }))}
          candidateName={seekerName}
          jobTitle={jobTitle}
          interviewDate={confirmedModal.date}
          interviewTime={confirmedModal.time}
          interviewMode={confirmedModal.mode}
        />

        {/* Private Employer Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-800 block">Employer Notes (Internal):</label>
          <textarea
            rows={3}
            value={localNotes}
            onChange={e => setLocalNotes(e.target.value)}
            placeholder="Add notes about candidate interview performance, salary expectations, notice period..."
            className="w-full p-3 rounded-xl border border-gray-300 text-xs text-gray-900 outline-none focus:border-blue-500 font-medium leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save size={13} /> {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CandidatesPage() {
  const { user } = useAuth();
  const toast = useToast();

  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  const { data: applications, loading: appsLoading } = useCollection<any>('applications', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !companyId });

  const [pipelineTab, setPipelineTab] = useState<PipelineStatus>('all');
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('All Jobs');
  const [activeModalCandidate, setActiveModalCandidate] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleUpdateStatus = async (appId: string, status: string, seekerId: string, jobTitle: string) => {
    setActionLoading(appId);
    try {
      await updateApplicationStatus(appId, status);
      
      let notifyMessage = '';
      if (status === 'shortlisted') {
        notifyMessage = `Congratulations! You have been shortlisted for "${jobTitle}".`;
      } else if (status === 'selected') {
        notifyMessage = `Great news! You have been selected for "${jobTitle}".`;
      } else if (status === 'rejected') {
        notifyMessage = `Thank you for your interest in "${jobTitle}". Unfortunately, the company has decided to move forward with other candidates.`;
      }

      if (notifyMessage) {
        await createNotification({
          userId: seekerId,
          type: 'application_update',
          title: `Application Update: ${status.toUpperCase()}!`,
          message: notifyMessage,
          actionUrl: '/seeker/applications'
        });
      }
      toast.success(`Candidate marked as ${status}!`);
    } catch (err: any) {
      console.error('Update status error:', err);
      toast.error('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const counts = {
    all: applications.length,
    applied: applications.filter((c) => c.status === 'applied' || !c.status).length,
    shortlisted: applications.filter((c) => c.status === 'shortlisted').length,
    interview_scheduled: applications.filter((c) => c.status === 'interview_scheduled').length,
    selected: applications.filter((c) => c.status === 'selected').length,
    rejected: applications.filter((c) => c.status === 'rejected').length
  };

  const jobOptions = ['All Jobs', ...Array.from(new Set(applications.map((a: any) => a.jobTitle).filter(Boolean)))];

  const filtered = applications.filter((c) => {
    const candidateStatus = c.status || 'applied';
    if (pipelineTab !== 'all' && candidateStatus !== pipelineTab) return false;
    if (search && !c.seekerName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (jobFilter !== 'All Jobs' && c.jobTitle !== jobFilter) return false;
    return true;
  });

  const loading = companyLoading || appsLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 py-20 text-center px-4 font-outfit">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-200 shadow-xs">
          <Users2 size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Company Profile</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
          Please register your company profile first to view and manage candidate applications.
        </p>
        <Link href="/employer/company-profile" className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Candidate Pipeline</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Review applicants, schedule interviews, and manage hiring decisions</p>
        </div>
        <Link
          href="/employer/talent-search"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
        >
          <Search size={15} /> Search Talent Database
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-blue-600 animate-spin" />
          <p className="text-xs text-gray-500 font-semibold">Loading applicants...</p>
        </div>
      ) : (
        <>
          {/* Pipeline Tabs (Touch-Scrollable) */}
          <div className="flex gap-1.5 p-1.5 rounded-2xl bg-gray-100/80 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-1.5">
            {PIPELINE_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setPipelineTab(t.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  pipelineTab === t.value
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.label}
                <span className="ml-1.5 opacity-60 text-[11px]">({counts[t.value as keyof typeof counts]})</span>
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-white border border-gray-300 text-xs font-bold text-gray-700 outline-none cursor-pointer"
            >
              {jobOptions.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>

          {/* Candidate Cards Grid */}
          <div className="space-y-3.5">
            {filtered.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-xs space-y-3">
                <Users2 size={36} className="mx-auto text-gray-300" />
                <p className="text-sm font-bold text-gray-700">No candidate applications in this stage</p>
                <p className="text-xs text-gray-400">Try switching pipeline stages or clearing the search filter.</p>
              </div>
            ) : (
              filtered.map((app) => {
                const curStatus = app.status || 'applied';
                const st = STATUS_STYLES[curStatus] || STATUS_STYLES.applied;
                const createdMillis = app.createdAt?.toMillis ? app.createdAt.toMillis() : (app.createdAt ? new Date(app.createdAt).getTime() : Date.now());
                const isAppOverdue = (curStatus === 'applied' || curStatus === 'under_review') && (Date.now() - createdMillis) > 7 * 86400000;

                return (
                  <div
                    key={app.id}
                    className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:shadow-md ${
                      isAppOverdue ? 'border-amber-300 ring-1 ring-amber-100' : 'border-gray-200'
                    }`}
                  >
                    {/* Left Info */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 font-black text-base flex items-center justify-center shrink-0 border border-blue-100">
                        {app.seekerName?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-gray-900">{app.seekerName}</h3>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold"
                            style={{ background: st.bg, color: st.color }}
                          >
                            {st.label}
                          </span>
                          {isAppOverdue && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold flex items-center gap-1">
                              <Clock size={11} className="text-amber-700" /> Overdue (7+ Days)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          Applied for <span className="font-bold text-gray-900">{app.jobTitle}</span> · {app.createdAt ? new Date(app.createdAt?.toMillis?.() || app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently'}
                        </p>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap justify-between md:justify-end border-t md:border-0 border-gray-100 pt-3 md:pt-0">
                      <button
                        type="button"
                        onClick={() => setActiveModalCandidate(app)}
                        className="py-2 px-3.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <Eye size={14} /> Full Profile &amp; Notes
                      </button>

                      {curStatus !== 'shortlisted' && curStatus !== 'selected' && (
                        <button
                          type="button"
                          disabled={actionLoading === app.id}
                          onClick={() => handleUpdateStatus(app.id, 'shortlisted', app.seekerId, app.jobTitle)}
                          className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1 border border-purple-200 transition-colors cursor-pointer"
                        >
                          <Star size={13} /> Shortlist
                        </button>
                      )}

                      {curStatus !== 'selected' && (
                        <button
                          type="button"
                          disabled={actionLoading === app.id}
                          onClick={() => handleUpdateStatus(app.id, 'selected', app.seekerId, app.jobTitle)}
                          className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
                        >
                          <CheckCircle size={13} /> Hire
                        </button>
                      )}

                      {curStatus !== 'rejected' && (
                        <button
                          type="button"
                          disabled={actionLoading === app.id}
                          onClick={() => handleUpdateStatus(app.id, 'rejected', app.seekerId, app.jobTitle)}
                          className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1 border border-red-200 transition-colors cursor-pointer"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Candidate Modal */}
      {activeModalCandidate && (
        <CandidateDetailModal
          seekerId={activeModalCandidate.seekerId}
          applicationId={activeModalCandidate.id}
          currentStatus={activeModalCandidate.status || 'applied'}
          initialNotes={activeModalCandidate.notes || ''}
          companyId={companyId}
          companyName={company?.name || 'Company'}
          jobId={activeModalCandidate.jobId}
          jobTitle={activeModalCandidate.jobTitle}
          seekerName={activeModalCandidate.seekerName}
          createdAt={activeModalCandidate.createdAt}
          onClose={() => setActiveModalCandidate(null)}
          onNotesUpdated={(notes) => {
            activeModalCandidate.notes = notes;
          }}
          onStatusUpdated={(status) => {
            activeModalCandidate.status = status;
          }}
        />
      )}
    </div>
  );
}
