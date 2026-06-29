'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, X, Briefcase, Clock, Banknote,
  Zap, Star, BookmarkPlus, SlidersHorizontal,
  Building2, ArrowRight, BadgeCheck, Loader2, CalendarCheck
} from 'lucide-react';

import { collection, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { saveJob, unsaveJob } from '@/lib/firebase/firestoreService';
import { LAUNCH_DISTRICT } from '@/lib/types';
import { useLocations } from '@/hooks/useLocations';
import { matchesSearch, scoreSearchMatch } from '@/lib/search';
import { isPublicJobVisible } from '@/lib/jobPolicy';
import { useToast } from '@/hooks/useToast';
import { Select } from '@/components/ui/Select';

const JOB_TYPES = ['Full Time', 'Part Time', 'Remote', 'WFH', 'Internship', 'Fresher', 'Contract'];
const CATEGORIES = ['Agriculture', 'Education', 'IT & Software', 'Healthcare', 'Construction', 'Textiles', 'Transport', 'Finance'];

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  district: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  type: string;
  posted: string;
  logo: string;
  isUrgent: boolean;
  isPremium: boolean;
  isVerified: boolean;
  category: string;
  skills: string[];
  description: string;
  companyDescription: string;
  openings: number;
  isWalkIn: boolean;
  companySlug?: string;
  createdAtMs: number;
}

function timestampToMillis(timestamp: any) {
  if (!timestamp) return 0;
  if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
  const date = new Date(timestamp).getTime();
  return Number.isNaN(date) ? 0 : date;
}

