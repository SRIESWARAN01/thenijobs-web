'use client';

import { useMemo } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface CompanyCompletionProps {
  company: {
    name?: string;
    description?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    district?: string;
    category?: string;
    logoUrl?: string;
    coverUrl?: string;
    tagline?: string;
    workingHours?: any;
    galleryImages?: string[];
    verificationStatus?: string;
    socialLinks?: Record<string, string>;
  };
  variant?: 'compact' | 'full';
}

interface CompletionItem {
  label: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
}

function computeCompletion(company: CompanyCompletionProps['company']): {
  percentage: number;
  items: CompletionItem[];
  nextAction: string | null;
} {
  const items: CompletionItem[] = [
    { label: 'Business Name', done: !!company.name, priority: 'high' },
    { label: 'Logo', done: !!company.logoUrl, priority: 'high' },
    { label: 'Phone Number', done: !!company.phone, priority: 'high' },
    { label: 'Email', done: !!company.email, priority: 'high' },
    { label: 'Category', done: !!company.category, priority: 'high' },
    { label: 'Location', done: !!(company.address || company.district), priority: 'high' },
    { label: 'Description', done: !!(company.description && company.description.length > 20), priority: 'medium' },
    { label: 'Tagline', done: !!company.tagline, priority: 'medium' },
    { label: 'Cover Image', done: !!company.coverUrl, priority: 'medium' },
    { label: 'Website', done: !!company.website, priority: 'low' },
    { label: 'Working Hours', done: !!company.workingHours, priority: 'low' },
    { label: 'Gallery Images', done: !!(company.galleryImages && company.galleryImages.length > 0), priority: 'low' },
    { label: 'Verification', done: company.verificationStatus === 'verified', priority: 'low' },
  ];

  const done = items.filter(i => i.done).length;
  const percentage = Math.round((done / items.length) * 100);
  const nextAction = items.find(i => !i.done && i.priority === 'high')?.label
    || items.find(i => !i.done && i.priority === 'medium')?.label
    || items.find(i => !i.done)?.label
    || null;

  return { percentage, items, nextAction };
}

export default function ProfileCompletionIndicator({ company, variant = 'compact' }: CompanyCompletionProps) {
  const { percentage, items, nextAction } = useMemo(() => computeCompletion(company), [company]);

  const barColor = percentage >= 90 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-teal-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = percentage >= 90 ? 'text-emerald-700' : percentage >= 60 ? 'text-teal-700' : percentage >= 40 ? 'text-amber-700' : 'text-red-700';

  if (variant === 'compact') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400">Profile Completion</span>
          <span className={`text-sm font-black ${textColor}`}>{percentage}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${percentage}%` }} />
        </div>
        {nextAction && percentage < 100 && (
          <p className="mt-2 text-[10px] font-semibold text-slate-500 flex items-center gap-1">
            <AlertCircle size={10} className="text-amber-500" />
            Next: Add {nextAction}
          </p>
        )}
      </div>
    );
  }

  // Full variant with checklist
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900">Profile Completion</h3>
        <span className={`text-lg font-black ${textColor}`}>{percentage}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 mb-4 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
              item.done
                ? 'text-emerald-700 bg-emerald-50/50'
                : 'text-slate-400'
            }`}
          >
            {item.done ? (
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 shrink-0" />
            )}
            <span>{item.label}</span>
            {!item.done && item.priority === 'high' && (
              <span className="ml-auto text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { computeCompletion };
