import type { JobType } from '@/lib/types';
import { toDate } from '@/lib/firebase/serializers';

export const JOB_TYPE_OPTIONS: Array<{ id: JobType; label: string }> = [
  { id: 'full_time', label: 'Full Time' },
  { id: 'part_time', label: 'Part Time' },
  { id: 'remote', label: 'Remote' },
  { id: 'work_from_home', label: 'Work From Home' },
  { id: 'internship', label: 'Internship' },
  { id: 'fresher', label: 'Fresher' },
  { id: 'contract', label: 'Contract' },
];

const JOB_TYPE_LABELS: Record<string, string> = JOB_TYPE_OPTIONS.reduce(
  (acc, type) => {
    acc[type.id] = type.label;
    return acc;
  },
  {} as Record<string, string>,
);

export function formatJobType(type?: string | null) {
  if (!type) return 'Full Time';

  const normalised = type
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  return JOB_TYPE_LABELS[normalised] || normalised
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatRelativeTime(value: unknown) {
  const date = toDate(value);
  if (!date) return 'Recently';

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const units = [
    { label: 'yr', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'd', seconds: 86400 },
    { label: 'hr', seconds: 3600 },
    { label: 'min', seconds: 60 },
  ];

  for (const unit of units) {
    const interval = Math.floor(seconds / unit.seconds);
    if (interval >= 1) return `${interval} ${unit.label} ago`;
  }

  return 'Just now';
}

export function formatDate(value: unknown, fallback = 'Recently') {
  const date = toDate(value);
  return date ? date.toLocaleDateString('en-IN') : fallback;
}
