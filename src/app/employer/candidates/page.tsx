'use client';

import { useState } from 'react';
import {
  Users2, Search, Eye, Download, CheckCircle, XCircle,
  Calendar, Clock, Briefcase,
  Star, X, Mail, Phone, ExternalLink, Loader2, Save, GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { updateApplicationStatus, createDocument, createNotification } from '@/lib/firebase/firestoreService';
import { where, orderBy } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';

type PipelineStatus = 'all' | 'applied' | 'shortlisted' | 'interview_scheduled' | 'selected' | 'rejected';

const PIPELINE_TABS: { label: string; value: PipelineStatus; color: string }[] = [
  { label: 'All', value: 'all', color: 'gray' },
  { label: 'New', value: 'applied', color: 'cyan' },
  { label: 'Shortlisted', value: 'shortlisted', color: 'violet' },
  { label: 'Interview', value: 'interview_scheduled', color: 'amber' },
  { label: 'Selected / Hired', value: 'selected', color: 'emerald' },
  { label: 'Rejected', value: 'rejected', color: 'rose' },
];

// Vaanikan light-theme status config used inline via style prop
const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  applied:             { bg: '#EFF6FF', color: '#2563EB', label: 'New' },
  shortlisted:         { bg: '#F5F3FF', color: '#7C3AED', label: 'Shortlisted' },
  interview_scheduled: { bg: '#FFFBEB', color: '#D97706', label: 'Interview' },
  selected:            { bg: '#ECFDF5', color: '#059669', label: 'Selected' },
  rejected:            { bg: '#FEF2F2', color: '#DC2626', label: 'Rejected' } };
// Backwards compat alias
const statusConfig = Object.fromEntries(
  Object.entries(statusStyles).map(([k, v]) => [k, { bg: '', text: '', label: v.label, _bg: v.bg, _color: v.color }])
);

