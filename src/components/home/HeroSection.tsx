'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// `query` is aliased: this component already has a `query` state for the search box, and the
// unaliased import silently shadowed it — tsc caught it as "Type 'String' has no call
// signatures" rather than it reaching a browser.
import { collection, getCountFromServer, query as fsQuery, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Search, MapPin, Briefcase, Building2, ArrowRight, SlidersHorizontal,
  Target, Zap, Home, ClipboardList, GraduationCap, Wrench, PlusCircle, Store,
} from 'lucide-react';

const DISTRICTS = [
  'All Tamil Nadu', 'Theni', 'Madurai', 'Dindigul', 'Virudhunagar',
  'Tirunelveli', 'Coimbatore', 'Chennai', 'Trichy', 'Salem'
];

const popularTags = [
  'Software Engineer', 'Accountant', 'Driver', 'Teacher', 'Nurse', 'Sales Executive',
];

const quickActions = [
  { label: 'Companies', href: '/businesses', icon: Building2 },
  { label: 'Daily Jobs', href: '/jobs?type=daily', icon: Zap },
  { label: 'Work From Home', href: '/jobs?type=remote', icon: Home },
  { label: 'Walk-in Jobs', href: '/jobs?type=walkin', icon: ClipboardList },
  { label: 'Internships', href: '/jobs?type=internship', icon: GraduationCap },
  { label: 'Services', href: '/services', icon: Wrench },
];

// TRUST-2: the 'Job Seekers' card was removed rather than made accurate. Counting `users`
// needs a read the security rules restrict to the owner and admins, correctly, so there is no
// honest number a visitor could be shown — and an invented one is what this phase exists to
// remove. Two cards that are true beat three where one is decoration.
const heroStats = [
  { label: 'Active Jobs', icon: Briefcase, color: '#2563EB', bg: '#EFF6FF' },
  { label: 'Verified Companies', icon: Building2, color: '#10B981', bg: '#ECFDF5' },
];

