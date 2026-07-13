'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Search, MapPin, X, Briefcase, Clock, Banknote,
  Zap, Star, BookmarkPlus, SlidersHorizontal,
  Building2, ArrowRight, BadgeCheck, Loader2, CalendarCheck, Bell
} from 'lucide-react';

import { collection, query, where, orderBy, onSnapshot, limit as firestoreLimit, startAfter, getDocs } from 'firebase/firestore';
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
const EXPERIENCE_LEVELS = [
  { value: '', label: 'Any Experience' },
  { value: 'fresher', label: 'Fresher' },
  { value: '1-2', label: '1-2 Years' },
  { value: '3-5', label: '3-5 Years' },
  { value: '5+', label: '5+ Years' },
];
const WORK_MODES = [
  { value: '', label: 'Any Mode' },
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'wfh', label: 'Work From Home' },
];

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
  verificationLevel?: string;
  category: string;
  skills: string[];
  description: string;
  companyDescription: string;
  openings: number;
  isWalkIn: boolean;
  isPromoted?: boolean;
  companySlug?: string;
  createdAtMs: number;
  latitude?: number | null;
  longitude?: number | null;
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

const LOCAL_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Theni': { lat: 10.0104, lng: 77.4748 },
  'Uthamapalayam': { lat: 9.8055, lng: 77.3304 },
  'Cumbum': { lat: 9.7369, lng: 77.2917 },
  'Chinnamanur': { lat: 9.8407, lng: 77.3828 },
  'Bodinayakanur': { lat: 10.0104, lng: 77.3503 },
  'Periyakulam': { lat: 10.1197, lng: 77.5492 },
  'Andipatti': { lat: 9.9972, lng: 77.6253 },
  'Devaram': { lat: 9.8787, lng: 77.2882 },
  'Thevaram': { lat: 9.8787, lng: 77.2882 },
  'Kombai': { lat: 9.8331, lng: 77.2694 },
  'Veerapandi': { lat: 9.9678, lng: 77.4336 },
  'Gudalur': { lat: 9.6806, lng: 77.2478 }
};

