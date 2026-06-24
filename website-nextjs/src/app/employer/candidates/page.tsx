'use client';

import { useState } from 'react';
import {
  Users2, Search, Eye, Download, CheckCircle, XCircle,
  Calendar, Clock, Briefcase,
  Star, X, Mail, Phone, ExternalLink, Loader2, Save, GraduationCap, MessageSquare, Lock
} from 'lucide-react';
import Link from 'next/link';
import { selectBestSubscription, planHasFeature } from '@/lib/subscriptions';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { updateApplicationStatus, createDocument, createNotification, startConversation } from '@/lib/firebase/firestoreService';
import { where, orderBy } from 'firebase/firestore';

type PipelineStatus = 'all' | 'applied' | 'pending_review' | 'shortlisted' | 'approved' | 'interview_scheduled' | 'walk_in_attended' | 'interview_attended' | 'selected' | 'rejected';

const PIPELINE_TABS: { label: string; value: PipelineStatus; color: string }[] = [
  { label: 'All', value: 'all', color: 'gray' },
  { label: 'New', value: 'applied', color: 'cyan' },
  { label: 'Walk-In Review', value: 'pending_review', color: 'amber' },
  { label: 'Shortlisted', value: 'shortlisted', color: 'violet' },
  { label: 'Approved', value: 'approved', color: 'cyan' },
  { label: 'Interview', value: 'interview_scheduled', color: 'amber' },
  { label: 'Walk-In Attended', value: 'walk_in_attended', color: 'emerald' },
  { label: 'Selected / Hired', value: 'selected', color: 'emerald' },
  { label: 'Rejected', value: 'rejected', color: 'rose' },
];

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  applied: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'New' },
  pending_review: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Pending Review' },
  shortlisted: { bg: 'bg-violet-500/10', text: 'text-violet-400', label: 'Shortlisted' },
  approved: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'Approved' },
  interview_scheduled: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Interview' },
  interview_attended: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Attended' },
  walk_in_attended: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', label: 'Walk-In Attended' },
  selected: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Selected' },
  rejected: { bg: 'bg-rose-500/10', text: 'text-rose-400', label: 'Rejected' },
};

