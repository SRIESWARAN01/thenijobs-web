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
  if (normalized.includes('job')) return 'bg-amber-50 text-amber-700';
  if (normalized.includes('service') || normalized.includes('product')) return 'bg-emerald-50 text-emerald-700';
  if (normalized.includes('business') || normalized.includes('company')) return 'bg-blue-50 text-blue-700';
  return 'bg-rose-50 text-rose-700';
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
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <TrendingUp size={18} />
                </span>
                <p className="text-xs font-black uppercase text-teal-700">Business Feed</p>
              </div>
              <h2 className="font-outfit text-2xl font-black text-slate-950 sm:text-3xl">
                Latest company updates
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Real platform activity from jobs, services, leads and business approvals.
              </p>
            </div>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-50"
            >
              View jobs <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : updates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <h3 className="font-outfit text-lg font-black text-slate-950">No updates yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">
                Approved jobs, company changes and service updates will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {updates.map((update) => {
                const Icon = update.icon;
                return (
                  <Link
                    key={update.id}
                    href={update.href}
                    className="group flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-teal-200 hover:bg-teal-50/50"
                  >
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${update.tone}`}>
                      <Icon size={21} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200">
                        {update.type}
                      </span>
                      <span className="block line-clamp-1 text-sm font-black text-slate-950 group-hover:text-teal-800">
                        {update.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
                        <span>{update.company}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {update.time}
                        </span>
                      </span>
                    </span>
                    <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300 group-hover:text-teal-700" />
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