function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function JobsPage() {
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [extraJobs, setExtraJobs] = useState<Job[]>([]);

  // Proximity states
  const [proximity, setProximity] = useState<string>('all');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const [savingAlert, setSavingAlert] = useState(false);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');

  const handleSaveAlert = async () => {
    if (!user?.uid) {
      toast({ title: 'Auth Required', description: 'Please login to save search alerts.', variant: 'warning' });
      return;
    }

    const defaultTitle = search ? `Alert: ${search}` : 'General Job Alert';
    const alertTitle = window.prompt('Enter a name for this job alert:', defaultTitle);
    if (alertTitle === null) return; // user cancelled

    const finalTitle = alertTitle.trim() || defaultTitle;
    setSavingAlert(true);
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'jobAlerts'), {
        userId: user.uid,
        title: finalTitle,
        category: selectedCategories[0] || '',
        district: location || LAUNCH_DISTRICT,
        jobType: selectedTypes[0] || '',
        emailEnabled: true,
        whatsappEnabled: true,
        pushEnabled: true,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({
        title: 'Alert Saved! 🔔',
        description: `We'll notify you on WhatsApp & email when new matching jobs are posted.`,
        variant: 'success'
      });
    } catch (err) {
      console.error('Failed to save search alert:', err);
      toast({ title: 'Error', description: 'Failed to create job alert.', variant: 'error' });
    } finally {
      setSavingAlert(false);
    }
  };

  const renderVerificationBadge = (level?: string, isVerified?: boolean) => {
    const activeLevel = level || (isVerified ? 'standard' : 'free');
    if (activeLevel === 'free') return null;
    if (activeLevel === 'standard') {
      return <span title="Standard Verified Business" className="shrink-0 inline-block align-middle ml-1"><BadgeCheck size={14} className="text-blue-400 fill-blue-400/10" /></span>;
    }
    if (activeLevel === 'premium') {
      return <span title="Premium Verified Business" className="shrink-0 inline-block align-middle ml-1"><BadgeCheck size={14} className="text-amber-400 fill-amber-400/10" /></span>;
    }
    if (activeLevel === 'elite') {
      return (
        <span className="inline-flex items-center gap-0.5 align-middle ml-1 shrink-0">
          <span title="Elite Verified Business"><BadgeCheck size={14} className="text-violet-400 fill-violet-400/10" /></span>
          <span className="text-[10px] text-violet-400 font-extrabold" title="Elite Crown VIP">👑</span>
        </span>
      );
    }
    return null;
  };

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

  // Handle proximity geolocation request
  useEffect(() => {
    if (proximity !== 'all' && !coords) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLocating(false);
          toast({ title: 'Location Enabled', description: `Showing jobs near you.`, variant: 'success' });
        },
        (err) => {
          console.error(err);
          setLocating(false);
          setProximity('all');
          toast({ title: 'Location Error', description: 'Please enable location access in your browser.', variant: 'error' });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [proximity, coords, toast]);

  // Helper to map a Firestore doc to a Job object
  const mapDocToJob = (doc: any): Job | null => {
    const d = doc.data();
    if (!isPublicJobVisible(d)) return null;
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
      logo: d.companyLogoUrl || d.logoUrl || d.logo || (d.companyName ? d.companyName.substring(0, 2).toUpperCase() : '💼'),
      isUrgent: d.isUrgent || false,
      isPremium: d.isPremium || false,
      isVerified: d.isVerified || d.companyVerificationStatus === 'verified' || d.companyVerified || false,
      verificationLevel: d.verificationLevel || d.companyVerificationLevel || (d.isVerified || d.companyVerificationStatus === 'verified' || d.companyVerified ? 'standard' : 'free'),
      category: d.category || '',
      skills: d.skills || [],
      description: d.description || '',
      companyDescription: d.companyDescription || '',
      openings: d.openings ? Number(d.openings) : 1,
      isWalkIn: d.isWalkIn || !!d.walkInDate || !!d.walkIn?.date,
      isPromoted: d.isPromoted || false,
      companySlug: d.companySlug || '',
      createdAtMs,
      latitude: d.latitude || null,
      longitude: d.longitude || null,
    } as Job;
  };

  // Real-time listener for first 24 jobs — updates automatically when admin approves/rejects
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'jobs'),
      where('isActive', '==', true),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(24)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const mapped = snapshot.docs
          .map(mapDocToJob)
          .filter((j): j is Job => j !== null);
        setJobs(mapped);
        if (snapshot.docs.length > 0) {
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        }
        setHasMore(snapshot.docs.length >= 24);
        setLoading(false);
      },
      (err) => {
        console.error('Error in jobs real-time listener:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
     
  }, []);

  // Load more jobs (pagination) — uses getDocs for subsequent pages
  const loadJobs = async (isFirstPage = false) => {
    if (isFirstPage) return; // first page is handled by onSnapshot above
    try {
      setLoadingMore(true);
      if (!lastVisible) return;

      const q = query(
        collection(db, 'jobs'),
        where('isActive', '==', true),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(24),
        startAfter(lastVisible)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setHasMore(false);
        return;
      }

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastDoc);

      if (snapshot.docs.length < 24) {
        setHasMore(false);
      }

      const newJobs = snapshot.docs
        .map(mapDocToJob)
        .filter((j): j is Job => j !== null);

      setExtraJobs(prev => [...prev, ...newJobs]);
    } catch (err) {
      console.error('Error loading more jobs:', err);
    } finally {
      setLoadingMore(false);
    }
  };

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

  const allJobs = useMemo(() => {
    const combined = [...jobs, ...extraJobs];
    const seen = new Set<string>();
    return combined.filter(j => {
      if (seen.has(j.id)) return false;
      seen.add(j.id);
      return true;
    });
  }, [jobs, extraJobs]);

  const filtered = useMemo(() => allJobs.filter(j => {
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

    let matchProximity = true;
    if (proximity !== 'all' && coords) {
      const targetLocation = j.location || j.district;
      let jobLat = j.latitude;
      let jobLng = j.longitude;

      if (!jobLat || !jobLng) {
        const resolved = LOCAL_COORDINATES[targetLocation];
        if (resolved) {
          jobLat = resolved.lat;
          jobLng = resolved.lng;
        }
      }

      if (jobLat && jobLng) {
        const dist = getHaversineDistanceKm(coords.latitude, coords.longitude, jobLat, jobLng);
        matchProximity = dist <= parseFloat(proximity);
      } else {
        matchProximity = false;
      }
    }

    // Salary filter
    let matchSalary = true;
    if (salaryMin) {
      const min = parseInt(salaryMin, 10);
      if (!isNaN(min)) matchSalary = (j.salaryMax || j.salaryMin || 0) >= min;
    }
    if (matchSalary && salaryMax) {
      const max = parseInt(salaryMax, 10);
      if (!isNaN(max)) matchSalary = (j.salaryMin || 0) <= max;
    }

    return matchSearch && matchLoc && matchType && matchCat && matchProximity && matchSalary;
  }), [jobs, search, location, selectedTypes, selectedCategories, proximity, coords, salaryMin, salaryMax]);

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
      // Prioritize promoted jobs first
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;

      if (sortBy === 'salary') {
        return (b.salaryMax || b.salaryMin || 0) - (a.salaryMax || a.salaryMin || 0);
      }
      if (sortBy === 'relevance') {
        return relevanceScore(b) - relevanceScore(a) || b.createdAtMs - a.createdAtMs;
      }
      return b.createdAtMs - a.createdAtMs;
    });
  }, [filtered, search, sortBy]);

  const activeFilters = selectedTypes.length + selectedCategories.length + (salaryMin ? 1 : 0) + (salaryMax ? 1 : 0) + (experienceFilter ? 1 : 0) + (workModeFilter ? 1 : 0);


  return (
    <main className="min-h-screen bg-[#0a0a1a]">
      <Header />

      {/* Search Bar – Sticky */}
      <div className="sticky top-16 z-40 glass-nav border-b border-white/5 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex gap-2">
          <div className="flex-1 flex items-center gap-2 search-input px-4 py-2.5">
            <Search size={15} className="text-gray-500 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              type="text" placeholder="Job title, skill, company..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
            {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-500" /></button>}
          </div>
          <div className="flex items-center gap-2 search-input px-3 py-1">
            <MapPin size={14} className="text-violet-400 shrink-0" />
            <Select
              value={location}
              onChange={setLocation}
              options={locationItems}
              placeholder="All Areas"
              className="w-28"
              buttonClassName="bg-transparent border-none text-gray-300 text-sm hover:text-white"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all border
              ${showFilters || activeFilters > 0 ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-white/5 border-white/10 text-gray-400'}`}>
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="max-w-5xl mx-auto mt-3 glass-card rounded-2xl p-4 border border-white/10">
            <div className="grid sm:grid-cols-3 gap-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Job Type</p>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPES.map(t => (
                    <button key={t} onClick={() => toggleType(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                        ${selectedTypes.includes(t) ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => toggleCategory(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                        ${selectedCategories.includes(c) ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Nearby Jobs</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All Jobs' },
                    { value: '5', label: 'Within 5 KM' },
                    { value: '10', label: 'Within 10 KM' },
                    { value: '25', label: 'Within 25 KM' }
                  ].map(item => (
                    <button key={item.value} onClick={() => setProximity(item.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5
                        ${proximity === item.value ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                      {item.label}
                      {locating && item.value !== 'all' && proximity === item.value && (
                        <span className="h-2 w-2 animate-spin rounded-full border border-emerald-500 border-t-transparent" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {/* Salary Range */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Salary Range (₹/month)</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    className="w-24 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/40"
                  />
                  <span className="text-gray-500 text-xs">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    className="w-24 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-cyan-500/40"
                  />
                </div>
              </div>
              {/* Experience Level */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Experience</p>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_LEVELS.map(item => (
                    <button key={item.value} onClick={() => setExperienceFilter(experienceFilter === item.value ? '' : item.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                        ${experienceFilter === item.value ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Work Mode */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Work Mode</p>
                <div className="flex flex-wrap gap-2">
                  {WORK_MODES.map(item => (
                    <button key={item.value} onClick={() => setWorkModeFilter(workModeFilter === item.value ? '' : item.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                        ${workModeFilter === item.value ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setSelectedTypes([]); setSelectedCategories([]); setProximity('all'); setCoords(null); setSalaryMin(''); setSalaryMax(''); setExperienceFilter(''); setWorkModeFilter(''); }}
                className="mt-3 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                <X size={11} /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12">
        {/* Results Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div className="min-w-0">
            <h1 className="font-outfit font-bold text-xl text-white truncate">
              {sortedJobs.length} Jobs Found
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {search ? `Results for "${search}"` : 'All available positions'}
              {location ? ` in ${location}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 shrink-0">
            <button
              onClick={handleSaveAlert}
              disabled={savingAlert}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/50 transition-all active:scale-95 disabled:opacity-50"
            >
              <Bell size={13} className={savingAlert ? "animate-bounce" : ""} />
              {savingAlert ? 'Saving...' : 'Save Alert'}
            </button>
            <span className="hidden sm:inline text-xs">Sort:</span>
            <Select
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'latest', label: 'Latest' },
                { value: 'salary', label: 'Salary' },
                { value: 'relevance', label: 'Relevance' }
              ]}
              className="w-28"
              buttonClassName="bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-3 py-1.5 text-xs text-gray-300"
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
              <button onClick={() => { setSearch(''); setSelectedTypes([]); setSelectedCategories([]); setLocation(''); }}
                className="mt-4 btn-outline-glass px-5 py-2 rounded-xl text-sm font-medium">
                Clear Filters
              </button>
            </div>
          ) : (
            sortedJobs.map(job => (
              <div key={job.id} className="premium-card rounded-2xl p-5 group">
                <div className="flex gap-4">
                  {/* Logo */}
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {job.logo && (job.logo.startsWith('http') || job.logo.startsWith('/')) ? (
                      <img src={job.logo} alt={job.company} className="w-full h-full object-cover" onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-lg font-black text-violet-400">${(job.company || 'C').substring(0, 2).toUpperCase()}</span>`;
                      }} />
                    ) : (
                      <span className="text-lg font-black text-violet-400">{job.logo}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title + Badges */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <Link href={`/jobs/${job.id}`}>
                          <h2 className="font-semibold text-white text-base hover:text-violet-400 transition-colors cursor-pointer leading-tight">
                            {job.title}
                          </h2>
                        </Link>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {job.companySlug ? (
                            <Link href={`/company/${encodeURIComponent(job.companySlug)}`} className="text-sm text-gray-400 hover:text-violet-400 transition-colors">
                              {job.company}
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-400">{job.company}</span>
                          )}
                          {renderVerificationBadge(job.verificationLevel, job.isVerified)}
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
                        <span key={skill} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/8">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                      <Link href={`/jobs/${job.id}`}
                        className="flex-1 sm:flex-none btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold relative z-10 text-center flex items-center justify-center gap-2">
                        Apply Now <ArrowRight size={14} />
                      </Link>
                      <button onClick={() => toggleSave(job)}
                        className={`p-2.5 rounded-xl border transition-all
                          ${savedJobs.includes(job.id)
                            ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                            : 'bg-white/5 border-white/10 text-gray-500 hover:text-violet-400 hover:border-violet-500/30'}`}>
                        <BookmarkPlus size={16} className={savedJobs.includes(job.id) ? 'fill-current' : ''} />
                      </button>
                      {job.companySlug && (
                        <Link href={`/company/${encodeURIComponent(job.companySlug)}`}
                          className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-outline-glass text-sm font-medium">
                          <Building2 size={14} /> Company
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => loadJobs(false)}
                disabled={loadingMore}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-violet-400" />
                    <span>Loading more...</span>
                  </>
                ) : (
                  <span>Load More Jobs</span>
                )}
              </button>
            </div>
          )}
          {/* Real-time badge */}
          <p className="text-center text-[10px] text-gray-600 mt-4">
            🔴 Live — updates automatically when new jobs are approved
          </p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
