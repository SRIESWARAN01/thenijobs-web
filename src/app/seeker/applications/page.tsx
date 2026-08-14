'use client';

import WorkflowPage, { type WorkflowItem, type WorkflowMetric, type WorkflowTab } from '@/components/portal/WorkflowPage';
import {
  Calendar,
  CheckCircle,
  Eye,
  MessageSquare,
  Send
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where, orderBy } from 'firebase/firestore';

const tabs: WorkflowTab[] = [
  { label: 'All', value: 'all' },
  { label: 'Applied', value: 'applied' },
  { label: 'Review', value: 'under_review' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Interview', value: 'interview_scheduled' },
  { label: 'Selected', value: 'selected' },
  { label: 'Rejected', value: 'rejected' },
];

const statusConfig = {
  applied:             { label: 'Applied',         bg: '#EFF6FF', text: '#2563EB' },
  under_review:        { label: 'Under Review',    bg: '#F5F3FF', text: '#7C3AED' },
  shortlisted:         { label: 'Shortlisted',     bg: '#ECFDF5', text: '#059669' },
  interview_scheduled: { label: 'Interview',       bg: '#FFFBEB', text: '#D97706' },
  selected:            { label: 'Selected',        bg: '#ECFDF5', text: '#059669' },
  rejected:            { label: 'Rejected',        bg: '#FEF2F2', text: '#DC2626' } };

export default function SeekerApplicationsPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  // Fetch applications for current seeker
  const { data: rawApps, loading } = useCollection<any>('applications', [
    where('seekerId', '==', uid || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !uid });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading your applications...</p>
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
      value: rawApps.filter(app => app.status === 'under_review').length,
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
    const appliedDate = app.createdAt
      ? new Date(app.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Recently';

    // Timeline steps based on status
    const getTimeline = (): any[] => {
      const base = [
        { label: 'Applied', detail: appliedDate, state: app.status === 'applied' ? 'current' : 'done' },
        { label: 'Under Review', detail: app.status === 'under_review' ? 'Evaluating' : '', state: app.status === 'under_review' ? 'current' : app.status === 'applied' ? 'next' : 'done' },
        { label: 'Shortlisted', detail: app.status === 'shortlisted' ? 'Shortlisted' : app.status === 'interview_scheduled' ? 'Interview Set' : '', state: (app.status === 'shortlisted' || app.status === 'interview_scheduled') ? 'current' : (app.status === 'applied' || app.status === 'under_review') ? 'next' : 'done' },
        { label: app.status === 'rejected' ? 'Rejected' : app.status === 'selected' ? 'Selected' : 'Decision', detail: app.status === 'selected' ? 'Offer Made' : '', state: (app.status === 'selected' || app.status === 'rejected') ? 'done' : 'next' }
      ];
      return base;
    };

    return {
      id: app.id,
      title: app.jobTitle || 'Job Title',
      subtitle: app.companyName || 'Company Name',
      description: app.coverLetter || 'No cover letter attached.',
      status: app.status || 'applied',
      meta: [
        app.district || 'Theni',
        `Applied ${appliedDate}`,
        app.resumeName ? `Resume: ${app.resumeName}` : 'Profile Apply'
      ],
      tags: app.skills || [],
      timeline: getTimeline(),
      actions: [
        { label: 'View Job', icon: Eye, href: `/jobs/${app.jobId}`, tone: 'primary' },
        { label: 'Message Employer', icon: MessageSquare, href: `/seeker/messages?convId=conv_${app.id}`, tone: 'neutral' },
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