function CandidateDetailPanel({
  application,
  applicationId,
  currentStatus,
  initialNotes,
  companyId,
  companyName,
  jobId,
  jobTitle,
  seekerName,
  onNotesUpdated,
  onStatusUpdated,
  canContact
}: {
  application: any;
  applicationId: string;
  currentStatus: string;
  initialNotes?: string;
  companyId: string;
  companyName: string;
  jobId: string;
  jobTitle: string;
  seekerName: string;
  onNotesUpdated: (notes: string) => void;
  onStatusUpdated: (status: string) => void;
  canContact: boolean;
}) {
  const [savingNotes, setSavingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(initialNotes || '');
  
  // Interview Form State
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewMode, setInterviewMode] = useState('Phone');
  const [scheduling, setScheduling] = useState(false);
  const seekerId = application?.seekerId || '';

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateApplicationStatus(applicationId, currentStatus, localNotes);
      onNotesUpdated(localNotes);
      alert('Notes updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewDate || !interviewTime) {
      alert('Please fill in both date and time.');
      return;
    }
    setScheduling(true);
    try {
      // Create Interview document
      await createDocument('interviews', {
        companyId,
        companyName,
        seekerId,
        seekerName,
        jobId,
        jobTitle,
        date: interviewDate,
        time: interviewTime,
        mode: interviewMode,
        status: 'scheduled',
      });

      // Update Application status
      await updateApplicationStatus(applicationId, 'interview_scheduled');
      onStatusUpdated('interview_scheduled');

      // Create seeker notification
      await createNotification({
        userId: seekerId,
        type: 'interview',
        title: 'Interview Scheduled! 📅',
        message: `An interview has been scheduled for "${jobTitle}" on ${interviewDate} at ${interviewTime} via ${interviewMode}.`,
        actionUrl: '/seeker/interviews',
      });

      alert('Interview scheduled successfully!');
      setShowScheduleForm(false);
    } catch (err) {
      console.error(err);
      alert('Failed to schedule interview');
    } finally {
      setScheduling(false);
    }
  };

  const email = application?.seekerEmail || application?.email || 'N/A';
  const phone = application?.seekerPhone || application?.phone || 'N/A';
  const experienceList = Array.isArray(application?.experience) ? application.experience : [];
  const educationList = Array.isArray(application?.education) ? application.education : [];
  const skillsList = Array.isArray(application?.skills) ? application.skills : [];
  const district = application?.district || application?.location || 'Not available';
  const portfolioLinks = Array.isArray(application?.portfolio) ? application.portfolio : [];
  const walkIn = application?.walkIn || {};

  // Calculate profile strength
  const strengthItems = [
    { label: 'Photo uploaded', done: !!application?.photoUrl },
    { label: 'Contact details', done: !!phone && phone !== 'N/A' && !!email && email !== 'N/A' },
    { label: 'Education added', done: educationList.length > 0 },
    { label: 'Experience added', done: experienceList.length > 0 },
    { label: 'Skills added', done: skillsList.length >= 3 },
  ];
  const profileStrength = Math.round((strengthItems.filter(i => i.done).length / strengthItems.length) * 100);

  return (
    <div className="px-5 pb-5 pt-0 border-t border-white/[0.06] animate-fade-in">
      <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contact Info & Notes */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-3">Contact Info</h4>
            {canContact ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={13} className="text-cyan-400" />
                  <span className="text-gray-300">{phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={13} className="text-cyan-400" />
                  <span className="text-gray-300 truncate">{email}</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5 text-xs">
                  <span className="text-gray-500">Area</span>
                  <span className="text-gray-300 truncate">{district}</span>
                </div>
                {portfolioLinks.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-1">
                    <p className="text-[10px] text-gray-500 font-semibold">Links</p>
                    {portfolioLinks.map((link: string, i: number) => (
                      <a key={i} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-cyan-400 hover:underline">
                        <ExternalLink size={10} /> {link.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    ))}
                  </div>
                )}
                {application?.coverLetter && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <p className="text-[10px] text-gray-500 font-semibold mb-1">Cover Letter</p>
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">{application.coverLetter}</p>
                  </div>
                )}
                {application?.applicationType === 'walk_in' && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <p className="text-[10px] text-emerald-400 font-semibold mb-1">Walk-In Details</p>
                    <div className="space-y-1 text-xs text-gray-400">
                      <p>{walkIn.date || application.walkInDate || 'Date pending'} at {walkIn.time || application.walkInTime || 'Time pending'}</p>
                      <p>{walkIn.venue || application.walkInVenue || 'Venue pending'}</p>
                      <p>{walkIn.contactPerson || application.walkInContactPerson || 'HR'} - {walkIn.contactMobile || application.walkInContactMobile || 'Mobile pending'}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 blur-[3px] select-none">
                  <Phone size={13} />
                  <span>+91 99999 99999</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 blur-[3px] select-none">
                  <Mail size={13} />
                  <span>candidate@email.com</span>
                </div>
                <Link
                  href="/employer/billing"
                  className="mt-2 w-full py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 text-center block"
                >
                  <Lock size={12} /> Unlock Contact Info
                </Link>
              </div>
            )}
          </div>

          {/* Employer Notes */}
          <div className="glass-card rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Employer Notes</h4>
            <textarea
              className="w-full bg-[#111124] border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/40 focus:outline-none resize-none"
              rows={3}
              placeholder="Add review notes, assessment scores, etc..."
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 transition-colors disabled:opacity-50"
            >
              {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save Notes
            </button>
          </div>
        </div>

        {/* Education & Experience */}
        <div className="glass-card rounded-xl p-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <Briefcase size={12} className="text-violet-400" /> Experience
            </h4>
            {experienceList.length === 0 ? (
              <p className="text-xs text-gray-500 italic">Experience was not shared with this application</p>
            ) : (
              <div className="space-y-3">
                {experienceList.map((exp: any, i: number) => (
                  <div key={i} className="text-xs border-l-2 border-violet-500/20 pl-2">
                    <p className="font-semibold text-white">{exp.role}</p>
                    <p className="text-gray-400">{exp.company} ({exp.startDate} - {exp.endDate})</p>
                    {exp.description && <p className="text-gray-500 text-[10px] mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/[0.06]">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <GraduationCap size={12} className="text-emerald-400" /> Education
            </h4>
            {educationList.length === 0 ? (
              <p className="text-xs text-gray-500 italic">Education was not shared with this application</p>
            ) : (
              <div className="space-y-3">
                {educationList.map((edu: any, i: number) => (
                  <div key={i} className="text-xs border-l-2 border-emerald-500/20 pl-2">
                    <p className="font-semibold text-white">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                    <p className="text-gray-400">{edu.institution} ({edu.year})</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile Strength & Schedule Interview */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-3">Profile Strength</h4>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                  style={{ width: `${profileStrength}%` }}
                />
              </div>
              <span className="text-xs font-bold text-cyan-400">{profileStrength}%</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {skillsList.map((s: string) => (
                <span key={s} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[9px] text-gray-400 border border-white/[0.06]">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Schedule Interview section */}
          {currentStatus !== 'rejected' && currentStatus !== 'selected' && (
            <div className="glass-card rounded-xl p-4">
              {!showScheduleForm ? (
                <button
                  onClick={() => setShowScheduleForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-all"
                >
                  <Calendar size={14} />
                  Schedule Interview
                </button>
              ) : (
                <form onSubmit={handleScheduleInterview} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2">
                    <span className="text-xs font-semibold text-amber-400">Schedule Interview</span>
                    <button type="button" onClick={() => setShowScheduleForm(false)} className="text-gray-500 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full bg-[#111124] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Time</label>
                    <input
                      type="time"
                      required
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full bg-[#111124] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Mode</label>
                    <select
                      value={interviewMode}
                      onChange={(e) => setInterviewMode(e.target.value)}
                      className="w-full bg-[#111124] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    >
                      <option value="Phone">Phone Call</option>
                      <option value="Video">Video Call (Google Meet)</option>
                      <option value="In-Person">In-Person Office Interview</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={scheduling}
                    className="w-full py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {scheduling ? 'Scheduling...' : 'Confirm Date & Time'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CandidatesPage() {
  const { user } = useAuth();
  const router = useRouter();

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch applications matching company
  const { data: applications, loading: appsLoading } = useCollection<any>('applications', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !companyId });

  // 3. Fetch subscriptions matching company
  const { data: subscriptions, loading: subLoading } = useCollection<any>('subscriptions', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  const activeSub = selectBestSubscription(subscriptions);
  const activePlan = activeSub?.plan || company?.subscriptionPlan || (company?.isPremium ? 'premium' : 'free');
  const canContactCandidates = planHasFeature(activePlan, 'direct_candidate_contact');

  const [pipelineTab, setPipelineTab] = useState<PipelineStatus>('all');
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('All Jobs');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Helper: get initials
  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'C';
  };

  const handleUpdateStatus = async (appId: string, status: string, seekerId: string, jobTitle: string) => {
    setActionLoading(appId);
    try {
      await updateApplicationStatus(appId, status);
      
      // Notify candidate
      let notifyMessage = '';
      if (status === 'shortlisted') {
        notifyMessage = `Congratulations! You have been shortlisted for "${jobTitle}".`;
      } else if (status === 'approved') {
        notifyMessage = `Your walk-in application for "${jobTitle}" has been approved.`;
      } else if (status === 'walk_in_attended') {
        notifyMessage = `Your walk-in attendance for "${jobTitle}" has been marked.`;
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
          actionUrl: '/seeker/applications',
        });
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessageCandidate = async (candidate: any) => {
    if (!user?.uid || !candidate.seekerId) return;
    const loadingKey = `message-${candidate.id}`;
    setActionLoading(loadingKey);
    try {
      const conversationId = await startConversation({
        currentUserId: user.uid,
        otherUserId: candidate.seekerId,
        currentUserName: company?.name || user.displayName || user.email || 'Employer',
        otherUserName: candidate.seekerName || 'Candidate',
        contextTitle: candidate.jobTitle || '',
      });
      router.push(`/employer/messages?conversation=${conversationId}`);
    } catch (err) {
      console.error('Start conversation error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const counts = {
    all: applications.length,
    applied: applications.filter((c) => c.status === 'applied' || !c.status).length,
    pending_review: applications.filter((c) => c.status === 'pending_review').length,
    shortlisted: applications.filter((c) => c.status === 'shortlisted').length,
    approved: applications.filter((c) => c.status === 'approved').length,
    interview_scheduled: applications.filter((c) => c.status === 'interview_scheduled').length,
    walk_in_attended: applications.filter((c) => c.status === 'walk_in_attended' || c.status === 'interview_attended').length,
    interview_attended: applications.filter((c) => c.status === 'interview_attended').length,
    selected: applications.filter((c) => c.status === 'selected').length,
    rejected: applications.filter((c) => c.status === 'rejected').length,
  };

  const jobOptions = ['All Jobs', ...Array.from(new Set(applications.map((a: any) => a.jobTitle).filter(Boolean)))];

  const filtered = applications.filter((c) => {
    const candidateStatus = c.status === 'interview_attended' ? 'walk_in_attended' : (c.status || 'applied');
    if (pipelineTab !== 'all' && candidateStatus !== pipelineTab) return false;
    const q = search.toLowerCase();
    const searchable = [
      c.seekerName,
      c.jobTitle,
      c.seekerPhone,
      c.seekerEmail,
      ...(Array.isArray(c.skills) ? c.skills : []),
    ].filter(Boolean).join(' ').toLowerCase();
    if (search && !searchable.includes(q)) return false;
    if (jobFilter !== 'All Jobs' && c.jobTitle !== jobFilter) return false;
    return true;
  });

  const loading = companyLoading || appsLoading || subLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit">
        <Users2 size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-white">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to view and manage candidate applications.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-outfit">Candidate Management</h1>
        <p className="text-sm text-gray-400 mt-1">Track and manage your recruitment pipeline</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading candidate applications...</p>
        </div>
      ) : (
        <>
          {/* Pipeline Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
            {PIPELINE_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setPipelineTab(t.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  pipelineTab === t.value
                     ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {t.label}
                <span className="ml-1.5 text-[10px]">({counts[t.value as keyof typeof counts]})</span>
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
              />
            </div>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all"
            >
              {jobOptions.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>

          {/* Candidate Cards */}
          <div className="space-y-3">
            {filtered.map((candidate) => {
              const status = statusConfig[candidate.status || 'applied'] || statusConfig.applied;
              const isExpanded = expandedId === candidate.id;
              return (
                <div
                  key={candidate.id}
                  className="glass-card rounded-2xl overflow-hidden hover:border-white/15 transition-all"
                >
                  {/* Main Row */}
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Avatar + Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{getInitials(candidate.seekerName)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-white">{candidate.seekerName || 'Candidate'}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${status.bg} ${status.text}`}>
                              {status.label}
                            </span>
                            {candidate.applicationType === 'walk_in' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                                Walk-In
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Briefcase size={11} /> {candidate.jobTitle}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> Applied {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'Recently'}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {actionLoading === candidate.id ? (
                          <Loader2 size={16} className="text-cyan-400 animate-spin" />
                        ) : (
                          <>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                              className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white transition-all"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (!canContactCandidates) {
                                  alert('Upgrade to the Premium Plan to message candidates directly!');
                                  router.push('/employer/billing');
                                  return;
                                }
                                handleMessageCandidate(candidate);
                              }}
                              disabled={actionLoading === `message-${candidate.id}`}
                              className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                              title="Message Candidate"
                            >
                              {actionLoading === `message-${candidate.id}` ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                            </button>
                            {candidate.resumeUrl && candidate.resumeUrl !== '#' && (
                              <a
                                href={candidate.resumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center justify-center"
                                title="Download Resume"
                              >
                                <Download size={14} />
                              </a>
                            )}
                            {candidate.status !== 'shortlisted' && candidate.status !== 'selected' && (
                              <button
                                onClick={() => handleUpdateStatus(candidate.id, 'shortlisted', candidate.seekerId, candidate.jobTitle)}
                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                title="Shortlist"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                            {candidate.applicationType === 'walk_in' && !['approved', 'walk_in_attended', 'interview_attended', 'selected', 'rejected'].includes(candidate.status) && (
                              <button
                                onClick={() => handleUpdateStatus(candidate.id, 'approved', candidate.seekerId, candidate.jobTitle)}
                                className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                                title="Approve Walk-In"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                            {candidate.applicationType === 'walk_in' && candidate.status === 'approved' && (
                              <button
                                onClick={() => handleUpdateStatus(candidate.id, 'walk_in_attended', candidate.seekerId, candidate.jobTitle)}
                                className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                                title="Mark Attended"
                              >
                                <Clock size={14} />
                              </button>
                            )}
                            {candidate.status !== 'selected' && (
                              <button
                                onClick={() => handleUpdateStatus(candidate.id, 'selected', candidate.seekerId, candidate.jobTitle)}
                                className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all"
                                title="Select / Hire"
                              >
                                <Star size={14} />
                              </button>
                            )}
                            {candidate.status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateStatus(candidate.id, 'rejected', candidate.seekerId, candidate.jobTitle)}
                                className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"
                                title="Reject"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <CandidateDetailPanel
                      application={candidate}
                      applicationId={candidate.id}
                      currentStatus={candidate.status || 'applied'}
                      initialNotes={candidate.employerNote}
                      companyId={companyId}
                      companyName={company?.name || 'Company'}
                      jobId={candidate.jobId}
                      jobTitle={candidate.jobTitle}
                      seekerName={candidate.seekerName}
                      canContact={canContactCandidates}
                      onNotesUpdated={(newNotes) => {
                        candidate.employerNote = newNotes;
                      }}
                      onStatusUpdated={(newStatus) => {
                        candidate.status = newStatus;
                        setExpandedId(null);
                      }}
                    />
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Users2 size={32} className="text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No candidates found</p>
                <p className="text-xs text-gray-600 mt-1">Adjust filters or wait for new applications</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
