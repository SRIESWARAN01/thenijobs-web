'use client';

import { cn } from '@/lib/cn';

/**
 * A neutral shimmer block. Deliberately not animated with framer-motion: these
 * render dozens at a time on a loading dashboard and a CSS animation costs no
 * JavaScript on the low-end Android phones that make up most of this audience.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-100', className)} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}
