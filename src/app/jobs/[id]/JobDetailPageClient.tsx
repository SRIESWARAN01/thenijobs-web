'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  MapPin, Briefcase, Banknote, Clock, Users, BadgeCheck,
  BookmarkPlus, Share2, Zap, Building2, ChevronRight,
  CheckCircle, BellRing, MessageCircle, Loader2, FileText, CalendarCheck, UserRound,
  Phone, Mail
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { applyToJob, saveJob, unsaveJob } from '@/lib/firebase/firestoreService';
import { formatDate, formatJobType } from '@/lib/jobFormatters';
import { isPublicJobVisible } from '@/lib/jobPolicy';

interface JobRecord {
  id: string;
  title: string;
  companyName: string;
  companyId: string;
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
  verificationLevel?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  experience?: string;
  education?: string;
  deadline?: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  skills?: string[];
  benefits?: string[];
  isWalkIn?: boolean;
  walkIn?: {
    date?: string;
    time?: string;
    venue?: string;
    contactPerson?: string;
    contactMobile?: string;
  };
}

function normaliseWhatsappNumber(value?: string) {
  const digits = value?.replace(/\D/g, '') || '';
  if (!digits) return undefined;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.length >= 11) return digits;
  return undefined;
}

export default function JobDetailPageClient({ id, hideNav = false }: { id: string; hideNav?: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid;

  const [job, setJob] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

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

  // Fetch seekerProfile to check their resumes
  const { data: seekerProfile } = useDocument<any>('seekerProfiles', uid);

  // 1. Fetch job details from Firestore
  useEffect(() => {
    if (!id) return;
    async function loadJob() {
      try {
        setLoading(true);
        const docSnap = await getDoc(doc(db, 'jobs', id));
        if (docSnap.exists()) {
          const d = docSnap.data();
          if (!isPublicJobVisible(d)) {
            setJob(null);
            return;
          }
          setJob({
            id: docSnap.id,
            title: d.title || '',
            companyName: d.companyName || 'Verified Employer',
            companyId: d.companyId || '',
            location: d.location || d.district || 'Theni',
            district: d.district || 'Theni',
            state: d.state || 'Tamil Nadu',
            salaryMin: d.salaryMin || 0,
            salaryMax: d.salaryMax || 0,
            jobType: d.jobType || 'full_time',
            posted: formatDate(d.createdAt),
            openings: d.openings ? Number(d.openings) : 1,
            logo: d.logo || '',
            isUrgent: d.isUrgent || false,
            isVerified: d.isVerified || d.companyVerificationStatus === 'verified' || d.companyVerified || false,
            verificationLevel: d.verificationLevel || d.companyVerificationLevel || (d.isVerified || d.companyVerificationStatus === 'verified' || d.companyVerified ? 'standard' : 'free'),
            whatsapp: normaliseWhatsappNumber(d.whatsapp || d.phone),
            phone: d.phone || '',
            email: d.email || d.contactEmail || d.hrEmail || '',
            experience: d.experience || 'Not specified',
            education: d.education || 'Not specified',
            deadline: formatDate(d.expiresAt || d.deadline, 'N/A'),
            description: d.description || '',
            responsibilities: d.responsibilities || [],
            requirements: d.requirements || [],
            skills: d.skills || [],
            benefits: d.benefits || [],
            isWalkIn: d.isWalkIn || !!d.walkInDate || !!d.walkIn?.date,
            walkIn: {
              date: d.walkIn?.date || d.walkInDate || '',
              time: d.walkIn?.time || d.walkInTime || '',
              venue: d.walkIn?.venue || d.walkInVenue || '',
              contactPerson: d.walkIn?.contactPerson || d.walkInContactPerson || '',
              contactMobile: d.walkIn?.contactMobile || d.walkInContactMobile || '',
            },
          });
        }
      } catch (err) {
        console.error('Error loading job details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [id]);

  // 2. Check if job is saved & if already applied
  useEffect(() => {
    if (!uid || !id) return;
    async function checkSavedAndApplied() {
      try {
        // Check saved
        const qSaved = query(collection(db, 'savedJobs'), where('userId', '==', uid), where('jobId', '==', id));
        const snapSaved = await getDocs(qSaved);
        setSaved(!snapSaved.empty);

        // Check applied
        const qApplied = query(collection(db, 'jobApplications'), where('applicantId', '==', uid), where('jobId', '==', id));
        const snapApplied = await getDocs(qApplied);
        setHasApplied(!snapApplied.empty);
      } catch (err) {
        console.error(err);
      }
    }
    checkSavedAndApplied();
  }, [uid, id]);



  const handleToggleSave = async () => {
    if (!uid || !job) {
      alert('Please login to save this job.');
      return;
    }
    try {
      if (saved) {
        await unsaveJob(uid, job.id);
        setSaved(false);
      } else {
        await saveJob(uid, job.id, {
          jobTitle: job.title,
          companyName: job.companyName,
          description: job.description,
          district: job.location,
          jobType: job.jobType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
        });
        setSaved(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getProfileCompletionScore = (profile: any) => {
    if (!profile) return 0;
    let score = 0;
    if (profile.photoUrl || profile.profilePhotoUrl) score += 10;
    if (profile.phone && profile.email) score += 10;
    if (Array.isArray(profile.education) && profile.education.length > 0) score += 10;
    if (Array.isArray(profile.experience) && profile.experience.length > 0) score += 10;
    if (Array.isArray(profile.skills) && profile.skills.length >= 3) score += 10;
    if (Array.isArray(profile.languages) && profile.languages.length > 0) score += 10;
    if (Array.isArray(profile.certifications) && profile.certifications.length > 0) score += 10;
    const portfolio = profile.portfolio || profile.portfolioLinks || [];
    if (Array.isArray(portfolio) && portfolio.length > 0) score += 10;
    if (profile.aboutMe || profile.summary) score += 10;
    if (Array.isArray(profile.achievements) && profile.achievements.length > 0) score += 10;
    return score;
  };

  const handleApplyClick = () => {
    if (!uid) {
      alert('Please login or register to apply.');
      router.push(`/login?redirect=/jobs/${encodeURIComponent(id)}`);
      return;
    }

    const profileName = seekerProfile?.name || user?.displayName;
    const profilePhone = seekerProfile?.phone;

    if (profileName && profilePhone) {
      handleApplyDirect();
    } else {
      alert('Complete Your Profile First (Name and Phone Number are required).');
      router.push('/seeker/profile');
    }
  };

  const handleApplyDirect = async () => {
    if (!uid || !job) {
      alert('Please login as a seeker to apply.');
      router.push('/login');
      return;
    }

    setApplying(true);
    try {
      const portfolioLinks = seekerProfile?.portfolio || seekerProfile?.portfolioLinks || [];
      const score = getProfileCompletionScore(seekerProfile);

      const batch = writeBatch(db);
      const appRef = doc(db, 'jobApplications', `${uid}_${job.id}`);
      batch.set(appRef, {
        jobId: job.id,
        employerId: job.companyId,
        applicantId: uid,
        appliedDate: serverTimestamp(),
        status: job.isWalkIn ? 'pending_review' : 'applied',
        jobTitle: job.title,
        companyName: job.companyName,
        district: job.location,
        coverLetter: '',
        resumeName: seekerProfile?.resumeName || '',
        resumeUrl: seekerProfile?.resumeUrl || '',
        profileCompletion: score,
        isVerified: seekerProfile?.isVerified || false,
        applicationType: job.isWalkIn ? 'walk_in' : 'job',
        applicantData: {
          name: seekerProfile?.name || user?.displayName || 'Job Seeker',
          phone: seekerProfile?.phone || '',
          email: seekerProfile?.email || user?.email || '',
          dob: seekerProfile?.dob || '',
          gender: seekerProfile?.gender || 'Male',
          photoUrl: seekerProfile?.photoUrl || seekerProfile?.profilePhotoUrl || '',
          address: seekerProfile?.address || '',
          district: seekerProfile?.district || '',
          currentRole: seekerProfile?.currentRole || '',
          aboutMe: seekerProfile?.aboutMe || seekerProfile?.summary || ''
        },
        qualificationData: Array.isArray(seekerProfile?.education) ? seekerProfile.education : [],
        skills: Array.isArray(seekerProfile?.skills) ? seekerProfile.skills : [],
        experience: Array.isArray(seekerProfile?.experience) ? seekerProfile.experience : [],
        portfolioData: {
          portfolio: Array.isArray(portfolioLinks) ? portfolioLinks : [],
          resumeUrl: seekerProfile?.resumeUrl || '',
          resumeName: seekerProfile?.resumeName || '',
          linkedin: seekerProfile?.linkedin || '',
          website: seekerProfile?.website || ''
        }
      });

      const jobRef = doc(db, 'jobs', job.id);
      batch.update(jobRef, {
        applicationsCount: increment(1),
        applicationCount: increment(1),
        updatedAt: serverTimestamp()
      });

      await batch.commit();

      setHasApplied(true);
      alert(job.isWalkIn ? 'Walk-in application submitted successfully!' : 'Application submitted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  const handleShare = async () => {
    if (!job || typeof window === 'undefined') return;

    const shareUrl = window.location.href;
    const shareData = {
      title: `${job.title} at ${job.companyName}`,
      text: `Apply for ${job.title} at ${job.companyName} on THENIJOBS.`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a1a] text-white">
        <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a1a] text-white p-6 text-center">
        <h2 className="text-lg font-bold">Job Not Found</h2>
        <p className="text-gray-400 text-sm mt-1">This job posting may have expired or been deleted.</p>
        <Link href="/jobs" className="mt-4 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-gray-300">
          Back to Jobs List
        </Link>
      </div>
    );
  }

  const salaryStr = job.salaryMin && job.salaryMax
    ? `₹${job.salaryMin.toLocaleString('en-IN')} - ₹${job.salaryMax.toLocaleString('en-IN')}`
    : 'Salary Negotiable';
  const jobTypeLabel = formatJobType(job.jobType).toUpperCase();
  const whatsappNumber = job.whatsapp || normaliseWhatsappNumber(job.phone || job.walkIn?.contactMobile);

  return (
    <main className="min-h-screen bg-[#0a0a1a] font-outfit text-white">
      {!hideNav && <Header />}
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 ${hideNav ? 'pt-6' : 'pt-20'} pb-28 md:pb-12`}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mt-4 mb-6">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={11} />
          <Link href="/jobs" className="hover:text-white transition-colors">Jobs</Link>
          <ChevronRight size={11} />
          <span className="text-white truncate max-w-[200px]">{job.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header Card */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-bold shrink-0">
                  {job.logo || (job.companyName ? job.companyName.substring(0, 2).toUpperCase() : '💼')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h1 className="text-xl font-bold text-white leading-tight">{job.title}</h1>
                        {job.isUrgent && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                            <Zap size={9} className="fill-current" /> URGENT
                          </span>
                        )}
                        {job.isWalkIn && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                            <CalendarCheck size={9} /> WALK-IN
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors font-medium text-sm">
                        <Building2 size={14} /> {job.companyName}
                        {renderVerificationBadge(job.verificationLevel, job.isVerified)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleToggleSave}
                        aria-label={saved ? 'Remove saved job' : 'Save job'}
                        className={`p-2.5 rounded-xl border transition-all ${
                          saved ? 'bg-violet-500/20 border-violet-500/40 text-violet-400' : 'btn-outline-glass text-gray-400 hover:text-violet-400'
                        }`}
                      >
                        <BookmarkPlus size={16} className={saved ? 'fill-current' : ''} />
                      </button>
                      <button
                        onClick={handleShare}
                        aria-label="Share job"
                        className="p-2.5 rounded-xl btn-outline-glass text-gray-400 hover:text-white transition-all"
                      >
                        {shareCopied ? <CheckCircle size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5"><MapPin size={13} className="text-violet-400" />{job.location}, {job.state}</span>
                    <span className="flex items-center gap-1.5"><Banknote size={13} className="text-emerald-400" />{salaryStr} / Month</span>
                    <span className="flex items-center gap-1.5"><Briefcase size={13} className="text-cyan-400" />{jobTypeLabel}</span>
                    <span className="flex items-center gap-1.5"><Users size={13} />{job.openings} Opening{job.openings > 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1.5"><Clock size={13} />Posted {job.posted}</span>
                  </div>
                </div>
              </div>

              {/* Application CTA Row */}
              <div className="space-y-4 mt-5 pt-5 border-t border-white/5">
                <div className="flex gap-3">
                  {hasApplied ? (
                    <button disabled className="flex-1 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm cursor-not-allowed">
                      Applied ✓
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyClick}
                      disabled={applying}
                      className="flex-1 btn-gradient py-3.5 rounded-xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2"
                    >
                      {applying && <Loader2 size={14} className="animate-spin" />}
                      {applying ? 'Applying...' : job.isWalkIn ? 'Submit Walk-In Application' : 'Apply Now'}
                    </button>
                  )}
                </div>

                {/* Direct HR Call, WhatsApp & Email actions */}
                {hasApplied ? (
                  (job.phone || whatsappNumber || job.email || job.walkIn?.contactMobile) && (
                    <div className="grid grid-cols-3 gap-3">
                      {(job.phone || job.walkIn?.contactMobile) && (
                        <a
                          href={`tel:${job.phone || job.walkIn?.contactMobile}`}
                          className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15 transition-all"
                          title="Call HR Mobile"
                        >
                          <Phone size={16} />
                          <span className="text-[10px] font-bold tracking-wide uppercase">Call HR</span>
                        </a>
                      )}
                      {whatsappNumber && (
                        <a
                          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I am interested in the "${job.title}" position posted on THENIJOBS.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/15 transition-all"
                          title="WhatsApp HR Chat"
                        >
                          <MessageCircle size={16} />
                          <span className="text-[10px] font-bold tracking-wide uppercase">WhatsApp</span>
                        </a>
                      )}
                      {job.email && (
                        <a
                          href={`mailto:${job.email}?subject=${encodeURIComponent(`Job Application: ${job.title}`)}&body=${encodeURIComponent(`Hi HR Team,\n\nI am interested in applying for the "${job.title}" position at ${job.companyName} listed on THENIJOBS.\n\nPlease find my application details on the platform.`)}`}
                          className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/15 transition-all"
                          title="Email HR Address"
                        >
                          <Mail size={16} />
                          <span className="text-[10px] font-bold tracking-wide uppercase">Email HR</span>
                        </a>
                      )}
                    </div>
                  )
                ) : (
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center space-y-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 mx-auto">
                      <Users size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-white">Contact Info Protected 🔒</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed max-w-md mx-auto">
                      Employer Contact Information (HR Phone, WhatsApp, and Email) is hidden. 
                      Successfully apply to this job to unlock direct contact buttons.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Experience', value: job.experience, icon: '💼' },
                { label: 'Education', value: job.education, icon: '🎓' },
                { label: 'Openings', value: `${job.openings} post${job.openings > 1 ? 's' : ''}`, icon: '👥' },
                { label: 'Deadline', value: job.deadline, icon: '📅' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="glass-card rounded-2xl p-4 text-center">
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                  <div className="text-sm font-semibold text-white truncate">{value}</div>
                </div>
              ))}
            </div>

            {job.isWalkIn && (
              <div className="glass-card rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                  <CalendarCheck size={16} className="text-emerald-400" />
                  Walk-In Interview
                </h2>
                <div className="grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/[0.03] p-3">
                    <p className="text-xs font-semibold text-gray-500">Date & Time</p>
                    <p className="mt-1 font-medium text-white">{job.walkIn?.date || 'To be confirmed'} at {job.walkIn?.time || 'To be confirmed'}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-3">
                    <p className="text-xs font-semibold text-gray-500">Contact Person</p>
                    <p className="mt-1 font-medium text-white">{job.walkIn?.contactPerson || 'HR Team'}</p>
                    {job.walkIn?.contactMobile && <p className="text-xs text-gray-400">Mobile: {hasApplied ? job.walkIn.contactMobile : 'Protected (Apply to Unlock)'}</p>}
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-3 sm:col-span-2">
                    <p className="text-xs font-semibold text-gray-500">Venue</p>
                    <p className="mt-1 font-medium text-white">{job.walkIn?.venue || job.location}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Job Description */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-3">Job Description</h2>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-4">Key Responsibilities</h2>
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
                <h2 className="text-base font-semibold text-white mb-4">Requirements</h2>
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
                <h2 className="text-base font-semibold text-white mb-4">Required Skills</h2>
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
                <h2 className="text-base font-semibold text-white mb-4">Benefits & Perks</h2>
                <div className="flex flex-wrap gap-2">
                  {job.benefits.map((b: string) => (
                    <span key={b} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 text-sm border border-emerald-500/20 font-medium flex items-center gap-1.5">
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
                <div className="text-2xl font-bold text-white">{salaryStr}</div>
                <div className="text-xs text-gray-500">per month</div>
              </div>
              {hasApplied ? (
                <button disabled className="w-full py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm cursor-not-allowed mb-3">
                  Applied ✓
                </button>
              ) : (
                <button onClick={handleApplyClick} disabled={applying} className="w-full btn-gradient py-3.5 rounded-xl font-semibold text-sm relative z-10 mb-3 flex items-center justify-center gap-2">
                  {applying && <Loader2 size={14} className="animate-spin" />}
                  {applying ? 'Applying...' : job.isWalkIn ? 'Submit Walk-In Application' : 'Apply Now'}
                </button>
              )}
              {hasApplied && job.phone && (
                <a
                  href={`tel:${job.phone}`}
                  className="w-full btn-outline-glass py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 mb-2"
                >
                  📞 Call HR
                </a>
              )}
              <p className="text-center text-[10px] text-gray-500 mt-2">
                🔒 Your details are kept private and secure
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-cyan-500/15">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <BellRing size={18} className="text-cyan-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white">Job Alerts</h3>
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
      </div>
      {!hideNav && <BottomNav />}
    </main>
  );
}
