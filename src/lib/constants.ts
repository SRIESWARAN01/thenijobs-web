// ============================================================
// THENIJOBS - Application-wide Constants
// ============================================================

import { YEARLY_SUBSCRIPTION_PLANS } from '@/lib/subscriptions';
import type { SubscriptionPlan } from '@/lib/types';

// ===== SUBSCRIPTION PLANS =====
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = YEARLY_SUBSCRIPTION_PLANS;

// ===== JOB CATEGORIES =====
export const JOB_CATEGORIES = [
  'IT & Software',
  'Healthcare',
  'Education',
  'Agriculture',
  'Construction',
  'Manufacturing',
  'Retail',
  'Finance',
  'Hospitality',
  'Transportation',
  'Textile',
  'Automobile',
  'Real Estate',
  'Media',
  'Government',
  'BPO',
  'Sales & Marketing',
  'Accounting',
  'Legal',
  'HR',
] as const;

export type JobCategory = typeof JOB_CATEGORIES[number];

// ===== SKILLS =====
export const SKILLS = [
  'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Node.js',
  'SQL', 'MongoDB', 'AWS', 'HTML/CSS', 'Flutter', 'Android', 'iOS',
  'Data Entry', 'MS Office', 'Tally', 'AutoCAD',
  'Communication', 'Leadership', 'Teamwork', 'Problem Solving',
  'Time Management', 'Customer Service', 'Sales', 'Negotiation',
  'Accounting', 'Marketing', 'Content Writing', 'Graphic Design',
  'Welding', 'Electrical', 'Plumbing', 'Carpentry', 'Driving',
  'Machine Operation', 'Quality Control', 'Packaging',
  'Tamil Typing', 'English Typing', 'Tailoring', 'Embroidery',
  'Agriculture Management', 'Silk Weaving', 'Logistics',
] as const;

// ===== EXPERIENCE LEVELS =====
export const EXPERIENCE_LEVELS = [
  'Fresher',
  '1-2 Years',
  '3-5 Years',
  '5-10 Years',
  '10+ Years',
] as const;

export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];

// ===== SALARY RANGES (INR per month) =====
export const SALARY_RANGES = [
  { label: 'Rs. 5,000 - Rs. 10,000', min: 5000, max: 10000 },
  { label: 'Rs. 10,000 - Rs. 15,000', min: 10000, max: 15000 },
  { label: 'Rs. 15,000 - Rs. 20,000', min: 15000, max: 20000 },
  { label: 'Rs. 20,000 - Rs. 30,000', min: 20000, max: 30000 },
  { label: 'Rs. 30,000 - Rs. 50,000', min: 30000, max: 50000 },
  { label: 'Rs. 50,000 - Rs. 75,000', min: 50000, max: 75000 },
  { label: 'Rs. 75,000 - Rs. 1,00,000', min: 75000, max: 100000 },
  { label: 'Rs. 1,00,000+', min: 100000, max: 999999 },
] as const;

// ===== APPLICATION STATUS CONFIG =====
export const APPLICATION_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  applied: {
    label: 'Applied',
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
    icon: 'Send',
  },
  pending_review: {
    label: 'Pending Review',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    icon: 'Clock',
  },
  under_review: {
    label: 'Under Review',
    color: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
    icon: 'Eye',
  },
  shortlisted: {
    label: 'Shortlisted',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    icon: 'Star',
  },
  approved: {
    label: 'Approved',
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
    icon: 'CheckCircle',
  },
  interview_scheduled: {
    label: 'Interview Scheduled',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    icon: 'Calendar',
  },
  interview_attended: {
    label: 'Interview Attended',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    icon: 'CalendarCheck',
  },
  selected: {
    label: 'Selected',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    icon: 'CheckCircle',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-400 bg-red-400/10 border-red-400/30',
    icon: 'XCircle',
  },
};

