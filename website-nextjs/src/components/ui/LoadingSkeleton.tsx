'use client';

import React from 'react';

/* ------------------------------------------------------------------ */
/*  Base shimmer bar                                                   */
/* ------------------------------------------------------------------ */

interface SkeletonBarProps {
  className?: string;
}

function SkeletonBar({ className = '' }: SkeletonBarProps) {
  return (
    <div
      className={`rounded-lg bg-white/[0.06] shimmer ${className}`}
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonAvatar                                                     */
/* ------------------------------------------------------------------ */

export interface SkeletonAvatarProps {
  size?: number;
  className?: string;
}

export function SkeletonAvatar({ size = 40, className = '' }: SkeletonAvatarProps) {
  return (
    <div
      className={`rounded-full bg-white/[0.06] shimmer shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonText                                                       */
/* ------------------------------------------------------------------ */

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBar
          key={i}
          className={`h-3.5 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonCard                                                       */
/* ------------------------------------------------------------------ */

export interface SkeletonCardProps {
  count?: number;
  className?: string;
}

export function SkeletonCard({ count = 1, className = '' }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`glass-card rounded-2xl p-5 space-y-4 ${className}`}
          aria-hidden="true"
        >
          {/* Header row */}
          <div className="flex items-center gap-3">
            <SkeletonAvatar size={44} />
            <div className="flex-1 space-y-2">
              <SkeletonBar className="h-4 w-2/3" />
              <SkeletonBar className="h-3 w-1/3" />
            </div>
          </div>
          {/* Body */}
          <SkeletonText lines={2} />
          {/* Footer */}
          <div className="flex gap-2 pt-1">
            <SkeletonBar className="h-8 w-20 rounded-lg" />
            <SkeletonBar className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonTable                                                      */
/* ------------------------------------------------------------------ */

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 5,
  className = '',
}: SkeletonTableProps) {
  return (
    <div className={`glass-card rounded-2xl overflow-hidden ${className}`} aria-hidden="true">
      {/* Header */}
      <div
        className="grid gap-4 px-5 py-3.5 border-b border-white/[0.06]"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBar key={i} className="h-3.5 w-3/4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-4 px-5 py-3.5 border-b border-white/[0.03]"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonBar
              key={c}
              className={`h-3.5 ${c === 0 ? 'w-full' : 'w-4/5'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonList                                                       */
/* ------------------------------------------------------------------ */

export interface SkeletonListProps {
  items?: number;
  className?: string;
}

export function SkeletonList({ items = 5, className = '' }: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="glass-card rounded-xl p-4 flex items-center gap-3"
        >
          <SkeletonAvatar size={36} />
          <div className="flex-1 space-y-2">
            <SkeletonBar className="h-3.5 w-3/5" />
            <SkeletonBar className="h-3 w-2/5" />
          </div>
          <SkeletonBar className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonChart                                                      */
/* ------------------------------------------------------------------ */

export interface SkeletonChartProps {
  height?: number;
  className?: string;
}

export function SkeletonChart({ height = 280, className = '' }: SkeletonChartProps) {
  return (
    <div
      className={`glass-card rounded-2xl p-5 ${className}`}
      aria-hidden="true"
    >
      {/* Title */}
      <SkeletonBar className="h-5 w-40 mb-6" />
      {/* Chart area */}
      <div
        className="w-full rounded-xl bg-white/[0.03] shimmer"
        style={{ height }}
      />
      {/* Legend */}
      <div className="flex gap-6 mt-4">
        <SkeletonBar className="h-3 w-20" />
        <SkeletonBar className="h-3 w-20" />
        <SkeletonBar className="h-3 w-20" />
      </div>
    </div>
  );
}

const LoadingSkeletons = {
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonText,
  SkeletonAvatar,
  SkeletonChart,
};

export default LoadingSkeletons;
