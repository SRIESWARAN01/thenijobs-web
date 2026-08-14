'use client';

import React from 'react';

function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`rounded-lg bg-gray-100 animate-pulse ${className}`} aria-hidden="true" />;
}

export interface SkeletonAvatarProps { size?: number; className?: string; }
export function SkeletonAvatar({ size = 40, className = '' }: SkeletonAvatarProps) {
  return <div className={`rounded-full bg-gray-100 animate-pulse shrink-0 ${className}`} style={{ width: size, height: size }} aria-hidden="true" />;
}

export interface SkeletonTextProps { lines?: number; className?: string; }
export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => <SkeletonBar key={i} className={`h-3.5 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`} />)}
    </div>
  );
}

export interface SkeletonCardProps { count?: number; className?: string; }
export function SkeletonCard({ count = 1, className = '' }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm ${className}`} aria-hidden="true">
          <div className="flex items-center gap-3">
            <SkeletonAvatar size={44} />
            <div className="flex-1 space-y-2">
              <SkeletonBar className="h-4 w-2/3" />
              <SkeletonBar className="h-3 w-1/3" />
            </div>
          </div>
          <SkeletonText lines={2} />
          <div className="flex gap-2 pt-1">
            <SkeletonBar className="h-8 w-20 rounded-lg" />
            <SkeletonBar className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </>
  );
}

export interface SkeletonTableProps { rows?: number; columns?: number; className?: string; }
export function SkeletonTable({ rows = 5, columns = 5, className = '' }: SkeletonTableProps) {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm ${className}`} aria-hidden="true">
      <div className="grid gap-4 px-5 py-3.5 border-b border-gray-50" style={{ background: '#F8FAFC', gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => <SkeletonBar key={i} className="h-3.5 w-3/4" />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4 px-5 py-3.5 border-t border-gray-50" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, c) => <SkeletonBar key={c} className={`h-3.5 ${c === 0 ? 'w-full' : 'w-4/5'}`} />)}
        </div>
      ))}
    </div>
  );
}

export interface SkeletonListProps { items?: number; className?: string; }
export function SkeletonList({ items = 5, className = '' }: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 shadow-sm">
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

export interface SkeletonChartProps { height?: number; className?: string; }
export function SkeletonChart({ height = 280, className = '' }: SkeletonChartProps) {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm ${className}`} aria-hidden="true">
      <SkeletonBar className="h-5 w-40 mb-6" />
      <div className="w-full rounded-xl bg-gray-100 animate-pulse" style={{ height }} />
      <div className="flex gap-6 mt-4">
        <SkeletonBar className="h-3 w-20" />
        <SkeletonBar className="h-3 w-20" />
        <SkeletonBar className="h-3 w-20" />
      </div>
    </div>
  );
}

const SkeletonComponents = { SkeletonCard, SkeletonTable, SkeletonList, SkeletonText, SkeletonAvatar, SkeletonChart };
export default SkeletonComponents;
