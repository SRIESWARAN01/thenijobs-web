'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Briefcase, MapPin, Clock, Banknote, CalendarCheck, Zap,
  Star, Loader2, ArrowRight, BadgeCheck
} from 'lucide-react';
import type { SeoJob } from './fetchSeoJobs';

interface SeoJobsLandingProps {
  title: string;
  subtitle: string;
  metaDescription: string;
  filterField: 'district' | 'jobType';
  filterValue: string;
  /** Server-fetched initial jobs for SSR. If provided, skips client-side fetch. */
  initialJobs?: SeoJob[];
}

export default function SeoJobsLanding({
  title,
  subtitle,
  metaDescription,
  filterField,
  filterValue,
  initialJobs,
}: SeoJobsLandingProps) {
  const [jobs, setJobs] = useState<SeoJob[]>(initialJobs || []);
  const [loading, setLoading] = useState(!initialJobs);

  // Only fetch client-side if no server-fetched data was provided (fallback)
  useEffect(() => {
    if (initialJobs && initialJobs.length > 0) return;
    // Dynamic import to avoid bundling Firestore in the client if SSR data is available
    import('firebase/firestore').then(async ({ collection, getDocs, query, where, orderBy, limit: fbLimit }) => {
      const { db } = await import('@/lib/firebase/config');
      const { isPublicJobVisible } = await import('@/lib/jobPolicy');
      try {
        setLoading(true);
        const jobsRef = collection(db, 'jobs');

        let q;
        if (filterField === 'district') {
          q = query(
            jobsRef,
            where('isActive', '==', true),
            where('district', '==', filterValue),
            orderBy('createdAt', 'desc'),
            fbLimit(40)
          );
        } else {
          q = query(
            jobsRef,
            where('isActive', '==', true),
            where('jobType', '==', filterValue),
            orderBy('createdAt', 'desc'),
            fbLimit(40)
          );
        }

        const snapshot = await getDocs(q);
        const fetched = snapshot.docs
          .filter(doc => isPublicJobVisible(doc.data()))
          .map(doc => {
            const d = doc.data();
            const salaryStr = d.salaryMin && d.salaryMax
              ? `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')}`
              : 'Salary Negotiable';

            const typeStr = d.jobType
              ? d.jobType.replace('_', ' ').split(' ').map((w: string) => w[0].toUpperCase() + w.substring(1)).join(' ')
              : 'Full Time';

            const timeDiff = d.createdAt ? (Date.now() - (d.createdAt.toMillis ? d.createdAt.toMillis() : new Date(d.createdAt).getTime())) : 0;
            const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const postedStr = daysAgo <= 0 ? 'Today' : `${daysAgo}d ago`;

            return {
              id: doc.id,
              title: d.title || '',
              company: d.companyName || 'Verified Employer',
              location: d.location || d.district || 'Theni',
              district: d.district || 'Theni',
              salary: salaryStr,
              type: typeStr,
              posted: postedStr,
              logo: d.logo || (d.companyName ? d.companyName.substring(0, 2).toUpperCase() : '💼'),
              isUrgent: d.isUrgent || false,
              isPremium: d.isPremium || false,
              isVerified: d.isVerified || d.companyVerificationStatus === 'verified' || d.companyVerified || false,
              verificationLevel: d.verificationLevel || d.companyVerificationLevel || 'free',
              description: d.description || '',
            };
          });

        setJobs(fetched);
      } catch (err) {
        console.error('Error fetching landing page jobs:', err);
      } finally {
        setLoading(false);
      }
    });
  }, [filterField, filterValue, initialJobs]);

  // Helper to render badge based on verification level
  const renderVerificationBadge = (level?: string) => {
    if (!level || level === 'free') return null;
    if (level === 'standard') {
      return <span title="Standard Verified Business"><BadgeCheck size={16} className="text-blue-400 fill-blue-400/10" /></span>;
    }
    if (level === 'premium') {
      return <span title="Premium Verified Business"><BadgeCheck size={16} className="text-amber-400 fill-amber-400/10" /></span>;
    }
    if (level === 'elite') {
      return (
        <span className="flex items-center gap-0.5">
          <span title="Elite Verified Business"><BadgeCheck size={16} className="text-violet-400 fill-violet-400/10" /></span>
          <span className="text-[10px] text-violet-400 font-extrabold" title="Elite Crown VIP">👑</span>
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 font-outfit">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 pb-32">
        {/* SEO Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-base text-gray-400 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Job Listings Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-200 border-b border-white/5 pb-2 flex items-center justify-between">
            <span>Featured & Recent Positions</span>
            <span className="text-xs text-cyan-400 font-normal">Active Job Offers ({jobs.length})</span>
          </h2>

          {loading ? (
            <div className="glass-card rounded-2xl p-16 text-center">
              <Loader2 size={36} className="animate-spin text-cyan-400 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Searching for jobs near {filterValue}...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-white mb-2">No matching jobs found</h3>
              <p className="text-gray-400 text-sm">We are currently updating listings. Check back shortly or view other regions.</p>
              <Link href="/jobs" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300">
                Browse All Jobs <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className="premium-card rounded-2xl p-5 group hover:border-white/10 transition-all bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center font-bold text-white text-lg flex-shrink-0 group-hover:border-cyan-500/30 transition-all">
                      {job.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link href={`/jobs/${job.id}`}>
                          <h3 className="text-sm font-bold text-white hover:text-cyan-400 transition-colors truncate">
                            {job.title}
                          </h3>
                        </Link>
                        {renderVerificationBadge(job.verificationLevel)}
                        {job.isUrgent && (
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-500/10 text-amber-400 flex items-center gap-0.5">
                            URGENT
                          </span>
                        )}
                        {job.isPremium && (
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-violet-500/10 text-violet-400">
                            PREMIUM
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
                        <span className="text-gray-300 font-semibold">{job.company}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><MapPin size={12} /> {job.location}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Clock size={12} /> {job.type}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Banknote size={12} /> {job.salary}</span>
                      </div>

                      <p className="text-xs text-gray-500 line-clamp-2 mt-2">
                        {job.description}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between flex-shrink-0">
                      <span className="text-[10px] text-gray-500 font-medium bg-white/[0.02] px-2 py-1 rounded-lg">
                        {job.posted}
                      </span>
                      <Link href={`/jobs/${job.id}`} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all">
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEO Cross Navigation Footer */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <h3 className="text-sm font-bold text-gray-300 mb-4">Popular Jobs in Tamil Nadu</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link href="/jobs/theni" className="text-xs text-gray-500 hover:text-cyan-400 transition-colors font-semibold">
              Jobs in Theni
            </Link>
            <Link href="/jobs/madurai" className="text-xs text-gray-500 hover:text-cyan-400 transition-colors font-semibold">
              Jobs in Madurai
            </Link>
            <Link href="/jobs/coimbatore" className="text-xs text-gray-500 hover:text-cyan-400 transition-colors font-semibold">
              Jobs in Coimbatore
            </Link>
            <Link href="/jobs/freshers" className="text-xs text-gray-500 hover:text-cyan-400 transition-colors font-semibold">
              Jobs for Freshers
            </Link>
            <Link href="/jobs/part-time" className="text-xs text-gray-500 hover:text-cyan-400 transition-colors font-semibold">
              Part-Time Jobs
            </Link>
            <Link href="/jobs" className="text-xs text-gray-500 hover:text-cyan-400 transition-colors font-semibold">
              All Tamil Nadu Jobs
            </Link>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
