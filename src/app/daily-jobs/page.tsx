'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import HomeFooter from '@/components/home/HomeFooter';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Search, MapPin, Calendar, Clock, Sparkles, Filter, 
  Briefcase, BadgeCheck, Flame, ChevronRight, Share2, 
  Bookmark, BookmarkPlus, CheckCircle2, ArrowRight, Loader2,
  RefreshCw, Building2, Phone, MessageCircle
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

interface DailyJob {
  id: string;
  title: string;
  company: string;
  location: string;
  district: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  type: string;
  workMode?: string;
  experience?: string;
  education?: string;
  category: string;
  skills: string[];
  postedAt: number; // millis
  postedText: string;
  isUrgent?: boolean;
  isVerified?: boolean;
  whatsapp?: string;
  phone?: string;
  description?: string;
}

const DISTRICTS = ['All Locations', 'Theni', 'Periyakulam', 'Cumbum', 'Bodinayakanur', 'Chinnamanur', 'Andipatti', 'Madurai', 'Dindigul'];
const CATEGORIES = ['All Categories', 'IT & Software', 'Agriculture', 'Healthcare', 'Education', 'Retail & Sales', 'Manufacturing', 'Textiles', 'Finance', 'Automobile'];
const JOB_TYPES = ['All Types', 'Full Time', 'Part Time', 'Remote', 'Internship', 'Walk-in', 'Fresher'];