// ===== LEAD STATUS CONFIG =====
export const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
  contacted: { label: 'Contacted', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  qualified: { label: 'Qualified', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  converted: { label: 'Converted', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  lost: { label: 'Lost', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
};

// ===== NAVIGATION ITEMS =====

export interface NavItem {
  label: string;
  tamilLabel: string;
  icon: string;
  href: string;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', tamilLabel: 'Dashboard', icon: 'LayoutDashboard', href: '/admin/dashboard' },
  { label: 'Users', tamilLabel: 'Users', icon: 'Users', href: '/admin/users' },
  { label: 'Companies', tamilLabel: 'Companies', icon: 'Building2', href: '/admin/companies' },
  { label: 'Jobs', tamilLabel: 'Jobs', icon: 'Briefcase', href: '/admin/jobs' },
  { label: 'Applications', tamilLabel: 'Applications', icon: 'FileText', href: '/admin/applications' },
  { label: 'Leads', tamilLabel: 'Leads', icon: 'Target', href: '/admin/leads' },
  { label: 'Services', tamilLabel: 'Services', icon: 'Wrench', href: '/admin/services' },
  { label: 'Subscriptions', tamilLabel: 'Subscriptions', icon: 'CreditCard', href: '/admin/subscriptions' },
  { label: 'Advertisements', tamilLabel: 'Advertisements', icon: 'Megaphone', href: '/admin/advertisements' },
  { label: 'Franchises', tamilLabel: 'Franchises', icon: 'MapPin', href: '/admin/franchises' },
  { label: 'Support Tickets', tamilLabel: 'Support', icon: 'LifeBuoy', href: '/admin/support' },
  { label: 'Analytics', tamilLabel: 'Analytics', icon: 'BarChart3', href: '/admin/analytics' },
  { label: 'Activity Log', tamilLabel: 'Activity', icon: 'ScrollText', href: '/admin/activity' },
  { label: 'Settings', tamilLabel: 'Settings', icon: 'Settings', href: '/admin/settings' },
];

export const EMPLOYER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', tamilLabel: 'Dashboard', icon: 'LayoutDashboard', href: '/employer/dashboard' },
  { label: 'Post Job', tamilLabel: 'Post Job', icon: 'PlusCircle', href: '/employer/post-job' },
  { label: 'My Jobs', tamilLabel: 'My Jobs', icon: 'Briefcase', href: '/employer/jobs' },
  { label: 'Applications', tamilLabel: 'Applications', icon: 'FileText', href: '/employer/applications' },
  { label: 'Interviews', tamilLabel: 'Interviews', icon: 'Video', href: '/employer/interviews' },
  { label: 'Candidates', tamilLabel: 'Candidates', icon: 'Users', href: '/employer/candidates' },
  { label: 'Company Profile', tamilLabel: 'Company', icon: 'Building2', href: '/employer/company' },
  { label: 'Leads', tamilLabel: 'Leads', icon: 'Target', href: '/employer/leads' },
  { label: 'Messages', tamilLabel: 'Messages', icon: 'MessageSquare', href: '/employer/messages' },
  { label: 'Subscription', tamilLabel: 'Subscription', icon: 'CreditCard', href: '/employer/subscription' },
  { label: 'Analytics', tamilLabel: 'Analytics', icon: 'BarChart3', href: '/employer/analytics' },
  { label: 'Settings', tamilLabel: 'Settings', icon: 'Settings', href: '/employer/settings' },
];

export const SEEKER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', tamilLabel: 'Dashboard', icon: 'LayoutDashboard', href: '/seeker/dashboard' },
  { label: 'My Profile', tamilLabel: 'Profile', icon: 'UserCircle', href: '/seeker/profile' },
  { label: 'Search Jobs', tamilLabel: 'Search', icon: 'Search', href: '/jobs' },
  { label: 'My Applications', tamilLabel: 'Applications', icon: 'FileText', href: '/seeker/applications' },
  { label: 'Saved Jobs', tamilLabel: 'Saved', icon: 'Bookmark', href: '/seeker/saved' },
  { label: 'Interviews', tamilLabel: 'Interviews', icon: 'Video', href: '/seeker/interviews' },
  { label: 'Messages', tamilLabel: 'Messages', icon: 'MessageSquare', href: '/seeker/messages' },
  { label: 'Notifications', tamilLabel: 'Notifications', icon: 'Bell', href: '/seeker/notifications' },
  { label: 'Subscription', tamilLabel: 'Subscription', icon: 'CreditCard', href: '/seeker/subscription' },
  { label: 'Settings', tamilLabel: 'Settings', icon: 'Settings', href: '/seeker/settings' },
];
