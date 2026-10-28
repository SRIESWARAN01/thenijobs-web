'use client';

import { useState } from 'react';
import {
  Sparkles, MapPin, CheckCircle2, Zap, Award,
  Check, ChevronDown, ChevronUp
} from 'lucide-react';
import type { CandidateMatchBreakdown } from '@/lib/matching/candidateMatchScore';

interface Props {
  match: CandidateMatchBreakdown;
  compact?: boolean;
  showBreakdownToggle?: boolean;
}

export function CandidateMatchBadge({
  score,
  tier = 'moderate',
  compact = false,
  showTamil = false,
  size = 'md',
}: {
  score: number;
  tier?: CandidateMatchBreakdown['tier'];
  compact?: boolean;
  showTamil?: boolean;
  size?: 'sm' | 'md';
}) {
  let bgClass = 'bg-slate-100 text-slate-800 border-slate-200';
  let dotClass = 'bg-slate-400';
  let tamilLabel = 'பரிசீலனை';

  if (tier === 'exceptional') {
    bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs';
    dotClass = 'bg-emerald-500 animate-pulse';
    tamilLabel = 'தகுதியான ஆள்';
  } else if (tier === 'high') {
    bgClass = 'bg-blue-50 text-blue-800 border-blue-300';
    dotClass = 'bg-blue-500';
    tamilLabel = 'நல்ல பொருத்தம்';
  } else if (tier === 'moderate') {
    bgClass = 'bg-amber-50 text-amber-800 border-amber-300';
    dotClass = 'bg-amber-500';
    tamilLabel = 'மிதமான பொருத்தம்';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-extrabold border ${sizeClasses} ${bgClass}`}
        title={`AI Match: ${score}% (${tamilLabel})`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        <span>{score}%</span>
        {(showTamil || tier === 'exceptional') && (
          <span className="hidden sm:inline text-[10px] font-bold opacity-90 border-l border-emerald-300 pl-1">
            {tamilLabel}
          </span>
        )}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-xl font-bold border ${sizeClasses} ${bgClass}`}>
      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
      <span className="text-sm font-black">{score}%</span>
      <span className="text-[11px] font-semibold opacity-90">
        AI Match {showTamil ? `• ${tamilLabel}` : ''}
      </span>
    </div>
  );
}

/**
 * Full scorecard widget for Candidate Detail Modal.
 */
export default function CandidateMatchScoreWidget({
  match,
  compact = false,
  showBreakdownToggle = false,
}: Props) {
  const [expanded, setExpanded] = useState(!compact);

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 p-4 sm:p-5 shadow-xs font-outfit text-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight">
                AI Match &amp; Proximity Score
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                தகுதியான ஆட்கள் AI தரவரிசை
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Automated multi-factor candidate scoring based on location, skill match &amp; availability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CandidateMatchBadge score={match.totalScore} tier={match.tier} />
          {showBreakdownToggle && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg hover:bg-white text-gray-500 hover:text-gray-900 cursor-pointer transition-colors"
              aria-label={expanded ? 'Collapse breakdown' : 'Expand breakdown'}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Score Overview Gauge / Bar */}
      <div className="mt-3.5 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-gray-700">
          <span className="flex items-center gap-1.5">
            Total Compatibility Score:
            <span className="text-blue-700 font-black text-sm">{match.totalScore} / 100</span>
          </span>
          <span className="text-[11px] font-bold text-gray-500">
            {match.tierLabel}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              match.totalScore >= 90
                ? 'bg-emerald-500'
                : match.totalScore >= 75
                ? 'bg-blue-600'
                : match.totalScore >= 50
                ? 'bg-amber-500'
                : 'bg-slate-400'
            }`}
            style={{ width: `${match.totalScore}%` }}
          />
        </div>
      </div>

      {expanded && (
        <>
          {/* 3-Point Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
            {/* 1. Proximity (+30 pts) */}
            <div className="p-3 rounded-xl bg-white border border-gray-200/90 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                  <MapPin size={13} className="text-rose-500" />
                  Proximity (தூரம்)
                </span>
                <span className="text-xs font-black text-emerald-700">
                  {match.proximity.score} / 30 pts
                </span>
              </div>
              <p className="text-xs font-extrabold text-gray-900">
                {match.proximity.distanceKm} km away
              </p>
              <p className="text-[10px] text-gray-500 leading-tight">
                {match.proximity.tamilLabel}
              </p>
              {match.proximity.isWithin5km ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1">
                  <Check size={10} /> Local (&le; 5 km: +30 pts)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-md mt-1">
                  {match.proximity.distanceKm > 15 ? 'Out of immediate town' : 'Nearby taluk'}
                </span>
              )}
            </div>

            {/* 2. Skill Match (+40 pts) */}
            <div className="p-3 rounded-xl bg-white border border-gray-200/90 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                  <Award size={13} className="text-blue-600" />
                  Skills (திறன்)
                </span>
                <span className="text-xs font-black text-blue-700">
                  {match.skills.score} / 40 pts
                </span>
              </div>
              <p className="text-xs font-extrabold text-gray-900">
                {match.skills.matchPercentage}% Match
              </p>
              <p className="text-[10px] text-gray-500 leading-tight">
                {match.skills.tamilLabel}
              </p>
              {match.skills.matchedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {match.skills.matchedSkills.slice(0, 3).map((s, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-100"
                    >
                      ✓ {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Immediate Availability (+30 pts) */}
            <div className="p-3 rounded-xl bg-white border border-gray-200/90 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                  <Zap size={13} className="text-amber-500" />
                  Joining (உடனடி)
                </span>
                <span className="text-xs font-black text-amber-700">
                  {match.availability.score} / 30 pts
                </span>
              </div>
              <p className="text-xs font-extrabold text-gray-900">
                {match.availability.isImmediate ? 'Immediate Joiner' : match.availability.noticePeriod}
              </p>
              <p className="text-[10px] text-gray-500 leading-tight">
                {match.availability.tamilLabel}
              </p>
              {match.availability.isImmediate ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md mt-1">
                  <Check size={10} /> Available Now (+30 pts)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-md mt-1">
                  Notice: {match.availability.noticePeriod}
                </span>
              )}
            </div>
          </div>

          {/* AI Recommendation Banner */}
          <div className="mt-3.5 p-3 rounded-xl bg-indigo-50/80 border border-indigo-200/80 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-extrabold text-indigo-950">
                {match.recommendation}
              </p>
              <p className="text-[11px] text-indigo-800 font-medium">
                {match.recommendationTamil}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
