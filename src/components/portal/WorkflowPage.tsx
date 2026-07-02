'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Search,
  type LucideIcon,
} from 'lucide-react';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
type Accent = 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose';

export interface WorkflowMetric {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  color: Accent;
}


export interface WorkflowTab {
  label: string;
  value: string;
}

export interface WorkflowAction {
  label: string;
  icon: LucideIcon;
  href?: string;
  tone?: Tone;
  onClick?: () => void;
}

export interface WorkflowTimelineStep {
  label: string;
  detail?: string;
  state: 'done' | 'current' | 'next';
}

export interface WorkflowItem {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  status: string;
  statusLabel?: string;
  meta: string[];
  tags?: string[];
  amount?: string;
  score?: {
    label: string;
    value: number;
    color?: Accent;
  };
  timeline?: WorkflowTimelineStep[];
  actions?: WorkflowAction[];
}

export interface WorkflowPageProps {
  title: string;
  eyebrow?: string;
  description: string;
  accent?: Accent;
  metrics: WorkflowMetric[];
  tabs?: WorkflowTab[];
  items: WorkflowItem[];
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  primaryAction?: WorkflowAction;
  statusConfig?: Record<string, { label: string; color: string }>;
}

const accentMap: Record<Accent, {
  text: string;
  border: string;
  bg: string;
  button: string;
  soft: string;
  bar: string;
}> = {
  cyan: {
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/15',
    button: 'from-cyan-600 to-emerald-600',
    soft: 'from-cyan-500/10 to-emerald-500/5',
    bar: 'from-cyan-500 to-emerald-500',
  },
  emerald: {
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/15',
    button: 'from-emerald-600 to-cyan-600',
    soft: 'from-emerald-500/10 to-cyan-500/5',
    bar: 'from-emerald-500 to-cyan-500',
  },
  violet: {
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/15',
    button: 'from-violet-600 to-indigo-600',
    soft: 'from-violet-500/10 to-cyan-500/5',
    bar: 'from-violet-500 to-cyan-500',
  },
  amber: {
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/15',
    button: 'from-amber-500 to-orange-600',
    soft: 'from-amber-500/10 to-rose-500/5',
    bar: 'from-amber-500 to-orange-500',
  },
  rose: {
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/15',
    button: 'from-rose-600 to-pink-600',
    soft: 'from-rose-500/10 to-violet-500/5',
    bar: 'from-rose-500 to-pink-500',
  },
};

const toneMap: Record<Tone, string> = {
  neutral: 'bg-white/[0.04] text-gray-300 border-white/[0.08] hover:bg-white/[0.08]',
  primary: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
};

const metricColorMap: Record<Accent, { bg: string; text: string }> = {
  cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  violet: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  rose: { bg: 'bg-rose-500/15', text: 'text-rose-400' },
};

const defaultStatusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  active: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  applied: { label: 'Applied', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  contacted: { label: 'Contacted', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  converted: { label: 'Converted', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  lost: { label: 'Lost', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  scheduled: { label: 'Scheduled', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  saved: { label: 'Saved', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
};

function matchesSearch(item: WorkflowItem, query: string) {
  if (!query) return true;
  const haystack = [
    item.title,
    item.subtitle,
    item.description || '',
    item.status,
    ...(item.meta || []),
    ...(item.tags || []),
  ].join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function renderAction(action: WorkflowAction) {
  const Icon = action.icon;
  const classes = `inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all sm:flex-none ${toneMap[action.tone || 'neutral']}`;

  if (!action.href) {
    return (
      <button key={action.label} type="button" onClick={action.onClick} className={classes}>
        <Icon size={14} />
        {action.label}
      </button>
    );
  }

  if (action.href.startsWith('http') || action.href.startsWith('tel:') || action.href.startsWith('mailto:')) {
    return (
      <a key={action.label} href={action.href} target={action.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" onClick={action.onClick} className={classes}>
        <Icon size={14} />
        {action.label}
      </a>
    );
  }

  return (
    <Link key={action.label} href={action.href} onClick={action.onClick} className={classes}>
      <Icon size={14} />
      {action.label}
    </Link>
  );
}

export default function WorkflowPage({
  title,
  eyebrow,
  description,
  accent = 'cyan',
  metrics,
  tabs = [{ label: 'All', value: 'all' }],
  items,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  primaryAction,
  statusConfig = defaultStatusConfig,
}: WorkflowPageProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(tabs[0]?.value || 'all');
  const colors = accentMap[accent];
  const PrimaryIcon = primaryAction?.icon;

  const filteredItems = useMemo(
    () => items.filter((item) => {
      const tabMatch = activeTab === 'all' || item.status === activeTab;
      return tabMatch && matchesSearch(item, query);
    }),
    [activeTab, items, query],
  );

  const tabCounts = useMemo(() => {
    return tabs.reduce<Record<string, number>>((acc, tab) => {
      acc[tab.value] = tab.value === 'all'
        ? items.length
        : items.filter((item) => item.status === tab.value).length;
      return acc;
    }, {});
  }, [items, tabs]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className={`rounded-2xl border ${colors.border} bg-gradient-to-r ${colors.soft} p-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            {eyebrow && <p className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>{eyebrow}</p>}
            <h1 className="mt-1 text-2xl font-bold text-white font-outfit">{title}</h1>
            <p className="mt-1 text-sm text-gray-400">{description}</p>
          </div>
          {primaryAction && (
            primaryAction.href ? (
              <Link
                href={primaryAction.href}
                onClick={primaryAction.onClick}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${colors.button} px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto`}
              >
                {PrimaryIcon && <PrimaryIcon size={16} />}
                {primaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${colors.button} px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto`}
              >
                {PrimaryIcon && <PrimaryIcon size={16} />}
                {primaryAction.label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const metricColors = metricColorMap[metric.color];
          return (
            <div key={metric.label} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold text-white font-outfit">{metric.value}</p>
                  <p className="mt-1 text-xs font-medium text-gray-400">{metric.label}</p>
                  {metric.description && <p className="mt-1 text-[10px] text-gray-500">{metric.description}</p>}
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${metricColors.bg}`}>
                  <Icon size={18} className={metricColors.text} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="search-input w-full py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                activeTab === tab.value
                  ? `${colors.bg} ${colors.text} border ${colors.border}`
                  : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] opacity-70">{tabCounts[tab.value] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredItems.map((item) => {
          const status = statusConfig[item.status] || { label: item.statusLabel || item.status, color: 'bg-white/[0.06] text-gray-300 border-white/[0.08]' };
          const scoreColor = item.score ? metricColorMap[item.score.color || accent] : null;
          return (
            <div key={item.id} className="glass-card rounded-2xl p-4 transition-all hover:border-white/[0.15] sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-white">{item.title}</h2>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${status.color}`}>
                      {item.statusLabel || status.label}
                    </span>
                    {item.amount && <span className="text-sm font-bold text-emerald-400">{item.amount}</span>}
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{item.subtitle}</p>
                  {item.description && <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">{item.description}</p>}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                    {item.meta.map((meta) => (
                      <span key={meta} className="text-xs text-gray-500">{meta}</span>
                    ))}
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span key={tag} className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-gray-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {item.score && scoreColor && (
                  <div className="w-full shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 xl:w-44">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{item.score.label}</span>
                      <span className={`text-sm font-bold ${scoreColor.text}`}>{item.score.value}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`} style={{ width: `${item.score.value}%` }} />
                    </div>
                  </div>
                )}

                {item.actions && item.actions.length > 0 && (
                  <div className="flex w-full shrink-0 flex-wrap gap-2 xl:w-auto xl:justify-end">
                    {item.actions.map(renderAction)}
                  </div>
                )}
              </div>

              {item.timeline && item.timeline.length > 0 && (
                <div className="mt-5 grid gap-2 border-t border-white/[0.06] pt-4 sm:grid-cols-2 xl:grid-cols-4">
                  {item.timeline.map((step) => (
                    <div key={step.label} className="flex items-start gap-2">
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        step.state === 'done'
                          ? 'bg-emerald-400'
                          : step.state === 'current'
                            ? 'bg-amber-400'
                            : 'bg-white/[0.16]'
                      }`} />
                      <div>
                        <p className="text-xs font-semibold text-gray-300">{step.label}</p>
                        {step.detail && <p className="mt-0.5 text-[10px] text-gray-500">{step.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="glass-card rounded-2xl p-6 text-center sm:p-12">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${colors.bg}`}>
            <ChevronRight size={24} className={colors.text} />
          </div>
          <h2 className="text-base font-semibold text-white">{emptyTitle}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{emptyDescription}</p>
        </div>
      )}
    </div>
  );
}
