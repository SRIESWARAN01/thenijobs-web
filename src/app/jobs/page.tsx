'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Search, MapPin, X, Briefcase, Clock, BadgeCheck, BookmarkPlus, Bookmark, Share2, SlidersHorizontal, ChevronRight, Star, CheckCircle, Copy, MessageCircle, Sparkles, Loader2
} from 'lucide-react';
import { collection, getDocs, query, where, addDoc, writeBatch, serverTimestamp, getDocs as getDocsFire } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { requestAIService } from '@/lib/ai/aiClient';

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
const CATEGORIES = ['IT & Software', 'Agriculture', 'Education', 'Healthcare', 'Construction', 'Textiles', 'Transport', 'Finance', 'Sales & Marketing', 'Manufacturing'];
const DISTRICTS = ['Theni', 'Madurai', 'Dindigul', 'Virudhunagar', 'Tirunelveli', 'Coimbatore', 'Salem', 'Trichy', 'Chennai'];
const EXPERIENCES = ['Fresher', '1-3 yrs', '3-5 yrs', '5+ yrs'];
const QUALIFICATIONS = ['10th', '12th', 'Any Degree', 'Diploma', 'PG', 'ITI'];
const WORK_TYPES = ['On-site', 'Remote', 'Hybrid'];
const COMPANY_TYPES = ['Private', 'Government', 'NGO', 'Startup'];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  'Full Time':   { bg: '#EFF6FF', color: '#2563EB' },
  'Part Time':   { bg: '#F0FDF4', color: '#16A34A' },
  'Remote':      { bg: '#F5F3FF', color: '#7C3AED' },
  'WFH':         { bg: '#F5F3FF', color: '#7C3AED' },
  'Walk-in':     { bg: '#FFFBEB', color: '#D97706' },
  'Internship':  { bg: '#FFF1F2', color: '#E11D48' },
  'Contract':    { bg: '#F0F9FF', color: '#0284C7' },
  'Fresher':     { bg: '#F0FDF4', color: '#16A34A' } };

