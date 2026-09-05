'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import HomeFooter from '@/components/home/HomeFooter';
import BottomNav from '@/components/navigation/BottomNav';
import {
  MapPin, Briefcase, ChevronRight, Search, Building2,
  BadgeCheck, Banknote, ArrowRight, Zap, CheckCircle2
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit as fbLimit } from 'firebase/firestore';
import { LOCATIONS_DATA, CATEGORIES_LIST } from './locationData';

export default function LocationJobPageClient({ locationSlug }: { locationSlug: string }) {
  const loc = LOCATIONS_DATA[locationSlug] || {
    slug: locationSlug,
    name: locationSlug.charAt(0).toUpperCase() + locationSlug.slice(1),
    district: 'Theni',
    description: `Find the latest job vacancies in ${locationSlug}, Tamil Nadu with direct employer contact on THENIJOBS.`,
    highlights: ['Local business opportunities', 'Private & fresher jobs', 'Direct employer applications'],
  };

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'jobs'),
          where('isActive', '==', true),
          where('status', '==', 'active'),
          fbLimit(15)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const filtered = fetched.filter((j: any) => 
          (j.location && j.location.toLowerCase().includes(loc.slug)) ||
          (j.district && j.district.toLowerCase().includes(loc.slug)) ||
          (j.district && j.district.toLowerCase() === 'theni')
        );
        setJobs(filtered.length > 0 ? filtered : fetched.slice(0, 8));
      } catch (err) {
        console.error('Error loading location jobs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [loc.slug]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {/* Hero Header */}
      <section className="relative pt-20 pb-12 bg-gradient-to-b from-blue-50/70 to-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-blue-600 font-medium">Home</Link>
            <ChevronRight size={12} className="text-slate-500" />
            <Link href="/jobs" className="hover:text-blue-600 font-medium">Jobs</Link>
            <ChevronRight size={12} className="text-slate-500" />
            <span className="text-gray-900 font-semibold">Jobs in {loc.name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-bold mb-3">
                <MapPin size={12} className="text-blue-600" />
                {loc.name}, Tamil Nadu Job Portal
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Jobs in <span className="text-blue-600">{loc.name}</span>, Tamil Nadu
              </h1>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-normal">
                {loc.description}
              </p>
            </div>

            {/* Quick Search */}
            <div className="lg:w-80 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Looking for a specific role?</h2>
              <form action="/jobs" method="GET" className="space-y-3">
                <input type="hidden" name="location" value={loc.name} />
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    name="search"
                    placeholder="Search job title, skills..."
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Search Jobs in {loc.name}
                </button>
              </form>
            </div>
          </div>

          {/* Key Industry Chips */}
          <div className="mt-8 pt-6 border-t border-gray-200/80">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Top Hiring Sectors in {loc.name}:</h3>
            <div className="flex flex-wrap gap-2">
              {loc.highlights.map((h, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 shadow-xs">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Job Listings Column */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0F172A]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Latest Job Vacancies in {loc.name}
              </h2>
              <span className="text-xs font-semibold text-gray-500">
                {jobs.length} Active Listings
              </span>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500">Loading {loc.name} job vacancies...</p>
              </div>
            ) : jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block bg-white border border-gray-200 hover:border-blue-300 rounded-2xl p-5 transition-all hover:shadow-md group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {job.logo ? <img src={job.logo} alt="" className="w-12 h-12 rounded-xl object-contain" /> : <Building2 size={22} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {job.title}
                            </h3>
                            {job.isUrgent && (
                              <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                                <Zap size={10} className="fill-current" /> Urgent
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                            {job.companyName || 'Verified Employer'}
                            {job.isVerified && <BadgeCheck size={14} className="text-emerald-500" />}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1"><MapPin size={13} className="text-slate-500" /> {job.location || loc.name}</span>
                            <span className="flex items-center gap-1"><Banknote size={13} className="text-slate-500" /> {job.salaryMin ? `₹${job.salaryMin.toLocaleString('en-IN')} - ₹${(job.salaryMax || job.salaryMin).toLocaleString('en-IN')}/mo` : 'Best in Industry'}</span>
                            <span className="flex items-center gap-1"><Briefcase size={13} className="text-slate-500" /> {job.jobType || 'Full-time'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform whitespace-nowrap">
                        View Job <ArrowRight size={15} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center">
                <p className="text-gray-600 mb-4">No specific openings currently listed in {loc.name}. Check all Tamil Nadu jobs below.</p>
                <Link href="/jobs" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 inline-block">
                  Browse All Jobs
                </Link>
              </div>
            )}

            {/* SEO Content Box */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 space-y-4 mt-8">
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                How to Find Jobs in {loc.name} with THENIJOBS
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                THENIJOBS is dedicated to bridging local job seekers and businesses in {loc.name} and across Tamil Nadu. Whether you are a college fresher looking for your first role, a skilled driver, an accountant, or an experienced sales manager, our platform allows you to apply directly to verified employers without paying any fees.
              </p>
              <h3 className="text-base font-bold text-gray-900 pt-2">Popular Job Roles in {loc.name}:</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><span>✓</span> Fresher &amp; Graduate Jobs</li>
                <li className="flex items-center gap-2"><span>✓</span> Sales Executive &amp; Marketing</li>
                <li className="flex items-center gap-2"><span>✓</span> Accounts &amp; Tally Billing Staff</li>
                <li className="flex items-center gap-2"><span>✓</span> Hospital Staff &amp; Nursing</li>
                <li className="flex items-center gap-2"><span>✓</span> Driver, Logistics &amp; Delivery</li>
                <li className="flex items-center gap-2"><span>✓</span> Part-Time &amp; Work From Home</li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category Filter Links */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                Jobs by Category in {loc.name}
              </h3>
              <div className="space-y-1.5">
                {CATEGORIES_LIST.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/jobs-in-${loc.slug}/${cat.slug}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <span>{cat.name} in {loc.name}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">{cat.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Other Location Links */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                Jobs in Nearby Towns
              </h3>
              <div className="space-y-1.5">
                {Object.values(LOCATIONS_DATA).filter(l => l.slug !== loc.slug).map((other) => (
                  <Link
                    key={other.slug}
                    href={`/jobs-in-${other.slug}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <span>Jobs in {other.name}</span>
                    <ChevronRight size={13} className="text-slate-500" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <HomeFooter />
      <BottomNav />
    </main>
  );
}
