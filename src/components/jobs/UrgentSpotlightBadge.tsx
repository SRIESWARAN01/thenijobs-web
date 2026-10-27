'use client';

import React from 'react';
import { Zap, Clock, Flame } from 'lucide-react';
import { getUrgentRemainingTime, isJobUrgent } from '@/lib/constants';

interface UrgentSpotlightBadgeProps {
  job?: {
    isUrgent?: boolean;
    urgentUntil?: any;
    title?: string;
  } | null;
  variant?: 'full' | 'compact' | 'minimal' | 'banner' | 'card_ribbon';
  showCountdown?: boolean;
  className?: string;
}

/**
 * Animated Flashing "Urgent Requirement (அவசர ஆட்கள் தேவை)" Red Badge.
 * 
 * Displayed for jobs active under the 48-Hour Urgent Hiring Spotlight (₹99 / ₹149 micro-fee).
 */
export default function UrgentSpotlightBadge({
  job,
  variant = 'full',
  showCountdown = false,
  className = '',
}: UrgentSpotlightBadgeProps) {
  // If a job object is provided, verify it has an active urgent spotlight
  if (job && !isJobUrgent(job)) {
    return null;
  }

  const remaining = job?.urgentUntil ? getUrgentRemainingTime(job) : null;

  if (variant === 'banner') {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-3.5 sm:p-4 shadow-lg shadow-red-600/20 border border-red-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs shrink-0">
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400" />
            </span>
            <Zap size={18} className="fill-yellow-300 text-yellow-300 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black tracking-wide uppercase bg-black/25 px-2 py-0.5 rounded-md text-yellow-300">
                48-Hour Spotlight
              </span>
              <h4 className="text-sm sm:text-base font-black tracking-tight leading-tight">
                Urgent Requirement (அவசர ஆட்கள் தேவை)
              </h4>
            </div>
            <p className="text-xs text-red-100 mt-0.5 font-medium">
              Top priority vacancy pinned across Theni &amp; taluk WhatsApp channels.
            </p>
          </div>
        </div>

        {remaining && remaining !== 'Expired' && (
          <div className="flex items-center gap-1.5 self-start sm:self-center px-3 py-1 rounded-xl bg-black/20 backdrop-blur-xs text-xs font-bold text-yellow-200 shrink-0">
            <Clock size={13} className="text-yellow-300" />
            <span>Spotlight: {remaining}</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-red-600 to-rose-600 text-white border border-red-400/50 shadow-sm shadow-red-600/30 animate-pulse tracking-tight shrink-0 ${className}`}
        title="48-Hour Urgent Requirement (அவசர ஆட்கள் தேவை)"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-80" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
        </span>
        <Zap size={12} className="fill-yellow-300 text-yellow-300 shrink-0" />
        <span>அவசர தேவை • Urgent</span>
      </span>
    );
  }

  if (variant === 'minimal') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-600 text-white shadow-xs animate-pulse ${className}`}
      >
        <Zap size={10} className="fill-yellow-300 text-yellow-300 shrink-0" />
        <span>அவசர தேவை</span>
      </span>
    );
  }

  if (variant === 'card_ribbon') {
    return (
      <div className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 border border-red-500/40 ${className}`}>
        <div className="flex items-center gap-1.5 truncate">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-90" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
          </span>
          <Zap size={13} className="fill-yellow-300 text-yellow-300 shrink-0" />
          <span className="truncate font-black tracking-tight">
            Urgent Requirement (அவசர ஆட்கள் தேவை)
          </span>
        </div>
        {remaining && remaining !== 'Expired' && (
          <span className="text-[10px] font-semibold bg-black/25 px-2 py-0.5 rounded-md shrink-0 text-yellow-200">
            {remaining}
          </span>
        )}
      </div>
    );
  }

  // Default 'full' variant
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border border-red-400/60 shadow-md shadow-red-600/30 animate-pulse tracking-tight ${className}`}
      title="48-Hour Urgent Hiring Spotlight (அவசர ஆட்கள் தேவை)"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-80" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400" />
      </span>
      <Zap size={13} className="fill-yellow-300 text-yellow-300 shrink-0" />
      <span className="font-extrabold">Urgent Requirement (அவசர ஆட்கள் தேவை)</span>
      {showCountdown && remaining && remaining !== 'Expired' && (
        <span className="ml-1 pl-1.5 border-l border-red-400/40 text-[10px] text-yellow-200 font-bold">
          {remaining}
        </span>
      )}
    </span>
  );
}
