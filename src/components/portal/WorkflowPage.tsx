'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, type LucideIcon } from 'lucide-react';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
type Accent = 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose';

export interface WorkflowMetric { label: string; value: string | number; description?: string; icon: LucideIcon; color: Accent; }
export interface WorkflowTab { label: string; value: string; }
export interface WorkflowAction { label: string; icon: LucideIcon; href?: string; tone?: Tone; }
export interface WorkflowTimelineStep { label: string; detail?: string; state: 'done' | 'current' | 'next'; }
export interface WorkflowItem {
  id: string; title: string; subtitle: string; description?: string; status: string; statusLabel?: string;
  meta: string[]; tags?: string[]; amount?: string;
  score?: { label: string; value: number; color?: Accent };
  timeline?: WorkflowTimelineStep[]; actions?: WorkflowAction[];
}
export interface WorkflowPageProps {
  title: string; eyebrow?: string; description: string; accent?: Accent;
  metrics: WorkflowMetric[]; tabs?: WorkflowTab[]; items: WorkflowItem[];
  searchPlaceholder: string; emptyTitle: string; emptyDescription: string;
  primaryAction?: WorkflowAction;
  statusConfig?: Record<string, { label: string; color?: string; bg?: string; text?: string }>;
}

// Vaanikan light palette per accent
const ACCENT: Record<Accent, { bg: string; text: string; border: string; btnBg: string; dot: string }> = {
  cyan:    { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', btnBg: '#2563EB', dot: '#2563EB' },
  emerald: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', btnBg: '#10B981', dot: '#059669' },
  violet:  { bg: '#F5F3FF', text: '#7C3AED', border: '#C4B5FD', btnBg: '#7C3AED', dot: '#7C3AED' },
  amber:   { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', btnBg: '#D97706', dot: '#D97706' },
  rose:    { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3', btnBg: '#E11D48', dot: '#E11D48' },
};

const TONE: Record<Tone, { bg: string; text: string; border: string }> = {
  neutral: { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' },
  primary: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  success: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  warning: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  danger:  { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3' },
};

const METRIC_COLOR: Record<Accent, { bg: string; color: string }> = {
  cyan:    { bg: '#EFF6FF', color: '#2563EB' },
  emerald: { bg: '#ECFDF5', color: '#059669' },
  violet:  { bg: '#F5F3FF', color: '#7C3AED' },
  amber:   { bg: '#FFFBEB', color: '#D97706' },
  rose:    { bg: '#FFF1F2', color: '#E11D48' },
};

// Light status config defaults (replaces dark opacity classes)
const DEFAULT_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  new:             { label: 'New',             bg: '#EFF6FF', text: '#2563EB' },
  active:          { label: 'Active',          bg: '#ECFDF5', text: '#059669' },
  applied:         { label: 'Applied',         bg: '#EFF6FF', text: '#2563EB' },
  under_review:    { label: 'Under Review',    bg: '#F5F3FF', text: '#7C3AED' },
  shortlisted:     { label: 'Shortlisted',     bg: '#ECFDF5', text: '#059669' },
  interview_scheduled: { label: 'Interview',   bg: '#FFFBEB', text: '#D97706' },
  selected:        { label: 'Selected',        bg: '#ECFDF5', text: '#059669' },
  rejected:        { label: 'Rejected',        bg: '#FEF2F2', text: '#DC2626' },
  contacted:       { label: 'Contacted',       bg: '#F5F3FF', text: '#7C3AED' },
  in_progress:     { label: 'In Progress',     bg: '#FFFBEB', text: '#D97706' },
  converted:       { label: 'Converted',       bg: '#ECFDF5', text: '#059669' },
  lost:            { label: 'Lost',            bg: '#FEF2F2', text: '#DC2626' },
  scheduled:       { label: 'Scheduled',       bg: '#FFFBEB', text: '#D97706' },
  completed:       { label: 'Completed',       bg: '#ECFDF5', text: '#059669' },
  saved:           { label: 'Saved',           bg: '#F5F3FF', text: '#7C3AED' },
};

function matchesSearch(item: WorkflowItem, q: string) {
  if (!q) return true;
  const hay = [item.title, item.subtitle, item.description || '', item.status, ...(item.meta || []), ...(item.tags || [])].join(' ').toLowerCase();
  return hay.includes(q.toLowerCase());
}

function ActionBtn({ action }: { action: WorkflowAction }) {
  const Icon = action.icon;
  const t = TONE[action.tone || 'neutral'];
  const cls = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all hover:opacity-80";
  const style = { background: t.bg, color: t.text, borderColor: t.border };
  if (!action.href) return <button type="button" className={cls} style={style}><Icon size={13} />{action.label}</button>;
  if (action.href.startsWith('http') || action.href.startsWith('tel:') || action.href.startsWith('mailto:'))
    return <a href={action.href} target={action.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={cls} style={style}><Icon size={13} />{action.label}</a>;
  return <Link href={action.href} className={cls} style={style}><Icon size={13} />{action.label}</Link>;
}

// Merge caller's statusConfig with our defaults (caller may pass the old dark string format)
function resolveStatus(status: string, config: Record<string, any>): { label: string; bg: string; text: string } {
  const cfg = config[status] || DEFAULT_STATUS[status];
  if (!cfg) return { label: status, bg: '#F9FAFB', text: '#6B7280' };
  // If it has bg/text directly (new format) return as-is
  if (cfg.bg) return cfg;
  // Else it's the old `color` string format — fall back to defaults
  return DEFAULT_STATUS[status] || { label: cfg.label || status, bg: '#F9FAFB', text: '#6B7280' };
}

export default function WorkflowPage({
  title, eyebrow, description, accent = 'cyan',
  metrics, tabs = [{ label: 'All', value: 'all' }], items,
  searchPlaceholder, emptyTitle, emptyDescription, primaryAction, statusConfig = {},
}: WorkflowPageProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(tabs[0]?.value || 'all');
  const ac = ACCENT[accent];
  const PrimaryIcon = primaryAction?.icon;

  const filtered = useMemo(() =>
    items.filter(item => (activeTab === 'all' || item.status === activeTab) && matchesSearch(item, query)),
    [activeTab, items, query]);

  const tabCounts = useMemo(() =>
    tabs.reduce<Record<string, number>>((a, t) => {
      a[t.value] = t.value === 'all' ? items.length : items.filter(i => i.status === t.value).length;
      return a;
    }, {}), [items, tabs]);

  return (
    <div className="p-4 sm:p-6 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {eyebrow && <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: ac.text }}>{eyebrow}</p>}
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          </div>
          {primaryAction && (
            primaryAction.href
              ? <Link href={primaryAction.href} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all shadow-xs" style={{ background: ac.btnBg }}>
                  {PrimaryIcon && <PrimaryIcon size={15} />} {primaryAction.label}
                </Link>
              : <button type="button" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all shadow-xs" style={{ background: ac.btnBg }}>
                  {PrimaryIcon && <PrimaryIcon size={15} />} {primaryAction.label}
                </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {metrics.map(metric => {
          const Icon = metric.icon;
          const mc = METRIC_COLOR[metric.color];
          return (
            <div key={metric.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-500">{metric.label}</p>
                  {metric.description && <p className="mt-0.5 text-[10px] text-gray-400">{metric.description}</p>}
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: mc.bg }}>
                  <Icon size={18} style={{ color: mc.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button key={tab.value} type="button" onClick={() => setActiveTab(tab.value)}
              className={`whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.value ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`} style={activeTab === tab.value ? { color: ac.text } : {}}>
              {tab.label} <span className="opacity-60">({tabCounts[tab.value] ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {filtered.map(item => {
          const st = resolveStatus(item.status, statusConfig);
          const scoreColor = item.score ? METRIC_COLOR[item.score.color || accent] : null;
          return (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-900">{item.title}</h2>
                    <span className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: st.bg, color: st.text, borderColor: st.bg }}>
                      {item.statusLabel || st.label}
                    </span>
                    {item.amount && <span className="text-sm font-bold" style={{ color: '#059669' }}>{item.amount}</span>}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{item.subtitle}</p>
                  {item.description && <p className="mt-2 text-xs leading-5 text-gray-400 max-w-3xl line-clamp-2">{item.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {item.meta.map(m => <span key={m} className="text-xs text-gray-400">{m}</span>)}
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {item.tags.map(tag => (
                        <span key={tag} className="rounded-lg border px-2.5 py-0.5 text-[10px] font-medium text-gray-500 border-gray-100 bg-gray-50">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {item.score && scoreColor && (
                  <div className="w-full xl:w-40 shrink-0 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{item.score.label}</span>
                      <span className="text-sm font-bold" style={{ color: scoreColor.color }}>{item.score.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${item.score.value}%`, background: scoreColor.color }} />
                    </div>
                  </div>
                )}

                {item.actions && item.actions.length > 0 && (
                  <div className="flex flex-shrink-0 flex-wrap gap-2 xl:justify-end">
                    {item.actions.map(a => <ActionBtn key={a.label} action={a} />)}
                  </div>
                )}
              </div>

              {item.timeline && item.timeline.length > 0 && (
                <div className="mt-4 grid gap-2 border-t border-gray-50 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                  {item.timeline.map(step => (
                    <div key={step.label} className="flex items-start gap-2">
                      <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{
                        background: step.state === 'done' ? '#10B981' : step.state === 'current' ? '#D97706' : '#E5E7EB'
                      }} />
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{step.label}</p>
                        {step.detail && <p className="mt-0.5 text-[10px] text-gray-400">{step.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: ac.bg }}>
            <ChevronRight size={24} style={{ color: ac.text }} />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">{emptyTitle}</h2>
          <p className="mt-1 text-xs text-gray-400 max-w-md mx-auto">{emptyDescription}</p>
        </div>
      )}
    </div>
  );
}
