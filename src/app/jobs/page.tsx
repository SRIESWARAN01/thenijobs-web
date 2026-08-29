'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Search, MapPin, X, Briefcase, Clock, BadgeCheck, BookmarkPlus, Bookmark,
  Share2, SlidersHorizontal, ChevronRight, Star, CheckCircle, Copy,
  MessageCircle, Sparkles, Loader2, Calendar, Flame, ArrowRight
} from 'lucide-react';
import { collection, getDocs, query, where, addDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { requestAIService } from '@/lib/ai/aiClient';
import { useToast } from '@/contexts/ToastContext';

/* ─── Types ─── */
interface Job {
  id: string;
  title: string;
  company: string;
  companyId?: string;
  location: string;
  district?: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  type: string;
  posted: string;
  postedAt?: number;
  logo: string;
  isUrgent: boolean;
  isPremium: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  category: string;
  skills: string[];
  openings: number;
  experience?: string;
  education?: string;
  description?: string;
  benefits?: string[];
  requirements?: string[];
  whatsapp?: string;
}

/* ─── Constants ─── */
const JOB_TYPES = ['Full Time', 'Part Time', 'Remote', 'WFH', 'Internship', 'Walk-in', 'Contract', 'Fresher'];
const CATEGORIES = ['IT & Software', 'Agriculture', 'Education', 'Healthcare', 'Construction', 'Textiles', 'Transport', 'Finance', 'Sales & Marketing', 'Manufacturing', 'Retail & Shop'];
const DISTRICTS = ['Theni', 'Periyakulam', 'Cumbum', 'Bodinayakanur', 'Chinnamanur', 'Andipatti', 'Madurai', 'Dindigul', 'Coimbatore', 'Chennai'];
const EXPERIENCES = ['Fresher', '1-3 yrs', '3-5 yrs', '5+ yrs'];
const QUALIFICATIONS = ['10th', '12th', 'Any Degree', 'Diploma', 'PG', 'ITI'];
const WORK_TYPES = ['On-site', 'Remote', 'Hybrid'];
const DATE_POSTED_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today (Daily Jobs)', value: 'today' },
  { label: 'Past 3 Days', value: '3days' },
  { label: 'Past Week (7 Days)', value: 'weekly' }
];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  'Full Time':   { bg: '#EFF6FF', color: '#2563EB' },
  'Part Time':   { bg: '#F0FDF4', color: '#16A34A' },
  'Remote':      { bg: '#F5F3FF', color: '#7C3AED' },
  'WFH':         { bg: '#F5F3FF', color: '#7C3AED' },
  'Walk-in':     { bg: '#FFFBEB', color: '#D97706' },
  'Internship':  { bg: '#FFF1F2', color: '#E11D48' },
  'Contract':    { bg: '#F0F9FF', color: '#0284C7' },
  'Fresher':     { bg: '#F0FDF4', color: '#16A34A' }
};

const TRENDING_SEARCHES = ['Digital Marketing', 'Software Engineer', 'Accountant', 'Sales Executive', 'Driver', 'Teacher', 'Delivery Boy', 'Electrician', 'Data Entry', 'Staff Nurse'];

