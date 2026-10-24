'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import HomeFooter from '@/components/home/HomeFooter';
import BottomNav from '@/components/navigation/BottomNav';
import FilterBottomSheet from '@/components/search/FilterBottomSheet';
import JobApplySuccessModal from '@/components/ui/JobApplySuccessModal';
import {
  Search, MapPin, Calendar, Clock, Sparkles, Filter,
  Briefcase, BadgeCheck, Flame, ChevronRight, Share2,
  Bookmark, BookmarkPlus, CheckCircle2, ArrowRight, Loader2,
  RefreshCw, Building2, Phone, MessageCircle, X, SlidersHorizontal,
  GraduationCap, Award, Eye, Heart, Compass, AlertCircle, FileText,
  User, Check, AlertTriangle, ExternalLink
} from 'lucide-react';
import {
  collection, getDocs, query, where, addDoc, deleteDoc, doc,
  serverTimestamp, limit as fbLimit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

// Public list limit matching platform standards
const PUBLIC_LIST_LIMIT = 500;

export interface DailyJob {
  id: string;
  slug?: string;
  title: string;
  company: string;
  companyId?: string;
  companyLogo?: string;
  location: string;
  district: string;
  taluk?: string;
  town?: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  type: string;
  workMode?: string;
  experience?: string;
  education?: string;
  category: string;
  subcategory?: string;
  skills: string[];
  benefits?: string[];
  openings?: number;
  postedAt: number; // millis
  postedText: string;
  deadline?: string;
  isUrgent?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  isWalkIn?: boolean;
  isFresher?: boolean;
  isDailyWage?: boolean;
  isExpired?: boolean;
  whatsapp?: string;
  phone?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
}

// 7 Official Theni Taluks + Key Towns & Regional Centers
const LOCATIONS = [
  'All Locations',
  'Theni',
  'Periyakulam',
  'Cumbum',
  'Bodinayakanur',
  'Chinnamanur',
  'Uthamapalayam',
  'Andipatti',
  'Thevaram',
  'Devadanapatti',
  'Veerapandi',
  'Kombai',
  'Kuchanur',
  'Gudalur',
  'Highwavys',
  'Madurai',
  'Dindigul',
];

const CATEGORIES = [
  'All Categories',
  'IT & Software',
  'Healthcare',
  'Education',
  'Agriculture',
  'Construction',
  'Manufacturing',
  'Retail & Sales',
  'Finance & Accounting',
  'Transport & Logistics',
  'Textiles & Handlooms',
  'Hospitality & Hotel',
  'Automobile',
  'BPO & Customer Care',
];

const SALARY_RANGES = [
  { label: 'All Salaries', value: 'all' },
  { label: 'Under ₹10,000', value: 'under_10k', max: 10000 },
  { label: '₹10,000 – ₹25,000', value: '10k_25k', min: 10000, max: 25000 },
  { label: '₹25,000 – ₹50,000', value: '25k_50k', min: 25000, max: 50000 },
  { label: 'Above ₹50,000', value: 'above_50k', min: 50000 },
];

const QUALIFICATIONS = [
  'All Qualifications',
  '10th Pass',
  '12th Pass',
  'ITI',
  'Diploma',
  'Any Degree',
  'Post Graduate (PG)',
];

const EXPERIENCES = [
  'All Experience',
  'Fresher',
  '1-2 Years',
  '3-5 Years',
  '5+ Years',
];

const JOB_TYPES = [
  'All Types',
  'Full Time',
  'Part Time',
  'Contract',
  'Internship',
  'Walk-in',
  'Daily Wage',
];

const WORK_MODES = ['All Work Modes', 'On-site', 'Remote', 'Hybrid'];

const POSTED_WINDOWS = [
  { label: 'All Time', value: 'all' },
  { label: "Today's Jobs (< 24h)", value: 'today' },
  { label: 'Past 3 Days', value: '3days' },
  { label: 'Past 7 Days (This Week)', value: '7days' },
  { label: 'Past 30 Days', value: '30days' },
];

const SEARCH_SUGGESTIONS = [
  'Medical Coding',
  'Accountant',
  'Sales Executive',
  'Data Entry',
  'Driver',
  'Teacher',
  'Electrician',
  'Delivery Boy',
  'Tailor',
  'Nurse',
  'Agriculture',
  'Store Manager',
];

type DiscoveryTab = 'all' | 'today' | 'urgent' | 'fresher' | 'walkin' | 'daily_wage' | 'featured' | 'nearby' | 'recent';

function formatPostedTime(millis: number): string {
  if (!millis) return 'Recently';
  const diffMs = Date.now() - millis;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(millis).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DailyJobsClient() {
  const { user } = useAuth();
  const toast = useToast();
  const { recentJobs, addToRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  // Core Data States
  const [allJobs, setAllJobs] = useState<DailyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<DailyJob | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<DiscoveryTab>('all');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedSalary, setSelectedSalary] = useState('all');
  const [selectedQualification, setSelectedQualification] = useState('All Qualifications');
  const [selectedExperience, setSelectedExperience] = useState('All Experience');
  const [selectedJobType, setSelectedJobType] = useState('All Types');
  const [selectedWorkMode, setSelectedWorkMode] = useState('All Work Modes');
  const [selectedPostedWindow, setSelectedPostedWindow] = useState('all');

  // Badge Toggles
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [fresherOnly, setFresherOnly] = useState(false);
  const [walkInOnly, setWalkInOnly] = useState(false);
  const [dailyWageOnly, setDailyWageOnly] = useState(false);

  // Modals & Drawers
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quickApplyJob, setQuickApplyJob] = useState<DailyJob | null>(null);
  const [applying, setApplying] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [appliedJobSuccess, setAppliedJobSuccess] = useState<{ title: string; company: string; id?: string } | null>(null);

  // Load Saved Jobs for Logged In User
  useEffect(() => {
    if (!user) {
      try {
        const local = localStorage.getItem('thenijobs_saved_jobs');
        if (local) setSavedJobIds(JSON.parse(local));
      } catch {
        // ignore
      }
      return;
    }

    async function loadSavedJobs() {
      try {
        const q = query(collection(db, 'savedJobs'), where('userId', '==', user?.uid));
        const snap = await getDocs(q);
        const ids = snap.docs.map(d => d.data().jobId).filter(Boolean);
        setSavedJobIds(ids);
      } catch (err) {
        console.warn('Failed to load saved jobs:', err);
      }
    }
    loadSavedJobs();
  }, [user]);

  // Load Real Jobs from Firestore
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 10000);

    async function fetchJobs() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'jobs'),
          where('isActive', '==', true),
          where('status', '==', 'active'),
          fbLimit(PUBLIC_LIST_LIMIT)
        );
        const snap = await getDocs(q);
        if (cancelled) return;

        const typeMap: Record<string, string> = {
          full_time: 'Full Time',
          part_time: 'Part Time',
          remote: 'Remote',
          contract: 'Contract',
          internship: 'Internship',
          walk_in: 'Walk-in',
          daily_wage: 'Daily Wage',
          fresher: 'Fresher',
        };

        const now = Date.now();

        const mapped: DailyJob[] = snap.docs.map(docSnap => {
          const d = docSnap.data();
          const millis = d.createdAt?.toMillis
            ? d.createdAt.toMillis()
            : d.createdAt
            ? new Date(d.createdAt).getTime()
            : d.postedAt || now;

          const postedText = formatPostedTime(millis);

          let salaryStr = 'Salary Negotiable';
          if (d.salary) {
            salaryStr = d.salary;
          } else if (d.salaryMin && d.salaryMax) {
            salaryStr = `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')} / mo`;
          } else if (d.salaryMin) {
            salaryStr = `From ₹${Number(d.salaryMin).toLocaleString('en-IN')} / mo`;
          }

          const isExpPassed = d.deadline ? new Date(d.deadline).getTime() < now : false;

          return {
            id: docSnap.id,
            slug: d.slug || '',
            title: d.title || 'Job Opening',
            company: d.companyName || d.company || 'Direct Employer',
            companyId: d.companyId || '',
            companyLogo: d.companyLogoUrl || d.logoUrl || d.companyLogo || d.logo || '',
            location: d.district ? `${d.location || d.district}, Theni` : d.location || 'Theni',
            district: d.district || d.companyDistrict || 'Theni',
            taluk: d.taluk || '',
            town: d.town || '',
            salary: salaryStr,
            salaryMin: d.salaryMin || 0,
            salaryMax: d.salaryMax || 0,
            type: typeMap[d.jobType] || d.type || 'Full Time',
            workMode: d.workMode || 'On-site',
            experience: d.experience || 'Any Experience',
            education: d.education || 'Any Degree',
            category: d.category || 'General',
            subcategory: d.subcategory || '',
            skills: Array.isArray(d.skills) ? d.skills : [],
            benefits: Array.isArray(d.benefits) ? d.benefits : [],
            openings: d.openings || 1,
            postedAt: millis,
            postedText,
            deadline: d.deadline || d.expiryDate || '',
            isUrgent: !!d.isUrgent,
            isVerified: !!d.isVerified,
            isFeatured: !!d.isFeatured || !!d.isPremium,
            isWalkIn: !!d.isWalkIn || d.jobType === 'walk_in',
            isFresher: (d.experience && d.experience.toLowerCase().includes('fresher')) || !!d.isFresher,
            isDailyWage: d.jobType === 'daily_wage' || !!d.isDailyWage || (salaryStr.toLowerCase().includes('daily') || salaryStr.toLowerCase().includes('wage')),
            isExpired: isExpPassed || d.status === 'expired',
            whatsapp: d.walkInContactPhone || d.whatsapp || d.phone || '',
            phone: d.walkInContactPhone || d.phone || '',
            description: d.description || '',
            responsibilities: Array.isArray(d.responsibilities) ? d.responsibilities : [],
            requirements: Array.isArray(d.requirements) ? d.requirements : [],
          };
        });

        // Filter out expired jobs from active pool
        const activePool = mapped.filter(j => !j.isExpired);
        // Sort latest first
        activePool.sort((a, b) => b.postedAt - a.postedAt);

        setAllJobs(activePool);
        if (activePool.length > 0) setSelectedJob(activePool[0]);
      } catch (err) {
        console.error('Failed to load daily jobs:', err);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    }

    fetchJobs();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  // Save / Bookmark Job Toggle Handler
  const handleToggleSave = async (job: DailyJob, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isSaved = savedJobIds.includes(job.id);

    if (user) {
      if (isSaved) {
        setSavedJobIds(prev => prev.filter(id => id !== job.id));
        try {
          const q = query(
            collection(db, 'savedJobs'),
            where('userId', '==', user.uid),
            where('jobId', '==', job.id)
          );
          const snap = await getDocs(q);
          snap.forEach(async docSnap => {
            await deleteDoc(doc(db, 'savedJobs', docSnap.id));
          });
          toast.info('Job removed from saved jobs');
        } catch (err) {
          console.error('Error unsaving job:', err);
        }
      } else {
        setSavedJobIds(prev => [...prev, job.id]);
        try {
          await addDoc(collection(db, 'savedJobs'), {
            userId: user.uid,
            jobId: job.id,
            jobTitle: job.title,
            companyName: job.company,
            district: job.district,
            salary: job.salary,
            createdAt: serverTimestamp(),
          });
          toast.success('Job saved to your profile!');
        } catch (err) {
          console.error('Error saving job:', err);
        }
      }
    } else {
      let updated: string[];
      if (isSaved) {
        updated = savedJobIds.filter(id => id !== job.id);
        toast.info('Job removed from saved jobs');
      } else {
        updated = [...savedJobIds, job.id];
        toast.success('Job saved! Sign in to sync across devices.');
      }
      setSavedJobIds(updated);
      try {
        localStorage.setItem('thenijobs_saved_jobs', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  // Share Job Handler
  const handleShareJob = async (job: DailyJob, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const jobUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://www.thenijobs.com'}/jobs/${job.slug || job.id}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${job.title} at ${job.company}`,
          text: `Check out this job opening: ${job.title} at ${job.company} (${job.location}) on THENIJOBS:`,
          url: jobUrl,
        });
        return;
      } catch {
        // User cancelled or unsupported, fallback to clipboard
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(jobUrl);
        toast.success('Job link copied to clipboard!');
      } catch {
        toast.info('Job link', jobUrl);
      }
    }
  };

  // Quick Apply Submission Handler
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickApplyJob) return;

    if (!user) {
      toast.warning('Please sign in as a job seeker to apply directly.');
      return;
    }

    setApplying(true);
    try {
      // 1. Duplicate check: prevent duplicate applications
      const qExisting = query(
        collection(db, 'applications'),
        where('jobId', '==', quickApplyJob.id),
        where('seekerId', '==', user.uid)
      );
      const existingSnap = await getDocs(qExisting);
      if (!existingSnap.empty) {
        toast.info('You have already applied for this job opening.');
        setQuickApplyJob(null);
        return;
      }

      // 2. Submit application document strictly matching security rule
      const appPayload = {
        jobId: quickApplyJob.id,
        jobTitle: quickApplyJob.title,
        companyId: quickApplyJob.companyId || 'direct',
        companyName: quickApplyJob.company,
        companyLogo: quickApplyJob.companyLogo || '',
        seekerId: user.uid,
        seekerName: user.displayName || 'Job Seeker',
        seekerEmail: user.email || '',
        seekerPhone: user.phone || '',
        coverLetter: coverNote.trim(),
        status: 'applied',
        appliedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'applications'), appPayload);

      setAppliedJobSuccess({
        title: quickApplyJob.title,
        company: quickApplyJob.company,
        id: docRef.id,
      });

      // Record to recently viewed
      addToRecentlyViewed({
        id: quickApplyJob.id,
        title: quickApplyJob.title,
        companyName: quickApplyJob.company,
        district: quickApplyJob.district,
        jobType: quickApplyJob.type,
        salaryMin: quickApplyJob.salaryMin,
        salaryMax: quickApplyJob.salaryMax,
        logo: quickApplyJob.companyLogo,
      });

      setQuickApplyJob(null);
      setCoverNote('');
    } catch (err: any) {
      console.error('Application failed:', err);
      toast.error(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  // Active counts for discovery badges (only display badge if actual eligible records exist)
  const counts = useMemo(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 3600 * 1000;
    return {
      all: allJobs.length,
      today: allJobs.filter(j => j.postedAt >= twentyFourHoursAgo).length,
      urgent: allJobs.filter(j => j.isUrgent).length,
      fresher: allJobs.filter(j => j.isFresher).length,
      walkin: allJobs.filter(j => j.isWalkIn).length,
      daily_wage: allJobs.filter(j => j.isDailyWage).length,
      featured: allJobs.filter(j => j.isFeatured).length,
      recent: recentJobs.length,
    };
  }, [allJobs, recentJobs]);

  // Main Multi-Criteria Filtering Engine
  const filteredJobs = useMemo(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 3600 * 1000;
    const threeDaysAgo = now - 3 * 86400 * 1000;
    const sevenDaysAgo = now - 7 * 86400 * 1000;
    const thirtyDaysAgo = now - 30 * 86400 * 1000;

    return allJobs.filter(job => {
      // 1. Discovery Tab Pre-filter
      if (activeTab === 'today' && job.postedAt < twentyFourHoursAgo) return false;
      if (activeTab === 'urgent' && !job.isUrgent) return false;
      if (activeTab === 'fresher' && !job.isFresher) return false;
      if (activeTab === 'walkin' && !job.isWalkIn) return false;
      if (activeTab === 'daily_wage' && !job.isDailyWage) return false;
      if (activeTab === 'featured' && !job.isFeatured) return false;

      // 2. Search Query (Title, Company, Location, Description, Skills, Category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = job.title.toLowerCase().includes(q);
        const inComp = job.company.toLowerCase().includes(q);
        const inLoc = job.location.toLowerCase().includes(q) || job.district.toLowerCase().includes(q);
        const inDesc = job.description?.toLowerCase().includes(q) || false;
        const inSkills = job.skills.some(s => s.toLowerCase().includes(q));
        const inCat = job.category.toLowerCase().includes(q);
        if (!inTitle && !inComp && !inLoc && !inDesc && !inSkills && !inCat) return false;
      }

      // 3. Location / Taluk / Town Filter
      if (selectedLocation !== 'All Locations') {
        const locLower = selectedLocation.toLowerCase();
        const matchesDistrict = job.district.toLowerCase().includes(locLower);
        const matchesLoc = job.location.toLowerCase().includes(locLower);
        const matchesTaluk = job.taluk ? job.taluk.toLowerCase().includes(locLower) : false;
        const matchesTown = job.town ? job.town.toLowerCase().includes(locLower) : false;
        if (!matchesDistrict && !matchesLoc && !matchesTaluk && !matchesTown) return false;
      }

      // 4. Category Filter
      if (selectedCategory !== 'All Categories' && job.category !== selectedCategory) {
        return false;
      }

      // 5. Salary Range Filter
      if (selectedSalary !== 'all') {
        const range = SALARY_RANGES.find(r => r.value === selectedSalary);
        if (range) {
          const effectiveMin = job.salaryMin || 0;
          const effectiveMax = job.salaryMax || job.salaryMin || 0;
          if (range.min && effectiveMax < range.min) return false;
          if (range.max && effectiveMin > range.max) return false;
        }
      }

      // 6. Qualification Filter
      if (selectedQualification !== 'All Qualifications') {
        if (!job.education || !job.education.toLowerCase().includes(selectedQualification.toLowerCase())) {
          return false;
        }
      }

      // 7. Experience Filter
      if (selectedExperience !== 'All Experience') {
        if (selectedExperience === 'Fresher') {
          if (!job.isFresher) return false;
        } else if (job.experience && !job.experience.toLowerCase().includes(selectedExperience.toLowerCase().slice(0, 3))) {
          return false;
        }
      }

      // 8. Job Type Filter
      if (selectedJobType !== 'All Types' && job.type !== selectedJobType) {
        return false;
      }

      // 9. Work Mode Filter
      if (selectedWorkMode !== 'All Work Modes' && job.workMode && job.workMode !== selectedWorkMode) {
        return false;
      }

      // 10. Posted Date Window Filter
      if (selectedPostedWindow === 'today' && job.postedAt < twentyFourHoursAgo) return false;
      if (selectedPostedWindow === '3days' && job.postedAt < threeDaysAgo) return false;
      if (selectedPostedWindow === '7days' && job.postedAt < sevenDaysAgo) return false;
      if (selectedPostedWindow === '30days' && job.postedAt < thirtyDaysAgo) return false;

      // 11. Quick Badges Filters
      if (verifiedOnly && !job.isVerified) return false;
      if (urgentOnly && !job.isUrgent) return false;
      if (fresherOnly && !job.isFresher) return false;
      if (walkInOnly && !job.isWalkIn) return false;
      if (dailyWageOnly && !job.isDailyWage) return false;

      return true;
    });
  }, [
    allJobs, activeTab, searchQuery, selectedLocation, selectedCategory,
    selectedSalary, selectedQualification, selectedExperience, selectedJobType,
    selectedWorkMode, selectedPostedWindow, verifiedOnly, urgentOnly,
    fresherOnly, walkInOnly, dailyWageOnly
  ]);

  // Count of active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedLocation !== 'All Locations') count++;
    if (selectedCategory !== 'All Categories') count++;
    if (selectedSalary !== 'all') count++;
    if (selectedQualification !== 'All Qualifications') count++;
    if (selectedExperience !== 'All Experience') count++;
    if (selectedJobType !== 'All Types') count++;
    if (selectedWorkMode !== 'All Work Modes') count++;
    if (selectedPostedWindow !== 'all') count++;
    if (verifiedOnly) count++;
    if (urgentOnly) count++;
    if (fresherOnly) count++;
    if (walkInOnly) count++;
    if (dailyWageOnly) count++;
    return count;
  }, [
    selectedLocation, selectedCategory, selectedSalary, selectedQualification,
    selectedExperience, selectedJobType, selectedWorkMode, selectedPostedWindow,
    verifiedOnly, urgentOnly, fresherOnly, walkInOnly, dailyWageOnly
  ]);

  // Clear all filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setActiveTab('all');
    setSelectedLocation('All Locations');
    setSelectedCategory('All Categories');
    setSelectedSalary('all');
    setSelectedQualification('All Qualifications');
    setSelectedExperience('All Experience');
    setSelectedJobType('All Types');
    setSelectedWorkMode('All Work Modes');
    setSelectedPostedWindow('all');
    setVerifiedOnly(false);
    setUrgentOnly(false);
    setFresherOnly(false);
    setWalkInOnly(false);
    setDailyWageOnly(false);
  }, []);

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-outfit text-slate-900 flex flex-col">
      <Header />

      {/* Hero Header Section */}
      <section className="pt-24 pb-8 px-4 sm:px-6 bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950 text-white relative overflow-hidden">
        {/* Decorative background blurs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={13} className="text-emerald-400 animate-pulse" />
                Theni District Daily Jobs Hub
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Daily Jobs &amp; Urgent Vacancies in Theni
              </h1>
              <p className="text-xs sm:text-sm text-blue-200/80 mt-1 max-w-2xl">
                Browse verified daily jobs, urgent hiring, walk-in interviews, and immediate joining vacancies across Theni, Cumbum, Periyakulam, and Tamil Nadu. Apply directly with zero middleman fees.
              </p>
            </div>

            {/* Quick Employer Action Button */}
            <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
              <Link
                href="/employer/post-job"
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                <Briefcase size={14} />
                Post a Job Free
              </Link>
            </div>
          </div>

          {/* Search Box Bar */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-6 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                aria-label="Search job title, skills, company name, location"
                placeholder="Search job title, skills, company name, or location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-3 bg-white text-gray-900 rounded-2xl text-xs sm:text-sm font-semibold placeholder-gray-400 outline-none shadow-sm focus:ring-2 focus:ring-blue-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 rounded-full"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="sm:col-span-3">
              <select
                aria-label="Filter by Taluk or Location"
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="w-full px-3.5 py-3 bg-white text-gray-900 rounded-2xl text-xs sm:text-sm font-semibold outline-none shadow-sm cursor-pointer"
              >
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === 'All Locations' ? '📍 All Taluks & Locations' : `📍 ${loc}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3 flex items-center gap-2">
              <select
                aria-label="Filter by Job Category"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-3 bg-white text-gray-900 rounded-2xl text-xs sm:text-sm font-semibold outline-none shadow-sm cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'All Categories' ? '💼 All Categories' : cat}
                  </option>
                ))}
              </select>

              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center shrink-0 relative cursor-pointer"
                aria-label="Open Filter Drawer"
              >
                <SlidersHorizontal size={18} />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Autocomplete Suggestions Chips */}
          <div className="pt-1 flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-blue-300 font-bold text-[11px] mr-1">Popular in Theni:</span>
            {SEARCH_SUGGESTIONS.map(sug => (
              <button
                key={sug}
                type="button"
                onClick={() => setSearchQuery(sug)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  searchQuery.toLowerCase() === sug.toLowerCase()
                    ? 'bg-blue-500 text-white border border-blue-400'
                    : 'bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white border border-white/10'
                }`}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Discovery Navigation Tabs Bar */}
      <section className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-xs px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 py-2.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Openings ({counts.all})
            </button>

            {counts.today > 0 && (
              <button
                onClick={() => setActiveTab('today')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'today'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <Clock size={13} />
                Today&apos;s Jobs ({counts.today})
              </button>
            )}

            {counts.urgent > 0 && (
              <button
                onClick={() => setActiveTab('urgent')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'urgent'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Flame size={13} className="text-amber-500 fill-amber-500" />
                Urgent Hiring ({counts.urgent})
              </button>
            )}

            {counts.fresher > 0 && (
              <button
                onClick={() => setActiveTab('fresher')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'fresher'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                }`}
              >
                <GraduationCap size={13} />
                Fresher Jobs ({counts.fresher})
              </button>
            )}

            {counts.walkin > 0 && (
              <button
                onClick={() => setActiveTab('walkin')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'walkin'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Calendar size={13} />
                Walk-in Interviews ({counts.walkin})
              </button>
            )}

            {counts.daily_wage > 0 && (
              <button
                onClick={() => setActiveTab('daily_wage')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'daily_wage'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
                }`}
              >
                ⚡ Daily Wage ({counts.daily_wage})
              </button>
            )}

            {counts.featured > 0 && (
              <button
                onClick={() => setActiveTab('featured')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'featured'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                ⭐ Featured ({counts.featured})
              </button>
            )}
          </div>

          {/* Filter Reset Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <RefreshCw size={12} />
              Reset Filters ({activeFiltersCount})
            </button>
          )}
        </div>
      </section>

      {/* Recently Viewed Jobs Shelf (Only shown when actual recent records exist) */}
      {recentJobs.length > 0 && (
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 py-3 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Clock size={13} className="text-blue-600" />
                Recently Viewed Jobs ({recentJobs.length})
              </span>
              <button
                onClick={clearRecentlyViewed}
                className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Clear History
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
              {recentJobs.map(rj => (
                <Link
                  key={rj.id}
                  href={`/jobs/${rj.slug || rj.id}`}
                  className="bg-white rounded-2xl p-2.5 border border-blue-200/80 shadow-2xs hover:shadow-sm shrink-0 w-60 flex items-center gap-2.5 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-xs text-blue-700 shrink-0">
                    {rj.logo?.startsWith('http') ? (
                      <img src={rj.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      (rj.companyName?.[0] || 'C')
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 group-hover:text-blue-600 truncate">{rj.title}</p>
                    <p className="text-[11px] text-gray-500 truncate">{rj.companyName} • {rj.district}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content: Left Filter Sidebar + Middle Cards Grid + Right Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Desktop Left Filter Sidebar (3 cols) */}
          <aside className="hidden lg:block lg:col-span-3 bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-5 sticky top-32">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <SlidersHorizontal size={16} className="text-blue-600" />
                Refine Openings
              </span>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Quick Badges Toggles */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fast Toggles</p>
              <label className="flex items-center justify-between text-xs font-semibold text-gray-700 cursor-pointer group">
                <span className="flex items-center gap-1.5 group-hover:text-emerald-700">
                  <BadgeCheck size={14} className="text-emerald-600" /> Verified Employers Only
                </span>
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={e => setVerifiedOnly(e.target.checked)}
                  className="accent-emerald-600 w-4 h-4 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold text-gray-700 cursor-pointer group">
                <span className="flex items-center gap-1.5 group-hover:text-amber-700">
                  <Flame size={14} className="text-amber-600" /> Urgent Vacancies Only
                </span>
                <input
                  type="checkbox"
                  checked={urgentOnly}
                  onChange={e => setUrgentOnly(e.target.checked)}
                  className="accent-amber-600 w-4 h-4 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold text-gray-700 cursor-pointer group">
                <span className="flex items-center gap-1.5 group-hover:text-teal-700">
                  <GraduationCap size={14} className="text-teal-600" /> Fresher Friendly
                </span>
                <input
                  type="checkbox"
                  checked={fresherOnly}
                  onChange={e => setFresherOnly(e.target.checked)}
                  className="accent-teal-600 w-4 h-4 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold text-gray-700 cursor-pointer group">
                <span className="flex items-center gap-1.5 group-hover:text-purple-700">
                  <Calendar size={14} className="text-purple-600" /> Walk-in Interviews
                </span>
                <input
                  type="checkbox"
                  checked={walkInOnly}
                  onChange={e => setWalkInOnly(e.target.checked)}
                  className="accent-purple-600 w-4 h-4 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold text-gray-700 cursor-pointer group">
                <span className="flex items-center gap-1.5 group-hover:text-orange-700">
                  ⚡ Daily Wage / Immediate
                </span>
                <input
                  type="checkbox"
                  checked={dailyWageOnly}
                  onChange={e => setDailyWageOnly(e.target.checked)}
                  className="accent-orange-600 w-4 h-4 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Salary Range */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Salary Expectation</p>
              <div className="space-y-1.5">
                {SALARY_RANGES.map(sal => (
                  <label key={sal.value} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="salaryRange"
                      checked={selectedSalary === sal.value}
                      onChange={() => setSelectedSalary(sal.value)}
                      className="accent-blue-600"
                    />
                    {sal.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Qualification */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Minimum Qualification</p>
              <select
                value={selectedQualification}
                onChange={e => setSelectedQualification(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none"
              >
                {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Experience Level */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Experience</p>
              <select
                value={selectedExperience}
                onChange={e => setSelectedExperience(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none"
              >
                {EXPERIENCES.map(exp => <option key={exp} value={exp}>{exp}</option>)}
              </select>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Job Type & Work Mode */}
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Job Type</p>
                <select
                  value={selectedJobType}
                  onChange={e => setSelectedJobType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none"
                >
                  {JOB_TYPES.map(jt => <option key={jt} value={jt}>{jt}</option>)}
                </select>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Work Mode</p>
                <select
                  value={selectedWorkMode}
                  onChange={e => setSelectedWorkMode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none"
                >
                  {WORK_MODES.map(wm => <option key={wm} value={wm}>{wm}</option>)}
                </select>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Posted Window</p>
                <select
                  value={selectedPostedWindow}
                  onChange={e => setSelectedPostedWindow(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none"
                >
                  {POSTED_WINDOWS.map(pw => <option key={pw.value} value={pw.value}>{pw.label}</option>)}
                </select>
              </div>
            </div>
          </aside>

          {/* Job Cards Listing Column (5 cols or 9 cols if preview hidden) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-600 px-1">
              <span>
                Showing <strong>{filteredJobs.length}</strong> matching openings
              </span>
              <span className="text-gray-400">Sorted by newest posted</span>
            </div>

            {loading ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3 shadow-xs">
                <Loader2 size={36} className="text-blue-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-gray-600">Loading verified openings from local Theni employers...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Compass size={32} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">No active jobs found for these filters</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Try broadening your search keywords, resetting taluk or category filters, or check back later today.
                  </p>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredJobs.map(job => {
                  const isSelected = selectedJob?.id === job.id;
                  const isSaved = savedJobIds.includes(job.id);

                  return (
                    <div
                      key={job.id}
                      onClick={() => {
                        setSelectedJob(job);
                        addToRecentlyViewed({
                          id: job.id,
                          title: job.title,
                          companyName: job.company,
                          district: job.district,
                          jobType: job.type,
                          salaryMin: job.salaryMin,
                          salaryMax: job.salaryMax,
                          logo: job.companyLogo,
                        });
                      }}
                      className={`bg-white rounded-3xl p-5 border-2 transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-100'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {/* Top Header Row */}
                      <div>
                        <div className="flex items-start gap-3 mb-2">
                          {/* Company Logo or Initial */}
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 flex items-center justify-center font-black text-base text-blue-700 shrink-0 shadow-2xs overflow-hidden">
                            {job.companyLogo?.startsWith('http') ? (
                              <img src={job.companyLogo} alt="" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              (job.company?.[0] || 'T')
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                                  {job.title}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <p className="text-xs text-gray-600 font-semibold truncate">{job.company}</p>
                                  {job.isVerified && (
                                    <span title="Verified Employer">
                                      <BadgeCheck size={14} className="text-emerald-600 shrink-0" />
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Relative Posted Time Badge */}
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 shrink-0">
                                ⚡ {job.postedText}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Salary Display */}
                        <p className="text-base font-black text-emerald-700 mb-2">
                          {job.salary}
                        </p>

                        {/* Pills & Tags */}
                        <div className="flex flex-wrap gap-1.5 text-[11px] mb-2.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                            {job.type}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-700 font-medium border border-gray-100">
                            <MapPin size={10} className="inline mr-1 text-gray-400" />
                            {job.location}
                          </span>
                          {job.experience && (
                            <span className="px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-700 font-medium border border-gray-100">
                              {job.experience}
                            </span>
                          )}
                          {job.education && (
                            <span className="px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-700 font-medium border border-gray-100">
                              <GraduationCap size={10} className="inline mr-1 text-gray-400" />
                              {job.education}
                            </span>
                          )}
                          {job.isUrgent && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                              URGENT
                            </span>
                          )}
                          {job.isWalkIn && (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-extrabold text-[10px]">
                              WALK-IN
                            </span>
                          )}
                        </div>

                        {/* Description Summary Snippet */}
                        {job.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2">
                            {job.description}
                          </p>
                        )}

                        {job.deadline && (
                          <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 mb-2">
                            <Clock size={11} /> Deadline: {job.deadline}
                          </p>
                        )}
                      </div>

                      {/* Card Bottom Actions Row */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 text-xs" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {/* Save Job Button */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleSave(job, e)}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                              isSaved ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title={isSaved ? 'Remove from Saved' : 'Save Job'}
                            aria-label={isSaved ? 'Remove from Saved' : 'Save Job'}
                          >
                            {isSaved ? <Bookmark size={15} className="fill-current" /> : <BookmarkPlus size={15} />}
                          </button>

                          {/* Share Job Button */}
                          <button
                            type="button"
                            onClick={(e) => handleShareJob(job, e)}
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                            title="Share Job"
                            aria-label="Share Job"
                          >
                            <Share2 size={15} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuickApplyJob(job)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-2xs cursor-pointer"
                          >
                            Apply Now
                          </button>

                          <Link
                            href={`/jobs/${job.slug || job.id}`}
                            className="text-xs font-bold text-gray-700 hover:text-blue-600 flex items-center gap-0.5 transition-colors"
                          >
                            Details <ChevronRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Right Sticky Job Details Preview Panel (4 cols) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-32">
            {selectedJob ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-sm">
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                      {selectedJob.category}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">
                      ⚡ {selectedJob.postedText}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 leading-snug">{selectedJob.title}</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-xs text-gray-600 font-semibold">{selectedJob.company}</p>
                    {selectedJob.isVerified && <BadgeCheck size={14} className="text-emerald-600" />}
                  </div>

                  <p className="text-lg font-black text-emerald-700 mt-2">{selectedJob.salary}</p>
                </div>

                {/* Key Attributes */}
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Location:</span>
                    <strong className="text-gray-800">{selectedJob.location}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Job Type:</span>
                    <strong className="text-gray-800">{selectedJob.type}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Experience:</span>
                    <strong className="text-gray-800">{selectedJob.experience}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-400">Qualification:</span>
                    <strong className="text-gray-800">{selectedJob.education}</strong>
                  </div>
                  {selectedJob.openings && (
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-400">Openings:</span>
                      <strong className="text-gray-800">{selectedJob.openings} vacancies</strong>
                    </div>
                  )}
                  {selectedJob.deadline && (
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-400">Deadline:</span>
                      <strong className="text-amber-700">{selectedJob.deadline}</strong>
                    </div>
                  )}
                </div>

                {/* Overview Description */}
                {selectedJob.description && (
                  <div className="pt-2 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Overview</h4>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                      {selectedJob.description}
                    </p>
                  </div>
                )}

                {/* Skills Chips */}
                {selectedJob.skills.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Required Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.skills.map(sk => (
                        <span key={sk} className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Action Buttons */}
                <div className="pt-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => setQuickApplyJob(selectedJob)}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    Apply Now <ArrowRight size={14} />
                  </button>

                  {selectedJob.whatsapp && (
                    <a
                      href={`https://wa.me/${selectedJob.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I saw "${selectedJob.title}" posted on THENIJOBS Daily Jobs and would like to apply. Listing: https://www.thenijobs.com/jobs/${selectedJob.slug || selectedJob.id}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      style={{ background: '#25D366' }}
                    >
                      <MessageCircle size={14} /> WhatsApp Direct Apply
                    </a>
                  )}

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(selectedJob, e)}
                      className="text-gray-600 hover:text-blue-600 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Bookmark size={13} className={savedJobIds.includes(selectedJob.id) ? 'fill-blue-600 text-blue-600' : ''} />
                      {savedJobIds.includes(selectedJob.id) ? 'Saved' : 'Save Job'}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleShareJob(selectedJob, e)}
                      className="text-gray-600 hover:text-blue-600 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Share2 size={13} />
                      Share
                    </button>

                    <Link
                      href={`/jobs/${selectedJob.slug || selectedJob.id}`}
                      className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                    >
                      Full Details <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center text-xs text-gray-400">
                Select a job opening to inspect full requirements
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        open={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title="Filter Job Openings"
        footer={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                handleResetFilters();
                setShowMobileFilters(false);
              }}
              className="flex-1 py-3 rounded-2xl border border-gray-300 text-xs font-bold text-gray-700"
            >
              Reset
            </button>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="flex-1 py-3 rounded-2xl bg-blue-600 text-xs font-bold text-white shadow-xs"
            >
              Show {filteredJobs.length} Results
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-semibold text-gray-800">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Taluk / Town</p>
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
            >
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Category</p>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Job Type</p>
            <select
              value={selectedJobType}
              onChange={e => setSelectedJobType(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl"
            >
              {JOB_TYPES.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Salary Range</p>
            <div className="space-y-1.5">
              {SALARY_RANGES.map(sal => (
                <label key={sal.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mobileSalary"
                    checked={selectedSalary === sal.value}
                    onChange={() => setSelectedSalary(sal.value)}
                    className="accent-blue-600"
                  />
                  {sal.label}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quick Filters</p>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Verified Employers Only</span>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={e => setVerifiedOnly(e.target.checked)}
                className="accent-emerald-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Urgent Hiring Only</span>
              <input
                type="checkbox"
                checked={urgentOnly}
                onChange={e => setUrgentOnly(e.target.checked)}
                className="accent-amber-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Fresher Friendly</span>
              <input
                type="checkbox"
                checked={fresherOnly}
                onChange={e => setFresherOnly(e.target.checked)}
                className="accent-teal-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Walk-in Interviews</span>
              <input
                type="checkbox"
                checked={walkInOnly}
                onChange={e => setWalkInOnly(e.target.checked)}
                className="accent-purple-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Daily Wage Jobs</span>
              <input
                type="checkbox"
                checked={dailyWageOnly}
                onChange={e => setDailyWageOnly(e.target.checked)}
                className="accent-orange-600"
              />
            </label>
          </div>
        </div>
      </FilterBottomSheet>

      {/* Quick Application Modal */}
      {quickApplyJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
          onClick={() => setQuickApplyJob(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 relative animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setQuickApplyJob(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-full cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                Direct Job Application
              </span>
              <h3 className="text-base font-bold text-gray-900 mt-1">{quickApplyJob.title}</h3>
              <p className="text-xs text-gray-600 font-semibold">{quickApplyJob.company} • {quickApplyJob.location}</p>
              <p className="text-xs font-bold text-emerald-700 mt-1">{quickApplyJob.salary}</p>
            </div>

            {user ? (
              <form onSubmit={handleApplySubmit} className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs space-y-1">
                  <p className="font-bold text-gray-800">Applying as:</p>
                  <p className="text-gray-600">{user.displayName || 'Job Seeker'}</p>
                  <p className="text-gray-500">{user.phone || user.email}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Cover Note / Message to Employer (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={coverNote}
                    onChange={e => setCoverNote(e.target.value)}
                    placeholder="Briefly state your relevant experience, immediate joining availability, and contact number..."
                    className="w-full p-3 rounded-2xl border border-gray-200 text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setQuickApplyJob(null)}
                    className="flex-1 py-3 rounded-2xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {applying ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Submit Application
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <p className="text-xs text-gray-600">
                  Please sign in to your THENIJOBS seeker account to submit applications and track employer status.
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/login?redirect=/daily-jobs`}
                    className="w-full py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-xs"
                  >
                    Sign In to Apply
                  </Link>
                  {quickApplyJob.whatsapp && (
                    <a
                      href={`https://wa.me/${quickApplyJob.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I saw "${quickApplyJob.title}" posted on THENIJOBS Daily Jobs and would like to apply.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 rounded-2xl text-white font-bold text-xs"
                      style={{ background: '#25D366' }}
                    >
                      Apply via WhatsApp Instantly
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Application Confirmed Success Modal */}
      {appliedJobSuccess && (
        <JobApplySuccessModal
          isOpen={true}
          onClose={() => setAppliedJobSuccess(null)}
          jobTitle={appliedJobSuccess.title}
          companyName={appliedJobSuccess.company}
          applicationId={appliedJobSuccess.id}
        />
      )}

      <HomeFooter />
      <BottomNav />
    </main>
  );
}
