'use client';

import WorkflowPage, { type WorkflowItem, type WorkflowMetric, type WorkflowTab } from '@/components/portal/WorkflowPage';
import {
  Calendar,
  CheckCircle,
  Eye,
  MessageSquare,
  Send,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where, orderBy } from 'firebase/firestore';

const tabs: WorkflowTab[] = [
  { label: 'All', value: 'all' },
  { label: 'Applied', value: 'applied' },
  { label: 'Resume Viewed', value: 'resume_viewed' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Review', value: 'under_review' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Interview', value: 'interview_scheduled' },
  { label: 'Walk-In Attended', value: 'walk_in_attended' },
  { label: 'Selected', value: 'selected' },
  { label: 'Rejected', value: 'rejected' },
];

const statusConfig = {
  applied: { label: 'Applied', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  under_review: { label: 'Under Review', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  shortlisted: { label: 'Shortlisted', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  walk_in_interview: { label: 'Walk-In Interview', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  interview_scheduled: { label: 'Interview Scheduled', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  interview_completed: { label: 'Interview Completed', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  selected: { label: 'Selected', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  offer_sent: { label: 'Offer Sent', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  joined: { label: 'Joined', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { label: 'Rejected', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  
  // Legacy keys
  resume_viewed: { label: 'Resume Viewed', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  pending_review: { label: 'Under Review', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { label: 'Walk-In Approved', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  interview_attended: { label: 'Interview Completed', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  walk_in_attended: { label: 'Interview Completed', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
};

export default function SeekerApplicationsPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  // Fetch applications for current seeker
  const { data: rawApps, loading } = useCollection<any>('jobApplications', [
    where('applicantId', '==', uid || ''),
    orderBy('appliedDate', 'desc')
  ], { skip: !uid });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-white">
        <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading your applications...</p>
      </div>
    );
  }

  // Compute metrics from the live applications
  const metrics: WorkflowMetric[] = [
    {
      label: 'Applications',
      value: rawApps.length,
      description: 'Total jobs applied',
      icon: Send,
      color: 'emerald'
    },
    {
      label: 'Under Review',
      value: rawApps.filter(app => app.status === 'under_review' || app.status === 'pending_review').length,
      description: 'Employer is evaluating',
      icon: Eye,
      color: 'cyan'
    },
    {
      label: 'Interviews',
      value: rawApps.filter(app => app.status === 'interview_scheduled').length,
      description: 'Scheduled rounds',
      icon: Calendar,
      color: 'amber'
    },
    {
      label: 'Selected',
      value: rawApps.filter(app => app.status === 'selected').length,
      description: 'Offer pipeline',
      icon: CheckCircle,
      color: 'violet'
    },
  ];

  // Map to WorkflowItem format
  const applications: WorkflowItem[] = rawApps.map((app) => {
    let appliedDate = 'Recently';
    if (app.appliedDate) {
      try {
        const d = app.appliedDate.toDate ? app.appliedDate.toDate() : (app.appliedDate.seconds ? new Date(app.appliedDate.seconds * 1000) : new Date(app.appliedDate));
        if (!isNaN(d.getTime())) {
          appliedDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch (e) {
        console.error('Error formatting date:', e);
      }
    }

    // Timeline steps based on status history
    const getTimeline = (): any[] => {
      if (Array.isArray(app.statusHistory) && app.statusHistory.length > 0) {
        return app.statusHistory.map((h: any, i: number) => {
          const stepLabel = statusConfig[h.status as keyof typeof statusConfig]?.label || h.status.toUpperCase();
          const stepDate = h.updatedAt ? new Date(h.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
          return {
            label: stepLabel,
            detail: `${stepDate}${h.note ? ` - ${h.note}` : ''}`,
            state: i === app.statusHistory.length - 1 ? 'current' : 'done',
          };
        });
      }

      if (app.applicationType === 'walk_in') {
        return [
          { label: 'Submitted', detail: appliedDate, state: app.status === 'pending_review' ? 'current' : 'done' },
          { label: 'Approved', detail: app.status === 'approved' ? 'Ready for walk-in' : '', state: app.status === 'approved' ? 'current' : ['pending_review', 'rejected'].includes(app.status) ? 'next' : 'done' },
          { label: 'Attended', detail: app.status === 'interview_attended' ? 'Interview attended' : '', state: app.status === 'interview_attended' ? 'current' : ['pending_review', 'approved'].includes(app.status) ? 'next' : 'done' },
          { label: app.status === 'rejected' ? 'Rejected' : app.status === 'selected' ? 'Selected' : 'Decision', detail: app.status === 'selected' ? 'Selected' : '', state: (app.status === 'selected' || app.status === 'rejected') ? 'done' : 'next' }
        ];
      }

      const base = [
        { label: 'Applied', detail: appliedDate, state: app.status === 'applied' ? 'current' : 'done' },
        { label: 'Resume Viewed', detail: app.status === 'resume_viewed' ? 'Viewed by Employer' : '', state: app.status === 'resume_viewed' ? 'current' : app.status === 'applied' ? 'next' : 'done' },
        { label: 'Under Review', detail: app.status === 'under_review' ? 'Evaluating' : '', state: app.status === 'under_review' ? 'current' : ['applied', 'resume_viewed'].includes(app.status) ? 'next' : 'done' },
        { label: 'Shortlisted', detail: app.status === 'shortlisted' ? 'Shortlisted' : '', state: app.status === 'shortlisted' ? 'current' : ['applied', 'resume_viewed', 'under_review'].includes(app.status) ? 'next' : 'done' },
        { label: 'Interview', detail: app.status === 'interview_scheduled' ? 'Interview Scheduled' : '', state: app.status === 'interview_scheduled' ? 'current' : ['applied', 'resume_viewed', 'under_review', 'shortlisted'].includes(app.status) ? 'next' : 'done' },
        { label: app.status === 'rejected' ? 'Rejected' : app.status === 'selected' ? 'Selected' : 'Decision', detail: app.status === 'selected' ? 'Offer Made' : '', state: (app.status === 'selected' || app.status === 'rejected') ? 'done' : 'next' }
      ];
      return base;
    };

    return {
      id: app.id,
      title: app.jobTitle || 'Job Title',
      subtitle: app.companyName || 'Company Name',
      description: app.applicationType === 'walk_in'
        ? 'Walk-In Application Submitted'
        : app.coverLetter || 'No cover letter attached.',
      status: app.status || (app.applicationType === 'walk_in' ? 'pending_review' : 'applied'),
      meta: [
        app.applicationType === 'walk_in' ? 'Walk-In' : 'Job Application',
        app.district || 'Theni',
        `Applied ${appliedDate}`,
        app.resumeName ? `Resume: ${app.resumeName}` : 'Profile Apply'
      ],
      tags: app.skills || [],
      timeline: getTimeline(),
      actions: [
        { label: 'View Job', icon: Eye, href: `/jobs/${app.jobId}`, tone: 'primary' },
        { label: 'Messages', icon: MessageSquare, href: '/seeker/messages', tone: 'neutral' },
      ]
    };
  });

  return (
    <WorkflowPage
      title="Application Tracking"
      eyebrow="Career Pipeline"
      description="Follow every application from one-click apply through review, shortlist, interview, and final decision."
      accent="emerald"
      metrics={metrics}
      tabs={tabs}
      items={applications}
      searchPlaceholder="Search applications, companies, skills..."
      emptyTitle="No matching applications"
      emptyDescription="Try another status tab or search term."
      primaryAction={{ label: 'Find Jobs', icon: Send, href: '/jobs' }}
      statusConfig={statusConfig}
    />
  );
}