export default function DailyJobsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [allJobs, setAllJobs] = useState<DailyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'weekly'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All Locations');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedJob, setSelectedJob] = useState<DailyJob | null>(null);

  // Load jobs and calculate time diffs
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
    }, 10000);

    async function fetchDailyJobs() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'jobs'),
          where('isActive', '==', true),
          where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        if (cancelled) return;

        const typeMap: Record<string, string> = {
          full_time: 'Full Time', part_time: 'Part Time', remote: 'Remote',
          contract: 'Contract', internship: 'Internship', walk_in: 'Walk-in', fresher: 'Fresher'
        };

        const now = Date.now();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTodayMillis = startOfToday.getTime();

        const mapped: DailyJob[] = snap.docs.map(doc => {
          const d = doc.data();
          const millis = d.createdAt?.toMillis ? d.createdAt.toMillis() : (d.createdAt ? new Date(d.createdAt).getTime() : now);
          const diffHours = Math.floor((now - millis) / 3600000);
          
          let postedText = 'Today';
          if (diffHours < 1) postedText = 'Just now';
          else if (diffHours < 24) postedText = `${diffHours}h ago`;
          else if (diffHours < 48) postedText = 'Yesterday';
          else postedText = `${Math.floor(diffHours / 24)}d ago`;

          const salaryStr = d.salaryMin && d.salaryMax
            ? `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')}/mo`
            : d.salary || 'Salary Negotiable';

          return {
            id: doc.id,
            title: d.title || 'Job Opening',
            company: d.companyName || d.company || 'Direct Employer',
            location: d.district ? `${d.district}, Theni` : d.location || 'Theni',
            district: d.district || 'Theni',
            salary: salaryStr,
            salaryMin: d.salaryMin || 0,
            salaryMax: d.salaryMax || 0,
            type: typeMap[d.jobType] || d.type || 'Full Time',
            workMode: d.workMode || 'On-site',
            experience: d.experience || 'Any Experience',
            education: d.education || 'Any Degree / 12th',
            category: d.category || 'General',
            skills: d.skills || [],
            postedAt: millis,
            postedText,
            isUrgent: !!d.isUrgent,
            isVerified: d.isVerified ?? true,
            whatsapp: d.whatsapp || d.phone || '',
            phone: d.phone || '',
            description: d.description || '',
          };
        });

        // Sort latest first
        mapped.sort((a, b) => b.postedAt - a.postedAt);
        setAllJobs(mapped);
        if (mapped.length > 0) setSelectedJob(mapped[0]);
      } catch (err) {
        console.error('Failed to load daily jobs:', err);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    }
    fetchDailyJobs();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  // Filter based on selected timeRange (Today vs Past 7 Days) and search/category/location filters
  const filteredJobs = useMemo(() => {
    const now = Date.now();
    const oneDayAgo = now - (36 * 3600 * 1000); // 36 hours for today window
    const sevenDaysAgo = now - (7 * 86400 * 1000);

    return allJobs.filter(job => {
      // 1. Time filter
      if (timeRange === 'today') {
        if (job.postedAt < oneDayAgo) return false;
      } else {
        // weekly
        if (job.postedAt < sevenDaysAgo) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = job.title.toLowerCase().includes(q);
        const matchComp = job.company.toLowerCase().includes(q);
        const matchSkill = job.skills.some(s => s.toLowerCase().includes(q));
        const matchCat = job.category.toLowerCase().includes(q);
        if (!matchTitle && !matchComp && !matchSkill && !matchCat) return false;
      }

      // 3. District filter
      if (selectedDistrict !== 'All Locations' && !job.location.includes(selectedDistrict)) {
        return false;
      }

      // 4. Category filter
      if (selectedCategory !== 'All Categories' && job.category !== selectedCategory) {
        return false;
      }

      // 5. Job Type filter
      if (selectedType !== 'All Types' && job.type !== selectedType) {
        return false;
      }

      return true;
    });
  }, [allJobs, timeRange, searchQuery, selectedDistrict, selectedCategory, selectedType]);

  const todayCount = allJobs.filter(j => j.postedAt >= (Date.now() - 36 * 3600 * 1000)).length;
  const weeklyCount = allJobs.filter(j => j.postedAt >= (Date.now() - 7 * 86400 * 1000)).length;

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-outfit text-slate-900 flex flex-col">
      <Header />

      {/* Hero Header */}
      <section className="pt-24 pb-10 px-4 sm:px-6 bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950 text-white">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider mb-2">
                <Calendar size={13} />
                Live Fresh Vacancies
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {timeRange === 'today' ? "Today's Daily Jobs in Theni" : "This Week's Fresh Jobs in Theni"}
              </h1>
              <p className="text-xs sm:text-sm text-blue-200/80 mt-1">
                Verified new job openings posted by local employers and businesses across Theni District
              </p>
            </div>

            {/* Time Toggle Tabs */}
            <div className="flex items-center bg-white/10 p-1.5 rounded-2xl border border-white/20 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  timeRange === 'today'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <Clock size={14} />
                Daily Jobs Today ({todayCount})
              </button>
              <button
                onClick={() => setTimeRange('weekly')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  timeRange === 'weekly'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <Calendar size={14} />
                Past 7 Days ({weeklyCount})
              </button>
            </div>
          </div>

          {/* Search Box & Filters Bar */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-2 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search today's jobs, skills, roles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 rounded-2xl text-xs font-semibold placeholder-gray-400 outline-none shadow-sm"
              />
            </div>

            <div>
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="w-full px-3.5 py-3 bg-white text-gray-900 rounded-2xl text-xs font-semibold outline-none shadow-sm cursor-pointer"
              >
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-3 bg-white text-gray-900 rounded-2xl text-xs font-semibold outline-none shadow-sm cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 size={36} className="text-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-gray-500">Loading verified daily jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Calendar size={32} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {timeRange === 'today' ? 'No new jobs posted yet today' : 'No jobs found matching your filters'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {timeRange === 'today'
                  ? 'Switch to Past 7 Days to view this week’s active vacancies across Theni.'
                  : 'Try resetting your search query or category filters.'}
              </p>
            </div>
            <button
              onClick={() => { setTimeRange('weekly'); setSearchQuery(''); setSelectedCategory('All Categories'); setSelectedDistrict('All Locations'); }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs"
            >
              View This Week&apos;s Jobs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left: Job Cards List (2 cols) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span>Showing <strong>{filteredJobs.length}</strong> {timeRange === 'today' ? 'daily' : 'weekly'} vacancies</span>
                <span>Sorted by latest post time</span>
              </div>

              {filteredJobs.map(job => {
                const isSelected = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`bg-white rounded-3xl p-5 border-2 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between gap-3 ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors">
                              {job.title}
                            </h3>
                            {job.isVerified && <BadgeCheck size={15} className="text-emerald-600 shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-600 font-semibold mt-0.5">{job.company}</p>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                          ⚡ {job.postedText}
                        </span>
                      </div>

                      <p className="text-sm font-black text-emerald-700 mb-2">
                        {job.salary}
                      </p>

                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                          {job.type}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-600 font-medium border border-gray-100">
                          {job.experience}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-600 font-medium border border-gray-100">
                          <MapPin size={10} className="inline mr-1" />
                          {job.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                      <span className="text-gray-400">{job.category}</span>
                      <Link
                        href={`/jobs/${job.id}`}
                        onClick={e => e.stopPropagation()}
                        className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        View &amp; Apply <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Quick Job Preview Sticky Panel (1 col) */}
            <div className="hidden lg:block lg:sticky lg:top-24">
              {selectedJob ? (
                <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-sm">
                  <div className="border-b border-gray-100 pb-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                      {selectedJob.category}
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 mt-1">{selectedJob.title}</h2>
                    <p className="text-xs text-gray-600 font-semibold">{selectedJob.company}</p>
                    <p className="text-base font-black text-emerald-700 mt-2">{selectedJob.salary}</p>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600">
                    <p className="flex justify-between">
                      <span className="text-gray-400">Location:</span>
                      <strong>{selectedJob.location}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Job Type:</span>
                      <strong>{selectedJob.type}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Experience:</span>
                      <strong>{selectedJob.experience}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Posted:</span>
                      <strong className="text-emerald-700">{selectedJob.postedText}</strong>
                    </p>
                  </div>

                  {selectedJob.description && (
                    <div className="pt-2 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-gray-900 mb-1 uppercase">Job Overview:</h4>
                      <p className="text-xs text-gray-600 line-clamp-4 leading-relaxed">{selectedJob.description}</p>
                    </div>
                  )}

                  <div className="pt-3 space-y-2">
                    <Link
                      href={`/jobs/${selectedJob.id}`}
                      className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      Apply Now <ArrowRight size={14} />
                    </Link>
                    {selectedJob.whatsapp && (
                      <a
                        href={`https://wa.me/${selectedJob.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I saw "${selectedJob.title}" posted on THENIJOBS Daily Jobs and would like to apply.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        style={{ background: '#25D366' }}
                      >
                        <MessageCircle size={14} /> WhatsApp Direct Apply
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center text-xs text-gray-400">
                  Select a job card to view full details
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <HomeFooter />
      <BottomNav />
    </main>
  );
}