function CandidateDetailPanel({
  seekerId,
  applicationId,
  currentStatus,
  initialNotes,
  companyId,
  companyName,
  jobId,
  jobTitle,
  seekerName,
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
  const [interviewMode, setInterviewMode] = useState('Phone');
  const [scheduling, setScheduling] = useState(false);

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
        status: 'scheduled' });

      // Update Application status
      await updateApplicationStatus(applicationId, 'interview_scheduled');
      onStatusUpdated('interview_scheduled');

      // Create seeker notification
      await createNotification({
        userId: seekerId,
        type: 'interview',
        title: 'Interview Scheduled! 📅',
        message: `An interview has been scheduled for "${jobTitle}" on ${interviewDate} at ${interviewTime} via ${interviewMode}.`,
        actionUrl: '/seeker/interviews' });

      toast.success('Interview scheduled successfully!');
      setShowScheduleForm(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to schedule interview');
    } finally {
      setScheduling(false);
    }
  };

  if (profileLoading || userLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="animate-spin text-cyan-400" size={20} />
      </div>
    );
  }

  const email = profile?.email || userDoc?.email || 'N/A';
  const phone = profile?.phone || userDoc?.phone || 'N/A';
  const experienceList = profile?.experience || [];
  const educationList = profile?.education || [];
  const skillsList = profile?.skills || [];
  const district = profile?.district || userDoc?.district || 'Theni';

  // Calculate profile strength
  const strengthItems = [
    { label: 'Photo uploaded', done: !!profile?.photoUrl },
    { label: 'Contact details', done: !!phone && phone !== 'N/A' && !!email && email !== 'N/A' },
    { label: 'Education added', done: educationList.length > 0 },
    { label: 'Experience added', done: experienceList.length > 0 },
    { label: 'Skills added', done: skillsList.length >= 3 },
  ];
  const profileStrength = Math.round((strengthItems.filter(i => i.done).length / strengthItems.length) * 100);

  return (
    <div className="px-5 pb-5 pt-0 border-t border-gray-100 animate-fade-in">
      <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contact Info & Notes */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400">Contact &amp; Documents</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Phone size={13} className="text-cyan-400" />
                <span className="text-gray-700 font-bold">{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Mail size={13} className="text-cyan-400" />
                <span className="text-gray-700 truncate">{email}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Candidate Assets</p>
                {profile?.resumes?.[0]?.url && (
                  <a href={profile.resumes[0].url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-cyan-600 font-bold hover:underline">
                    <ExternalLink size={12} /> View Resume ({profile.resumes[0].name || 'PDF'})
                  </a>
                )}
                <Link href={`/portfolio/seeker/${seekerId}`} target="_blank" className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold hover:underline">
                  <ExternalLink size={12} /> View ID Card &amp; Portfolio
                </Link>
              </div>

              {/* Direct Instant Chat Button */}
              <div className="pt-2">
                <Link
                  href={`/employer/messages?convId=conv_${applicationId}`}
                  className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Mail size={14} /> Message Applicant Directly
                </Link>
              </div>
            </div>
          </div>

          {/* Employer Notes */}
          <div className="glass-card rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Employer Notes</h4>
            <textarea
              className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none resize-none"
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
              <p className="text-xs text-gray-500 italic">No experience documented</p>
            ) : (
              <div className="space-y-3">
                {experienceList.map((exp: any, i: number) => (
                  <div key={i} className="text-xs border-l-2 border-violet-200 pl-2">
                    <p className="font-semibold text-gray-900">{exp.role}</p>
                    <p className="text-gray-400">{exp.company} ({exp.startDate} - {exp.endDate})</p>
                    {exp.description && <p className="text-gray-500 text-[10px] mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <GraduationCap size={12} className="text-emerald-400" /> Education
            </h4>
            {educationList.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No education documented</p>
            ) : (
              <div className="space-y-3">
                {educationList.map((edu: any, i: number) => (
                  <div key={i} className="text-xs border-l-2 border-emerald-200 pl-2">
                    <p className="font-semibold text-gray-900">{edu.degree} {edu.field && `in ${edu.field}`}</p>
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
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                  style={{ width: `${profileStrength}%` }}
                />
              </div>
              <span className="text-xs font-bold text-cyan-400">{profileStrength}%</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {skillsList.map((s: string) => (
                <span key={s} className="px-1.5 py-0.5 rounded bg-white text-[9px] text-gray-400 border border-gray-100">
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
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-100 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-all"
                >
                  <Calendar size={14} />
                  Schedule Interview
                </button>
              ) : (
                <form onSubmit={handleScheduleInterview} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
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
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Time</label>
                    <input
                      type="time"
                      required
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Mode</label>
                    <select
                      value={interviewMode}
                      onChange={(e) => setInterviewMode(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
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
          actionUrl: '/seeker/applications' });
      }
    } catch (err) {
      console.error('Update status error:', err);
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
    rejected: applications.filter((c) => c.status === 'rejected').length };

  const jobOptions = ['All Jobs', ...Array.from(new Set(applications.map((a: any) => a.jobTitle).filter(Boolean)))];

  const filtered = applications.filter((c) => {
    const candidateStatus = c.status || 'applied';
    if (pipelineTab !== 'all' && candidateStatus !== pipelineTab) return false;
    if (search && !c.seekerName.toLowerCase().includes(search.toLowerCase())) return false;
    if (jobFilter !== 'All Jobs' && c.jobTitle !== jobFilter) return false;
    return true;
  });

  const loading = companyLoading || appsLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit">
        <Users2 size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">No Company Profile</h2>
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
        <h1 className="text-2xl font-bold text-gray-900 font-outfit">Candidate Management</h1>
        <p className="text-sm text-slate-500 mt-1">Track and manage your recruitment pipeline</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading candidate applications...</p>
        </div>
      ) : (
        <>
          {/* Pipeline Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-white/[0.03] rounded-xl p-1 border border-gray-100">
            {PIPELINE_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setPipelineTab(t.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  pipelineTab === t.value
                    ? 'bg-cyan-500/15 text-cyan-300 border border-blue-200'
                    : 'text-gray-400 hover:text-white hover:bg-white'
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:border-blue-500 outline-none transition-all"
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
                          <span className="text-xs font-bold text-gray-900">{getInitials(candidate.seekerName)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{candidate.seekerName || 'Candidate'}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${status.bg} ${status.text}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
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
                          <Loader2 size={16} className="text-blue-600 animate-spin" />
                        ) : (
                          <>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                              className="p-2 rounded-lg bg-white text-gray-400 hover:bg-white/[0.08] hover:text-white transition-all"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            {candidate.resumeUrl && candidate.resumeUrl !== '#' && (
                              <a
                                href={candidate.resumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-blue-100 text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center justify-center"
                                title="Download Resume"
                              >
                                <Download size={14} />
                              </a>
                            )}
                            {candidate.status !== 'shortlisted' && candidate.status !== 'selected' && (
                              <button
                                onClick={() => handleUpdateStatus(candidate.id, 'shortlisted', candidate.seekerId, candidate.jobTitle)}
                                className="p-2 rounded-lg bg-emerald-100 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                title="Shortlist"
                              >
                                <CheckCircle size={14} />
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
                                className="p-2 rounded-lg bg-red-100 text-rose-400 hover:bg-rose-500/20 transition-all"
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
                      seekerId={candidate.seekerId}
                      applicationId={candidate.id}
                      currentStatus={candidate.status || 'applied'}
                      initialNotes={candidate.employerNote}
                      companyId={companyId}
                      companyName={company?.name || 'Company'}
                      jobId={candidate.jobId}
                      jobTitle={candidate.jobTitle}
                      seekerName={candidate.seekerName}
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
