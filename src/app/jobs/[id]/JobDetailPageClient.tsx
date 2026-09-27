'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  MapPin, Briefcase, Banknote, Clock, Users, BadgeCheck,
  BookmarkPlus, Share2, Zap, Building2, ChevronRight,
  CheckCircle, BellRing, MessageCircle, Loader2, FileText,
  Copy, Heart, AlertTriangle, X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument, useCollection } from '@/hooks/useFirestore';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { followCompany, unfollowCompany, isFollowingCompany, applyToJob } from '@/lib/firebase/firestoreService';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, addDoc, collection, query, where, getDocs, writeBatch, serverTimestamp, limit as fbLimit } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';
import JobApplySuccessModal from '@/components/ui/JobApplySuccessModal';
import { slugify } from '@/lib/seo/jobSlug';

interface JobRecord {
  id: string;
  slug?: string;
  title: string;
  companyName: string;
  companyId: string;
  companySlug?: string;
  location: string;
  district: string;
  state: string;
  salaryMin: number;
  salaryMax: number;
  jobType: string;
  posted: string;
  openings: number;
  logo: string;
  isUrgent: boolean;
  isVerified: boolean;
  whatsapp?: string;
  phone?: string;
  experience?: string;
  education?: string;
  deadline?: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  skills?: string[];
  benefits?: string[];
}

interface InitialJobData {
  id: string;
  slug?: string;
  title: string;
  companyName: string;
  companyId: string;
  companySlug?: string;
  location: string;
  district: string;
  state: string;
  salaryMin: number;
  salaryMax: number;
  jobType: string;
  openings: number;
  isUrgent: boolean;
  isVerified: boolean;
  whatsapp?: string;
  phone?: string;
  experience?: string;
  education?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  benefits: string[];
  posted: string;
  deadline: string;
  logo: string;
  isExpired?: boolean;
  expiredMessage?: string;
}

