'use client';

import WorkflowPage, { type WorkflowItem, type WorkflowMetric, type WorkflowTab } from '@/components/portal/WorkflowPage';
import {
  Award,
  BookOpen,
  CheckCircle,
  GraduationCap,
  PlayCircle,
  Sparkles,
  Target,
} from 'lucide-react';

const metrics: WorkflowMetric[] = [
  { label: 'Learning Paths', value: 6, description: 'Recommended modules', icon: BookOpen, color: 'emerald' },
  { label: 'In Progress', value: 2, description: 'Active courses', icon: PlayCircle, color: 'cyan' },
  { label: 'Completed', value: 9, description: 'Profile badges earned', icon: CheckCircle, color: 'violet' },
  { label: 'Job Fit Lift', value: '+18%', description: 'Projected match gain', icon: Sparkles, color: 'amber' },
];

const tabs: WorkflowTab[] = [
  { label: 'All', value: 'all' },
  { label: 'Recommended', value: 'recommended' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
];

const paths: WorkflowItem[] = [
  {
    id: 'skill-1',
    title: 'Firebase for job portal apps',
    subtitle: 'Firestore, Auth, Storage, and notifications',
    description: 'Build confidence with Firebase concepts used in modern job dashboards and real-time applications.',
    status: 'recommended',
    meta: ['6 lessons', '2.5 hours', 'Unlocks 6 software matches'],
    tags: ['Firebase', 'Firestore', 'Auth', 'Storage'],
    score: { label: 'Job Impact', value: 91, color: 'emerald' },
    actions: [
      { label: 'Start', icon: PlayCircle, tone: 'success' },
      { label: 'Add Goal', icon: Target, tone: 'neutral' },
    ],
  },
  {
    id: 'skill-2',
    title: 'Tally and GST practical refresh',
    subtitle: 'Accounts roles in Dindigul and Theni',
    description: 'Practice purchase entries, GSTR summaries, reconciliation, and invoice matching tasks.',
    status: 'in_progress',
    meta: ['4 of 8 lessons done', 'Next: GST filing workflow', 'Interview Jun 8'],
    tags: ['Tally', 'GST', 'Excel'],
    score: { label: 'Progress', value: 50, color: 'amber' },
    actions: [
      { label: 'Continue', icon: PlayCircle, tone: 'primary' },
      { label: 'Mark Done', icon: CheckCircle, tone: 'success' },
    ],
    timeline: [
      { label: 'Basics', state: 'done' },
      { label: 'Purchase entries', state: 'done' },
      { label: 'GST filing', state: 'current' },
      { label: 'Mock test', state: 'next' },
    ],
  },
  {
    id: 'skill-3',
    title: 'Tamil and English typing speed',
    subtitle: 'Data entry and office assistant roles',
    description: 'Improve accuracy and speed for data entry jobs that ask for typing tests.',
    status: 'recommended',
    meta: ['15 min daily', 'Beginner friendly', 'Typing test ready'],
    tags: ['Tamil Typing', 'English Typing', 'Data Entry'],
    score: { label: 'Job Impact', value: 76, color: 'cyan' },
    actions: [
      { label: 'Start', icon: PlayCircle, tone: 'success' },
      { label: 'View Jobs', icon: Award, href: '/jobs', tone: 'neutral' },
    ],
  },
  {
    id: 'skill-4',
    title: 'Customer communication basics',
    subtitle: 'Support and field marketing readiness',
    description: 'Completed path covering call etiquette, follow-up notes, escalation, and customer objections.',
    status: 'completed',
    meta: ['Completed May 28', 'Badge added', 'Used by 3 applications'],
    tags: ['Communication', 'Sales', 'Support'],
    score: { label: 'Score', value: 96, color: 'emerald' },
    actions: [
      { label: 'View Badge', icon: Award, href: '/seeker/profile', tone: 'primary' },
    ],
  },
];

const statusConfig = {
  recommended: { label: 'Recommended', color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-600 border-amber-200' },
  completed: { label: 'Completed', color: 'bg-violet-500/10 text-violet-600 border-violet-200' },
};

export default function SkillsPage() {
  return (
    <WorkflowPage
      title="Skill Development"
      eyebrow="Career Growth"
      description="Prioritized learning paths based on your profile, applications, and the jobs you are targeting."
      accent="emerald"
      metrics={metrics}
      tabs={tabs}
      items={paths}
      searchPlaceholder="Search learning paths, skills, badges..."
      emptyTitle="No learning paths match"
      emptyDescription="Try another progress tab or search term."
      primaryAction={{ label: 'AI Coach', icon: GraduationCap, href: '/seeker/ai-coach' }}
      statusConfig={statusConfig}
    />
  );
}