function formatTime(timestamp: any) {
  if (!timestamp) return 'Recently';
  const date = timestampToMillis(timestamp);
  const seconds = Math.floor((Date.now() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + ' yr ago';
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + ' mo ago';
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + ' d ago';
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + ' hr ago';
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + ' min ago';
  return 'Just now';
}

export default function SeekerJobsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { allAreas } = useLocations();
  
  const locationItems = useMemo(() => {
    const combined = Array.from(new Set([LAUNCH_DISTRICT, ...allAreas]));
    return [{ value: '', label: 'All Areas' }, ...combined.map(d => ({ value: d, label: d }))];
  }, [allAreas]);

  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('latest');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize search and location from URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('q') || params.get('search');
      const locationParam = params.get('location');
      if (searchParam) setSearch(searchParam);
      if (locationParam) setLocation(locationParam);
    }
  }, []);

  // Fetch jobs from Firestore
  const loadJobs = async () => {
    try {
      setLoading(true);
      const constraints: any[] = [
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      ];

      const q = query(collection(db, 'jobs'), ...constraints);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setJobs([]);
        return;
      }

      const fetchedJobs = snapshot.docs
        .filter((jobDoc) => isPublicJobVisible(jobDoc.data()))
        .map(doc => {
          const d = doc.data();
          const salaryStr = d.salaryMin && d.salaryMax 
            ? `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')}`
            : 'Salary Negotiable';
            
          const typeStr = d.jobType 
            ? d.jobType.replace('_', ' ').split(' ').map((w: string) => w[0].toUpperCase() + w.substring(1)).join(' ')
            : 'Full Time';
          const createdAtMs = timestampToMillis(d.createdAt);

          return {
            id: doc.id,
            title: d.title || '',
            company: d.companyName || 'Verified Employer',
            location: d.location || d.district || 'Theni',
            district: d.district || LAUNCH_DISTRICT,
            salary: salaryStr,
            salaryMin: d.salaryMin || 0,
            salaryMax: d.salaryMax || 0,
            type: typeStr,
            posted: formatTime(d.createdAt),
            logo: d.logo || (d.companyName ? d.companyName.substring(0, 2).toUpperCase() : '💼'),
            isUrgent: d.isUrgent || false,
            isPremium: d.isPremium || false,
            isVerified: d.isVerified || d.companyVerificationStatus === 'verified' || d.companyVerified || false,
            category: d.category || '',
            skills: d.skills || [],
            description: d.description || '',
            companyDescription: d.companyDescription || '',
            openings: d.openings ? Number(d.openings) : 1,
            isWalkIn: d.isWalkIn || !!d.walkInDate || !!d.walkIn?.date,
            companySlug: d.companySlug || '',
            createdAtMs,
          } as Job;
        });

      setJobs(fetchedJobs);
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch saved jobs for the user
  useEffect(() => {
    const userId = user?.uid;
    if (!userId) {
      setSavedJobs([]);
      return;
    }
    const q = query(collection(db, 'savedJobs'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const ids = snap.docs.map(doc => doc.data().jobId);
        setSavedJobs(ids);
      },
      (err) => {
        console.error('Error loading saved jobs in real-time:', err);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  const toggleType = (t: string) => setSelectedTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const toggleCategory = (c: string) => setSelectedCategories(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  const toggleSave = async (job: Job) => {
    if (!user?.uid) {
      toast({ title: 'Auth Required', description: 'Please login to save jobs.', variant: 'warning' });
      return;
    }
    const isCurrentlySaved = savedJobs.includes(job.id);
    try {
      if (isCurrentlySaved) {
        await unsaveJob(user.uid, job.id);
        setSavedJobs(p => p.filter(x => x !== job.id));
      } else {
        await saveJob(user.uid, job.id, {
          jobTitle: job.title,
          companyName: job.company,
          description: `Positions available at ${job.company}. Required skills: ${job.skills.join(', ')}`,
          district: job.location,
          jobType: job.type,
          salaryMin: job.salaryMin || 0,
          salaryMax: job.salaryMax || 0,
        });
        setSavedJobs(p => [...p, job.id]);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
      toast({ title: 'Error', description: 'Failed to save job.', variant: 'error' });
    }
  };

  const filtered = useMemo(() => jobs.filter(j => {
    const loc = location.toLowerCase();
    const matchSearch = matchesSearch(search, [
      { value: j.title, weight: 3 },
      { value: j.company, weight: 2 },
      { value: j.skills, weight: 2 },
      j.category,
      j.description,
      j.companyDescription,
    ]);
    const matchLoc = !location ||
      j.location.toLowerCase().includes(loc) ||
      j.district.toLowerCase().includes(loc);
    const matchType = selectedTypes.length === 0 || selectedTypes.includes(j.type);
    const matchCat = selectedCategories.length === 0 || selectedCategories.includes(j.category);
    return matchSearch && matchLoc && matchType && matchCat;
  }), [jobs, search, location, selectedTypes, selectedCategories]);

  const sortedJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const relevanceScore = (job: Job) => {
      if (!q) return Number(job.isPremium) * 2 + Number(job.isUrgent);
      const score = scoreSearchMatch(q, [
        { value: job.title, weight: 4 },
        { value: job.company, weight: 3 },
        { value: job.skills, weight: 2 },
        { value: job.category, weight: 1.5 },
        job.description,
        job.companyDescription,
      ]);
      return score + Number(job.isPremium) * 2 + Number(job.isUrgent);
    };

    return [...filtered].sort((a, b) => {
      if (sortBy === 'salary') {
        return (b.salaryMax || b.salaryMin || 0) - (a.salaryMax || a.salaryMin || 0);
      }
      if (sortBy === 'relevance') {
        return relevanceScore(b) - relevanceScore(a) || b.createdAtMs - a.createdAtMs;
      }
      return b.createdAtMs - a.createdAtMs;
    });
  }, [filtered, search, sortBy]);

  const activeFilters = selectedTypes.length + selectedCategories.length;

  return (
    <div className="animate-fade-in-up space-y-6 max-w-5xl mx-auto font-outfit text-white">
      {/* Sticky Search Panel inside dashboard context */}
      <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="flex-1 flex items-center gap-2 bg-[#0e0e22] border border-white/10 rounded-xl px-4 py-2.5">
            <Search size={15} className="text-gray-500 shrink-0" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              type="text" 
              placeholder="Job title, skill, company..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none" 
            />
            {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-500" /></button>}
          </div>

          {/* Area select */}
          <div className="flex items-center gap-2 bg-[#0e0e22] border border-white/10 rounded-xl px-3 py-1 md:w-48">
            <MapPin size={14} className="text-violet-400 shrink-0" />
            <Select
              value={location}
              onChange={setLocation}
              options={locationItems}
              placeholder="All Areas"
              className="w-full"
              buttonClassName="bg-transparent border-none text-gray-300 text-sm hover:text-white"
            />
          </div>

          {/* Filters toggle */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border
              ${showFilters || activeFilters > 0 ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-white/5 border-white/10 text-gray-400'}`}
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>
            {activeFilters > 0 && <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="pt-3 border-t border-white/5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">Job Type</p>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map(t => (
                  <button 
                    key={t} 
                    onClick={() => toggleType(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                      ${selectedTypes.includes(t) ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button 
                    key={c} 
                    onClick={() => toggleCategory(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                      ${selectedCategories.includes(c) ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {activeFilters > 0 && (
              <button 
                onClick={() => { setSelectedTypes([]); setSelectedCategories([]); }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <X size={11} /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit font-bold text-xl text-white">
            {sortedJobs.length} Jobs Found
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {search ? `Results for "${search}"` : 'All available positions'}
            {location ? ` in ${location}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="text-xs">Sort:</span>
          <Select
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'latest', label: 'Latest' },
              { value: 'salary', label: 'Salary' },
              { value: 'relevance', label: 'Relevance' }
            ]}
            className="w-28"
            buttonClassName="bg-[#0e0e22] border border-white/10 hover:border-white/20 rounded-xl px-3 py-1.5 text-xs text-gray-300"
          />
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Loader2 size={32} className="animate-spin text-violet-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading jobs...</p>
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-white mb-2">No jobs found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
            <button 
              onClick={() => { setSearch(''); setSelectedTypes([]); setSelectedCategories([]); setLocation(''); }}
              className="mt-4 bg-white/5 border border-white/10 px-5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          sortedJobs.map(job => (
            <div key={job.id} className="glass-card rounded-2xl p-5 border border-white/5 hover:border-violet-500/20 transition-all duration-300">
              <div className="flex gap-4">
                {/* Logo */}
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shrink-0">
                  {job.logo}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title + Badges */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <Link href={`/seeker/jobs/${job.id}`}>
                        <h2 className="font-semibold text-white text-base hover:text-violet-400 transition-colors cursor-pointer leading-tight">
                          {job.title}
                        </h2>
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm text-gray-400">{job.company}</span>
                        {job.isVerified && <BadgeCheck size={14} className="text-emerald-400" />}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end shrink-0">
                      {job.isUrgent && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                          <Zap size={9} className="fill-current" /> URGENT
                        </span>
                      )}
                      {job.isPremium && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full border border-violet-400/20">
                          <Star size={9} className="fill-current" /> PREMIUM
                        </span>
                      )}
                      {job.isWalkIn && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                          <CalendarCheck size={9} /> WALK-IN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><MapPin size={11} className="text-violet-400" />{job.location}</span>
                    <span className="flex items-center gap-1"><Banknote size={11} className="text-emerald-400" />{job.salary}</span>
                    <span className="flex items-center gap-1"><Briefcase size={11} className="text-cyan-400" />{job.type}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{job.posted}</span>
                    <span className="text-violet-400">{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.skills.map(skill => (
                      <span key={skill} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/5">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <Link href={`/seeker/jobs/${job.id}`}
                      className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-95 text-white text-sm font-semibold text-center flex items-center justify-center gap-2 transition-all">
                      Apply Now <ArrowRight size={14} />
                    </Link>
                    <button onClick={() => toggleSave(job)}
                      className={`p-2.5 rounded-xl border transition-all
                        ${savedJobs.includes(job.id)
                          ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:text-violet-400 hover:border-violet-500/30'}`}>
                      <BookmarkPlus size={16} className={savedJobs.includes(job.id) ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