export default function JobDetailPageClient({ id: idProp, initialJob }: { id: string; initialJob?: InitialJobData }) {
  const router = useRouter();
  const pathname = usePathname();
  const urlId = pathname?.split('/').filter(Boolean).pop() || '';
  const id = (urlId && urlId !== '_fallback' && urlId !== 'demo') ? urlId : idProp;
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isEmployerRole = user?.role === 'employer' || user?.role === 'business_owner';
  const { data: userCompanies } = useCollection<any>('companies', [
    where('ownerId', '==', uid || '')
  ], { skip: !uid || !isEmployerRole });
  const userCompanyId = userCompanies?.[0]?.id || user?.companyId;

  // Use initialJob from server for instant hydration if it matches current id (by docId or slug)
  const hasValidInitialJob = Boolean(
    initialJob &&
    (initialJob.id === id || initialJob.slug === id) &&
    id !== '_fallback' &&
    id !== 'demo'
  );
  const [job, setJob] = useState<JobRecord | null>(
    hasValidInitialJob && initialJob ? {
      id: initialJob.id,
      slug: initialJob.slug || '',
      title: initialJob.title,
      companyName: initialJob.companyName,
      companyId: initialJob.companyId,
      companySlug: initialJob.companySlug || (initialJob.companyName ? slugify(initialJob.companyName) : ''),
      location: initialJob.location,
      district: initialJob.district,
      state: initialJob.state,
      salaryMin: initialJob.salaryMin,
      salaryMax: initialJob.salaryMax,
      jobType: initialJob.jobType,
      posted: initialJob.posted || 'Recently',
      openings: initialJob.openings,
      logo: initialJob.logo,
      isUrgent: initialJob.isUrgent,
      isVerified: initialJob.isVerified,
      whatsapp: initialJob.whatsapp,
      phone: initialJob.phone,
      experience: initialJob.experience,
      education: initialJob.education,
      deadline: initialJob.deadline || 'N/A',
      description: initialJob.description,
      responsibilities: initialJob.responsibilities,
      requirements: initialJob.requirements,
      skills: initialJob.skills,
      benefits: initialJob.benefits,
    } : null
  );
  const [loading, setLoading] = useState(!hasValidInitialJob);
  const [saved, setSaved] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSuccessTicket, setShowSuccessTicket] = useState(false);
  const [createdApplicationId, setCreatedApplicationId] = useState<string | undefined>(undefined);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [similarJobs, setSimilarJobs] = useState<any[]>([]);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [companyResponseTime, setCompanyResponseTime] = useState<string | null>(null);
  const [logoBroken, setLogoBroken] = useState(false);
  const { addToRecentlyViewed } = useRecentlyViewed();
  const toast = useToast();

  // Fetch seekerProfile to check their resumes
  const { data: seekerProfile } = useDocument<any>('seekerProfiles', uid);
  const resumes = seekerProfile?.resumes || [];

  // 1. Fetch job details from Firestore
  useEffect(() => {
    if (!id || id === '_fallback') return;
    // Skip Firestore fetch if we already have matching initialJob from server
    if (hasValidInitialJob) { setLoading(false); return; }
    async function loadJob() {
      try {
        setLoading(true);
        let d: any = null;
        let docId = id;

        // 1. Direct document lookup if id is not a hyphenated slug
        if (!id.includes('-')) {
          const docSnap = await getDoc(doc(db, 'jobs', id));
          if (docSnap.exists()) {
            d = docSnap.data();
            docId = docSnap.id;
          }
        }

        // 2. Query by slug
        if (!d) {
          const qSlug = query(
            collection(db, 'jobs'),
            where('slug', '==', id),
            where('status', '==', 'active'),
            fbLimit(1)
          );
          const snapSlug = await getDocs(qSlug);
          if (!snapSlug.empty) {
            d = snapSlug.docs[0].data();
            docId = snapSlug.docs[0].id;
          }
        }

        // 3. Query by aliases
        if (!d) {
          const qAlias = query(
            collection(db, 'jobs'),
            where('aliases', 'array-contains', id),
            where('status', '==', 'active'),
            fbLimit(1)
          );
          const snapAlias = await getDocs(qAlias);
          if (!snapAlias.empty) {
            d = snapAlias.docs[0].data();
            docId = snapAlias.docs[0].id;
          }
        }

        // 4. Direct doc get fallback
        if (!d && id.includes('-')) {
          const docSnap = await getDoc(doc(db, 'jobs', id));
          if (docSnap.exists()) {
            d = docSnap.data();
            docId = docSnap.id;
          }
        }

        if (d) {
          // Note: If inactive/expired, render checks (isJobActuallyExpired & isPrivileged) will guard access.

          // If accessed by legacy docId and a slug exists, replace URL
          if (d.slug && id === docId && id !== d.slug) {
            router.replace(`/jobs/${d.slug}`);
          }

          setJob({
            id: docId,
            slug: d.slug || '',
            title: d.title || '',
            companyName: d.companyName || 'Verified Employer',
            companyId: d.companyId || '',
            companySlug: d.companySlug || (d.companyName ? slugify(d.companyName) : ''),
            location: d.location || d.district || 'Theni',
            district: d.district || 'Theni',
            state: d.state || 'Tamil Nadu',
            salaryMin: d.salaryMin || 0,
            salaryMax: d.salaryMax || 0,
            jobType: d.jobType || 'full_time',
            posted: d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleDateString('en-IN') : 'Recently',
            openings: d.openings ? Number(d.openings) : 1,
            // companyLogoUrl is the field src/app/employer/post-job/page.tsx actually writes
            // onto a job document; logoUrl/companyLogo/logo are kept as fallbacks for any
            // differently-shaped job doc (duplicated/legacy), never observed to be the primary
            // source in this repo's own job-creation code.
            logo: d.companyLogoUrl || d.logoUrl || d.companyLogo || d.logo || '',
            isUrgent: d.isUrgent || false,
            isVerified: d.isVerified || false,
            whatsapp: d.whatsapp || d.phone || '919360519460',
            phone: d.phone || '',
            experience: d.experience || 'Not specified',
            education: d.education || 'Not specified',
            deadline: d.expiresAt ? new Date(d.expiresAt.seconds * 1000).toLocaleDateString('en-IN') : 'N/A',
            description: d.description || '',
            responsibilities: d.responsibilities || [],
            requirements: d.requirements || [],
            skills: d.skills || [],
            benefits: d.benefits || []
          });
        }
      } catch (err) {
        console.error('Error loading job details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [id, hasValidInitialJob, router]);

  // Track recently viewed + fetch company response time
  useEffect(() => {
    if (!job) return;
    addToRecentlyViewed({
      id: job.id,
      slug: job.slug,
      title: job.title,
      companyName: job.companyName,
      district: job.district,
      jobType: job.jobType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      logo: job.logo,
    });
    // Fetch company responseTime
    if (job.companyId) {
      getDoc(doc(db, 'companies', job.companyId)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.responseTime) setCompanyResponseTime(data.responseTime);
        }
      }).catch(() => {});
    }
  }, [job, addToRecentlyViewed]);

  // Fetch similar jobs
  useEffect(() => {
    if (!job) return;
    async function loadSimilarJobs() {
      try {
        const q = query(
          collection(db, 'jobs'),
          where('isActive', '==', true),
          where('status', '==', 'active'),
          where('district', '==', job!.district),
          fbLimit(5)
        );
        const snap = await getDocs(q);
        const targetId = job?.id || id;
        const targetSlug = job?.slug || id;
        const results = snap.docs
          .filter(d => d.id !== targetId && d.data().slug !== targetSlug)
          .slice(0, 4)
          .map(d => ({ id: d.id, slug: d.data().slug || '', ...d.data() }));
        setSimilarJobs(results);
      } catch { /* ignore */ }
    }
    loadSimilarJobs();
  }, [job, id]);

  // 2. Check if job is saved & if already applied & following
  useEffect(() => {
    if (!uid) return;
    const targetJobId = job?.id || id;
    if (!targetJobId || targetJobId === '_fallback' || targetJobId === 'demo') return;

    async function checkSavedAndApplied() {
      try {
        // Check saved
        const qSaved = query(collection(db, 'savedJobs'), where('userId', '==', uid), where('jobId', '==', targetJobId));
        const snapSaved = await getDocs(qSaved);
        setSaved(!snapSaved.empty);

        // Check applied
        const qApplied = query(collection(db, 'applications'), where('seekerId', '==', uid), where('jobId', '==', targetJobId));
        const snapApplied = await getDocs(qApplied);
        setHasApplied(!snapApplied.empty);
      } catch (err) {
        console.error(err);
      }
    }
    checkSavedAndApplied();
  }, [uid, id, job?.id]);

  // Check company follow status
  useEffect(() => {
    if (!uid || !job?.companyId) return;
    isFollowingCompany(uid, job.companyId).then(setFollowing).catch(() => {});
  }, [uid, job?.companyId]);

  const handleToggleFollow = async () => {
    if (!uid || !job?.companyId) {
      toast.warning('Please login to follow companies.');
      return;
    }
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowCompany(uid, job.companyId);
        setFollowing(false);
        toast.success('Unfollowed company');
      } else {
        await followCompany(uid, job.companyId);
        setFollowing(true);
        toast.success('Following! You\'ll get alerts for new jobs from this company.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = (method: 'whatsapp' | 'copy' | 'native') => {
    const canonicalUrl = typeof window !== 'undefined'
      ? (job?.slug ? `${window.location.origin}/jobs/${job.slug}` : window.location.href)
      : '';
    const text = `Check out this job: ${job?.title} at ${job?.companyName} - ${canonicalUrl}`;
    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (method === 'copy') {
      navigator.clipboard.writeText(canonicalUrl).then(() => {
        toast.success('Link copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy link');
      });
    } else if (method === 'native' && navigator.share) {
      navigator.share({ title: job?.title, text: text, url: canonicalUrl }).catch(() => {});
    }
    setShowShareMenu(false);
  };

  // Set default resume selection
  useEffect(() => {
    if (resumes.length > 0) {
      const def = resumes.find((r: any) => r.isDefault);
      setSelectedResumeId(def ? def.id : resumes[0].id);
    }
  }, [resumes]);

  const handleToggleSave = async () => {
    if (!uid || !job) {
      toast.warning('Please login to save this job.');
      return;
    }
    try {
      if (saved) {
        const q = query(collection(db, 'savedJobs'), where('userId', '==', uid), where('jobId', '==', job.id));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        setSaved(false);
      } else {
        await addDoc(collection(db, 'savedJobs'), {
          userId: uid,
          jobId: job.id,
          jobSlug: job.slug || '',
          jobTitle: job.title,
          companyName: job.companyName,
          description: job.description,
          district: job.location,
          jobType: job.jobType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          savedAt: serverTimestamp()
        });
        setSaved(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApply = async () => {
    if (!uid || !job) {
      toast.warning('Please login as a job seeker to apply.');
      router.push(`/login?redirect=/jobs/${job?.slug || id}`);
      return;
    }

    setApplying(true);
    try {
      const selectedResume = resumes.find((r: any) => r.id === selectedResumeId);

      const appId = await applyToJob({
        jobId: job.id,
        jobTitle: job.title,
        companyId: job.companyId,
        companyName: job.companyName,
        seekerId: uid,
        seekerName: seekerProfile?.name || user?.displayName || 'Job Seeker',
        seekerEmail: user?.email || '',
        seekerPhone: seekerProfile?.phone || '',
        resumeUrl: selectedResume?.url || '',
        resumeName: selectedResume?.name || 'Profile Apply',
        coverLetter: coverLetter.trim(),
      });

      setCreatedApplicationId(appId);
      setHasApplied(true);
      setShowApplyModal(false);
      setShowSuccessTicket(true);
      toast.success('Application submitted successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  // Calculate deadline urgency
  const getDeadlineInfo = () => {
    if (!job?.deadline || job.deadline === 'N/A') return { text: 'N/A', urgent: false, daysLeft: null };
    try {
      let deadlineDate: Date | null = null;
      if (typeof job.deadline === 'string' && job.deadline.includes('/')) {
        const parts = job.deadline.split('/');
        deadlineDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else {
        deadlineDate = new Date(job.deadline);
      }
      if (!deadlineDate || isNaN(deadlineDate.getTime())) return { text: job.deadline, urgent: false, daysLeft: null };
      const now = new Date();
      const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { text: 'Expired', urgent: true, daysLeft: 0 };
      if (diffDays === 0) return { text: 'Closes Today!', urgent: true, daysLeft: 0 };
      if (diffDays === 1) return { text: 'Closes Tomorrow!', urgent: true, daysLeft: 1 };
      if (diffDays <= 3) return { text: `Closes in ${diffDays} days!`, urgent: true, daysLeft: diffDays };
      if (diffDays <= 7) return { text: `${diffDays} days left`, urgent: false, daysLeft: diffDays };
      return { text: job.deadline, urgent: false, daysLeft: diffDays };
    } catch {
      return { text: job.deadline, urgent: false, daysLeft: null };
    }
  };
  const deadlineInfo = getDeadlineInfo();

  const isJobActuallyExpired = Boolean(
    initialJob?.isExpired ||
    deadlineInfo.text === 'Expired' ||
    (job && (job as any).status === 'expired') ||
    (job && (job as any).isActive === false)
  );

  const isPostingEmployer = Boolean(
    user &&
    isEmployerRole &&
    (
      (userCompanyId && (userCompanyId === job?.companyId || userCompanyId === initialJob?.companyId)) ||
      ((job as any)?.postedBy && (job as any)?.postedBy === uid)
    )
  );
  const isPrivileged = isAdmin || isPostingEmployer;

  if (loading || (isJobActuallyExpired && authLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] text-[#111827]">
        <Loader2 size={36} className="text-[#2563EB] animate-spin mb-4" />
        <p className="text-sm text-slate-500">Loading job details...</p>
      </div>
    );
  }

  // Not found or removed — clean public page with no admin/renewal exposure
  if (!job) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col font-outfit text-[#111827]">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center my-auto py-20">
          <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto text-blue-600">
              <Briefcase size={32} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Job Not Available</h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                This job posting is no longer available or may have been removed.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-sm w-full"
              >
                Browse All Active Jobs
              </Link>
            </div>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  // Expired jobs are hidden from public website.
  // ONLY Admin Portal / Admins and the posting Company (employer) can view this expired job.
  if (isJobActuallyExpired && !isPrivileged) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col font-outfit text-[#111827]">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center my-auto py-20">
          <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto text-blue-600">
              <Briefcase size={32} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Job Not Available</h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                This job posting is no longer active or is no longer accepting applications.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-sm w-full"
              >
                Browse All Active Jobs
              </Link>
            </div>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  const salaryStr = job.salaryMin && job.salaryMax
    ? `₹${job.salaryMin.toLocaleString('en-IN')} - ₹${job.salaryMax.toLocaleString('en-IN')}`
    : 'Salary Negotiable';

  const isQuickResponder = companyResponseTime && ['< 24 hours', 'Within 24 hours', 'Same day', '< 1 day'].some(t => companyResponseTime.toLowerCase().includes(t.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-outfit text-[#111827]">
      <Header />
      {/* JSON-LD is now injected server-side in page.tsx for Google visibility */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-28 md:pb-12">
        {/* Expired Job Banner for Admins */}
        {isJobActuallyExpired && isAdmin && (
          <div className="mt-4 mb-6 p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-700">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-extrabold uppercase tracking-wider mb-1">
                    Admin Preview · Expired Job
                  </div>
                  <h2 className="text-base font-bold text-gray-900">This Job Has Expired (Hidden from Public Website)</h2>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    This job is hidden from candidate search and public visitors. Only Admins and the posting company ({job.companyName}) can view it.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href="/admin/jobs"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Manage in Admin Portal
                </Link>
                {job.whatsapp && (
                  <a
                    href={`https://wa.me/${job.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${job.companyName}, your job listing "${job.title}" on THENIJOBS has expired. Would you like to renew it? Contact us to reactivate.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <MessageCircle size={14} /> WhatsApp Employer
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expired Job Banner for Posting Employer */}
        {isJobActuallyExpired && isPostingEmployer && (
          <div className="mt-4 mb-6 p-4 sm:p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider mb-1">
                    Your Job Posting · Expired
                  </div>
                  <h2 className="text-base font-bold text-gray-900">This Job Has Expired</h2>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    This job is no longer visible to candidates on the public website. To reactivate it and resume receiving applications, renew your subscription or contact the THENIJOBS Admin.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href="/employer/billing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Renew Plan
                </Link>
                <a
                  href={`https://wa.me/919360519460?text=${encodeURIComponent(`Hi THENIJOBS Admin, I want to renew my expired job posting "${job.title}" (${job.companyName}). Please help.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <MessageCircle size={14} /> Contact Admin via WhatsApp
                </a>
                <Link
                  href="/employer/jobs"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-semibold hover:border-gray-300 transition-all"
                >
                  My Jobs
                </Link>
              </div>
            </div>
          </div>
        )}
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-600 mt-4 mb-6" aria-label="Breadcrumbs">
          <Link href="/" className="hover:text-blue-700 font-medium transition-colors">Home</Link>
          <ChevronRight size={11} className="text-gray-400" />
          <Link href="/jobs" className="hover:text-blue-700 font-medium transition-colors">Jobs</Link>
          <ChevronRight size={11} className="text-gray-400" />
          <Link href={`/jobs-in-${(job.district || 'theni').toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-blue-700 font-semibold transition-colors">
            Jobs in {job.district || 'Theni'}
          </Link>
          <ChevronRight size={11} className="text-gray-400" />
          <span className="text-slate-900 font-bold truncate max-w-[200px]">{job.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header Card */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-gray-200 flex items-center justify-center text-3xl font-bold shrink-0 overflow-hidden">
                  {job.logo && !logoBroken ? (
                    <img
                      src={job.logo}
                      alt={job.companyName}
                      className="w-full h-full object-cover"
                      onError={() => setLogoBroken(true)}
                    />
                  ) : (
                    job.companyName ? job.companyName.substring(0, 2).toUpperCase() : '💼'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">{job.title}</h1>
                        {job.isUrgent && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                            <Zap size={9} className="fill-current" /> URGENT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Link
                          href={`/company/${job.companySlug || (job.companyName ? slugify(job.companyName) : '')}`}
                          className="text-violet-600 hover:text-violet-800 hover:underline flex items-center gap-1 transition-colors"
                        >
                          <Building2 size={14} /> {job.companyName}
                        </Link>
                        {job.isVerified && <BadgeCheck size={13} className="text-emerald-500 shrink-0" />}
                        {isQuickResponder && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ⚡ Quick Responder
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleToggleSave}
                        className={`p-2.5 rounded-xl border transition-all ${
                          saved ? 'bg-violet-500/20 border-violet-500/40 text-violet-400' : 'btn-outline-glass text-gray-400 hover:text-violet-400'
                        }`}
                      >
                        <BookmarkPlus size={16} className={saved ? 'fill-current' : ''} />
                      </button>
                      {/* Share dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowShareMenu(!showShareMenu)}
                          className="p-2.5 rounded-xl btn-outline-glass text-gray-400 hover:text-blue-600 transition-all"
                        >
                          <Share2 size={16} />
                        </button>
                        {showShareMenu && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                            <div className="absolute right-0 top-12 z-50 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1">
                              <button
                                onClick={() => handleShare('whatsapp')}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <MessageCircle size={15} className="text-green-600" /> Share via WhatsApp
                              </button>
                              <button
                                onClick={() => handleShare('copy')}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Copy size={15} className="text-blue-600" /> Copy Link
                              </button>
                              {typeof navigator !== 'undefined' && 'share' in navigator && (
                                <button
                                  onClick={() => handleShare('native')}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Share2 size={15} className="text-violet-600" /> More Options
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm text-gray-450">
                    <span className="flex items-center gap-1.5"><MapPin size={13} className="text-violet-400" />{job.location}, {job.state}</span>
                    <span className="flex items-center gap-1.5"><Banknote size={13} className="text-emerald-400" />{salaryStr} / Month</span>
                    <span className="flex items-center gap-1.5"><Briefcase size={13} className="text-cyan-400" />{job.jobType.replace('_', ' ').toUpperCase()}</span>
                    <span className="flex items-center gap-1.5"><Users size={13} />{job.openings} Opening{job.openings > 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1.5"><Clock size={13} />Posted {job.posted}</span>
                  </div>
                </div>
              </div>

              {/* Application CTA Row */}
              <div className="flex gap-3 mt-5 pt-5 border-t border-white/5">
                {isJobActuallyExpired ? (
                  <button disabled className="flex-1 py-3.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 font-semibold text-sm cursor-not-allowed">
                    Posting Expired (Applications Closed)
                  </button>
                ) : hasApplied ? (
                  <button disabled className="flex-1 py-3.5 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-400 font-semibold text-sm cursor-not-allowed">
                    Applied ✓
                  </button>
                ) : (
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="flex-1 btn-gradient py-3.5 rounded-xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2"
                  >
                    Apply Now
                  </button>
                )}
                {!isJobActuallyExpired && job.whatsapp && (
                  <a
                    href={`https://wa.me/${job.whatsapp}?text=Hi, I am interested in the ${job.title} position at ${job.companyName}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-5 py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                  >
                    <MessageCircle size={15} /> WhatsApp Apply
                  </a>
                )}
              </div>
            </div>

            {/* Quick specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Experience', value: job.experience, icon: '💼' },
                { label: 'Education', value: job.education, icon: '🎓' },
                { label: 'Openings', value: `${job.openings} post${job.openings > 1 ? 's' : ''}`, icon: '👥' },
                { label: 'Deadline', value: deadlineInfo.text, icon: '📅', urgent: deadlineInfo.urgent },
              ].map(({ label, value, icon, urgent }) => (
                <div key={label} className={`glass-card rounded-2xl p-4 text-center ${urgent ? 'border-2 border-red-200 bg-red-50/50' : ''}`}>
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                  <div className={`text-sm font-semibold truncate ${urgent ? 'text-red-600' : 'text-gray-900'}`}>
                    {urgent && <AlertTriangle size={12} className="inline mr-1" />}
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Job Description */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Job Description</h2>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Key Responsibilities</h2>
                <ul className="space-y-2.5">
                  {job.responsibilities.map((r: string) => (
                    <li key={r} className="flex items-start gap-3 text-sm text-gray-300">
                      <CheckCircle size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Requirements</h2>
                <ul className="space-y-2.5">
                  {job.requirements.map((r: string) => (
                    <li key={r} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="text-violet-400 mt-0.5 shrink-0">▸</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill: string) => (
                    <span key={skill} className="px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-300 text-sm border border-violet-500/20 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Benefits & Perks</h2>
                <div className="flex flex-wrap gap-2">
                  {job.benefits.map((b: string) => (
                    <span key={b} className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-300 text-sm border border-emerald-200 font-medium flex items-center gap-1.5">
                      ✓ {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5 sticky top-20">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-gray-900">{salaryStr}</div>
                <div className="text-xs text-gray-500">per month</div>
              </div>
              {isJobActuallyExpired ? (
                <button disabled className="w-full py-3.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 font-semibold text-sm cursor-not-allowed mb-3">
                  Posting Expired
                </button>
              ) : hasApplied ? (
                <button disabled className="w-full py-3.5 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-400 font-semibold text-sm cursor-not-allowed mb-3">
                  Applied ✓
                </button>
              ) : (
                <button onClick={() => setShowApplyModal(true)} className="w-full btn-gradient py-3.5 rounded-xl font-semibold text-sm relative z-10 mb-3">
                  Apply Now
                </button>
              )}
              {!isJobActuallyExpired && job.phone && (
                <a
                  href={`tel:${job.phone}`}
                  className="w-full btn-outline-glass py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 mb-2"
                >
                  📞 Call HR
                </a>
              )}
              <p className="text-center text-[10px] text-gray-655 mt-2">
                🔒 Your details are kept private and secure
              </p>
            </div>

            {/* Follow Company */}
            <div className="glass-card rounded-2xl p-5 border border-violet-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F5F3FF' }}>
                  <Heart size={18} className={following ? 'text-violet-600 fill-violet-600' : 'text-violet-400'} />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-gray-900">Follow {job.companyName}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Get notified when they post new jobs
                  </p>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <button
                      onClick={handleToggleFollow}
                      disabled={followLoading}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                        following
                          ? 'bg-violet-100 text-violet-700 border border-violet-200'
                          : 'bg-violet-600 text-white hover:bg-violet-700'
                      }`}
                    >
                      {followLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                      {following ? 'Following ✓' : 'Follow Company'}
                    </button>
                    <Link
                      href={`/company/${job.companySlug || (job.companyName ? slugify(job.companyName) : '')}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900 hover:underline"
                    >
                      View Profile <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-cyan-500/15">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <BellRing size={18} className="text-cyan-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900">Job Alerts</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {job.location} பகுதியில் இதுபோன்ற jobs வந்தவுடன் mobile alert பெறலாம்.
                  </p>
                  <Link
                    href="/seeker/job-alerts"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    Create Job Alert <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Jobs Section */}
        {similarJobs.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Similar Jobs in {job.district}</h2>
              <Link href={`/jobs?search=&district=${job.district}`} className="text-xs text-blue-600 font-semibold hover:text-blue-700">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {similarJobs.map((sj: any) => {
                const sjSalary = sj.salaryMin && sj.salaryMax
                  ? `₹${Number(sj.salaryMin).toLocaleString('en-IN')} - ₹${Number(sj.salaryMax).toLocaleString('en-IN')}/mo`
                  : 'Salary Negotiable';
                return (
                  <Link
                    key={sj.id}
                    href={`/jobs/${sj.slug || sj.id}`}
                    className="glass-card rounded-2xl p-4 hover:border-blue-200 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-blue-600 flex-shrink-0"
                        style={{ background: '#EFF6FF' }}>
                        {(sj.companyName || 'C')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700">{sj.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{sj.companyName}</p>
                        <p className="text-xs font-bold mt-1" style={{ color: '#10B981' }}>{sjSalary}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
                          <span className="flex items-center gap-0.5"><MapPin size={9} /> {sj.district}</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">
                            {(sj.jobType || 'full_time').replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <BottomNav />

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 shadow-2xl relative p-6 space-y-4 font-outfit">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Apply for {job.title}</h3>
                <p className="text-xs text-gray-500">{job.companyName} • {job.location}</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-700 block mb-1.5 font-bold">Application Resume / Profile</label>
                {resumes.length > 0 ? (
                  <select
                    value={selectedResumeId}
                    onChange={e => setSelectedResumeId(e.target.value)}
                    className="w-full px-3 py-2.5 text-base sm:text-sm bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="">Standard THENIJOBS Profile Resume</option>
                    {resumes.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.uploadDate || 'Uploaded'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2">
                    <CheckCircle size={16} className="text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-900 font-medium">Applying using your verified THENIJOBS Seeker Profile & Contact Info.</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-700 block mb-1.5 font-bold">Cover Letter / Note to Recruiter (Optional)</label>
                <textarea id="jobs-id-jobdetailpageclient-application-resume-profile-classname-w-f"
                  rows={4}
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Briefly state why you're a great fit for this position..."
                  className="w-full px-3 py-2.5 text-base sm:text-sm bg-white border border-gray-200 rounded-xl text-gray-900 resize-none focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {applying && <Loader2 size={13} className="animate-spin" />}
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pink Ticket Success Animation Modal */}
      {job && (
        <JobApplySuccessModal
          isOpen={showSuccessTicket}
          onClose={() => setShowSuccessTicket(false)}
          jobTitle={job.title}
          companyName={job.companyName}
          district={job.district || job.location}
          applicationId={createdApplicationId}
        />
      )}
    </main>
  );
}