// Rule-based offline SEO synonyms map (for fast resilient search without API lag)
const RULE_BASED_SYNONYMS: Record<string, string[]> = {
  'digital marketing': ['seo', 'sem', 'social media', 'google ads', 'content marketing', 'digital marketer', 'campaign', 'meta ads', 'smm'],
  'software engineer': ['react', 'node', 'full stack', 'developer', 'frontend', 'backend', 'programmer', 'software developer', 'python', 'javascript', 'nextjs', 'web developer', 'it'],
  'accountant': ['tally', 'gst', 'accounts', 'billing', 'finance', 'auditing', 'bookkeeper', 'ca inter', 'commerce', 'b.com', 'audit'],
  'driver': ['heavy vehicle', 'van driver', 'car driver', 'delivery driver', 'logistics', 'transport', 'auto driver', 'bus driver'],
  'teacher': ['faculty', 'lecturer', 'tutor', 'trainer', 'school teacher', 'professor', 'instructor', 'pgt', 'tgt', 'bed', 'teaching'],
  'sales': ['sales executive', 'marketing executive', 'business development', 'bde', 'telecaller', 'store sales', 'field sales', 'retail sales', 'counter sales', 'marketing'],
  'nurse': ['staff nurse', 'healthcare', 'hospital', 'patient care', 'clinic', 'medical', 'anm', 'gnm', 'bsc nursing', 'doctor'],
  'electrician': ['electrical', 'wireman', 'iti', 'maintenance', 'technician', 'wiring', 'electrician'],
  'delivery': ['delivery boy', 'courier', 'swiggy', 'zomato', 'delivery partner', 'rider', 'driver', 'logistics'],
  'data entry': ['back office', 'computer operator', 'excel', 'typing', 'clerk', 'office assistant', 'admin'],
  'agriculture': ['farm', 'estate', 'cardamom', 'plantation', 'horticulture', 'agriculture supervisor', 'greenhouse', 'agro'],
  'tailor': ['tailoring', 'cutting', 'stitching', 'garment', 'textile', 'fashion', 'sewing', 'embroidery', 'cloth'],
  'cashier': ['counter billing', 'pos', 'store cashier', 'billing executive', 'supermarket', 'retail'],
  'security': ['security guard', 'watchman', 'patrol', 'guard', 'security officer', 'cctv'],
  'hotel': ['cook', 'chef', 'waiter', 'hotel manager', 'receptionist', 'housekeeping', 'catering', 'service'],
  'graphic': ['graphic designer', 'photoshop', 'illustrator', 'banner', 'video editor', 'coreldraw', 'ui ux'],
  'mechanic': ['automobile', 'two wheeler', 'four wheeler', 'fitter', 'technician', 'workshop', 'iti mechanic'],
  'pharmacist': ['pharmacy', 'd.pharm', 'b.pharm', 'medical store', 'druggist', 'chemist'],
};