export default function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('All Tamil Nadu');

  // TRUST-2: these were `useState(500)`, `useState(190)` and `useState(1200)` — constants with
  // no setter, beside a `statsLoading` pinned to false so they rendered as figures that had
  // finished loading. Measured against production on 2026-09-05: 2 active jobs and 104 verified
  // companies. The page was telling every visitor there were 500+ jobs when there were two.
  //
  // Both counts below are aggregation queries an ANONYMOUS visitor is allowed to run: the jobs
  // read rule permits `status == 'active'` and the companies rule permits
  // `verificationStatus == 'verified'`, so each query carries the constraint its rule needs to
  // be provable. getCountFromServer bills one read per thousand documents rather than reading
  // the documents, so this costs less than the list it sits beside.
  const [jobCount, setJobCount] = useState<number | null>(null);
  const [companyCount, setCompanyCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [jobs, companies] = await Promise.all([
          getCountFromServer(fsQuery(collection(db, 'jobs'), where('status', '==', 'active'))),
          getCountFromServer(fsQuery(collection(db, 'companies'), where('verificationStatus', '==', 'verified'))),
        ]);
        if (cancelled) return;
        setJobCount(jobs.data().count);
        setCompanyCount(companies.data().count);
      } catch (err) {
        // A count that will not load is not worth guessing at. Leaving both null hides the
        // cards, which is the honest outcome and the one the render below already handles.
        console.error('[HeroSection] Could not load platform counts:', err);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (district && district !== 'All Tamil Nadu') params.set('location', district);
    router.push(`/jobs?${params.toString()}`);
  };

  const statsData = [
    { count: jobCount, loading: statsLoading },
    { count: companyCount, loading: statsLoading },
  ];

  return (
    <section className="relative isolate overflow-hidden pt-4 sm:pt-6 pb-8 sm:pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background — photo layer (graceful no-op if the file isn't there yet) + a
          left-to-right brand-gradient wash: opaque behind the text column for
          legibility, fading out toward the right where the photo should read clearly. */}
      <div className="absolute inset-0 -z-20 bg-cover bg-center opacity-90"
        style={{ backgroundImage: "url('/images/hero-bg.webp')", backgroundPosition: 'center 35%' }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10" style={{
        background: 'linear-gradient(100deg, rgba(248,250,252,0.97) 0%, rgba(248,250,252,0.9) 22%, rgba(248,250,252,0.62) 50%, rgba(248,250,252,0.42) 100%)'
      }} />
      <div className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(37,99,235,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(16,185,129,0.07) 0%, transparent 50%)'
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-14">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">

          {/* Left content */}
          <div className="flex-1 text-center lg:text-left w-full">
            {/* Top badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-3 sm:mb-4 shadow-xs">
              <Target size={13} className="text-blue-600" strokeWidth={2.25} />
              Theni&apos;s Local Job &amp; Business Platform
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold leading-tight text-slate-900 mb-3 sm:mb-4"
              style={{ fontFamily: "'Poppins', sans-serif" }}>
              Find the Right Job.{' '}
              <span className="block sm:inline" style={{
                background: 'linear-gradient(135deg, #2563EB, #10B981)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: '#2563EB'
              }}>Hire Local Talent.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-700 mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Discover verified jobs, trusted employers and local opportunities across
              Theni, Cumbum, Periyakulam, Bodinayakanur, Madurai, Dindigul and surrounding areas.
            </p>

            {/* Search bar — search + location + a real filter affordance */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto lg:mx-0 mb-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Job title, skills, or company (e.g. Sales, Driver, IT)..."
                  className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-gray-300 rounded-xl text-[#0F172A] placeholder-gray-500 text-base sm:text-sm focus:border-blue-600 focus:outline-none focus:ring-0 shadow-sm transition-all"
                  aria-label="Search jobs by title, skills, or company"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-none sm:w-44">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full pl-9 pr-3 py-3.5 bg-white border-2 border-gray-300 rounded-xl text-[#0F172A] font-medium text-base sm:text-sm focus:border-blue-600 focus:outline-none appearance-none shadow-sm cursor-pointer"
                    aria-label="Select location"
                  >
                    {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <Link
                  href="/jobs"
                  aria-label="More filters"
                  title="More filters"
                  className="shrink-0 w-[52px] flex items-center justify-center rounded-xl border-2 border-gray-300 bg-white text-slate-600 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
                >
                  <SlidersHorizontal size={17} />
                </Link>
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-95 shadow-md flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98] cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
              >
                <Search size={16} />
                Find Jobs
              </button>
            </form>

            {/* Primary / secondary CTA — Post a Job is the primary action (solid),
                Register Your Business is secondary (soft/tinted) */}
            <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start mb-5">
              <Link
                href="/employer/post-job"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
              >
                <PlusCircle size={15} /> Post a Job <ArrowRight size={14} />
              </Link>
              <Link
                href="/register-business"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all"
              >
                <Store size={15} /> Register Your Business
              </Link>
            </div>

            {/* Popular tags — curated, single row, scrolls on mobile instead of wrapping */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar justify-start lg:justify-start -mx-4 px-4 lg:mx-0 lg:px-0">
              <span className="text-xs text-slate-700 font-bold shrink-0">Popular:</span>
              {popularTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => { setQuery(tag); }}
                  className="shrink-0 px-3.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-full text-slate-800 hover:border-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right — Stats cards */}
          <div className="flex-shrink-0 w-full lg:w-72 xl:w-80">
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2.5 sm:gap-3">
              {heroStats.map((stat, i) => {
                const Icon = stat.icon;
                const { count, loading } = statsData[i];

                // Hidden when the count is zero or could not be loaded — the same branch that
                // already existed, now reachable for a real reason rather than never.
                if (!loading && !count) return null;

                return (
                  <div key={i} className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-4 bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 text-center lg:text-left">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: stat.bg }}>
                      <Icon size={20} style={{ color: stat.color }} />
                    </div>
                    <div>
                      {loading ? (
                        <div className="h-6 sm:h-7 w-14 sm:w-16 bg-gray-100 rounded animate-pulse mx-auto lg:mx-0" />
                      ) : (
                        <p className="text-lg sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          {/* TRUST-2: the trailing '+' is gone. These are exact counts, and a
                              plus sign on an exact number is its own small untruth. */}
                          {count?.toLocaleString('en-IN')}
                        </p>
                      )}
                      <p className="text-[11px] sm:text-sm text-gray-600 font-medium leading-tight">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Quick action chips — Lucide icons, soft-fill treatment matching bottom nav,
            single scrollable row on mobile instead of a wrapping tag cloud */}
        <div className="mt-6 sm:mt-10 flex items-center gap-2.5 overflow-x-auto no-scrollbar justify-start lg:justify-center -mx-4 px-4 lg:mx-0 lg:px-0">
          {quickActions.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-full text-xs sm:text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all shadow-xs whitespace-nowrap"
              >
                <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon size={12} className="text-blue-600" strokeWidth={2.25} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
