'use client';

import WorkflowPage, { type WorkflowItem, type WorkflowMetric, type WorkflowTab } from '@/components/portal/WorkflowPage';
import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  MapPin,
  MessageSquare,
  Phone,
  Video,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where, orderBy } from 'firebase/firestore';

const tabs: WorkflowTab[] = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

export default function SeekerInterviewsPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  // Fetch interviews for seeker
  const { data: rawInterviews, loading } = useCollection<any>('interviews', [
    where('seekerId', '==', uid || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !uid });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-white">
        <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading interviews...</p>
      </div>
    );
  }

  // Compute metrics from live interviews
  const scheduledCount = rawInterviews.filter(i => i.status === 'scheduled').length;
  const completedCount = rawInterviews.filter(i => i.status === 'completed').length;
  const onlineCount = rawInterviews.filter(i => i.type === 'video' || i.type === 'phone' || i.mode === 'Video' || i.mode === 'Phone').length;

  const metrics: WorkflowMetric[] = [
    { label: 'Scheduled', value: scheduledCount, description: 'Upcoming interviews', icon: Calendar, color: 'amber' },
    { label: 'Completed', value: completedCount, description: 'Past rounds', icon: CheckCircle, color: 'emerald' },
    { label: 'Online', value: onlineCount, description: 'Video or phone', icon: Video, color: 'cyan' },
    { label: 'Reminders', value: 'On', description: '24h and 1h alerts', icon: Clock, color: 'violet' },
  ];

  // Map to WorkflowItem format
  const items: WorkflowItem[] = rawInterviews.map((int) => {
    const formattedDate = int.date || 'TBD';
    const formattedTime = int.time || '';
    const mode = int.type || int.mode || 'video'; // video, phone, in-person

    const getActions = () => {
      const actions: any[] = [];
      if (mode.toLowerCase() === 'video' && int.meetingLink) {
        actions.push({ label: 'Join Meet', icon: ExternalLink, href: int.meetingLink, tone: 'success' });
      } else if (mode.toLowerCase() === 'in-person' && int.location) {
        actions.push({ label: 'Directions', icon: MapPin, href: `https://maps.google.com/?q=${encodeURIComponent(int.location)}`, tone: 'primary' });
      }
      
      if (int.phone) {
        actions.push({ label: 'Call', icon: Phone, href: `tel:${int.phone}`, tone: 'neutral' });
      }
      
      actions.push({ label: 'Messages', icon: MessageSquare, href: '/seeker/messages', tone: 'neutral' });
      return actions;
    };

    return {
      id: int.id,
      title: `${int.jobTitle || 'Job'} Interview`,
      subtitle: int.companyName || 'Company Name',
      description: int.notes || 'No notes provided by employer.',
      status: int.status || 'scheduled',
      meta: [
        formattedDate,
        formattedTime,
        mode.toUpperCase()
      ],
      tags: int.skills || [],
      actions: getActions()
    };
  });

  return (
    <WorkflowPage
      title="Interviews"
      eyebrow="Schedule"
      description="Track upcoming interview slots, modes, reminders, and employer contact actions."
      accent="amber"
      metrics={metrics}
      tabs={tabs}
      items={items}
      searchPlaceholder="Search interviews, companies, skills..."
      emptyTitle="No interviews match"
      emptyDescription="Try another status tab or search term."
      primaryAction={{ label: 'View Applications', icon: Calendar, href: '/seeker/applications' }}
      statusConfig={statusConfig}
    />
  );
}