function formatTime(ts: any) {
  if (!ts?.toMillis) return 'Recently';
  const diff = Date.now() - ts.toMillis();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

/* ─── Filter Panel ─── */
function FilterPanel({
  filters, setFilters, onReset
}: {
  filters: any;
  setFilters: (fn: (prev: any) => any) => void;
  onReset: () => void;
}) {
  const toggle = (key: string, value: string) => {
    setFilters((prev: any) => {
      const arr: string[] = prev[key] || [];
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value] };
    });
  };

  const CheckGroup = ({ title, fieldKey, options }: { title: string; fieldKey: string; options: string[] }) => (
    <div className="mb-4">
      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1.5">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
              (filters[fieldKey] || []).includes(opt) ? 'border-blue-600 bg-blue-600' : 'border-gray-300 group-hover:border-blue-300'
            }`}
              onClick={() => toggle(fieldKey, opt)}>
              {(filters[fieldKey] || []).includes(opt) && (
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                  <path d="M3.5 7.5L1.5 5.5 0 7l3.5 3.5 8-8-1.5-1.5z" />
                </svg>
              )}
            </div>
            <span className="text-xs text-gray-700 group-hover:text-gray-900 font-medium">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm font-outfit" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-900">Job Filters</p>
        <button onClick={onReset} className="text-xs text-blue-600 font-bold hover:text-blue-700 cursor-pointer">Reset All</button>
      </div>

      {/* Date Posted */}
      <div className="mb-4">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Date Posted</p>
        <div className="space-y-1.5">
          {DATE_POSTED_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="datePosted"
                checked={(filters.datePosted || 'all') === opt.value}
                onChange={() => setFilters((prev: any) => ({ ...prev, datePosted: opt.value }))}
                className="accent-blue-600"
              />
              <span className="text-xs text-gray-700 font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100 mb-4" />

      {/* Salary Range */}
      <div className="mb-4">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Max Salary</p>
        <div className="flex items-center justify-between text-xs font-bold text-emerald-700 mb-1">
          <span>₹0</span>
          <span>₹{(filters.salaryMax || 200000).toLocaleString('en-IN')}+</span>
        </div>
        <input
          type="range" min={10000} max={200000} step={5000}
          value={filters.salaryMax || 200000}
          onChange={e => setFilters((prev: any) => ({ ...prev, salaryMax: Number(e.target.value) }))}
          className="w-full accent-blue-600 cursor-pointer"
        />
      </div>

      <div className="h-px bg-gray-100 mb-4" />
      <CheckGroup title="Location / District" fieldKey="district" options={DISTRICTS.slice(0, 7)} />
      <div className="h-px bg-gray-100 mb-4" />
      <CheckGroup title="Job Category" fieldKey="category" options={CATEGORIES.slice(0, 8)} />
      <div className="h-px bg-gray-100 mb-4" />
      <CheckGroup title="Experience" fieldKey="experience" options={EXPERIENCES} />
      <div className="h-px bg-gray-100 mb-4" />
      <CheckGroup title="Qualification" fieldKey="qualification" options={QUALIFICATIONS} />
      <div className="h-px bg-gray-100 mb-4" />
      <CheckGroup title="Work Mode" fieldKey="workType" options={WORK_TYPES} />
      <div className="h-px bg-gray-100 mb-4" />
      <CheckGroup title="Job Type" fieldKey="jobType" options={JOB_TYPES.slice(0, 6)} />
    </div>
  );
}

/* ─── Job Card ─── */
function JobCard({ job, selected, onSelect, onSave, saved }: {
  job: Job; selected: boolean; onSelect: () => void;
  onSave: () => void; saved: boolean;
}) {
  const typeStyle = TYPE_COLORS[job.type] || TYPE_COLORS['Full Time'];

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-3xl p-5 border-2 transition-all duration-200 shadow-xs hover:shadow-md ${
        selected
          ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-100'
          : 'border-gray-200 bg-white hover:border-blue-300'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Logo */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-100 flex items-center justify-center font-bold text-base flex-shrink-0 text-blue-700 shadow-xs">
          {job.logo?.startsWith('http') ? (
            <img src={job.logo} alt="" className="w-full h-full object-cover rounded-2xl" />
          ) : (
            (job.logo || job.company?.[0] || 'C')
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate leading-tight">
                {job.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-gray-600 font-semibold truncate">{job.company}</p>
                {job.isVerified && <BadgeCheck size={14} className="text-emerald-600 flex-shrink-0" />}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {job.isFeatured && (
                <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-blue-100 text-blue-800">FEATURED</span>
              )}
              {job.isUrgent && (
                <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-amber-100 text-amber-900">URGENT</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Salary */}
      <p className="text-base font-black mb-2 text-emerald-600">
        {job.salary}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full"
          style={{ background: typeStyle.bg, color: typeStyle.color }}>
          {job.type}
        </span>
        {job.experience && (
          <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-100">
            {job.experience}
          </span>
        )}
        {job.education && (
          <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-100">
            {job.education}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin size={11} className="text-gray-400" />
          <span className="truncate">{job.location}</span>
          <span>·</span>
          <Clock size={11} className="text-gray-400" />
          <span>{job.posted}</span>
        </div>
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onSave()}
            className={`p-2 rounded-xl transition-all cursor-pointer ${saved ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            title="Save Job"
          >
            {saved ? <Bookmark size={14} className="fill-current" /> : <BookmarkPlus size={14} />}
          </button>
          <Link
            href={`/jobs/${job.id}`}
            className="px-3.5 py-1.5 text-xs font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-xs"
            style={{ background: '#2563EB' }}
          >
            Apply
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function JobsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiIntent, setAiIntent] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('latest');

  const [filters, setFilters] = useState<Record<string, any>>({
    experience: [], qualification: [], category: [],
    district: [], workType: [], jobType: [], salaryMax: 200000,
    datePosted: 'all'
  });

  // AI Job Search Handler (Fast, resilient with 3.5s timeout protection & offline fallback)
  const handleAIJobSearch = async () => {
    if (!search.trim() || aiSearching) return;

    // For Guest Users: Execute Instant Synonym Match without waiting
    if (!user) {
      toast.info('Instant Smart Search', 'Matched jobs using semantic keywords. Login for Gemini AI ranking!');
      return;
    }

    setAiSearching(true);
    try {
      // 3.5s timeout protection so search NEVER hangs
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI_SEARCH_TIMEOUT')), 3500)
      );

      const aiPromise = requestAIService({
        feature: 'job_search',
        userId: user.uid,
        userRole: 'SEEKER',
        payload: { query: search },
      });

      const res = (await Promise.race([aiPromise, timeoutPromise])) as any;

      if (res && res.success && res.data) {
        setAiIntent(res.data.intent);
        if (res.data.realJobs && Array.isArray(res.data.realJobs) && res.data.realJobs.length > 0) {
          const TYPE_MAP: Record<string, string> = {
            full_time: 'Full Time', part_time: 'Part Time', remote: 'Remote',
            wfh: 'WFH', contract: 'Contract', internship: 'Internship',
            walk_in: 'Walk-in', fresher: 'Fresher'
          };
          const mapped: Job[] = res.data.realJobs.map((d: any) => ({
            id: d.id,
            title: d.title || 'Job Title',
            company: d.companyName || d.company || 'Company',
            companyId: d.companyId || '',
            location: d.district || d.location || 'Theni',
            salary: d.salaryMin ? `₹${d.salaryMin.toLocaleString('en-IN')}/mo` : 'Negotiable',
            salaryMin: d.salaryMin || 0,
            salaryMax: d.salaryMax || 0,
            type: TYPE_MAP[d.jobType] || 'Full Time',
            posted: 'Live',
            logo: d.logoUrl || d.companyLogo || d.logo || 'C',
            isUrgent: d.isUrgent || false,
            isPremium: d.isPremium || false,
            isFeatured: true,
            isVerified: true,
            category: d.category || 'General',
            skills: d.skills || [],
            openings: d.openings || 1,
            description: d.description || '',
          }));
          setJobs(mapped);
          if (mapped.length > 0) setSelectedJob(mapped[0]);
          toast.success('✨ AI Matched Jobs Found', `Found ${mapped.length} matching jobs.`);
        }
      }
    } catch (err: any) {
      console.warn('[AI Job Search Notice]: Running local keyword match fallback.', err?.message);
      toast.info('Smart Search Active', 'Filtered matching database jobs.');
    } finally {
      setAiSearching(false);
    }
  };

  // URL params init
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('search')) setSearch(p.get('search')!);
      if (p.get('category')) setFilters(prev => ({ ...prev, category: [p.get('category')!] }));
      if (p.get('location')) setFilters(prev => ({ ...prev, district: [p.get('location')!] }));
    }
  }, []);

  // Fetch jobs from Firestore
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
    }, 10000); // 10s timeout protection

    async function load() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'jobs'),
          where('isActive', '==', true),
          where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        const TYPE_MAP: Record<string, string> = {
          full_time: 'Full Time', part_time: 'Part Time', remote: 'Remote',
          wfh: 'WFH', contract: 'Contract', internship: 'Internship',
          walk_in: 'Walk-in', fresher: 'Fresher'
        };

        const now = Date.now();
        const data = snap.docs.map(doc => {
          const d = doc.data();
          const millis = d.createdAt?.toMillis ? d.createdAt.toMillis() : (d.createdAt ? new Date(d.createdAt).getTime() : now);
          const salaryStr = d.salaryMin && d.salaryMax
            ? `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')}/mo`
            : d.salary || 'Salary Negotiable';

          return {
            id: doc.id,
            title: d.title || '',
            company: d.companyName || d.company || 'Company',
            companyId: d.companyId || '',
            location: d.district ? `${d.district}, Theni` : d.location || 'Theni',
            salary: salaryStr,
            salaryMin: d.salaryMin || 0,
            salaryMax: d.salaryMax || 0,
            type: TYPE_MAP[d.jobType] || d.type || 'Full Time',
            posted: formatTime(d.createdAt),
            postedAt: millis,
            logo: d.logoUrl || d.companyLogo || d.logo || d.companyName?.[0]?.toUpperCase() || 'C',
            isUrgent: d.isUrgent || false,
            isPremium: d.isPremium || false,
            isFeatured: d.isFeatured || false,
            isVerified: d.isVerified || false,
            category: d.category || '',
            skills: d.skills || [],
            openings: d.openings ? Number(d.openings) : 1,
            experience: d.experience || '',
            education: d.education || '',
            description: d.description || '',
            benefits: d.benefits || [],
            requirements: d.requirements || [],
            whatsapp: d.whatsapp || d.phone || ''
          } as Job;
        });

        // Sort latest first
        data.sort((a, b) => (b.postedAt || 0) - (a.postedAt || 0));
        setJobs(data);
        if (data.length > 0) setSelectedJob(data[0]);
      } catch (err) {
        console.error(err);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  // Saved Jobs tracking
  useEffect(() => {
    if (!user?.uid) {
      setSavedJobs([]);
      return;
    }
    const userId = user.uid;
    async function loadSavedJobs() {
      try {
        const savedQuery = query(collection(db, 'savedJobs'), where('userId', '==', userId));
        const snapshot = await getDocs(savedQuery);
        setSavedJobs(snapshot.docs.map((saved) => saved.data().jobId).filter(Boolean));
      } catch (err) {
        console.error('Unable to load saved jobs:', err);
      }
    }
    void loadSavedJobs();
  }, [user?.uid]);

  const handleSave = useCallback(async (jobId: string) => {
    if (!user) {
      toast.warning('Please login to save jobs.');
      return;
    }
    const userId = user.uid;
    if (savedJobs.includes(jobId)) {
      try {
        const savedQuery = query(
          collection(db, 'savedJobs'),
          where('userId', '==', userId),
          where('jobId', '==', jobId),
        );
        const snapshot = await getDocs(savedQuery);
        const batch = writeBatch(db);
        snapshot.docs.forEach((saved) => batch.delete(saved.ref));
        await batch.commit();
        setSavedJobs(prev => prev.filter(id => id !== jobId));
        toast.info('Job removed from saved');
      } catch (err) {
        console.error('Unable to remove saved job:', err);
      }
    } else {
      setSavedJobs(prev => [...prev, jobId]);
      try {
        await addDoc(collection(db, 'savedJobs'), {
          userId, jobId, createdAt: serverTimestamp()
        });
        toast.success('Job saved to your profile!');
      } catch (err) { console.error(err); }
    }
  }, [user, savedJobs, toast]);

  const resetFilters = () => {
    setFilters({ experience: [], qualification: [], category: [], district: [], workType: [], jobType: [], salaryMax: 200000, datePosted: 'all' });
    setSearch('');
  };

  // Rule-based search and multi-criteria filters
  const filtered = useMemo(() => {
    return jobs.filter(job => {
      // 1. Search Query with Rule-based SEO expansion
      if (search.trim()) {
        const s = search.toLowerCase().trim();
        const expandedTokens = [s];

        // Match against SEO synonym dictionaries without calling Gemini API
        Object.entries(RULE_BASED_SYNONYMS).forEach(([key, syns]) => {
          if (s.includes(key) || syns.some(syn => s.includes(syn))) {
            expandedTokens.push(key, ...syns);
          }
        });

        const titleLower = job.title.toLowerCase();
        const compLower = job.company.toLowerCase();
        const catLower = job.category.toLowerCase();
        const skillsLower = (job.skills || []).map(sk => sk.toLowerCase());

        const isMatched = expandedTokens.some(tok =>
          titleLower.includes(tok) ||
          compLower.includes(tok) ||
          catLower.includes(tok) ||
          skillsLower.some(sk => sk.includes(tok))
        );
        if (!isMatched) return false;
      }

      // 2. Date Posted
      if (filters.datePosted && filters.datePosted !== 'all') {
        const now = Date.now();
        const jobTime = job.postedAt || now;
        if (filters.datePosted === 'today' && (now - jobTime) > (36 * 3600 * 1000)) return false;
        if (filters.datePosted === '3days' && (now - jobTime) > (3 * 86400 * 1000)) return false;
        if (filters.datePosted === 'weekly' && (now - jobTime) > (7 * 86400 * 1000)) return false;
      }

      // 3. Salary Max
      if (filters.salaryMax < 200000 && job.salaryMax && job.salaryMax > filters.salaryMax) return false;

      // 4. Experience
      if (filters.experience?.length && job.experience && !filters.experience.some((e: string) => job.experience?.includes(e))) return false;

      // 5. Category
      if (filters.category?.length && !filters.category.includes(job.category)) return false;

      // 6. District / Location
      if (filters.district?.length && !filters.district.some((d: string) => job.location.includes(d))) return false;

      // 7. Work Mode
      if (filters.workType?.length) {
        const wt = filters.workType;
        if (wt.includes('Remote') && job.type !== 'Remote' && job.type !== 'WFH') return false;
      }

      // 8. Job Type
      if (filters.jobType?.length && !filters.jobType.includes(job.type)) return false;

      return true;
    });
  }, [jobs, search, filters]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) =>
    k !== 'salaryMax' && ((Array.isArray(v) && v.length > 0) || (k === 'datePosted' && v !== 'all'))
  ).length;

  const visibleJobs = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'salary') return (b.salaryMax || 0) - (a.salaryMax || 0);
      if (sortBy === 'newest') return (b.postedAt || 0) - (a.postedAt || 0);
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return a.isPremium === b.isPremium ? 0 : a.isPremium ? -1 : 1;
    });
  }, [filtered, sortBy]);

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }} className="font-outfit">
      <Header />

      {/* Page title & Main Search Bar */}
      <div className="pt-20 pb-6 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Browse Jobs in Theni &amp; Tamil Nadu
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {loading ? 'Searching...' : `${visibleJobs.length.toLocaleString()} verified career opportunities found`}
              </p>
            </div>

            {/* Daily Jobs & Trending Quick Links */}
            <div className="flex items-center gap-2">
              <Link
                href="/daily-jobs"
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-all"
              >
                <Calendar size={13} /> Today&apos;s Daily Jobs
              </Link>
            </div>
          </div>

          {/* Search Box with AI Match Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAIJobSearch()}
                placeholder="Search by job title, skill, company (e.g. Digital Marketing, React, Accountant, Delivery)..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-xs font-medium"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* AI Search CTA */}
            <button
              onClick={handleAIJobSearch}
              disabled={aiSearching}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50"
              title="Natural language Gemini AI Job Match"
            >
              {aiSearching ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              <span className="hidden sm:inline">AI Match</span>
            </button>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden p-3 rounded-2xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 relative"
            >
              <SlidersHorizontal size={17} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Quick Trending Searches Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
            <span className="text-gray-400 shrink-0 font-semibold text-[11px]">Popular:</span>
            {TRENDING_SEARCHES.map(term => (
              <button
                key={term}
                onClick={() => setSearch(term)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  search.toLowerCase() === term.toLowerCase()
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Jobs Layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Desktop Filter Sidebar (1 col) */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24">
            <FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} />
          </div>

          {/* Jobs List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Top Sort Header */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Showing <strong>{visibleJobs.length}</strong> jobs</span>
              <div className="flex items-center gap-2">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="latest">Latest First</option>
                  <option value="salary">Highest Salary</option>
                  <option value="newest">Posted Today</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 size={36} className="text-blue-600 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-gray-500">Loading verified jobs in Theni...</p>
              </div>
            ) : visibleJobs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
                <Briefcase size={36} className="text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-gray-900">No matching jobs found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Try clearing some filters or searching for broader keywords like &quot;Sales&quot;, &quot;Driver&quot;, or &quot;Teacher&quot;.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              visibleJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  selected={selectedJob?.id === job.id}
                  onSelect={() => setSelectedJob(job)}
                  onSave={() => handleSave(job.id)}
                  saved={savedJobs.includes(job.id)}
                />
              ))
            )}
          </div>

          {/* Selected Job Quick Preview Desktop Panel (1 col) */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24">
            {selectedJob ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-sm">
                <div className="border-b border-gray-100 pb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                    {selectedJob.category || 'Job Opportunity'}
                  </span>
                  <h2 className="text-base font-bold text-gray-900 mt-1.5 leading-snug">{selectedJob.title}</h2>
                  <p className="text-xs text-gray-600 font-semibold mt-0.5">{selectedJob.company}</p>
                  <p className="text-base font-black text-emerald-700 mt-2">{selectedJob.salary}</p>
                </div>

                <div className="space-y-2 text-xs text-gray-700">
                  <p className="flex justify-between"><span className="text-gray-400">Location:</span> <strong>{selectedJob.location}</strong></p>
                  <p className="flex justify-between"><span className="text-gray-400">Type:</span> <strong>{selectedJob.type}</strong></p>
                  <p className="flex justify-between"><span className="text-gray-400">Experience:</span> <strong>{selectedJob.experience || 'Any'}</strong></p>
                  <p className="flex justify-between"><span className="text-gray-400">Posted:</span> <strong>{selectedJob.posted}</strong></p>
                </div>

                {selectedJob.description && (
                  <div className="pt-2 border-t border-gray-100">
                    <h4 className="text-[11px] font-bold text-gray-900 uppercase mb-1">Description:</h4>
                    <p className="text-xs text-gray-600 line-clamp-4 leading-relaxed">{selectedJob.description}</p>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href={`/jobs/${selectedJob.id}`}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    View Details &amp; Apply <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center text-xs text-gray-400">
                Click any job card to preview
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Filter Jobs</h3>
              <button onClick={() => setShowMobileFilters(false)} className="p-1 rounded-xl text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} />
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-md"
            >
              Apply Filters ({filtered.length} Jobs)
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
