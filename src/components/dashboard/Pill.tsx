'use client';

import { cn } from '@/lib/cn';

export type PillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'violet';

const TONE: Record<PillTone, string> = {
  // Literal colours rather than bg-*-50 utilities, which globals.css overrides
  // with `!important` text colours.
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-[#ECFDF5] text-[#065F46] ring-emerald-200',
  warning: 'bg-[#FFFBEB] text-[#92400E] ring-amber-200',
  danger: 'bg-[#FEF2F2] text-[#991B1B] ring-rose-200',
  info: 'bg-[#EFF6FF] text-[#1E40AF] ring-blue-200',
  violet: 'bg-[#F5F3FF] text-[#5B21B6] ring-violet-200',
};

export function Pill({
  tone = 'neutral',
  children,
  className,
  dot,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset',
        TONE[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />}
      {children}
    </span>
  );
}
