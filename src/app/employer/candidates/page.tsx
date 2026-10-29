'use client';

import { useState, useMemo } from 'react';
import {
  Users2, Search, Eye, CheckCircle, XCircle,
  Calendar, Clock, MessageCircle,
  Star, X, Phone, ExternalLink, Loader2, Save,
  MapPin, Check, FileText, Zap, ArrowUpDown, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useEmployerCompany } from '@/hooks/useEmployerCompany';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { formatDate, toDate, type FirestoreTime } from '@/lib/firestoreTime';
import {
  ActionMenu, DataTable, ViewToggle, useViewMode,
  type ActionItem, type Column,
} from '@/components/dashboard';
import {
  computeCandidateMatchScore,
  type CandidateMatchBreakdown,
} from '@/lib/matching/candidateMatchScore';
import CandidateMatchScoreWidget, {
  CandidateMatchBadge,
} from '@/components/employer/CandidateMatchScoreWidget';

interface CandidateRow {
  id: string;
  seekerName?: string;
  seekerId?: string;
  seekerPhone?: string;
  seekerTaluk?: string;
  seekerEmail?: string;
  seekerQualification?: string;
  seekerExperience?: string;
  jobTitle?: string;
  jobId?: string;
  status?: string;
  notes?: string;
  appliedVia?: string;
  createdAt?: FirestoreTime;
  matchScore?: number;
  matchBreakdown?: CandidateMatchBreakdown;
  [key: string]: unknown;
}
import { updateApplicationStatus, createDocument, createNotification } from '@/lib/firebase/firestoreService';
import { where, orderBy } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';
import InterviewConfirmedModal from '@/components/ui/InterviewConfirmedModal';
import WhatsAppInterviewPassModal from '@/components/employer/WhatsAppInterviewPassModal';
import { safeExternalUrl } from '@/lib/safeUrl';

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
  appliedVia,
  appliedPhone,
  appliedTaluk,
  targetJob,
  initialMatchBreakdown,
  onClose,
  onNotesUpdated,
  onStatusUpdated,
  onOpenInterviewPass,
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
  appliedVia?: string;
  appliedPhone?: string;
  appliedTaluk?: string;
  targetJob?: any;
  initialMatchBreakdown?: CandidateMatchBreakdown;
  onClose: () => void;
  onNotesUpdated: (notes: string) => void;
  onStatusUpdated: (status: string) => void;
  onOpenInterviewPass?: () => void;
}) {
  // RULES-1: users/{uid} is readable only by its owner and admins; employers read the seeker profile
  // (the rule grants employers/business owners read on seekerProfiles).
  const { data: profile, loading: profileLoading } = useDocument<any>('seekerProfiles', seekerId);
  const toast = useToast();

  const [savingNotes, setSavingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(initialNotes || '');

  // Compute live AI match score incorporating rich profile data when loaded
  const effectiveMatch: CandidateMatchBreakdown = useMemo(() => {
    if (profile || targetJob) {
      return computeCandidateMatchScore(
        {
          id: seekerId,
          name: seekerName,
          phone: profile?.phone || appliedPhone,
          taluk: profile?.taluk || appliedTaluk,
          location: profile?.district || profile?.city || profile?.location || appliedTaluk,
          skills: profile?.skills || profile?.keySkills || [],
          immediateJoiner: profile?.immediateJoiner,
          noticePeriod: profile?.noticePeriod,
          availableFrom: profile?.availableFrom,
          experienceYears: profile?.experienceYears,
          qualification: profile?.qualification,
        },
        targetJob || {
          title: jobTitle,
          taluk: appliedTaluk || 'Theni',
          location: 'Theni',
        }
      );
    }
    return (
      initialMatchBreakdown ||
      computeCandidateMatchScore(
        {
          id: seekerId,
          name: seekerName,
          phone: appliedPhone,
          taluk: appliedTaluk,
        },
        {
          title: jobTitle,
          taluk: 'Theni',
        }
      )
    );
  }, [profile, targetJob, initialMatchBreakdown, seekerId, seekerName, appliedPhone, appliedTaluk, jobTitle]);
  
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

  if (profileLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-outfit">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={32} />
          <p className="text-xs text-gray-500 font-semibold">Loading applicant profile...</p>
        </div>
      </div>
    );
  }

  const email = profile?.email || 'N/A';
  const phone = profile?.phone || appliedPhone || 'N/A';
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const cleanWhatsApp = (profile?.whatsapp || profile?.phone || appliedPhone || '').replace(/[^0-9]/g, '');
  const skillsList = profile?.skills || [];
  const district = profile?.district || appliedTaluk || 'Theni';
  const resumeUrl = profile?.resumeUrl;

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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">{seekerName}</h2>
                {appliedVia === 'whatsapp' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shadow-xs">
                    <MessageCircle size={12} className="text-emerald-600" aria-hidden /> Applied via WhatsApp
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">Applied for: <span className="text-blue-700 font-bold">{jobTitle}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-slate-500 hover:text-gray-600 transition-colors cursor-pointer">
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

        {/* AI Candidate Match & Proximity Score (தகுதியான ஆட்கள் AI தரவரிசை) */}
        <CandidateMatchScoreWidget match={effectiveMatch} />

        {/* Quick Contact & Resume Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {cleanPhone && cleanPhone !== 'N/A' && (
            <a
              href={`tel:${cleanPhone}`}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                effectiveMatch.tier === 'exceptional' || effectiveMatch.totalScore >= 75
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-emerald-500 shadow-sm ring-2 ring-emerald-200'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
              }`}
            >
              <Phone size={14} />
              {effectiveMatch.tier === 'exceptional' || effectiveMatch.totalScore >= 75 ? (
                <span>Call First (தகுதியான ஆள்)</span>
              ) : (
                <span>Call Candidate</span>
              )}
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
              href={safeExternalUrl(resumeUrl)}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all text-center"
            >
              <FileText size={14} /> View Resume PDF
            </a>
          ) : (
            <span className="py-2.5 px-3 rounded-2xl bg-gray-50 text-slate-500 text-xs font-medium text-center border border-gray-200">
              No Resume Uploaded
            </span>
          )}
        </div>

        {/* 1-Click WhatsApp Interview Call Pass Button */}
        {onOpenInterviewPass && (
          <button
            type="button"
            onClick={onOpenInterviewPass}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <MessageCircle size={16} />
            <span>Send WhatsApp Interview Call Pass with Google Maps Pin (நேர்காணல் அட்டை)</span>
          </button>
        )}

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
                  <label htmlFor="employer-candidates-date" className="text-[11px] font-bold text-gray-700 block mb-1">Date</label>
                  <input id="employer-candidates-date"
                    type="date"
                    required
                    value={interviewDate}
                    onChange={e => setInterviewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-base sm:text-xs text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label htmlFor="employer-candidates-time" className="text-[11px] font-bold text-gray-700 block mb-1">Time</label>
                  <input id="employer-candidates-time"
                    type="time"
                    required
                    value={interviewTime}
                    onChange={e => setInterviewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-base sm:text-xs text-gray-900 font-medium"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="employer-candidates-interview-mode" className="text-[11px] font-bold text-gray-700 block mb-1">Interview Mode</label>
                <select id="employer-candidates-interview-mode"
                  value={interviewMode}
                  onChange={e => setInterviewMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-base sm:text-xs text-gray-900 font-medium"
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
          <label htmlFor="employer-candidates-employer-notes-internal" className="text-xs font-bold text-gray-800 block">Employer Notes (Internal):</label>
          <textarea id="employer-candidates-employer-notes-internal"
            rows={3}
            value={localNotes}
            onChange={e => setLocalNotes(e.target.value)}
            placeholder="Add notes about candidate interview performance, salary expectations, notice period..."
            className="w-full p-3 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 outline-none focus:border-blue-500 font-medium leading-relaxed"
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

  const { company: canonicalComp, loading: companyLoading } = useEmployerCompany();
  const company = canonicalComp;
  const companyId = company?.id;

  const { data: applications, loading: appsLoading } = useCollection<any>('applications', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !companyId });

  // Fetch employer's active jobs to cross-match required skills & job location
  const { data: jobs, loading: jobsLoading } = useCollection<any>('jobs', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  const jobsMap = useMemo(() => {
    const map = new Map<string, any>();
    (jobs || []).forEach((j: any) => {
      if (j.id) map.set(j.id, j);
    });
    return map;
  }, [jobs]);

  // Score each applicant against its targeted job requirements
  const scoredApplications: CandidateRow[] = useMemo(() => {
    return (applications || []).map((app: any) => {
      const targetJob = app.jobId ? jobsMap.get(app.jobId) : null;
      const jobContext = targetJob || {
        title: app.jobTitle || 'Job Role',
        location: app.jobLocation || company?.location || company?.taluk || 'Theni',
        taluk: app.jobTaluk || company?.taluk || 'Theni',
        skillsRequired: app.skillsRequired || [],
      };

      const candidateContext = {
        id: app.seekerId || app.id,
        name: app.seekerName,
        phone: app.seekerPhone,
        taluk: app.seekerTaluk || app.taluk,
        location: app.seekerLocation || app.location || app.district,
        skills: app.skills || app.seekerSkills || [],
        immediateJoiner: app.immediateJoiner,
        noticePeriod: app.noticePeriod || app.seekerNoticePeriod,
        availableFrom: app.availableFrom,
        experienceYears: app.seekerExperience || app.experience,
        qualification: app.seekerQualification || app.qualification,
      };

      const breakdown = computeCandidateMatchScore(candidateContext, jobContext);

      return {
        ...app,
        matchScore: breakdown.totalScore,
        matchBreakdown: breakdown,
      };
    });
  }, [applications, jobsMap, company]);

  const [pipelineTab, setPipelineTab] = useState<PipelineStatus>('all');
  const [matchFilter, setMatchFilter] = useState<'all' | 'high_match' | 'local_5km' | 'immediate'>('all');
  // Default sort is 'match_desc' so employers call the highest-fit local candidates first
  const [sortBy, setSortBy] = useState<'match_desc' | 'date_desc' | 'date_asc'>('match_desc');
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('All Jobs');
  const [activeModalCandidate, setActiveModalCandidate] = useState<CandidateRow | null>(null);
  const [passCandidate, setPassCandidate] = useState<CandidateRow | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [view, setView] = useViewMode('employer-candidates', 'table');

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
    all: scoredApplications.length,
    applied: scoredApplications.filter((c) => c.status === 'applied' || !c.status).length,
    shortlisted: scoredApplications.filter((c) => c.status === 'shortlisted').length,
    interview_scheduled: scoredApplications.filter((c) => c.status === 'interview_scheduled').length,
    selected: scoredApplications.filter((c) => c.status === 'selected').length,
    rejected: scoredApplications.filter((c) => c.status === 'rejected').length
  };

  const matchCounts = useMemo(() => {
    return {
      all: scoredApplications.length,
      high_match: scoredApplications.filter(c => (c.matchScore ?? 0) >= 75).length,
      local_5km: scoredApplications.filter(c => (c.matchBreakdown?.distanceKm ?? 999) <= 5).length,
      immediate: scoredApplications.filter(c => c.matchBreakdown?.immediateJoiner?.score === 30).length,
    };
  }, [scoredApplications]);

  const jobOptions = ['All Jobs', ...Array.from(new Set(scoredApplications.map((a: any) => a.jobTitle).filter(Boolean)))];

  const filtered = useMemo(() => {
    const list = scoredApplications.filter((c) => {
      const candidateStatus = c.status || 'applied';
      if (pipelineTab !== 'all' && candidateStatus !== pipelineTab) return false;
      if (search && !c.seekerName?.toLowerCase().includes(search.toLowerCase())) return false;
      if (jobFilter !== 'All Jobs' && c.jobTitle !== jobFilter) return false;

      // Match filter checks
      if (matchFilter === 'high_match' && (c.matchScore ?? 0) < 75) return false;
      if (matchFilter === 'local_5km' && ((c.matchBreakdown?.distanceKm ?? 999) > 5)) return false;
      if (matchFilter === 'immediate' && c.matchBreakdown?.immediateJoiner?.score !== 30) return false;

      return true;
    });

    // Automatic Sorting: default 'match_desc' so employers call highest-fit local candidates first
    return [...list].sort((a, b) => {
      if (sortBy === 'match_desc') {
        const scoreDiff = (b.matchScore ?? 0) - (a.matchScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        const timeA = toDate(a.createdAt)?.getTime() ?? 0;
        const timeB = toDate(b.createdAt)?.getTime() ?? 0;
        return timeB - timeA;
      }
      if (sortBy === 'date_desc') {
        const timeA = toDate(a.createdAt)?.getTime() ?? 0;
        const timeB = toDate(b.createdAt)?.getTime() ?? 0;
        return timeB - timeA;
      }
      if (sortBy === 'date_asc') {
        const timeA = toDate(a.createdAt)?.getTime() ?? 0;
        const timeB = toDate(b.createdAt)?.getTime() ?? 0;
        return timeA - timeB;
      }
      return 0;
    });
  }, [scoredApplications, pipelineTab, search, jobFilter, matchFilter, sortBy]);

  const loading = companyLoading || appsLoading || jobsLoading;

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

  const isOverdue = (app: CandidateRow) => {
    const cur = app.status || 'applied';
    if (cur !== 'applied' && cur !== 'under_review') return false;
    const d = toDate(app.createdAt);
    return d ? Date.now() - d.getTime() > 7 * 86400000 : false;
  };

  const candidateColumns: Column<CandidateRow>[] = [
    {
      key: 'seekerName',
      header: 'Candidate',
      card: 'title',
      sortValue: app => app.seekerName ?? '',
      render: app => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-[#EFF6FF] text-sm font-bold text-[#1E40AF]">
            {app.seekerName?.[0]?.toUpperCase() || 'C'}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 flex-wrap">
              <span className="block truncate font-semibold text-slate-900">{app.seekerName || 'Candidate'}</span>
              {app.appliedVia === 'whatsapp' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shadow-xs">
                  <MessageCircle size={10} className="text-emerald-600" aria-hidden /> WhatsApp Apply
                </span>
              )}
            </span>
            {isOverdue(app) && (
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                <Clock size={10} aria-hidden /> Overdue 7+ days
              </span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: 'matchScore',
      header: 'AI Match (AI தரவரிசை)',
      sortValue: app => app.matchScore ?? 0,
      render: app => {
        const breakdown = app.matchBreakdown;
        return (
          <div className="flex flex-col gap-1 py-0.5 min-w-[155px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <CandidateMatchBadge score={app.matchScore ?? 0} tier={breakdown?.tier} compact />
              {breakdown && breakdown.distanceKm !== undefined && breakdown.distanceKm !== null && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-bold rounded-md px-1.5 py-0.5 border ${
                    breakdown.distanceKm <= 5
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : breakdown.distanceKm <= 15
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                  title={`Distance from job: ${Math.round(breakdown.distanceKm)} km`}
                >
                  <MapPin size={10} />
                  {breakdown.distanceKm <= 5 ? `~${Math.round(breakdown.distanceKm)} km (Local)` : `~${Math.round(breakdown.distanceKm)} km`}
                </span>
              )}
              {breakdown?.immediateJoiner?.score === 30 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-50 rounded-md px-1.5 py-0.5 border border-amber-200">
                  <Zap size={10} className="fill-amber-600 text-amber-600" /> Immediate
                </span>
              )}
            </div>
            {breakdown?.matchedSkills && breakdown.matchedSkills.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap text-[10px] text-slate-500">
                <span className="font-semibold text-slate-400">Skills:</span>
                {breakdown.matchedSkills.slice(0, 2).map((s: string, idx: number) => (
                  <span key={idx} className="bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.5 rounded text-[10px] border border-indigo-100">
                    {s}
                  </span>
                ))}
                {breakdown.matchedSkills.length > 2 && (
                  <span className="text-[10px] text-slate-400 font-bold">+{breakdown.matchedSkills.length - 2}</span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'jobTitle',
      header: 'Applied for',
      sortValue: app => app.jobTitle ?? '',
      render: app => <span className="truncate">{app.jobTitle || '—'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Applied',
      hideBelow: 'lg',
      sortValue: app => toDate(app.createdAt)?.getTime() ?? 0,
      render: app => formatDate(app.createdAt),
    },
    {
      key: 'status',
      header: 'Stage',
      align: 'center',
      sortValue: app => app.status ?? 'applied',
      render: app => {
        const st = STATUS_STYLES[app.status || 'applied'] || STATUS_STYLES.applied;
        return (
          <span
            className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: st.bg, color: st.color }}
          >
            {st.label}
          </span>
        );
      },
    },
  ];

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

          {/* AI Candidate Match Quick Filters (தகுதியான ஆட்கள் AI வடிகட்டி) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1 shrink-0">
              <Sparkles size={13} className="text-blue-600" /> AI Filter:
            </span>
            <button
              type="button"
              onClick={() => setMatchFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                matchFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Candidates ({matchCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setMatchFilter('high_match')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                matchFilter === 'high_match'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <span>🎯 Top Match 75%+</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${matchFilter === 'high_match' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-900'}`}>
                {matchCounts.high_match}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMatchFilter('local_5km')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                matchFilter === 'local_5km'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-indigo-800 hover:bg-indigo-50'
              }`}
            >
              <MapPin size={12} />
              <span>Within 5 km Local</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${matchFilter === 'local_5km' ? 'bg-white/20' : 'bg-indigo-100 text-indigo-900'}`}>
                {matchCounts.local_5km}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMatchFilter('immediate')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                matchFilter === 'immediate'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Zap size={12} className="fill-current" />
              <span>Immediate Joiners</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${matchFilter === 'immediate' ? 'bg-white/20' : 'bg-amber-100 text-amber-900'}`}>
                {matchCounts.immediate}
              </span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                aria-label="Search candidates by name" placeholder="Search candidates by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-300 text-base sm:text-xs sm:text-sm text-gray-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-white border border-gray-300 text-base sm:text-xs font-bold text-gray-700 outline-none cursor-pointer"
            >
              {jobOptions.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-2xl px-3 py-2 text-xs font-bold text-gray-700 shadow-2xs">
              <ArrowUpDown size={14} className="text-gray-400 shrink-0" />
              <label htmlFor="candidates-sort-by" className="text-xs font-bold text-gray-500 hidden sm:inline">Sort:</label>
              <select
                id="candidates-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
                aria-label="Sort candidates"
              >
                <option value="match_desc">⭐ AI Match (Highest first) - Default</option>
                <option value="date_desc">📅 Applied Date (Newest first)</option>
                <option value="date_asc">📅 Applied Date (Oldest first)</option>
              </select>
            </div>
            <ViewToggle value={view} onChange={setView} />
          </div>

          <DataTable
            label="Candidate applications"
            view={view}
            gridColumns={2}
            columns={candidateColumns}
            rows={filtered}
            getRowId={app => app.id}
            emptyIcon={Users2}
            emptyTitle="No candidate applications in this stage"
            emptyDescription="Switch pipeline stages or clear the search filter."
            rowActions={app => {
              if (actionLoading === app.id) {
                return <Loader2 size={16} className="animate-spin text-blue-600" aria-label="Saving" />;
              }
              const curStatus = app.status || 'applied';
              const items: ActionItem[] = [
                { label: 'Full profile & notes', icon: Eye, onClick: () => setActiveModalCandidate(app) },
                {
                  label: 'Send WhatsApp Interview Pass (நேர்காணல் அட்டை)',
                  icon: MessageCircle,
                  tone: 'success',
                  onClick: () => setPassCandidate(app),
                },
              ];
              if (curStatus !== 'shortlisted' && curStatus !== 'selected') {
                items.push({ label: 'Shortlist', icon: Star, separatorBefore: true, onClick: () => handleUpdateStatus(app.id, 'shortlisted', app.seekerId ?? '', app.jobTitle ?? 'this role') });
              }
              if (curStatus !== 'selected') {
                items.push({ label: 'Hire candidate', icon: CheckCircle, tone: 'success', onClick: () => handleUpdateStatus(app.id, 'selected', app.seekerId ?? '', app.jobTitle ?? 'this role') });
              }
              if (curStatus !== 'rejected') {
                items.push({ label: 'Reject application', icon: XCircle, tone: 'danger', separatorBefore: true, onClick: () => handleUpdateStatus(app.id, 'rejected', app.seekerId ?? '', app.jobTitle ?? 'this role') });
              }
              return <ActionMenu label={`Actions for ${app.seekerName ?? 'candidate'}`} items={items} />;
            }}
          />
        </>
      )}

      {/* Candidate Modal */}
      {activeModalCandidate && (
        <CandidateDetailModal
          seekerId={activeModalCandidate.seekerId ?? ''}
          applicationId={activeModalCandidate.id}
          currentStatus={activeModalCandidate.status || 'applied'}
          initialNotes={activeModalCandidate.notes || ''}
          companyId={companyId || ''}
          companyName={company?.name || 'Company'}
          jobId={activeModalCandidate.jobId ?? ''}
          jobTitle={activeModalCandidate.jobTitle ?? ''}
          seekerName={activeModalCandidate.seekerName ?? 'Candidate'}
          createdAt={activeModalCandidate.createdAt}
          appliedVia={activeModalCandidate.appliedVia}
          appliedPhone={activeModalCandidate.seekerPhone}
          appliedTaluk={activeModalCandidate.seekerTaluk}
          targetJob={activeModalCandidate.jobId ? jobsMap.get(activeModalCandidate.jobId) : undefined}
          initialMatchBreakdown={activeModalCandidate.matchBreakdown}
          onClose={() => setActiveModalCandidate(null)}
          onNotesUpdated={(notes) => {
            // Assigning to the object returned by useState does not re-render, so a saved
            // note stayed invisible until the list reloaded. Replace the value instead.
            setActiveModalCandidate((prev: any) => (prev ? { ...prev, notes } : prev));
          }}
          onStatusUpdated={(status) => {
            setActiveModalCandidate((prev: any) => (prev ? { ...prev, status } : prev));
          }}
          onOpenInterviewPass={() => {
            setPassCandidate(activeModalCandidate);
          }}
        />
      )}

      {/* WhatsApp Interview Pass Modal */}
      {passCandidate && (
        <WhatsAppInterviewPassModal
          isOpen={!!passCandidate}
          onClose={() => setPassCandidate(null)}
          candidateName={passCandidate.seekerName || 'Candidate'}
          candidatePhone={passCandidate.seekerPhone || ''}
          jobTitle={passCandidate.jobTitle || 'Job Role'}
          companyName={company?.name || 'Company'}
          companyAddress={company?.address || 'Theni Main Road, Theni, Tamil Nadu'}
          companyMapsUrl={company?.mapsUrl || ''}
          companyContactPhone={company?.phone || user?.phone || '9360519460'}
          onConfirmSend={async (details) => {
            try {
              await updateApplicationStatus(
                passCandidate.id,
                'interview_scheduled',
                `Interview Call Pass issued for ${details.interviewDate} at ${details.interviewTime}. Location: ${details.interviewLocation}. Maps: ${details.mapsUrl}. Pass dispatched via WhatsApp.`
              );
              if (passCandidate.seekerId) {
                await createNotification({
                  userId: passCandidate.seekerId,
                  type: 'interview',
                  title: 'Interview Call Pass Issued! 🎟️',
                  message: `Interview call pass for "${passCandidate.jobTitle}" on ${details.interviewDate} at ${details.interviewTime} at ${details.interviewLocation} has been issued.`,
                  actionUrl: '/seeker/interviews'
                });
              }
              toast.success('Interview Call Pass dispatched via WhatsApp!');
            } catch (err) {
              console.error('Failed to log interview pass:', err);
              toast.error('Failed to update interview pass');
            }
          }}
        />
      )}
    </div>
  );
}
