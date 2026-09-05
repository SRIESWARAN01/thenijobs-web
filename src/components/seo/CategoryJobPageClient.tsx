'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import HomeFooter from '@/components/home/HomeFooter';
import BottomNav from '@/components/navigation/BottomNav';
import {
  MapPin, Briefcase, ChevronRight, Search, Building2,
  BadgeCheck, Banknote, ArrowRight, Zap
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit as fbLimit } from 'firebase/firestore';

const PUBLIC_LIST_LIMIT = 500;
import { LOCATIONS_DATA, CATEGORIES_LIST } from './locationData';

// SEO-6: `.includes(categorySlug)` on raw job text let a two-letter slug like 'it' match
// anywhere the letters appeared together — 'hospitality', 'security' and 'kitchen' all
// contain the substring 'it', so a Hospitality, Security or Kitchen job could be listed on
// the IT & Software category page. Confirmed against the real category list: 'it' is a
// substring of both 'hospitality' and 'security'.
//
// A word-boundary match can only be STRICTER than `.includes()`, never looser: anything that
// matched as a whole word before still matches, and only mid-word accidents like the ones
// above are excluded. It does not fix recall (a job titled "Driver Required" still will not
// match the slug 'driving', because the two words share no substring at all) — that is a
// synonym-expansion problem, the kind /jobs/page.tsx solves with RULE_BASED_SYNONYMS, and it
// is a different, larger fix than the false-positive bug this one closes.
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
}
function matchesCategoryWord(text: string | undefined, categorySlug: string): boolean {
  if (!text) return false;
  return new RegExp(`\\b${escapeRegex(categorySlug)}\\b`, 'i').test(text);
}

// SEO-6: real job documents store jobType as 'full_time' / 'part_time' (underscore), while the
// category slugs in the URL and in CATEGORIES_LIST are 'full-time' / 'part-time' (hyphen).
// `.includes('full-time')` against 'full_time' never matches — confirmed against the live
// database, both real jobs are 'full_time'. So /jobs-in-*/full-time and /jobs-in-*/part-time
// could never show a job by jobType at all, only by an exact literal hyphen in a title, which
// no real title has. Comparing on the normalised form fixes that without loosening anything
// else: it is an exact-equality check, not a broader substring test.
// 'work-from-home' has no hyphen/underscore relationship to the raw value at all — the app's
// own jobType vocabulary (src/app/jobs/page.tsx:371-372) stores it as 'remote' or 'wfh'. This
// is the one explicit exception, grounded in that existing vocabulary rather than invented.
const JOB_TYPE_SLUG_ALIASES: Record<string, string[]> = {
  'work-from-home': ['remote', 'wfh'],
};
function jobTypeMatchesSlug(jobType: string | undefined, categorySlug: string): boolean {
  if (!jobType) return false;
  const normalized = jobType.toLowerCase().replace(/_/g, '-');
  if (normalized === categorySlug.toLowerCase()) return true;
  const aliases = JOB_TYPE_SLUG_ALIASES[categorySlug.toLowerCase()];
  return aliases ? aliases.includes(jobType.toLowerCase()) : false;
}

export default function CategoryJobPageClient({
  locationSlug,
  categorySlug,
}: {
  locationSlug: string;
  categorySlug: string;
}) {
  const loc = LOCATIONS_DATA[locationSlug] || {
    slug: locationSlug,
    name: locationSlug.charAt(0).toUpperCase() + locationSlug.slice(1),
    district: 'Theni',
    description: `Find jobs in ${locationSlug}`,
    highlights: [],
  };

  const catObj = CATEGORIES_LIST.find(c => c.slug === categorySlug);
  const catName = catObj?.name || (categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1));

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
          // SEO-6: was fbLimit(15). Filtering happens client-side after this fetch, so a
          // genuine match beyond the 15th most-recent job was silently missed. Matches
          // PUBLIC_LIST_LIMIT, the cap PERF-3 set on /jobs and /businesses for the same
          // reason: bounded, but generous enough that a real result isn't dropped before
          // the filter even sees it.
          fbLimit(PUBLIC_LIST_LIMIT)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // SEO-5: the location test used to end with `|| j.district === 'theni'`, which made
        // EVERY Theni job match EVERY location — so a Theni job appeared on the Madurai page,
        // the Dindigul page and every other one. And the line below used to read
        // `filtered.length > 0 ? filtered : fetched.slice(0, 6)`, so a page with no genuine
        // matches showed six unrelated jobs rather than admitting it had none.
        //
        // Together those made all 135 of these pages render the same list with a different
        // heading. /jobs-in-madurai/it and /jobs-in-madurai/driving listed the identical two
        // jobs, neither in Madurai and neither in either category.
        //
        // The empty state further down this file — "No specific {catName} openings in
        // {loc.name} right now." — was already written and simply unreachable behind that
        // fallback. Removing it is what makes the page tell the truth.
        const filtered = fetched.filter((j: any) => {
          const matchLoc = !locationSlug ||
            (j.location && j.location.toLowerCase().includes(locationSlug)) ||
            (j.district && j.district.toLowerCase().includes(locationSlug));
          const matchCat = matchesCategoryWord(j.title, categorySlug) ||
            matchesCategoryWord(j.category, categorySlug) ||
            jobTypeMatchesSlug(j.jobType, categorySlug);
          return matchLoc && matchCat;
        });
        setJobs(filtered);
      } catch (err) {
        console.error('Error loading category jobs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [locationSlug, categorySlug]);

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
            <Link href={`/jobs-in-${locationSlug}`} className="hover:text-blue-600 font-medium">Jobs in {loc.name}</Link>
            <ChevronRight size={12} className="text-slate-500" />
            <span className="text-gray-900 font-semibold">{catName}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-bold mb-3">
              <Briefcase size={12} className="text-blue-600" />
              {catName} in {loc.name}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {catName} Jobs in <span className="text-blue-600">{loc.name}</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-normal">
              Explore verified {catName.toLowerCase()} vacancies in {loc.name} and surrounding Tamil Nadu towns. View salary brackets, requirements, and apply directly to local hiring employers.
            </p>
          </div>
        </div>
      </section>

      {/* Job Listings Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0F172A]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Active {catName} Openings in {loc.name}
              </h2>
              <span className="text-xs font-semibold text-gray-500">{jobs.length} Listed</span>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500">Loading {catName} jobs in {loc.name}...</p>
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
                            <span className="flex items-center gap-1"><Banknote size={13} className="text-slate-500" /> {job.salaryMin ? `₹${job.salaryMin.toLocaleString('en-IN')} - ₹${(job.salaryMax || job.salaryMin).toLocaleString('en-IN')}/mo` : 'Competitive'}</span>
                            <span className="flex items-center gap-1"><Briefcase size={13} className="text-slate-500" /> {job.jobType || 'Full-time'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform whitespace-nowrap">
                        Apply Now <ArrowRight size={15} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center">
                <p className="text-gray-600 mb-4">No specific {catName} openings in {loc.name} right now.</p>
                <Link href={`/jobs-in-${locationSlug}`} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 inline-block">
                  View All {loc.name} Jobs
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                Other Categories in {loc.name}
              </h3>
              <div className="space-y-1.5">
                {CATEGORIES_LIST.filter(c => c.slug !== categorySlug).map((c) => (
                  <Link
                    key={c.slug}
                    href={`/jobs-in-${locationSlug}/${c.slug}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <span>{c.name}</span>
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
