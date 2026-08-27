'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, Briefcase, Building2, Users, ArrowRight
} from 'lucide-react';
import { useRealtimeCount } from '@/hooks/useRealtimeStats';
import { where } from 'firebase/firestore';

const DISTRICTS = [
  'All Tamil Nadu', 'Theni', 'Madurai', 'Dindigul', 'Virudhunagar',
  'Tirunelveli', 'Coimbatore', 'Chennai', 'Trichy', 'Salem'
];

const popularTags = [
  'Software Engineer', 'Accountant', 'Driver', 'Teacher', 'Nurse',
  'Sales Executive', 'Electrician', 'Data Entry', 'Field Work'
];

const heroStats = [
  { label: 'Active Jobs', icon: Briefcase, color: '#2563EB', bg: '#EFF6FF' },
  { label: 'Verified Companies', icon: Building2, color: '#10B981', bg: '#ECFDF5' },
  { label: 'Job Seekers', icon: Users, color: '#F59E0B', bg: '#FFFBEB' },
];

export default function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('All Tamil Nadu');

  const { count: jobCount, loading: jobLoading } = useRealtimeCount('jobs', [where('status', '==', 'active')]);
  const { count: companyCount, loading: companyLoading } = useRealtimeCount('companies', [where('verificationStatus', '==', 'verified')]);
  const { count: seekerCount, loading: seekerLoading } = useRealtimeCount('users', [where('role', '==', 'seeker')]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (district && district !== 'All Tamil Nadu') params.set('location', district);
    router.push(`/jobs?${params.toString()}`);
  };

  // Only show stats that have real data (count > 0)
  const statsData = [
    { count: jobCount, loading: jobLoading },
    { count: companyCount, loading: companyLoading },
    { count: seekerCount, loading: seekerLoading },
  ];

  return (
    <section className="relative overflow-hidden pt-6 sm:pt-10 pb-8 sm:pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background */}
      <div className="absolute inset-0 -z-10" style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 55%, #FFFBEB 100%)'
      }} />
      <div className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(37,99,235,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(16,185,129,0.07) 0%, transparent 50%)'
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Left content */}
          <div className="flex-1 text-center lg:text-left">
            {/* Top badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-4 shadow-xs">
              <span aria-hidden="true">🎯</span>
              Theni&apos;s Local Job &amp; Business Platform
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold leading-tight text-slate-900 mb-4"
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

            <p className="text-base sm:text-lg text-slate-700 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Discover verified jobs, trusted employers and local opportunities across
              Theni, Cumbum, Periyakulam, Bodinayakanur, Madurai, Dindigul and surrounding areas.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto lg:mx-0 mb-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Job title, skills, or company (e.g. Sales, Driver, IT)..."
                  className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-gray-300 rounded-xl text-[#0F172A] placeholder-gray-500 text-sm focus:border-blue-600 focus:outline-none focus:ring-0 shadow-sm transition-all"
                  aria-label="Search jobs by title, skills, or company"
                />
              </div>
              <div className="relative sm:w-48">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <select
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full pl-9 pr-3 py-3.5 bg-white border-2 border-gray-300 rounded-xl text-[#0F172A] font-medium text-sm focus:border-blue-600 focus:outline-none appearance-none shadow-sm cursor-pointer"
                  aria-label="Select location"
                >
                  {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                </select>
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

            {/* Secondary CTA */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-5">
              <Link
                href="/employer/post-job"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all bg-white"
              >
                Post a Job <ArrowRight size={14} />
              </Link>
              <Link
                href="/register-business"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 transition-all bg-white"
              >
                Register Your Business
              </Link>
            </div>

            {/* Popular tags */}
            <div className="flex flex-wrap gap-2 items-center justify-center lg:justify-start">
              <span className="text-xs text-slate-700 font-bold self-center">Popular:</span>
              {popularTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => { setQuery(tag); }}
                  className="px-3.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-full text-slate-800 hover:border-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all shadow-xs cursor-pointer"
                  style={{ color: '#1E293B' }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right — Stats cards */}
          <div className="flex-shrink-0 w-full lg:w-72 xl:w-80">
            <div className="grid gap-3">
              {heroStats.map((stat, i) => {
                const Icon = stat.icon;
                const { count, loading } = statsData[i];

                // Hide card if data finished loading and count is 0
                if (!loading && count === 0) return null;

                return (
                  <div key={i} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: stat.bg }}>
                      <Icon size={22} style={{ color: stat.color }} />
                    </div>
                    <div>
                      {loading ? (
                        <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          {count.toLocaleString('en-IN')}+
                        </p>
                      )}
                      <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Quick action chips */}
        <div className="mt-10 flex flex-wrap items-center gap-3 justify-center">
          {[
            { label: '🏢 Browse Companies', href: '/businesses' },
            { label: '⚡ Daily Jobs', href: '/jobs?type=daily' },
            { label: '🏠 Work From Home', href: '/jobs?type=remote' },
            { label: '📋 Walk-in Jobs', href: '/jobs?type=walkin' },
            { label: '🎓 Internships', href: '/jobs?type=internship' },
            { label: '🏭 Services', href: '/services' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 bg-white border border-slate-300 rounded-full text-xs sm:text-sm font-bold text-slate-800 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all shadow-xs"
              style={{ color: '#1E293B' }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
