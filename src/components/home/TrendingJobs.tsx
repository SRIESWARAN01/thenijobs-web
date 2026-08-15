'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Briefcase, BadgeCheck, MapPin, Clock,
  ArrowRight, ChevronRight, Zap
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  experience: string;
  education: string;
  posted: string;
  logo: string;
  isUrgent: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  category: string;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'Full Time':   { bg: '#EFF6FF', text: '#2563EB' },
  'Part Time':   { bg: '#F0FDF4', text: '#16A34A' },
  'Remote':      { bg: '#F5F3FF', text: '#7C3AED' },
  'Walk-in':     { bg: '#FFFBEB', text: '#D97706' },
  'Internship':  { bg: '#FFF1F2', text: '#E11D48' },
  'Contract':    { bg: '#F0F9FF', text: '#0284C7' } };

function JobCard({ job }: { job: Job }) {
  const typeStyle = TYPE_COLORS[job.type] || TYPE_COLORS['Full Time'];

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 hover:border-blue-200 hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Logo */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-base flex-shrink-0">
            {job.logo?.startsWith('http') ? (
              <img src={job.logo} alt={job.company} className="w-full h-full object-cover rounded-xl" />
            ) : (
              job.logo || job.company?.[0] || 'C'
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {job.title}
              </h3>
              {job.isVerified && (
                <BadgeCheck size={14} className="text-emerald-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{job.company}</p>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {job.isFeatured && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                style={{ background: '#EFF6FF', color: '#2563EB' }}>
                FEATURED
              </span>
            )}
            {job.isUrgent && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                style={{ background: '#FFFBEB', color: '#D97706' }}>
                URGENT
              </span>
            )}
          </div>
        </div>

        {/* Salary */}
        <p className="text-base font-bold mb-2.5" style={{ color: '#10B981' }}>
          {job.salary || 'Salary Negotiable'}
        </p>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="px-2.5 py-1 text-[11px] font-medium rounded-full border"
            style={{ background: typeStyle.bg, color: typeStyle.text, borderColor: 'transparent' }}>
            {job.type}
          </span>
          {job.experience && (
            <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-50 text-gray-600 border border-gray-100">
              {job.experience}
            </span>
          )}
          {job.education && (
            <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-50 text-gray-600 border border-gray-100">
              {job.education}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <MapPin size={11} />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Clock size={11} />
            <span>{job.posted}</span>
          </div>
          <button
            onClick={e => e.preventDefault()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-900 rounded-lg transition-all hover:opacity-90"
            style={{ background: '#2563EB' }}
          >
            Apply
          </button>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="w-11 h-11 bg-gray-100 rounded-xl flex-shrink-0" />
        <div className="flex-1">
          <div className="h-3.5 bg-gray-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
      <div className="flex gap-2 mb-3">
        <div className="h-6 bg-gray-100 rounded-full w-16" />
        <div className="h-6 bg-gray-100 rounded-full w-16" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-100 rounded w-20" />
        <div className="h-7 bg-gray-100 rounded-lg w-16" />
      </div>
    </div>
  );
}

export default function TrendingJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, 'jobs'),
          where('isActive', '==', true),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => {
          const d = doc.data();
          const salaryStr = d.salaryMin && d.salaryMax
            ? `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')}/mo`
            : 'Salary Negotiable';
          const typeMap: Record<string, string> = {
            full_time: 'Full Time', part_time: 'Part Time', remote: 'Remote',
            contract: 'Contract', internship: 'Internship', walk_in: 'Walk-in'
          };
          const formatTime = (ts: any) => {
            if (!ts?.toMillis) return 'Recently';
            const diff = Date.now() - ts.toMillis();
            const days = Math.floor(diff / 86400000);
            if (days === 0) return 'Today';
            if (days === 1) return 'Yesterday';
            if (days < 7) return `${days}d ago`;
            return `${Math.floor(days/7)}w ago`;
          };
          return {
            id: doc.id,
            title: d.title || '',
            company: d.companyName || 'Company',
            location: d.district || d.location || 'Theni',
            salary: salaryStr,
            type: typeMap[d.jobType] || 'Full Time',
            experience: d.experience || '',
            education: d.education || '',
            posted: formatTime(d.createdAt),
            logo: d.logo || d.companyName?.[0]?.toUpperCase() || 'C',
            isUrgent: d.isUrgent || false,
            isFeatured: d.isFeatured || false,
            isVerified: d.isVerified || false,
            category: d.category || '' } as Job;
        });
        setJobs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="py-14" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-semibold mb-2">
              <Zap size={11} className="fill-current" /> Latest Openings
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Trending Jobs Near You
            </h2>
            <p className="text-sm text-gray-500 mt-1">Freshly posted opportunities from verified employers</p>
          </div>
          <Link href="/jobs" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            View all <ChevronRight size={16} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : jobs.length > 0
              ? jobs.map(job => <JobCard key={job.id} job={job} />)
              : (
                <div className="col-span-3 text-center py-16">
                  <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No active jobs found</p>
                  <Link href="/employer/post-job" className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 font-semibold">
                    Post the first job <ArrowRight size={14} />
                  </Link>
                </div>
              )
          }
        </div>

        {/* CTA */}
        <div className="mt-8 text-center sm:hidden">
          <Link href="/jobs" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md" style={{ background: '#2563EB' }}>
            View All Jobs <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
