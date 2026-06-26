'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Users2, Search, Eye, Download, CheckCircle, XCircle,
  Calendar, Clock, Briefcase, Table, Grid3X3, Lock, Sparkles,
  Star, X, Mail, Phone, ExternalLink, Loader2, Save, GraduationCap, MessageSquare,
  FileSpreadsheet, Filter, CheckSquare, Square, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { selectBestSubscription, planHasFeature } from '@/lib/subscriptions';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { updateApplicationStatus, createDocument, createNotification, startConversation } from '@/lib/firebase/firestoreService';
import { where, orderBy } from 'firebase/firestore';

type PipelineStatus = 'all' | 'applied' | 'under_review' | 'shortlisted' | 'walk_in_interview' | 'interview_scheduled' | 'interview_completed' | 'selected' | 'offer_sent' | 'joined' | 'rejected' | 'cancelled' | 'pending_review' | 'approved' | 'walk_in_attended' | 'interview_attended';

const PIPELINE_TABS: { label: string; value: PipelineStatus; color: string }[] = [
  { label: 'All', value: 'all', color: 'gray' },
  { label: 'Applied', value: 'applied', color: 'cyan' },
  { label: 'Under Review', value: 'under_review', color: 'indigo' },
  { label: 'Shortlisted', value: 'shortlisted', color: 'violet' },
  { label: 'Walk-In Interview', value: 'walk_in_interview', color: 'amber' },
  { label: 'Interview Scheduled', value: 'interview_scheduled', color: 'amber' },
  { label: 'Interview Completed', value: 'interview_completed', color: 'blue' },
  { label: 'Selected', value: 'selected', color: 'emerald' },
  { label: 'Offer Sent', value: 'offer_sent', color: 'violet' },
  { label: 'Joined', value: 'joined', color: 'emerald' },
  { label: 'Rejected', value: 'rejected', color: 'rose' },
  { label: 'Cancelled', value: 'cancelled', color: 'gray' },
];

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  applied: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'Applied' },
  under_review: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', label: 'Under Review' },
  shortlisted: { bg: 'bg-violet-500/10', text: 'text-violet-400', label: 'Shortlisted' },
  walk_in_interview: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Walk-In Interview' },
  interview_scheduled: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Interview Scheduled' },
  interview_completed: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Interview Completed' },
  selected: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Selected' },
  offer_sent: { bg: 'bg-violet-500/10', text: 'text-violet-400', label: 'Offer Sent' },
  joined: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Joined' },
  rejected: { bg: 'bg-rose-500/10', text: 'text-rose-400', label: 'Rejected' },
  cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Cancelled' },
  
  // Legacy mappings for backwards compatibility
  pending_review: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Under Review' },
  approved: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'Walk-In Approved' },
  interview_attended: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Interview Completed' },
  walk_in_attended: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', label: 'Interview Completed' },
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
  canContact,
  isLocked
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
  isLocked: boolean;
}) {
  const [savingNotes, setSavingNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(initialNotes || '');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Expanded Interview Form State
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewMode, setInterviewMode] = useState('Phone'); // Phone, Video, In-Person
  const [interviewLocation, setInterviewLocation] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewerContact, setInterviewerContact] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const seekerId = application?.seekerId || application?.applicantId || '';
  const { data: seekerProfile } = useDocument<any>('seekerProfiles', canContact && seekerId ? seekerId : null);

  const handleDropdownStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await updateApplicationStatus(applicationId, newStatus);
      onStatusUpdated(newStatus);
      
      // Notify candidate
      let notifyMessage = '';
      if (newStatus === 'under_review') {
        notifyMessage = `Your application for "${jobTitle}" is now under review by the hiring manager.`;
      } else if (newStatus === 'shortlisted') {
        notifyMessage = `Congratulations! You have been shortlisted for "${jobTitle}".`;
      } else if (newStatus === 'walk_in_interview') {
        notifyMessage = `You are invited to a Walk-In Interview for "${jobTitle}".`;
      } else if (newStatus === 'interview_scheduled') {
        notifyMessage = `An interview has been scheduled for "${jobTitle}". Check details in the interviews section.`;
      } else if (newStatus === 'interview_completed') {
        notifyMessage = `Your interview for "${jobTitle}" has been completed. We will update you soon.`;
      } else if (newStatus === 'selected') {
        notifyMessage = `Great news! You have been selected for "${jobTitle}". Congratulations!`;
      } else if (newStatus === 'offer_sent') {
        notifyMessage = `An official job offer has been sent to you for "${jobTitle}".`;
      } else if (newStatus === 'joined') {
        notifyMessage = `Welcome aboard! Your status is updated to Joined for "${jobTitle}".`;
      } else if (newStatus === 'rejected') {
        notifyMessage = `Thank you for your interest in "${jobTitle}". Unfortunately, the company has decided to move forward with other candidates.`;
      } else if (newStatus === 'cancelled') {
        notifyMessage = `Your application process for "${jobTitle}" has been cancelled.`;
      }

      if (notifyMessage) {
        await createNotification({
          userId: seekerId,
          type: 'application_update',
          title: `Application Update: ${statusConfig[newStatus]?.label || newStatus.toUpperCase()}!`,
          message: notifyMessage,
          actionUrl: '/seeker/applications',
        });
      }
      alert('Status updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

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
      const interviewData = {
        companyId,
        companyName,
        seekerId,
        seekerName,
        jobId,
        jobTitle,
        date: interviewDate,
        time: interviewTime,
        mode: interviewMode,
        location: interviewLocation,
        googleMapsLink,
        meetingLink,
        interviewerName,
        interviewerContact,
        notes: additionalInstructions,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };
      
      await createDocument('interviews', interviewData);

      // Update Application status
      const updateMsg = `Interview scheduled on ${interviewDate} at ${interviewTime} (${interviewMode}).`;
      await updateApplicationStatus(applicationId, 'interview_scheduled', updateMsg);
      onStatusUpdated('interview_scheduled');

      // Create seeker notification
      let detailsMessage = `An interview has been scheduled for "${jobTitle}" on ${interviewDate} at ${interviewTime} via ${interviewMode}.`;
      if (interviewerName) detailsMessage += ` Interviewer: ${interviewerName}.`;
      
      await createNotification({
        userId: seekerId,
        type: 'interview',
        title: 'Interview Scheduled! 📅',
        message: detailsMessage,
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

  const email = application?.seekerEmail || application?.email || seekerProfile?.email || 'N/A';
  const phone = application?.seekerPhone || application?.phone || seekerProfile?.phone || 'N/A';
  
  const rawExperience = Array.isArray(seekerProfile?.experience) && seekerProfile.experience.length > 0 
    ? seekerProfile.experience 
    : application?.experience;
  const experienceList = Array.isArray(rawExperience) ? rawExperience : [];
  
  const rawEducation = Array.isArray(seekerProfile?.education) && seekerProfile.education.length > 0 
    ? seekerProfile.education 
    : application?.education;
  const educationList = Array.isArray(rawEducation) ? rawEducation : [];
  
  const rawSkills = Array.isArray(seekerProfile?.skills) && seekerProfile.skills.length > 0 
    ? seekerProfile.skills 
    : application?.skills;
  const skillsList = Array.isArray(rawSkills) ? rawSkills : [];
  
  const district = application?.district || application?.location || seekerProfile?.district || 'Not available';
  
  const rawPortfolio = Array.isArray(seekerProfile?.portfolio) && seekerProfile.portfolio.length > 0
    ? seekerProfile.portfolio
    : Array.isArray(seekerProfile?.portfolioLinks) && seekerProfile.portfolioLinks.length > 0
      ? seekerProfile.portfolioLinks
      : application?.portfolio;
  const portfolioLinks = Array.isArray(rawPortfolio) ? (rawPortfolio as string[]) : [];
  
  const walkIn = application?.walkIn || {};
  const aboutMe = application?.aboutMe || seekerProfile?.aboutMe || seekerProfile?.summary || '';
  const panelInitials = seekerName ? seekerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'C';
  const cleanPhone = phone.replace(/\D/g, '');
  const whatsappNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  // Calculate profile strength
  const strengthItems = [
    { label: 'Photo uploaded', done: !!application?.photoUrl },
    { label: 'Contact details', done: !!phone && phone !== 'N/A' && !!email && email !== 'N/A' },
    { label: 'Education added', done: educationList.length > 0 },
    { label: 'Experience added', done: experienceList.length > 0 },
    { label: 'Skills added', done: skillsList.length >= 3 },
  ];
  const profileStrength = Math.round((strengthItems.filter(i => i.done).length / strengthItems.length) * 100);

  // If candidate is locked due to plan quota limits
  if (isLocked) {
    return (
      <div className="px-5 pb-8 pt-6 border-t border-white/[0.06] bg-black/40 text-center relative overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a]/50 to-indigo-950/20 blur-md -z-10" />
        <div className="max-w-md mx-auto space-y-4 py-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Unlock Candidate Details</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              You have reached the free viewing limit for candidate applications. Upgrade to a standard or premium subscription plan to access full resumes, contact details, and lead management.
            </p>
          </div>
          <Link
            href="/employer/subscription"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
          >
            <Sparkles size={13} className="text-amber-300" /> View Upgrade Options
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5 pt-0 border-t border-white/[0.06] bg-white/[0.01] animate-fade-in">
      <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* ================= COLUMN 1: PERSONAL & CONTACT ================= */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/5 pb-2">Personal Details</h4>
            
            {canContact ? (
              <div className="space-y-2.5 text-xs">
                {/* Profile Photo Header */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {application?.photoUrl ? (
                      <img 
                        src={application.photoUrl} 
                        alt={seekerName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-white">{panelInitials}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-white truncate">{seekerName}</h5>
                    <p className="text-[10px] text-gray-400 truncate">{application?.currentRole || 'Job Seeker'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                  <span className="text-gray-500">Full Name</span>
                  <span className="text-white font-bold">{seekerName}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                  <span className="text-gray-500">Gender</span>
                  <span className="text-gray-300 font-semibold">{application?.seekerGender || application?.gender || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                  <span className="text-gray-500">Date of Birth</span>
                  <span className="text-gray-300 font-semibold">{application?.seekerDob || application?.dob || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                  <span className="text-gray-500">Applied Date</span>
                  <span className="text-gray-300 font-semibold">
                    {application?.appliedDate 
                      ? new Date(application.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : application?.createdAt 
                        ? new Date(application.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Recently'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.02] gap-2">
                  <span className="text-gray-500">Status</span>
                  {updatingStatus ? (
                    <Loader2 size={12} className="text-cyan-400 animate-spin" />
                  ) : (
                    <select
                      value={currentStatus}
                      onChange={(e) => handleDropdownStatusChange(e.target.value)}
                      className="bg-[#111124] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-cyan-500/40"
                    >
                      <option value="applied">Applied</option>
                      <option value="under_review">Under Review</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="walk_in_interview">Walk-In Interview</option>
                      <option value="interview_scheduled">Interview Scheduled</option>
                      <option value="interview_completed">Interview Completed</option>
                      <option value="selected">Selected</option>
                      <option value="offer_sent">Offer Sent</option>
                      <option value="joined">Joined</option>
                      <option value="rejected">Rejected</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  )}
                </div>
                
                <div className="flex items-center gap-2.5 py-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  <Phone size={13} />
                  <a href={`tel:${phone}`} className="font-semibold font-mono">{phone}</a>
                </div>
                <div className="flex items-center gap-2.5 py-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  <Mail size={13} />
                  <a href={`mailto:${email}`} className="truncate font-semibold">{email}</a>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5 mt-1">
                  <span className="text-gray-500">Location</span>
                  <span className="text-gray-300 truncate font-semibold">{district}</span>
                </div>

                {/* Quick Contact Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5">
                  <a
                    href={`tel:${phone}`}
                    className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold transition-all text-center"
                  >
                    <Phone size={14} />
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello ${seekerName}, I am contacting you regarding your application for "${jobTitle}" on THENIJOBS.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-all text-center"
                  >
                    <MessageSquare size={14} />
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent(`Regarding your application for ${jobTitle}`)}`}
                    className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold transition-all text-center"
                  >
                    <Mail size={14} />
                    Email
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Blurred Profile Photo Header */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0 blur-[2px] select-none">
                    {application?.photoUrl ? (
                      <img 
                        src={application.photoUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-white">C</span>
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white blur-[2.5px] select-none">••••••••</h5>
                    <p className="text-[10px] text-gray-400">Job Seeker</p>
                  </div>
                </div>

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

          {aboutMe && (
            <div className="glass-card rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/5 pb-2">About Candidate</h4>
              <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{aboutMe}</p>
            </div>
          )}

          {/* Employer Review Notes */}
          <div className="glass-card rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/5 pb-2 mb-2">Internal HR Notes</h4>
            <textarea
              className="w-full bg-[#111124] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/40 focus:outline-none resize-none"
              rows={3}
              placeholder="Record interview notes, internal feedback, etc..."
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save Notes
            </button>
          </div>
        </div>

        {/* ================= COLUMN 2: EDUCATION & EXPERIENCE ================= */}
        <div className="glass-card rounded-xl p-4 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/5 pb-2 mb-2 flex items-center gap-1.5">
              <Briefcase size={12} className="text-violet-400" /> Work History
            </h4>
            {experienceList.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">No experience shared.</p>
            ) : (
              <div className="space-y-3">
                {experienceList.map((exp: any, i: number) => (
                  <div key={i} className="text-xs border-l-2 border-violet-500/20 pl-3 py-0.5">
                    <p className="font-semibold text-white">{exp.role}</p>
                    <p className="text-gray-400 text-[11px] mt-0.5">{exp.company} ({exp.startDate} - {exp.endDate})</p>
                    {exp.description && <p className="text-gray-500 text-[10px] mt-1 leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/[0.06]">
            <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/5 pb-2 mb-2 flex items-center gap-1.5">
              <GraduationCap size={12} className="text-emerald-400" /> Education Background
            </h4>
            {educationList.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">No education details shared.</p>
            ) : (
              <div className="space-y-3">
                {educationList.map((edu: any, i: number) => (
                  <div key={i} className="text-xs border-l-2 border-emerald-500/20 pl-3 py-0.5">
                    <p className="font-semibold text-white">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                    <p className="text-gray-400 text-[11px] mt-0.5">{edu.institution} (Class of {edu.year})</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="pt-3 border-t border-white/[0.06] space-y-3">
            <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/5 pb-2 mb-2 flex items-center gap-1.5">
              <Clock size={12} className="text-cyan-400" /> Activity Timeline
            </h4>
            <div className="space-y-3 pl-1 pt-1">
              {Array.isArray(application.statusHistory) && application.statusHistory.length > 0 ? (
                application.statusHistory.map((historyItem: any, idx: number) => {
                  const itemConfig = statusConfig[historyItem.status] || { label: historyItem.status, text: 'text-gray-400', bg: 'bg-gray-500/10' };
                  return (
                    <div key={idx} className="flex gap-2.5 text-xs">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${itemConfig.text.replace('text-', 'bg-')} shrink-0 mt-1`} />
                        {idx < application.statusHistory.length - 1 && <div className="w-0.5 bg-white/10 grow mt-1 mb-1" />}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-semibold text-white">{itemConfig.label}</p>
                        <p className="text-[9px] text-gray-500">
                          {new Date(historyItem.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {historyItem.note && <p className="text-[10px] text-gray-400 italic">{historyItem.note}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex gap-2.5 text-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">Applied</p>
                    <p className="text-[9px] text-gray-500">
                      {application?.appliedDate 
                        ? new Date(application.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : 'Recently'}
                    </p>
                    <p className="text-[10px] text-gray-400 italic">Application submitted.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= COLUMN 3: DOCUMENTS, PORTFOLIO & INTERVIEW ================= */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase border-b border-white/5 pb-2">Documents & Portfolios</h4>
            
            {/* Expected Salary */}
            <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
              <span className="text-gray-500">Expected Salary</span>
              <span className="text-emerald-400 font-bold">{application?.expectedSalary ? `₹${application.expectedSalary} / mo` : 'Negotiable'}</span>
            </div>

            {/* Resume Embed & Download */}
            {application.resumeUrl && application.resumeUrl !== '#' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">Candidate Resume</span>
                  <div className="flex gap-2">
                    <a
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-bold"
                    >
                      <Download size={12} /> Download
                    </a>
                    <button
                      onClick={() => {
                        const win = window.open(application.resumeUrl, '_blank');
                        if (win) win.print();
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] font-bold"
                    >
                      Print
                    </button>
                  </div>
                </div>
                <div className="w-full h-64 rounded-xl overflow-hidden border border-white/10 bg-[#0d0d1b]">
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(application.resumeUrl)}&embedded=true`}
                    className="w-full h-full border-0"
                    title="Resume PDF Viewer"
                  />
                </div>
              </div>
            )}

            {/* Portfolio Integration */}
            {application.website && (
              <div className="space-y-2 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">Portfolio Website</span>
                  <a
                    href={application.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    Open <ExternalLink size={10} />
                  </a>
                </div>
                <p className="text-[10px] text-gray-500 truncate">{application.website}</p>
                <div className="w-full h-40 rounded-xl overflow-hidden border border-white/10 bg-[#0d0d1b] relative group">
                  <iframe
                    src={application.website}
                    className="w-full h-full border-0 pointer-events-none opacity-80"
                    title="Portfolio Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                    <span className="text-[9px] text-gray-400">Live Website Preview</span>
                  </div>
                </div>
              </div>
            )}

            {/* LinkedIn & Other Portfolio links */}
            <div className="space-y-1.5 pt-2">
              {application.linkedin && (
                <a href={application.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[11px] text-cyan-400 hover:underline py-0.5">
                  <ExternalLink size={11} /> LinkedIn Profile
                </a>
              )}
              {portfolioLinks.filter(p => p !== application.linkedin && p !== application.website).map((link: string, i: number) => (
                <a key={i} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[11px] text-gray-400 hover:underline py-0.5">
                  <ExternalLink size={11} /> Link {i + 1}: {link.replace(/^https?:\/\/(www\.)?/, '').slice(0, 25)}...
                </a>
              ))}
            </div>

            {/* Digital ID & QR Code Verification */}
            {seekerId && (
              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-indigo-400" />
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">ID Card & Verification</span>
                </div>
                
                <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl">
                  {/* Basic Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-bold text-white truncate">{seekerName}</p>
                    <p className="text-[10px] text-gray-400 truncate">{application?.currentRole || seekerProfile?.currentRole || 'Job Seeker'}</p>
                    <span className="inline-block text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mt-1">
                      {seekerProfile?.candidateId || `TNI-${seekerId.slice(0, 8).toUpperCase()}`}
                    </span>
                  </div>
                  
                  {/* QR Code Verification */}
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        typeof window !== 'undefined' 
                          ? `${window.location.origin}/id?uid=${seekerId}` 
                          : `https://thenijobs.web.app/id?uid=${seekerId}`
                      )}`} 
                      alt="Candidate QR Code" 
                      className="w-16 h-16 rounded border border-white/10 bg-white p-0.5" 
                    />
                    <span className="text-[8px] text-gray-500 font-mono">Scan Profile</span>
                  </div>
                </div>
                
                <a
                  href={`/id?uid=${seekerId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/25 hover:bg-indigo-600/20 text-indigo-400 text-xs font-bold transition-all"
                >
                  <ExternalLink size={12} /> View Digital ID Card
                </a>
              </div>
            )}
          </div>

          {/* Profile Strength & Skills */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Profile Completeness</span>
              <span className="text-xs font-bold text-cyan-400">{profileStrength}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                style={{ width: `${profileStrength}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {skillsList.map((s: string) => (
                <span key={s} className="px-2 py-0.5 rounded bg-white/[0.04] text-[9px] text-gray-400 border border-white/[0.06]">
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
                <form onSubmit={handleScheduleInterview} className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-1">
                    <span className="text-xs font-semibold text-amber-400">Schedule Interview</span>
                    <button type="button" onClick={() => setShowScheduleForm(false)} className="text-gray-500 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5">Date</label>
                      <input
                        type="date"
                        required
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full bg-[#111124] border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5">Time</label>
                      <input
                        type="time"
                        required
                        value={interviewTime}
                        onChange={(e) => setInterviewTime(e.target.value)}
                        className="w-full bg-[#111124] border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 mb-0.5">Interview Type</label>
                    <select
                      value={interviewMode}
                      onChange={(e) => setInterviewMode(e.target.value)}
                      className="w-full bg-[#111124] border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    >
                      <option value="Phone">Phone Call</option>
                      <option value="Video">Online Video (Google Meet / Zoom)</option>
                      <option value="In-Person">Walk-in / In-Person Interview</option>
                    </select>
                  </div>

                  {interviewMode === 'In-Person' && (
                    <>
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-0.5">Location Address</label>
                        <input
                          type="text"
                          placeholder="e.g. 123 Office Road, Theni"
                          value={interviewLocation}
                          onChange={(e) => setInterviewLocation(e.target.value)}
                          className="w-full bg-[#111124] border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-0.5">Google Maps Link (Optional)</label>
                        <input
                          type="url"
                          placeholder="https://maps.app.goo.gl/..."
                          value={googleMapsLink}
                          onChange={(e) => setGoogleMapsLink(e.target.value)}
                          className="w-full bg-[#111124] border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                        />
                      </div>
                    </>
                  )}

                  {interviewMode === 'Video' && (
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5">Meeting URL (Optional)</label>
                      <input
                        type="url"
                        placeholder="https://meet.google.com/..."
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        className="w-full bg-[#111124] border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5">Interviewer Name</label>
                      <input
                        type="text"
                        placeholder="HR Manager"
                        value={interviewerName}
                        onChange={(e) => setInterviewerName(e.target.value)}
                        className="w-full bg-[#111124] border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5">Interviewer Contact</label>
                      <input
                        type="tel"
                        placeholder="Mobile Number"
                        value={interviewerContact}
                        onChange={(e) => setInterviewerContact(e.target.value)}
                        className="w-full bg-[#111124] border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 mb-0.5">Instructions / Notes</label>
                    <textarea
                      placeholder="e.g. Please bring original certificates..."
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      rows={2}
                      className="w-full bg-[#111124] border border-white/10 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={scheduling}
                    className="w-full py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-colors disabled:opacity-50 mt-1"
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
  const { data: rawApplications, loading: appsLoading } = useCollection<any>('jobApplications', [
    where('employerId', '==', companyId || ''),
    orderBy('appliedDate', 'desc')
  ], { skip: !companyId });

  const applications = useMemo(() => {
    return rawApplications.map(app => ({
      ...app,
      seekerName: app.applicantData?.name || 'Job Seeker',
      seekerEmail: app.applicantData?.email || '',
      seekerPhone: app.applicantData?.phone || '',
      seekerGender: app.applicantData?.gender || 'Male',
      seekerDob: app.applicantData?.dob || '',
      photoUrl: app.applicantData?.photoUrl || '',
      district: app.applicantData?.district || '',
      location: app.applicantData?.district || '',
      currentRole: app.applicantData?.currentRole || '',
      education: app.qualificationData || [],
      experience: app.experience || [],
      skills: app.skills || [],
      portfolio: app.portfolioData?.portfolio || [],
      resumeUrl: app.portfolioData?.resumeUrl || '',
      resumeName: app.portfolioData?.resumeName || '',
      linkedin: app.portfolioData?.linkedin || '',
      website: app.portfolioData?.website || '',
      createdAt: app.appliedDate || app.createdAt
    }));
  }, [rawApplications]);

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

  // New features states: viewMode, checkboxes, qualification & experience filters
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qualificationFilter, setQualificationFilter] = useState('All');
  const [experienceFilter, setExperienceFilter] = useState('All');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const appId = params.get('appId') || params.get('applicationId');
      if (appId) {
        setExpandedId(appId);
      }
    }
  }, [applications]);

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

  // CSV Export Method
  const handleExportCSV = (mode: 'all' | 'selected' | 'filtered') => {
    if (activePlan === 'free') {
      alert('CSV Export is a Standard and Premium plan feature. Please upgrade your subscription.');
      return;
    }
    
    let targetList = [];
    if (mode === 'all') {
      targetList = applications;
    } else if (mode === 'filtered') {
      targetList = filtered;
    } else if (mode === 'selected') {
      targetList = applications.filter((a: any) => selectedIds.includes(a.id));
      if (targetList.length === 0) {
        alert('Please select at least one candidate checkbox to export.');
        return;
      }
    }

    if (targetList.length === 0) {
      alert('No data found to export.');
      return;
    }

    const headers = [
      'Applicant Name', 'Mobile Number', 'Email', 'Qualification', 'Experience',
      'Skills', 'Resume Link', 'Digital ID Card Link', 'Profile Link', 'Applied Date',
      'Application Status'
    ];

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://thenijobs.in';

    const rows = targetList.map((app: any) => {
      const expStr = Array.isArray(app.experience) 
        ? app.experience.map((e: any) => `${e.role} at ${e.company} (${e.startDate}-${e.endDate})`).join('; ') 
        : '';
      const eduStr = Array.isArray(app.education) 
        ? app.education.map((e: any) => `${e.degree} in ${e.field} from ${e.institution} (${e.year})`).join('; ') 
        : '';
      const skillsStr = Array.isArray(app.skills) ? app.skills.join(', ') : '';
      const seekerId = app.seekerId || app.applicantId || '';

      return [
        app.seekerName || '',
        app.seekerPhone || app.phone || '',
        app.seekerEmail || app.email || '',
        eduStr || 'Not shared',
        expStr || 'Fresher',
        skillsStr || '',
        app.resumeUrl || '',
        seekerId ? `${baseUrl}/id?uid=${seekerId}` : '',
        seekerId ? `${baseUrl}/profile/${seekerId}` : '',
        app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN') : '',
        app.status || 'applied'
      ].map(val => `"${String(val).replace(/"/g, '""')}"`); // Escape quotes and wrap
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `THENIJOBS_Candidates_${mode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = (mode: 'all' | 'selected' | 'filtered') => {
    if (activePlan === 'free') {
      alert('Excel Export is a Standard and Premium plan feature. Please upgrade your subscription.');
      return;
    }
    
    let targetList = [];
    if (mode === 'all') {
      targetList = applications;
    } else if (mode === 'filtered') {
      targetList = filtered;
    } else if (mode === 'selected') {
      targetList = applications.filter((a: any) => selectedIds.includes(a.id));
      if (targetList.length === 0) {
        alert('Please select at least one candidate checkbox to export.');
        return;
      }
    }

    if (targetList.length === 0) {
      alert('No data found to export.');
      return;
    }

    const headers = [
      'Applicant Name', 'Mobile Number', 'Email', 'Qualification', 'Experience',
      'Skills', 'Resume Link', 'Digital ID Card Link', 'Profile Link', 'Applied Date',
      'Application Status'
    ];

    const escapeXml = (unsafe: any) => {
      const str = unsafe === null || unsafe === undefined ? '' : String(unsafe);
      return str.replace(/[<>&'"]/g, (c: string) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    let xmlRows = '';
    
    // Header Row
    xmlRows += '   <Row ss:Height="20">\n';
    headers.forEach(h => {
      xmlRows += `    <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\n`;
    });
    xmlRows += '   </Row>\n';

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://thenijobs.in';

    // Data Rows
    targetList.forEach((app: any) => {
      const expStr = Array.isArray(app.experience) 
        ? app.experience.map((e: any) => `${e.role} at ${e.company} (${e.startDate}-${e.endDate})`).join('; ') 
        : '';
      const eduStr = Array.isArray(app.education) 
        ? app.education.map((e: any) => `${e.degree} in ${e.field} from ${e.institution} (${e.year})`).join('; ') 
        : '';
      const skillsStr = Array.isArray(app.skills) ? app.skills.join(', ') : '';
      const seekerId = app.seekerId || app.applicantId || '';

      const cells = [
        app.seekerName || '',
        app.seekerPhone || app.phone || '',
        app.seekerEmail || app.email || '',
        eduStr || 'Not shared',
        expStr || 'Fresher',
        skillsStr || '',
        app.resumeUrl || '',
        seekerId ? `${baseUrl}/id?uid=${seekerId}` : '',
        seekerId ? `${baseUrl}/profile/${seekerId}` : '',
        app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN') : '',
        app.status || 'applied'
      ];

      xmlRows += '   <Row>\n';
      cells.forEach(c => {
        xmlRows += `    <Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>\n`;
      });
      xmlRows += '   </Row>\n';
    });

    const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:desktop"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#7c3aed" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Candidates">
  <Table>
${xmlRows}  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `THENIJOBS_Candidates_${mode}_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Filtering Candidate Logic including advanced degree & experience filters
  const filtered = useMemo(() => {
    return applications.filter((c) => {
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
      
      // Advanced Filter: Degree / Qualification
      if (qualificationFilter !== 'All') {
        const matchesEdu = Array.isArray(c.education) && c.education.some((edu: any) => 
          (edu.degree || '').toLowerCase().includes(qualificationFilter.toLowerCase())
        );
        if (!matchesEdu) return false;
      }

      // Advanced Filter: Experience
      if (experienceFilter !== 'All') {
        const expCount = Array.isArray(c.experience) ? c.experience.length : 0;
        if (experienceFilter === 'Fresher' && expCount > 0) return false;
        if (experienceFilter === 'Experienced' && expCount === 0) return false;
      }

      return true;
    });
  }, [applications, pipelineTab, search, jobFilter, qualificationFilter, experienceFilter]);

  const toggleSelectCandidate = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = () => {
    const allFilteredIds = filtered.map(c => c.id);
    const areAllSelected = allFilteredIds.every(id => selectedIds.includes(id));
    
    if (areAllSelected) {
      // Unselect all filtered
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Select all filtered
      setSelectedIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  // Helper function to check if a candidate index is locked based on plan limits
  const isCandidateLocked = (candidateId: string) => {
    if (activePlan === 'premium' || activePlan === 'admin') return false;
    const index = applications.findIndex((app: any) => app.id === candidateId);
    if (activePlan === 'standard' && index >= 15) return true;
    if ((activePlan === 'free' || !activePlan) && index >= 3) return true;
    return false;
  };

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
      
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Candidate Lead Pipeline</h1>
          <p className="text-sm text-gray-400 mt-1">Manage applications, search qualified leads, and export HR data</p>
        </div>

        {/* View Mode Toggle & Excel Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grid/Table Toggle */}
          <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'pipeline' ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
              title="Pipeline Board View"
            >
              <Grid3X3 size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
              title="HR Lead Table View"
            >
              <Table size={15} />
            </button>
          </div>

          {/* Excel Export dropdown trigger buttons */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => handleExportExcel('all')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/30 text-xs font-semibold text-gray-300 hover:text-emerald-400 transition-all"
            >
              <FileSpreadsheet size={13} /> Export All
            </button>
            <button
              onClick={() => handleExportExcel('filtered')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/30 text-xs font-semibold text-gray-300 hover:text-emerald-400 transition-all"
            >
              <FileSpreadsheet size={13} /> Export Filtered
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={() => handleExportExcel('selected')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all"
              >
                <CheckSquare size={13} /> Export Selected ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading candidate applications...</p>
        </div>
      ) : (
        <>
          {/* ================= PIPELINE TABS ================= */}
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

          {/* ================= ADVANCED FILTER BAR ================= */}
          <div className="glass-card rounded-2xl p-4 border border-white/[0.05] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, phone, skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
              />
            </div>

            {/* Position filter */}
            <div className="flex items-center gap-2">
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0d0d1b] border border-white/[0.08] text-xs text-white focus:border-cyan-500/40 outline-none"
              >
                {jobOptions.map((j) => (
                  <option key={j} value={j}>{j === 'All Jobs' ? 'All Job Posts' : j}</option>
                ))}
              </select>
            </div>

            {/* Degree/Qualification Filter */}
            <div className="flex items-center gap-2">
              <Filter size={12} className="text-gray-500 shrink-0" />
              <select
                value={qualificationFilter}
                onChange={(e) => setQualificationFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0d0d1b] border border-white/[0.08] text-xs text-white focus:border-cyan-500/40 outline-none"
              >
                <option value="All">All Degrees</option>
                <option value="10th">10th Standard</option>
                <option value="12th">12th Standard</option>
                <option value="Diploma">Diploma Courses</option>
                <option value="Degree">Any Degree</option>
                <option value="B.E">B.E / B.Tech</option>
                <option value="MBA">MBA / Business</option>
                <option value="Post Graduate">Post Graduate</option>
              </select>
            </div>

            {/* Experience Filter */}
            <div className="flex items-center gap-2">
              <Briefcase size={12} className="text-gray-500 shrink-0" />
              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0d0d1b] border border-white/[0.08] text-xs text-white focus:border-cyan-500/40 outline-none"
              >
                <option value="All">All Experience</option>
                <option value="Fresher">Freshers Only</option>
                <option value="Experienced">Experienced Candidates</option>
              </select>
            </div>
          </div>

          {/* ================= VIEW CONTAINER ================= */}
          {viewMode === 'pipeline' ? (
            /* PIPELINE BOARD VIEW */
            <div className="space-y-3">
              {filtered.map((candidate) => {
                const status = statusConfig[candidate.status || 'applied'] || statusConfig.applied;
                const isExpanded = expandedId === candidate.id;
                const isChecked = selectedIds.includes(candidate.id);
                const isLocked = isCandidateLocked(candidate.id);
                
                return (
                  <div
                    key={candidate.id}
                    className={`glass-card rounded-2xl overflow-hidden hover:border-white/12 transition-all ${isChecked ? 'border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]' : ''}`}
                  >
                    {/* Main Row */}
                    <div className="p-5 flex items-start gap-4">
                      {/* Checkbox Selection */}
                      <button 
                        onClick={() => toggleSelectCandidate(candidate.id)}
                        className="mt-3 text-gray-500 hover:text-cyan-400 transition-colors shrink-0"
                      >
                        {isChecked ? <CheckSquare size={16} className="text-cyan-400" /> : <Square size={16} />}
                      </button>

                      {/* Content Wrapper */}
                      <div className="flex-1 flex flex-col lg:flex-row lg:items-center gap-4 min-w-0">
                        {/* Avatar + Info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0 border border-white/5">
                            {candidate.photoUrl ? (
                              <img 
                                src={candidate.photoUrl} 
                                alt={candidate.seekerName} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-white">{getInitials(candidate.seekerName)}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-white truncate">{candidate.seekerName || 'Candidate'}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${status.bg} ${status.text}`}>
                                {status.label}
                              </span>
                              {candidate.applicationType === 'walk_in' && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                                  Walk-In
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-3 flex-wrap">
                              <span className="flex items-center gap-1"><Briefcase size={11} className="text-indigo-400" /> {candidate.jobTitle}</span>
                              <span className="flex items-center gap-1"><Clock size={11} className="text-indigo-400" /> Applied {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString('en-IN') : 'Recently'}</span>
                            </p>
                          </div>
                        </div>

                        {/* Card Row Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {actionLoading === candidate.id ? (
                            <Loader2 size={16} className="text-cyan-400 animate-spin" />
                          ) : (
                            <>
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                                className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white'}`}
                                title={isExpanded ? "Hide Details" : "View Full Profile Details"}
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
                                title="Open Message Chat"
                              >
                                {actionLoading === `message-${candidate.id}` ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                              </button>
                              
                              {/* Quick Shortlist/Reject Controls */}
                              {candidate.status !== 'shortlisted' && candidate.status !== 'selected' && !isLocked && (
                                <button
                                  onClick={() => handleUpdateStatus(candidate.id, 'shortlisted', candidate.seekerId, candidate.jobTitle)}
                                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                  title="Shortlist Seeker"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              {candidate.status !== 'selected' && !isLocked && (
                                <button
                                  onClick={() => handleUpdateStatus(candidate.id, 'selected', candidate.seekerId, candidate.jobTitle)}
                                  className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all"
                                  title="Hire Candidate"
                                >
                                  <Star size={14} />
                                </button>
                              )}
                              {candidate.status !== 'rejected' && !isLocked && (
                                <button
                                  onClick={() => handleUpdateStatus(candidate.id, 'rejected', candidate.seekerId, candidate.jobTitle)}
                                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"
                                  title="Reject Application"
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
                        isLocked={isLocked}
                        onNotesUpdated={(newNotes) => {
                          // Real-time listener handles state update
                        }}
                        onStatusUpdated={(newStatus) => {
                          setExpandedId(null);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* HR LEAD TABLE VIEW */
            <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-gray-300">
                  <thead>
                    <tr className="bg-white/[0.03] border-b border-white/[0.06] text-gray-400 uppercase tracking-wider font-semibold">
                      <th className="py-4 px-5 w-10">
                        <button onClick={toggleSelectAllFiltered} className="text-gray-500 hover:text-cyan-400 transition-colors">
                          <CheckSquare size={14} className={filtered.length > 0 && filtered.every(c => selectedIds.includes(c.id)) ? 'text-cyan-400' : ''} />
                        </button>
                      </th>
                      <th className="py-4 px-4">Applicant Name</th>
                      <th className="py-4 px-4">Position</th>
                      <th className="py-4 px-4">Phone Number</th>
                      <th className="py-4 px-4">Email</th>
                      <th className="py-4 px-4">Qualification</th>
                      <th className="py-4 px-4">Experience</th>
                      <th className="py-4 px-4">Applied Date</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filtered.map((candidate) => {
                      const status = statusConfig[candidate.status || 'applied'] || statusConfig.applied;
                      const isChecked = selectedIds.includes(candidate.id);
                      const isExpanded = expandedId === candidate.id;
                      const isLocked = isCandidateLocked(candidate.id);

                      const highestEdu = Array.isArray(candidate.education) && candidate.education.length > 0 ? candidate.education[0] : null;
                      const qualificationText = highestEdu ? `${highestEdu.degree} in ${highestEdu.field || 'General'}` : 'Not shared';
                      
                      const expCount = Array.isArray(candidate.experience) ? candidate.experience.length : 0;
                      const experienceText = expCount > 0 ? `${expCount} roles shared` : 'Fresher';

                      return (
                        <>
                          <tr 
                            key={candidate.id} 
                            className={`hover:bg-white/[0.02] transition-colors ${isChecked ? 'bg-cyan-500/[0.02]' : ''}`}
                          >
                            <td className="py-3 px-5">
                              <button 
                                onClick={() => toggleSelectCandidate(candidate.id)} 
                                className="text-gray-500 hover:text-cyan-400 transition-colors"
                              >
                                {isChecked ? <CheckSquare size={14} className="text-cyan-400" /> : <Square size={14} />}
                              </button>
                            </td>
                            <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{candidate.seekerName}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{candidate.jobTitle}</td>
                            <td className="py-3 px-4 whitespace-nowrap font-mono">{isLocked ? '••••••••••' : (candidate.seekerPhone || candidate.phone || 'N/A')}</td>
                            <td className="py-3 px-4 truncate max-w-[150px]">{isLocked ? '••••••••••' : (candidate.seekerEmail || candidate.email || 'N/A')}</td>
                            <td className="py-3 px-4 truncate max-w-[150px]">{qualificationText}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{experienceText}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString('en-IN') : 'Recently'}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${status.bg} ${status.text}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                                  className={`p-1.5 rounded-lg border ${isExpanded ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                  title="Toggle Detail View"
                                >
                                  <Eye size={12} />
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
                                  className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                                  title="Message Seeker"
                                >
                                  <MessageSquare size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Inline Details row inside table */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={10} className="bg-black/25">
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
                                  isLocked={isLocked}
                                  onNotesUpdated={(newNotes) => {
                                    // Real-time listener handles state update
                                  }}
                                  onStatusUpdated={(newStatus) => {
                                    setExpandedId(null);
                                  }}
                                />
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filtered.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center border border-white/[0.05]">
              <Users2 size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-semibold">No candidates match your search filters</p>
              <p className="text-xs text-gray-600 mt-1">Adjust search parameters or status tabs</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