const TRENDING_SEARCHES = ['Delivery Boy', 'Sales Executive', 'Teacher', 'Driver', 'Accountant', 'Data Entry', 'Telecaller', 'Electrician', 'Security Guard', 'Store Keeper'];

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

  const CheckGroup = ({ title, key, options }: { title: string; key: string; options: string[] }) => (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1.5">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
              (filters[key] || []).includes(opt) ? 'border-blue-600 bg-blue-600' : 'border-gray-300 group-hover:border-blue-300'
            }`}
              onClick={() => toggle(key, opt)}>
              {(filters[key] || []).includes(opt) && (
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                  <path d="M3.5 7.5L1.5 5.5 0 7l3.5 3.5 8-8-1.5-1.5z" />
                </svg>
              )}
            </div>
            <span className="text-xs text-gray-700 group-hover:text-gray-900">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-gray-900">Filters</p>
        <button onClick={onReset} className="text-xs text-blue-600 font-semibold hover:text-blue-700">Reset</button>
      </div>

      {/* Salary Range */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Salary Range</p>
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>₹0</span>
          <span>₹{(filters.salaryMax || 80000).toLocaleString('en-IN')}</span>
        </div>
        <input
          type="range" min={0} max={200000} step={5000}
          value={filters.salaryMax || 80000}
          onChange={e => setFilters((prev: any) => ({ ...prev, salaryMax: Number(e.target.value) }))}
          className="w-full accent-blue-600"
        />
      </div>

      <div className="h-px bg-gray-100 mb-4" />
      <CheckGroup title="Experience" key="experience" options={EXPERIENCES} />
      <div className="h-px bg-gray-100 mb-4" />
      <CheckGroup title="Qualification" key="qualification" options={QUALIFICATIONS} />
      <div className="h-px bg-gray-100 mb-4" />
      <CheckGroup title="Category" key="category" options={CATEGORIES.slice(0, 6)} />
      <div className="h-px bg-gray-100 mb-4" />
      <CheckGroup title="District" key="district" options={DISTRICTS.slice(0, 5)} />
      <div className="h-px bg-gray-100 mb-4" />
      <CheckGroup title="Work Type" key="workType" options={WORK_TYPES} />
      <div className="h-px bg-gray-100 mb-4" />
      <CheckGroup title="Company Type" key="companyType" options={COMPANY_TYPES} />
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
      className={`cursor-pointer rounded-2xl p-4 border-2 transition-all duration-150 ${
        selected
          ? 'border-blue-500 bg-blue-50/50 shadow-md'
          : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Logo */}
        <div className="w-11 h-11 rounded-xl border border-gray-100 flex items-center justify-center font-bold text-base flex-shrink-0"
          style={{ background: '#EFF6FF', color: '#2563EB' }}>
          {job.logo?.startsWith('http') ? (
            <img src={job.logo} alt="" className="w-full h-full object-cover rounded-xl" />
          ) : (
            (job.logo || job.company?.[0] || 'C')
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {job.title}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-xs text-gray-500 font-medium truncate">{job.company}</p>
                {job.isVerified && <BadgeCheck size={12} className="text-emerald-500 flex-shrink-0" />}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {job.isFeatured && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-blue-50 text-blue-600">FEATURED</span>
              )}
              {job.isUrgent && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-50 text-amber-600">URGENT</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Salary */}
      <p className="text-sm font-bold mb-2" style={{ color: '#10B981' }}>
        {job.salary}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
          style={{ background: typeStyle.bg, color: typeStyle.color }}>
          {job.type}
        </span>
        {job.experience && (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-50 text-gray-600 border border-gray-100">
            {job.experience}
          </span>
        )}
        {job.education && (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-50 text-gray-600 border border-gray-100">
            {job.education}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <MapPin size={10} />
          <span>{job.location}</span>
          <span>·</span>
          <Clock size={10} />
          <span>{job.posted}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={e => {
              e.stopPropagation();
              const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/jobs/${job.id}`;
              const text = `Check out this job: ${job.title} at ${job.company} - ${url}`;
              if (navigator.share) {
                navigator.share({ title: job.title, text, url }).catch(() => {});
              } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"
            title="Share"
          >
            <Share2 size={13} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onSave(); }}
            className={`p-1.5 rounded-lg transition-all ${saved ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          >
            {saved ? <Bookmark size={13} className="fill-current" /> : <BookmarkPlus size={13} />}
          </button>
          <Link
            href={`/jobs/${job.id}`}
            onClick={e => e.stopPropagation()}
            className="px-3 py-1.5 text-[11px] font-semibold text-white rounded-lg transition-all hover:opacity-90"
            style={{ background: '#2563EB' }}
          >
            Apply
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Preview Panel ─── */
function PreviewPanel({ job, onApply, saved, onSave }: {
  job: Job | null; onApply: () => void; saved: boolean; onSave: () => void;
}) {
  if (!job) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col items-center justify-center h-96 text-center p-8">
        <Briefcase size={40} className="text-gray-200 mb-3" />
        <p className="text-sm font-medium text-gray-500">Select a job to see details</p>
        <p className="text-xs text-gray-400 mt-1">Click any job card on the left</p>
      </div>
    );
  }

  const typeStyle = TYPE_COLORS[job.type] || TYPE_COLORS['Full Time'];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl border-2 border-gray-100 flex items-center justify-center font-bold text-xl flex-shrink-0"
            style={{ background: '#EFF6FF', color: '#2563EB' }}>
            {job.logo || job.company?.[0] || 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 leading-tight mb-0.5">{job.title}</h2>
            <div className="flex items-center gap-1">
              <p className="text-sm text-gray-600 font-medium">{job.company}</p>
              {job.isVerified && <BadgeCheck size={14} className="text-emerald-500" />}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-gray-600 font-medium">4.5</span>
              <span>· Verified Employer</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={onSave}
              className={`p-2 rounded-xl border transition-all ${saved ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}>
              {saved ? <Bookmark size={15} className="fill-current" /> : <BookmarkPlus size={15} />}
            </button>
            <button className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:border-gray-200 transition-all">
              <Share2 size={15} />
            </button>
          </div>
        </div>

        <p className="text-2xl font-bold mb-3" style={{ color: '#10B981' }}>{job.salary}</p>

        {/* Chips row */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full"
            style={{ background: typeStyle.bg, color: typeStyle.color }}>
            {job.type}
          </span>
          {job.experience && <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-600 border border-gray-100">{job.experience}</span>}
          {job.education && <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-600 border border-gray-100">{job.education}</span>}
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-400 border border-gray-100 flex items-center gap-1">
            <MapPin size={10} />{job.location}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-5">
        {['Overview', 'Requirements', 'Company'].map((tab, i) => (
          <button key={tab} className={`py-3 mr-4 text-xs font-semibold border-b-2 transition-all ${
            i === 0 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
        {job.description && (
          <div>
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Job Description</p>
            <p className="text-xs text-gray-600 leading-relaxed">{job.description}</p>
          </div>
        )}

        {job.skills && job.skills.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Required Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map(skill => (
                <span key={skill} className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {job.benefits && job.benefits.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Benefits</p>
            <div className="grid grid-cols-2 gap-1.5">
              {job.benefits.map(b => (
                <div key={b} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />
                  {b}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Apply button */}
      <div className="p-4 border-t border-gray-50">
        <Link
          href={`/jobs/${job.id}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-gray-900 transition-all hover:opacity-90 shadow-md"
          style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
        >
          Apply Now <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiIntent, setAiIntent] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('latest');

  const handleAIJobSearch = async () => {
    if (!search.trim() || aiSearching) return;
    setAiSearching(true);
    try {
      const res = await requestAIService({
        feature: 'job_search',
        userId: user?.uid,
        userRole: 'SEEKER',
        payload: { query: search },
      });

      if (res.success && res.data) {
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
            company: d.companyName || 'Company',
            companyId: d.companyId || '',
            location: d.district || d.location || 'Theni',
            salary: d.salaryMin ? `₹${d.salaryMin.toLocaleString('en-IN')}/mo` : 'Negotiable',
            salaryMin: d.salaryMin || 0,
            salaryMax: d.salaryMax || 0,
            type: TYPE_MAP[d.jobType] || 'Full Time',
            posted: 'Live',
            logo: d.logoUrl || d.companyLogo || 'C',
            isUrgent: false,
            isPremium: false,
            isFeatured: true,
            isVerified: true,
            category: d.category || 'General',
            skills: d.skills || [],
            openings: d.openings || 1,
            description: d.description || '',
          }));
          setJobs(mapped);
          if (mapped.length > 0) setSelectedJob(mapped[0]);
        }
      }
    } catch (err) {
      console.error('AI Job Search error:', err);
    } finally {
      setAiSearching(false);
    }
  };
  const [filters, setFilters] = useState<Record<string, any>>({
    experience: [], qualification: [], category: [],
    district: [], workType: [], companyType: [], salaryMax: 200000
  });

  // URL params init
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('search')) setSearch(p.get('search')!);
    }
  }, []);

  // Fetch jobs
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'jobs'),
          where('isActive', '==', true),
          where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        const TYPE_MAP: Record<string, string> = {
          full_time: 'Full Time', part_time: 'Part Time', remote: 'Remote',
          wfh: 'WFH', contract: 'Contract', internship: 'Internship',
          walk_in: 'Walk-in', fresher: 'Fresher'
        };
        const data = snap.docs.map(doc => {
          const d = doc.data();
          const salaryStr = d.salaryMin && d.salaryMax
            ? `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')}/mo`
            : 'Salary Negotiable';
          return {
            id: doc.id,
            title: d.title || '',
            company: d.companyName || 'Company',
            companyId: d.companyId || '',
            location: d.district || d.location || 'Theni',
            salary: salaryStr,
            salaryMin: d.salaryMin || 0,
            salaryMax: d.salaryMax || 0,
            type: TYPE_MAP[d.jobType] || 'Full Time',
            posted: formatTime(d.createdAt),
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
            whatsapp: d.whatsapp || d.phone || '' } as Job;
        });
        // Sort
        const sorted = [...data].sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          if (a.isPremium && !b.isPremium) return -1;
          return 0;
        });
        setJobs(sorted);
        if (sorted.length > 0) setSelectedJob(sorted[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
    if (!user) return;
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
      } catch (err) {
        console.error('Unable to remove saved job:', err);
      }
    } else {
      setSavedJobs(prev => [...prev, jobId]);
      try {
        await addDoc(collection(db, 'savedJobs'), {
          userId, jobId, createdAt: serverTimestamp()
        });
      } catch (err) { console.error(err); }
    }
  }, [user, savedJobs]);

  const resetFilters = () => {
    setFilters({ experience: [], qualification: [], category: [], district: [], workType: [], companyType: [], salaryMax: 200000 });
  };

  // Filter & search
  const filtered = jobs.filter(job => {
    if (search) {
      const s = search.toLowerCase();
      if (!job.title.toLowerCase().includes(s) && !job.company.toLowerCase().includes(s)) return false;
    }
    if (filters.salaryMax < 200000 && job.salaryMax && job.salaryMax > filters.salaryMax) return false;
    if (filters.experience?.length && job.experience && !filters.experience.some((e: string) => job.experience?.includes(e))) return false;
    if (filters.category?.length && !filters.category.includes(job.category)) return false;
    if (filters.district?.length && !filters.district.includes(job.location)) return false;
    if (filters.workType?.length) {
      const wt = filters.workType;
      if (wt.includes('Remote') && job.type !== 'Remote' && job.type !== 'WFH') return false;
    }
    return true;
  });

  const activeFilterCount = Object.entries(filters).filter(([k, v]) =>
    k !== 'salaryMax' && Array.isArray(v) && v.length > 0
  ).length;

  const visibleJobs = [...filtered].sort((a, b) => {
    if (sortBy === 'salary') return (b.salaryMax || 0) - (a.salaryMax || 0);
    if (sortBy === 'newest') return a.posted === 'Today' ? -1 : b.posted === 'Today' ? 1 : 0;
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    return a.isPremium === b.isPremium ? 0 : a.isPremium ? -1 : 1;
  });

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {/* Page title bar */}
      <div className="pt-16 border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Jobs in Theni &amp; Tamil Nadu
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {loading ? 'Loading...' : `${visibleJobs.length.toLocaleString()} verified jobs found`}
              </p>
            </div>

            {/* Search + sort */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64 flex gap-1.5">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAIJobSearch()}
                    placeholder="Describe jobs (e.g. Accounting in Theni > 15k)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-0 focus:bg-white transition-all"
                  />
                </div>
                <button
                  onClick={handleAIJobSearch}
                  disabled={aiSearching}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs shrink-0 disabled:opacity-50"
                  title="Natural language AI Job Search"
                >
                  {aiSearching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span className="hidden sm:inline">AI Search</span>
                </button>
              </div>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white"
              >
                <SlidersHorizontal size={15} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: '#2563EB' }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="hidden sm:block py-2.5 px-3 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none cursor-pointer"
              >
                <option value="latest">Relevance, Latest, Salary</option>
                <option value="salary">Salary: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowMobileFilters(false)} />
          <div className="w-80 bg-white overflow-y-auto p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-900">Filters</p>
              <button onClick={() => setShowMobileFilters(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} />
          </div>
        </div>
      )}

      {/* 3-Column Layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 pb-20 md:pb-6">
        <div className="flex gap-5">

          {/* Left: Filters (desktop only) */}
          <div className="hidden lg:block w-52 xl:w-60 flex-shrink-0">
            <div className="sticky top-20">
              <FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} />
            </div>
          </div>

          {/* Center: Job list */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                    <div className="flex gap-3 mb-3">
                      <div className="w-11 h-11 bg-gray-100 rounded-xl" />
                      <div className="flex-1">
                        <div className="h-3.5 bg-gray-100 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-gray-100 rounded-full w-16" />
                      <div className="h-5 bg-gray-100 rounded-full w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                <Briefcase size={40} className="text-gray-200 mb-3" />
                <p className="text-sm font-semibold text-gray-500 mb-1">No jobs found</p>
                <p className="text-xs text-gray-400">Try adjusting your filters or search term</p>
                <button onClick={resetFilters} className="mt-4 text-sm text-blue-600 font-semibold">Clear Filters</button>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    selected={selectedJob?.id === job.id}
                    onSelect={() => setSelectedJob(job)}
                    saved={savedJobs.includes(job.id)}
                    onSave={() => handleSave(job.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Preview panel (desktop only) */}
          <div className="hidden xl:block w-80 2xl:w-96 flex-shrink-0">
            <div className="sticky top-20">
              <PreviewPanel
                job={selectedJob}
                onApply={() => {}}
                saved={selectedJob ? savedJobs.includes(selectedJob.id) : false}
                onSave={() => selectedJob && handleSave(selectedJob.id)}
              />
            </div>
          </div>

        </div>
      </div>

      <BottomNav />
    </div>
  );
}
