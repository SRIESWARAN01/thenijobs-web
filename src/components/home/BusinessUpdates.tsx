'use client';

import Link from 'next/link';
import { ArrowRight, Briefcase, Building2, Clock, Megaphone, PackagePlus, TrendingUp } from 'lucide-react';
import { limit, orderBy } from 'firebase/firestore';
import { useCollection } from '@/hooks/useFirestore';
import { formatRelativeTime } from '@/lib/jobFormatters';

function getUpdateIcon(type?: string) {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('job')) return Briefcase;
  if (normalized.includes('service') || normalized.includes('product')) return PackagePlus;
  if (normalized.includes('business') || normalized.includes('company')) return Building2;
  return Megaphone;
}

function getUpdateTone(type?: string) {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('job')) return 'bg-amber-500/10 border border-amber-500/20 text-amber-400';
  if (normalized.includes('service') || normalized.includes('product')) return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
  if (normalized.includes('business') || normalized.includes('company')) return 'bg-blue-500/10 border border-blue-500/20 text-blue-400';
  return 'bg-rose-500/10 border border-rose-500/20 text-rose-400';
}

export default function BusinessUpdates() {
  const { data: logs, loading } = useCollection<any>('activityLogs', [
    orderBy('createdAt', 'desc'),
    limit(4),
  ]);

  const updates = logs.map((log) => ({
    id: log.id,
    type: log.type || log.category || 'Update',
    title: log.action || log.title || 'Platform update',
    company: log.target || log.userName || log.targetName || 'THENIJOBS',
    time: formatRelativeTime(log.createdAt),
    href: log.actionUrl || log.href || '/jobs',
    icon: getUpdateIcon(log.type || log.action),
    tone: getUpdateTone(log.type || log.action),
  }));

  return (
    <section className="px-4 py-12 sm:px-6 bg-[#0a0a1a]">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-md sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <TrendingUp size={16} />
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-400">Business Feed</p>
              </div>
              <h2 className="font-outfit text-2xl font-black text-white sm:text-3xl tracking-tight">
                Latest Company Updates
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Real platform activity from jobs, services, leads and business approvals.
              </p>
            </div>
            <Link
              href="/jobs"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 shrink-0"
            >
              View jobs <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : updates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
              <h3 className="font-outfit text-lg font-bold text-white">No updates yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                Approved jobs, company changes and service updates will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {updates.map((update) => {
                const Icon = update.icon;
                return (
                  <Link
                    key={update.id}
                    href={update.href}
                    className="group flex gap-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-violet-500/30 hover:bg-white/[0.04] p-4 transition-all duration-300 relative overflow-hidden"
                  >
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${update.tone} group-hover:scale-105 transition-transform`}>
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1.5 inline-flex rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-bold text-slate-300">
                        {update.type}
                      </span>
                      <span className="block line-clamp-1 text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                        {update.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span>{update.company}</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock size={11} />
                          {update.time}
                        </span>
                      </span>
                    </span>
                    <ArrowRight size={14} className="mt-1 shrink-0 text-slate-500 group-hover:text-violet-400 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
