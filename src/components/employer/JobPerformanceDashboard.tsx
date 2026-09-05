'use client';

import { useMemo } from 'react';
import {
  Eye, FileText, Search, Star, Mic, CheckCircle2,
  XCircle, TrendingUp, ArrowDown
} from 'lucide-react';

interface PerformanceData {
  views: number;
  applications: number;
  underReview: number;
  shortlisted: number;
  interview: number;
  selected: number;
  rejected: number;
}

interface JobPerformanceDashboardProps {
  data: PerformanceData;
  jobTitle: string;
  jobStatus?: string;
  compact?: boolean; // mobile compact mode
}

const FUNNEL_STEPS = [
  { key: 'views', label: 'Views', icon: Eye, color: '#2563EB', bg: '#EFF6FF' },
  { key: 'applications', label: 'Applications', icon: FileText, color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'underReview', label: 'Under Review', icon: Search, color: '#D97706', bg: '#FFFBEB' },
  { key: 'shortlisted', label: 'Shortlisted', icon: Star, color: '#059669', bg: '#ECFDF5' },
  { key: 'interview', label: 'Interview', icon: Mic, color: '#0891B2', bg: '#ECFEFF' },
  { key: 'selected', label: 'Selected', icon: CheckCircle2, color: '#16A34A', bg: '#F0FDF4' },
] as const;

export default function JobPerformanceDashboard({ data, jobTitle, jobStatus, compact }: JobPerformanceDashboardProps) {
  // Calculate conversion rates
  const conversions = useMemo(() => {
    const appRate = data.views > 0 ? ((data.applications / data.views) * 100) : 0;
    const shortlistRate = data.applications > 0 ? ((data.shortlisted / data.applications) * 100) : 0;
    const interviewRate = data.shortlisted > 0 ? ((data.interview / data.shortlisted) * 100) : 0;
    const selectRate = data.interview > 0 ? ((data.selected / data.interview) * 100) : 0;
    return { appRate, shortlistRate, interviewRate, selectRate };
  }, [data]);

  // Calculate funnel bar widths (relative to max)
  const maxVal = Math.max(data.views, 1);

  return (
    <div className="space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Job Performance
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{jobTitle}</p>
        </div>
        {jobStatus && (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
            jobStatus === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
            jobStatus === 'paused' ? 'bg-violet-50 text-violet-600 border border-violet-200' :
            jobStatus === 'closed' ? 'bg-red-50 text-red-600 border border-red-200' :
            'bg-gray-50 text-gray-600 border border-gray-200'
          }`}>
            ● {jobStatus}
          </span>
        )}
      </div>

      {/* Compact Metric Cards (Mobile) */}
      {compact ? (
        <div className="grid grid-cols-3 gap-2">
          {FUNNEL_STEPS.map(step => {
            const Icon = step.icon;
            const val = data[step.key as keyof PerformanceData] || 0;
            return (
              <div key={step.key} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                <Icon size={16} style={{ color: step.color }} className="mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{val.toLocaleString()}</p>
                <p className="text-[9px] text-gray-500 font-medium">{step.label}</p>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop: Full stats row */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {FUNNEL_STEPS.map(step => {
            const Icon = step.icon;
            const val = data[step.key as keyof PerformanceData] || 0;
            return (
              <div key={step.key} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: step.bg }}>
                    <Icon size={16} style={{ color: step.color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{val.toLocaleString()}</p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">{step.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejected count */}
      {data.rejected > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          <XCircle size={14} className="text-red-500" />
          <span className="text-sm text-red-700 font-medium">{data.rejected} Rejected</span>
        </div>
      )}

      {/* Performance Funnel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={15} className="text-blue-600" />
          Recruitment Funnel
        </h4>
        <div className="space-y-3">
          {FUNNEL_STEPS.map((step, idx) => {
            const val = data[step.key as keyof PerformanceData] || 0;
            const width = maxVal > 0 ? Math.max((val / maxVal) * 100, 3) : 3;
            const prevKey = idx > 0 ? FUNNEL_STEPS[idx - 1].key : null;
            const prevVal = prevKey ? (data[prevKey as keyof PerformanceData] || 0) : 0;
            const dropRate = prevVal > 0 && idx > 0 ? ((1 - val / prevVal) * 100).toFixed(0) : null;

            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className="w-24 sm:w-28 flex-shrink-0 text-right">
                  <span className="text-xs font-medium text-gray-600">{step.label}</span>
                </div>
                <div className="flex-1 relative">
                  <div className="h-7 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${width}%`, background: step.color }}
                    >
                      <span className="text-[10px] font-bold text-white">{val.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="w-14 flex-shrink-0 text-right">
                  {dropRate && (
                    <span className="text-[10px] text-red-500 font-medium flex items-center justify-end gap-0.5">
                      <ArrowDown size={10} /> {dropRate}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'View → Application', value: conversions.appRate, desc: 'Application Rate' },
          { label: 'App → Shortlist', value: conversions.shortlistRate, desc: 'Shortlist Rate' },
          { label: 'Shortlist → Interview', value: conversions.interviewRate, desc: 'Interview Rate' },
          { label: 'Interview → Selection', value: conversions.selectRate, desc: 'Selection Rate' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <p className="text-[10px] text-gray-500 font-medium">{m.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {m.value.toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
