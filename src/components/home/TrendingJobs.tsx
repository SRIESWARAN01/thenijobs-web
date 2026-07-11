'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Briefcase,
  Clock,
  MapPin,
  Sprout,
  Star,
  Zap,
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { where, limit, orderBy } from 'firebase/firestore';
import { formatJobType, formatRelativeTime } from '@/lib/jobFormatters';
import { isPublicJobVisible } from '@/lib/jobPolicy';

interface TrendingJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  posted: string;
  category: string;
  isUrgent: boolean;
  isPremium: boolean;
  skills: string[];
  isPromoted?: boolean;
  companyLogo?: string;
}

const getCategoryIcon = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'agriculture':
      return Sprout;
    case 'finance':
    case 'accounts':
      return Banknote;
    case 'education':
      return BadgeCheck;
    case 'it & software':
      return Briefcase;
    default:
      return Briefcase;
  }
};

export default function TrendingJobs() {
  const { data: dbJobs, loading } = useCollection<any>('jobs', [
    where('isActive', '==', true),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(20)
  ]);

  const jobsList: TrendingJob[] = useMemo(() => {
    // Sort so promoted jobs appear first
    const sorted = [...dbJobs].sort((a: any, b: any) => {
      const aProm = a.isPromoted || false;
      const bProm = b.isPromoted || false;
      if (aProm && !bProm) return -1;
      if (!aProm && bProm) return 1;
      return 0; // maintain Firestore orderBy('createdAt', 'desc') sorting
    });

    return sorted
      .filter((d: any) => isPublicJobVisible(d))
      .slice(0, 6)
      .map((d: any) => {
        const salaryStr = d.salaryMin && d.salaryMax
          ? `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')}`
          : 'Salary Negotiable';

        return {
          id: d.id,
          title: d.title || '',
          company: d.companyName || 'Verified Employer',
          location: d.location || d.district || 'Theni',
          salary: salaryStr,
          type: formatJobType(d.jobType),
          posted: formatRelativeTime(d.createdAt),
          isUrgent: d.isUrgent || false,
          isPremium: d.isPremium || false,
          category: d.category || '',
          skills: d.skills || [],
          isPromoted: d.isPromoted || false,
          companyLogo: d.companyLogo || d.logoUrl || '',
        };
      });
  }, [dbJobs]);

  return (
    <section className="px-4 py-12 sm:px-6 relative overflow-hidden bg-theme-main border-b border-theme text-theme-body">
      <div className="mx-auto max-w-6xl relative z-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-theme-primary">Latest Jobs</p>
            <h2 className="mt-1 font-outfit text-2xl font-black text-white sm:text-3xl tracking-tight">
              Latest Career Opportunities
            </h2>
            <p className="mt-1 text-sm text-slate-400">Verified local openings from top employers.</p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-theme bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            View all jobs <ArrowRight size={14} />
          </Link>
        </div>

        {loading && dbJobs.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)]"></div>
          </div>
        ) : jobsList.length === 0 ? (
          <div className="rounded-2xl border border-theme bg-white/[0.01] p-8 text-center backdrop-blur-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-theme-card text-theme-primary">
              <Briefcase size={24} />
            </div>
            <h3 className="mt-4 font-outfit text-lg font-bold text-white">No live jobs yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-450">
              Approved jobs from local employers will appear here as soon as they are posted.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {jobsList.map((job) => {
              const Icon = getCategoryIcon(job.category);
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group rounded-2xl border border-theme bg-theme-card hover:border-[var(--theme-primary)]/30 hover:bg-white/[0.05] p-5 shadow-xl transition-all duration-300 flex flex-col justify-between h-full relative"
                >
                  <div>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        {job.companyLogo ? (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-theme overflow-hidden group-hover:scale-105 transition-transform duration-300">
                            <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling && ((e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-sm font-black text-[var(--theme-primary)]">${(job.company || 'C').substring(0, 2).toUpperCase()}</span>`); }} />
                          </span>
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-primary)]/10 text-theme-primary group-hover:scale-105 transition-transform duration-300">
                            <Icon size={20} />
                          </span>
                        )}
                        <div className="min-w-0">
                          <h3 className="line-clamp-1 text-base font-bold text-white group-hover:text-[var(--theme-primary)] transition-colors">
                            {job.title}
                          </h3>
                          <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-450">{job.company}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {job.isUrgent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-wide">
                            <Zap size={9} className="fill-current" /> Urgent
                          </span>
                        )}
                        {job.isPremium && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-primary)]/15 border border-[var(--theme-primary)]/30 px-2 py-0.5 text-[9px] font-bold text-theme-primary uppercase tracking-wide">
                            <Star size={9} className="fill-current" /> Premium
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {job.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="rounded-full bg-white/5 border border-theme px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="grid gap-2 border-t border-theme pt-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-2">
                        <MapPin size={13} className="text-theme-primary" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-2">
                        <Banknote size={13} className="text-emerald-400" />
                        {job.salary}
                      </span>
                      <span className="flex items-center gap-2 text-slate-500">
                        <Clock size={13} />
                        {job.posted} - {job.type}
                      </span>
                    </div>

                    <div className="mt-5 flex min-h-10 items-center justify-center rounded-xl btn-theme-primary text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer">
                      Apply Now
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
