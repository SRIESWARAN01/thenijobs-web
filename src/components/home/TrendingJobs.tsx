'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Briefcase, BadgeCheck, MapPin, Clock,
  ArrowRight, ChevronRight, Zap, Flame, Sparkles
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

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
  trendingScore: number;
  viewCount: number;
  applicationCount: number;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'Full Time':   { bg: '#EFF6FF', text: '#2563EB' },
  'Part Time':   { bg: '#F0FDF4', text: '#16A34A' },
  'Remote':      { bg: '#F5F3FF', text: '#7C3AED' },
  'Walk-in':     { bg: '#FFFBEB', text: '#D97706' },
  'Internship':  { bg: '#FFF1F2', text: '#E11D48' },
  'Contract':    { bg: '#F0F9FF', text: '#0284C7' }
};

function JobCard({ job, rank }: { job: Job; rank: number }) {
  const typeStyle = TYPE_COLORS[job.type] || TYPE_COLORS['Full Time'];

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="bg-white border-2 border-gray-100 rounded-3xl p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group-hover:-translate-y-1 relative flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* Logo */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0 shadow-xs">
              {job.logo?.startsWith('http') ? (
                <img src={job.logo} alt={job.company} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                job.logo || job.company?.[0] || 'C'
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                  {job.title}
                </h3>
                {job.isVerified && (
                  <BadgeCheck size={14} className="text-emerald-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{job.company}</p>
            </div>

            {/* Trending rank badge */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs flex items-center gap-1">
                <Flame size={11} className="fill-white" /> #{rank}
              </span>
            </div>
          </div>

          {/* Salary */}
          <p className="text-base font-black mb-2.5 text-emerald-600">
            {job.salary || 'Salary Negotiable'}
          </p>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full"
              style={{ background: typeStyle.bg, color: typeStyle.text }}>
              {job.type}
            </span>
            {job.experience && (
              <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-100">
                {job.experience}
              </span>
            )}
            {job.education && (
              <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-100">
                {job.education}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin size={12} className="text-gray-500" />
            <span className="truncate">{job.location}</span>
            <span>·</span>
            <Clock size={12} className="text-gray-500" />
            <span>{job.posted}</span>
          </div>
          <span className="px-3.5 py-1.5 text-xs font-bold text-white rounded-xl bg-blue-600 group-hover:bg-blue-700 transition-all shadow-xs flex items-center gap-1">
            Apply <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 animate-pulse space-y-3">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-4 bg-gray-100 rounded w-1/3" />
      <div className="flex gap-2">
        <div className="h-6 bg-gray-100 rounded-full w-16" />
        <div className="h-6 bg-gray-100 rounded-full w-16" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-3 bg-gray-100 rounded w-20" />
        <div className="h-7 bg-gray-100 rounded-xl w-16" />
      </div>
    </div>
  );
}

const INITIAL_TRENDING_JOBS: Job[] = [
  {
    id: 'demo-1',
    title: 'Senior Software Engineer (Full Stack)',
    company: 'Digital Theni Solutions',
    location: 'Theni Main, Theni',
    salary: '₹35,000 - ₹55,000/mo',
    type: 'Full Time',
    experience: '2 - 4 Yrs',
    education: 'B.E / B.Tech / MCA',
    posted: 'Today',
    logo: '',
    isUrgent: true,
    isFeatured: true,
    isVerified: true,
    category: 'IT & Software',
    trendingScore: 100,
    viewCount: 150,
    applicationCount: 24,
  },
  {
    id: 'demo-2',
    title: 'Hospital Operations Manager',
    company: 'AM Siddha Hospital',
    location: 'Cumbum, Theni',
    salary: '₹25,000 - ₹40,000/mo',
    type: 'Full Time',
    experience: '1 - 3 Yrs',
    education: 'Any Degree / MBA',
    posted: 'Today',
    logo: '',
    isUrgent: false,
    isFeatured: true,
    isVerified: true,
    category: 'Healthcare & Hospital',
    trendingScore: 92,
    viewCount: 120,
    applicationCount: 18,
  },
  {
    id: 'demo-3',
    title: 'Automobile Service Advisor & Technicians',
    company: 'Classic Honda',
    location: 'Periyakulam, Theni',
    salary: '₹18,000 - ₹28,000/mo',
    type: 'Full Time',
    experience: 'Fresher - 2 Yrs',
    education: 'ITI / Diploma / BE',
    posted: '1d ago',
    logo: '',
    isUrgent: true,
    isFeatured: false,
    isVerified: true,
    category: 'Automobile & Transport',
    trendingScore: 88,
    viewCount: 95,
    applicationCount: 15,
  },
  {
    id: 'demo-4',
    title: 'Site Civil Engineer & Supervisor',
    company: 'Kudil Construction',
    location: 'Cumbum, Theni',
    salary: '₹22,000 - ₹35,000/mo',
    type: 'Full Time',
    experience: '1 - 5 Yrs',
    education: 'DCE / B.E Civil',
    posted: '1d ago',
    logo: '',
    isUrgent: false,
    isFeatured: true,
    isVerified: true,
    category: 'Construction & Real Estate',
    trendingScore: 84,
    viewCount: 88,
    applicationCount: 12,
  },
  {
    id: 'demo-5',
    title: 'Senior Accountant & GST Executive',
    company: 'GST Tax Office',
    location: 'Theni, Tamil Nadu',
    salary: '₹20,000 - ₹30,000/mo',
    type: 'Full Time',
    experience: '2+ Yrs',
    education: 'B.Com / M.Com / Tally',
    posted: '2d ago',
    logo: '',
    isUrgent: false,
    isFeatured: false,
    isVerified: true,
    category: 'Banking & Finance',
    trendingScore: 78,
    viewCount: 76,
    applicationCount: 11,
  },
  {
    id: 'demo-6',
    title: 'PGT / TGT Mathematics & Science Teacher',
    company: 'Velammal Matriculation Higher Secondary School',
    location: 'Theni, Tamil Nadu',
    salary: '₹25,000 - ₹38,000/mo',
    type: 'Full Time',
    experience: '1+ Yrs',
    education: 'B.Sc / M.Sc / B.Ed',
    posted: '2d ago',
    logo: '',
    isUrgent: true,
    isFeatured: true,
    isVerified: true,
    category: 'Education & Training',
    trendingScore: 75,
    viewCount: 70,
    applicationCount: 9,
  },
];

export default function TrendingJobs() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_TRENDING_JOBS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
    }, 8000);

    async function load() {
      try {
        const q = query(
          collection(db, 'jobs'),
          where('isActive', '==', true),
          where('status', '==', 'active'),
          limit(8)
        );
        const snap = await getDocs(q);
        if (cancelled) return;

        const typeMap: Record<string, string> = {
          full_time: 'Full Time', part_time: 'Part Time', remote: 'Remote',
          contract: 'Contract', internship: 'Internship', walk_in: 'Walk-in',
          fresher: 'Fresher'
        };

        const formatTime = (ts: any) => {
          if (!ts?.toMillis) return 'Recently';
          const diff = Date.now() - ts.toMillis();
          const days = Math.floor(diff / 86400000);
          if (days === 0) return 'Today';
          if (days === 1) return 'Yesterday';
          if (days < 7) return `${days}d ago`;
          return `${Math.floor(days / 7)}w ago`;
        };

        const calculatedJobs: Job[] = snap.docs.map(doc => {
          const d = doc.data();
          const salaryStr = d.salaryMin && d.salaryMax
            ? `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')}/mo`
            : d.salary || 'Salary Negotiable';

          const views = d.viewCount || d.views || 0;
          const applications = d.applicationCount || d.applications || 0;
          const saves = d.saveCount || d.savedCount || 0;
          const recencyDays = Math.max(0, (Date.now() - (d.createdAt?.toMillis?.() || Date.now())) / 86400000);
          const recencyBoost = Math.max(0, 50 - recencyDays * 4);

          // Real dynamic trending activity formula
          const trendingScore = (views * 1.5) + (applications * 10) + (saves * 4) + recencyBoost + (d.isUrgent ? 25 : 0) + (d.isFeatured ? 20 : 0);

          return {
            id: doc.id,
            title: d.title || 'Untitled Job',
            company: d.companyName || d.company || 'Direct Employer',
            location: d.district ? `${d.district}, Theni` : d.location || 'Theni',
            salary: salaryStr,
            type: typeMap[d.jobType] || d.type || 'Full Time',
            experience: d.experience || '',
            education: d.education || '',
            posted: formatTime(d.createdAt),
            logo: d.logoUrl || d.logo || '',
            isUrgent: !!d.isUrgent,
            isFeatured: !!d.isFeatured,
            isVerified: d.isVerified ?? true,
            category: d.category || 'General',
            trendingScore,
            viewCount: views,
            applicationCount: applications,
          };
        });

        // Sort descending by calculated dynamic trending score
        calculatedJobs.sort((a, b) => b.trendingScore - a.trendingScore);

        setJobs(calculatedJobs.slice(0, 6));
      } catch (err) {
        console.error('Failed to load trending jobs:', err);
        if (!cancelled) setError(true);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  return (
    <section className="py-14 sm:py-20 bg-slate-50 relative overflow-hidden font-outfit">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-extrabold uppercase tracking-wider mb-2.5">
              <Flame size={13} className="fill-orange-600 text-orange-600" />
              🔥 Updated Daily
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Latest &amp; Trending Jobs
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              Recently posted and popular job opportunities in Theni
            </p>
          </div>

          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-800 text-xs font-bold hover:bg-gray-100 hover:border-gray-300 transition-all shadow-xs shrink-0"
          >
            <span>Explore All Jobs</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : error ? (
            <div className="col-span-full py-12 text-center">
              <Briefcase size={36} className="mx-auto mb-2 text-slate-500" />
              <p className="text-sm font-semibold text-gray-600 mb-3">Something went wrong loading jobs</p>
              <button
                onClick={() => { setError(false); setLoading(true); window.location.reload(); }}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <Briefcase size={36} className="mx-auto mb-2 text-slate-500" />
              <p className="text-sm font-semibold text-gray-600 mb-1">No active jobs right now</p>
              <p className="text-xs text-gray-500 mb-4">Check back soon or post a job to get started</p>
              <a href="/employer/post-job" className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                Post a Job
              </a>
            </div>
          ) : (
            jobs.map((job, idx) => (
              <JobCard key={job.id} job={job} rank={idx + 1} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
