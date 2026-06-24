'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  MapPin, Briefcase, Banknote, Clock, Users, BadgeCheck,
  BookmarkPlus, Share2, Zap, Building2, ChevronRight,
  CheckCircle, BellRing, MessageCircle, Loader2, FileText, CalendarCheck, UserRound
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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

export default function JobDetailPageClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid;

  const [job, setJob] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  // Fetch seekerProfile to check their resumes
  const { data: seekerProfile } = useDocument<any>('seekerProfiles', uid);
  const resumes = useMemo(() => {
    const uploaded = Array.isArray(seekerProfile?.resumes) ? seekerProfile.resumes : [];
    if (uploaded.length > 0) return uploaded;
    if (seekerProfile?.resumeUrl) {
      return [{
        id: 'profile-resume',
        name: seekerProfile.resumeName || 'Profile Resume',
        url: seekerProfile.resumeUrl,
        isDefault: true,
        uploadDate: 'Profile',
      }];
    }
    return [];
  }, [seekerProfile]);

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
            whatsapp: normaliseWhatsappNumber(d.whatsapp || d.phone),
            phone: d.phone || '',
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
        const qApplied = query(collection(db, 'applications'), where('seekerId', '==', uid), where('jobId', '==', id));
        const snapApplied = await getDocs(qApplied);
        setHasApplied(!snapApplied.empty);
      } catch (err) {
        console.error(err);
      }
    }
    checkSavedAndApplied();
  }, [uid, id]);

  // Set default resume selection
  useEffect(() => {
    if (resumes.length > 0) {
      const def = resumes.find((r: any) => r.isDefault);
      setSelectedResumeId(def ? def.id : resumes[0].id);
    }
  }, [resumes]);

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

  const openApplyModal = () => {
    if (!uid) {
      alert('Please login or register to apply.');
      router.push(`/login?redirect=/jobs/detail?id=${encodeURIComponent(id)}`);
      return;
    }
    setShowApplyModal(true);
  };

  const handleApply = async () => {
    if (!uid || !job) {
      alert('Please login as a seeker to apply.');
      router.push('/login');
      return;
    }

    setApplying(true);
    try {
      const selectedResume = resumes.find((r: any) => r.id === selectedResumeId);
      const portfolioLinks = seekerProfile?.portfolio || seekerProfile?.portfolioLinks || [];

      await applyToJob({
        jobId: job.id,
        jobTitle: job.title,
        companyId: job.companyId,
        companyName: job.companyName,
        seekerId: uid,
        seekerName: seekerProfile?.name || user?.displayName || 'Job Seeker',
        seekerEmail: seekerProfile?.email || user?.email || '',
        seekerPhone: seekerProfile?.phone || '',
        currentRole: seekerProfile?.currentRole || '',
        district: seekerProfile?.district || '',
        location: seekerProfile?.district || '',
        photoUrl: seekerProfile?.photoUrl || seekerProfile?.profilePhotoUrl || user?.photoURL || '',
        skills: Array.isArray(seekerProfile?.skills) ? seekerProfile.skills : [],
        experience: Array.isArray(seekerProfile?.experience) ? seekerProfile.experience : [],
        education: Array.isArray(seekerProfile?.education) ? seekerProfile.education : [],
        portfolio: Array.isArray(portfolioLinks) ? portfolioLinks : [],
        profileStrength: Number(seekerProfile?.profileStrength || 0),
        resumeUrl: selectedResume?.url || '',
        resumeName: selectedResume?.name || 'Profile Apply',
        coverLetter: coverLetter.trim(),
        applicationType: job.isWalkIn ? 'walk_in' : 'job',
        walkIn: job.isWalkIn ? job.walkIn : undefined,
      });

      setHasApplied(true);
      setShowApplyModal(false);
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

  return (
    <main className="min-h-screen bg-[#0a0a1a] font-outfit text-white">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-28 md:pb-12">
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
                        {job.isVerified && <BadgeCheck size={13} className="text-emerald-400" />}
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
              <div className="flex gap-3 mt-5 pt-5 border-t border-white/5">
                {hasApplied ? (
                  <button disabled className="flex-1 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm cursor-not-allowed">
                    Applied ✓
                  </button>
                ) : (
                  <button
                    onClick={openApplyModal}
                    className="flex-1 btn-gradient py-3.5 rounded-xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2"
                  >
                    {job.isWalkIn ? 'Submit Walk-In Application' : 'Apply Now'}
                  </button>
                )}
                {job.whatsapp && (
                  <a
                    href={`https://wa.me/${job.whatsapp}?text=${encodeURIComponent(`Hi, I am interested in the ${job.title} position at ${job.companyName}`)}`}
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
                    {job.walkIn?.contactMobile && <p className="text-xs text-gray-400">{job.walkIn.contactMobile}</p>}
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
                <button onClick={openApplyModal} className="w-full btn-gradient py-3.5 rounded-xl font-semibold text-sm relative z-10 mb-3">
                  {job.isWalkIn ? 'Submit Walk-In Application' : 'Apply Now'}
                </button>
              )}
              {job.phone && (
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
      <BottomNav />

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl w-full max-w-lg overflow-hidden border border-emerald-500/20 shadow-2xl relative p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Apply for {job.title}</h3>
            
            {resumes.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/10 rounded-xl space-y-3 p-4">
                <FileText className="mx-auto text-gray-500" size={30} />
                <p className="text-xs text-gray-400">You need to upload or build a resume in your Seeker Portal first before applying.</p>
                <Link
                  href="/seeker/resume"
                  className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold text-white"
                >
                  Manage Resumes
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <UserRound size={13} />
                    Auto-filled candidate details
                  </p>
                  <div className="grid gap-1.5 text-xs text-gray-400 sm:grid-cols-2">
                    <span>Name: {seekerProfile?.name || user?.displayName || 'Job Seeker'}</span>
                    <span>Mobile: {seekerProfile?.phone || 'Not added'}</span>
                    <span className="sm:col-span-2">Email: {seekerProfile?.email || user?.email || 'Not added'}</span>
                    {job.isWalkIn && (
                      <span className="sm:col-span-2 text-emerald-300">Walk-in status starts as Pending Review.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Select Resume</label>
                  <select
                    value={selectedResumeId}
                    onChange={e => setSelectedResumeId(e.target.value)}
                    className="search-input w-full px-3 py-2.5 text-sm bg-[#0a0a1a]"
                  >
                    {resumes.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.uploadDate})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 font-medium">Cover Letter / Message to Recruiter</label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                    placeholder="Briefly state why you're a good fit for this role..."
                    className="search-input w-full px-3 py-2.5 text-sm bg-[#0a0a1a] resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold hover:bg-white/[0.08]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-xs hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {applying && <Loader2 size={12} className="animate-spin" />}
                    {job.isWalkIn ? 'Submit Walk-In' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
