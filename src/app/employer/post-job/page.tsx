'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase, Banknote, FileText, Users, Clock,
  ArrowLeft, ArrowRight, Check, Loader2, Plus, X, Zap, ShieldAlert, Eye,
  Sparkles, CheckCircle2
} from 'lucide-react';
import JobPreviewModal from '@/components/employer/JobPreviewModal';
import JobPostSuccessModal from '@/components/employer/JobPostSuccessModal';
import { TN_DISTRICTS } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { createDocument, logActivity } from '@/lib/firebase/firestoreService';
import { notifyAllAdmins } from '@/lib/firebase/adminNotify';
import { where, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';
import { canPostNewJob, getPlan } from '@/lib/plans';
import { Switch } from '@/components/dashboard';

const STEPS = [
  { id: 1, label: 'Job Details' },
  { id: 2, label: 'Requirements' },
  { id: 3, label: 'Salary & Benefits' },
  { id: 4, label: 'Preview & Post' },
];

const JOB_TYPES = [
  { id: 'full_time', label: 'Full Time' },
  { id: 'part_time', label: 'Part Time' },
  { id: 'internship', label: 'Internship' },
  { id: 'remote', label: 'Remote' },
  { id: 'work_from_home', label: 'Work From Home' },
  { id: 'fresher', label: 'Fresher' },
  { id: 'contract', label: 'Contract' },
];

const EXPERIENCE_LEVELS = ['Fresher (0 yrs)', '0–1 years', '1–2 years', '2–5 years', '5–10 years', '10+ years'];
const EDUCATION_LEVELS = ['8th Pass', '10th Pass', '12th Pass', 'Diploma', 'Any Degree', 'B.E / B.Tech', 'MBA', 'Post Graduate'];
const OPENINGS_OPTIONS = ['1', '2', '3', '4', '5', '10', '15', '20', '20+'];
const BENEFITS_OPTIONS = ['PF', 'ESI', 'Health Insurance', 'Food Allowance', 'Travel Allowance', 'Bonus', 'Accommodation', 'Paid Leave'];

const inputCls = "w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all font-medium";
const labelCls = "text-xs font-bold text-gray-700 block mb-1.5";

function getJobOrdinalName(num: number): string {
  if (num === 1) return 'Primary Job';
  if (num === 2) return 'Second Job';
  if (num === 3) return 'Third Job';
  if (num === 4) return 'Fourth Job';
  if (num === 5) return 'Fifth Job';
  if (num === 6) return 'Sixth Job';
  if (num === 7) return 'Seventh Job';
  if (num === 8) return 'Eighth Job';
  if (num === 9) return 'Ninth Job';
  if (num === 10) return 'Tenth Job';
  return `${num}th Job`;
}

export default function PostJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies?.[0];
  const companyId = company?.id;

  const { data: existingJobs, refresh: refreshJobs } = useCollection<any>('jobs', [
    where('companyId', '==', companyId || ''),
    where('isActive', '==', true)
  ], { skip: !companyId });

  const activeJobsCount = existingJobs?.length || 0;
  const planSlug = company?.subscriptionPlan || 'free';
  const planInfo = getPlan(planSlug);
  const planCheck = canPostNewJob(planSlug, activeJobsCount);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successJobData, setSuccessJobData] = useState<{
    id?: string;
    title: string;
    companyName: string;
    district: string;
    location?: string;
    jobType: string;
    salary?: string;
    openings?: number | string;
    ordinal: string;
    number: number;
  } | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', jobType: 'full_time', location: '', district: 'Theni',
    openings: '1', experience: '', education: '',
    salaryMin: '', salaryMax: '', salaryType: 'monthly',
    isNegotiable: false, deadline: '',
    isPremium: false, isUrgent: false, isFeatured: false,
    isWalkIn: false, walkInDate: '', walkInTime: '10:00 AM', walkInVenue: '', walkInContactPhone: ''
  });

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(s => [...s, newSkill.trim()]);
      setNewSkill('');
    }
  };
  
  const toggleBenefit = (b: string) => setBenefits(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]);

  const resetForm = () => {
    setForm({
      title: '', description: '', jobType: 'full_time', location: '', district: 'Theni',
      openings: '1', experience: '', education: '',
      salaryMin: '', salaryMax: '', salaryType: 'monthly',
      isNegotiable: false, deadline: '',
      isPremium: false, isUrgent: false, isFeatured: false,
      isWalkIn: false, walkInDate: '', walkInTime: '10:00 AM', walkInVenue: '', walkInContactPhone: ''
    });
    setSkills([]);
    setBenefits([]);
    setStep(1);
    setIsSuccessModalOpen(false);
  };

  const handlePost = async () => {
    if (!companyId) {
      toast.warning('You must have a registered company profile to post a job.');
      return;
    }

    if (!form.title.trim()) {
      toast.warning('Please enter a Job Title.');
      setStep(1);
      return;
    }

    setLoading(true);

    try {
      const minSal = form.salaryMin ? parseInt(form.salaryMin) : null;
      const maxSal = form.salaryMax ? parseInt(form.salaryMax) : null;

      let salaryDisplay = 'Not Disclosed';
      if (minSal && maxSal) {
        salaryDisplay = `₹${minSal.toLocaleString('en-IN')} - ₹${maxSal.toLocaleString('en-IN')} / ${form.salaryType}`;
      } else if (minSal) {
        salaryDisplay = `From ₹${minSal.toLocaleString('en-IN')} / ${form.salaryType}`;
      } else if (maxSal) {
        salaryDisplay = `Up to ₹${maxSal.toLocaleString('en-IN')} / ${form.salaryType}`;
      }

      const nextJobNum = activeJobsCount + 1;
      const ordinalName = getJobOrdinalName(nextJobNum);

      const jobPayload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        jobType: form.jobType,
        location: form.location.trim() || form.district || 'Theni',
        district: form.district || 'Theni',
        openings: parseInt(form.openings) || 1,
        experience: form.experience || 'Fresher',
        education: form.education || 'Any Degree',
        skills,
        salaryMin: minSal,
        salaryMax: maxSal,
        salary: salaryDisplay,
        salaryType: form.salaryType,
        isNegotiable: form.isNegotiable,
        benefits,
        isPremium: form.isPremium,
        isUrgent: form.isUrgent,
        isFeatured: form.isFeatured,
        isWalkIn: form.isWalkIn,
        walkInDate: form.walkInDate,
        walkInTime: form.walkInTime,
        walkInVenue: form.walkInVenue || form.location || 'Company Office',
        walkInContactPhone: form.walkInContactPhone || company.phone || '',
        companyId,
        companyName: company.name || 'Company',
        companyLogoUrl: company.logoUrl || '',
        companyDistrict: company.district || form.district || 'Theni',
        postedBy: user?.uid,
        status: 'pending',
        approvalStatus: 'pending',
        isActive: false,
        viewCount: 0,
        applicationsCount: 0,
        jobOrdinal: ordinalName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const jobId = await createDocument('jobs', jobPayload);

      await logActivity({
        userId: user?.uid || '',
        userName: user?.displayName || user?.email || 'Employer',
        action: 'Posted a job listing',
        target: form.title,
        targetId: jobId
      });

      await notifyAllAdmins(
        'New Job Pending Approval 💼',
        `"${form.title}" posted by ${company.name} is awaiting review.`,
        '/admin/jobs',
      );

      // Save for celebratory modal
      setSuccessJobData({
        id: jobId,
        title: form.title,
        companyName: company.name,
        district: form.district,
        location: form.location,
        jobType: form.jobType,
        salary: salaryDisplay,
        openings: form.openings,
        ordinal: ordinalName,
        number: nextJobNum,
      });

      setIsSuccessModalOpen(true);
      toast.success(`🎉 ${ordinalName} Created Successfully!`, 'Pending admin review before going live.');
      refreshJobs?.();
    } catch (err: any) {
      console.error('Failed to post job:', err);
      toast.error('Failed to post job listing', err.message || 'Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (companyLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 font-outfit">
      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-500 font-semibold">Loading employer details...</p>
    </div>
  );

  const isCompanyVerified = company?.verificationStatus === 'verified' || company?.isVerified === true;

  if (!isCompanyVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 py-20 text-center px-4 font-outfit">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200 shadow-xs">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Company Verification Pending
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 max-w-md mb-6 leading-relaxed">
          Only <strong>Admin-Verified Companies</strong> can post active job openings on THENIJOBS. Our verification team is reviewing your profile.
        </p>
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600 max-w-sm mb-6 font-medium">
          Status: <span className="font-extrabold text-amber-600 uppercase">{company?.verificationStatus || 'Pending Verification'}</span>
        </div>
        <Link href="/employer/company-profile" className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
          View Company Verification Details
        </Link>
      </div>
    );
  }

  const isStep1Valid = form.title && form.description && form.district && form.openings;

  return (
    <div className="mx-auto max-w-3xl pb-20 text-slate-900">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-2 bg-blue-50 text-blue-700 border border-blue-200">
          <Briefcase size={13} /> {getJobOrdinalName(activeJobsCount + 1)} · Job Posting Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Create New Job Opening
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Hire talent in Theni District with direct applicant tracking &amp; WhatsApp inquiries</p>
      </div>

      {/* Plan Active Job Limit Banner */}
      {!planCheck.allowed ? (
        <div className="mb-6 p-5 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">Job Posting Limit Reached ({activeJobsCount}/{planCheck.limit} Jobs)</h3>
            <p className="text-xs text-amber-700 mt-1">
              Your current <strong>{planInfo.name} Plan</strong> tier allows up to <strong>{planCheck.limit} active job postings</strong>. Upgrade your subscription to post more!
            </p>
          </div>
          <Link
            href="/employer/subscription"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-sm"
          >
            Upgrade Plan to Unlock More Postings <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="mb-6 px-4 py-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-xs text-blue-900 shadow-xs">
          <span>Active Jobs on {planInfo.name} Plan: <strong>{activeJobsCount} / {planCheck.limit === 999 ? 'Unlimited' : planCheck.limit}</strong></span>
          <Link href="/employer/subscription" className="font-bold text-blue-600 hover:underline">
            Upgrade Plan →
          </Link>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 gap-2 shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
              step > s.id ? 'bg-emerald-500 text-white shadow-xs' :
              step === s.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-slate-500'
            }`}>
              {step > s.id ? <Check size={12} /> : s.id}
            </div>
            <span className={`text-xs font-bold transition-colors whitespace-nowrap ${
              step === s.id ? 'text-blue-600' : step > s.id ? 'text-emerald-700' : 'text-slate-500'
            }`}>{s.label}</span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full ml-1 transition-all ${step > s.id ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-8 shadow-sm">
        {/* STEP 1 — Job Details */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <Briefcase size={14} />
              </div>
              1. Job Role &amp; Basic Details
            </h2>

            <div>
              <label htmlFor="employer-post-job-job-title-designation" className={labelCls}>Job Title / Designation <span className="text-red-500">*</span></label>
              <input id="employer-post-job-job-title-designation"
                type="text"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="e.g. Senior Accountant / Sales Representative / Web Developer"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Employment Type <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => update('jobType', t.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      form.jobType === t.id ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Job Description &amp; Responsibilities <span className="text-red-500">*</span></label>
              <textarea id="employer-post-job-employment-type-classname-px-3-5-py-2-ro"
                rows={6}
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Describe day-to-day duties, working hours, team culture, and expectations..."
                className={inputCls + " resize-none leading-relaxed"}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="employer-post-job-district" className={labelCls}>District <span className="text-red-500">*</span></label>
                <select id="employer-post-job-district" value={form.district} onChange={e => update('district', e.target.value)} className={inputCls}>
                  {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="employer-post-job-location-town-area" className={labelCls}>Location (Town / Area)</label>
                <input id="employer-post-job-location-town-area"
                  type="text"
                  value={form.location}
                  onChange={e => update('location', e.target.value)}
                  placeholder="e.g. Cumbum / Theni Bazaar"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="employer-post-job-number-of-openings" className={labelCls}>Number of Openings <span className="text-red-500">*</span></label>
                <select id="employer-post-job-number-of-openings" value={form.openings} onChange={e => update('openings', e.target.value)} className={inputCls}>
                  {OPENINGS_OPTIONS.map(o => <option key={o} value={o}>{o} Opening{parseInt(o) > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="employer-post-job-application-deadline" className={labelCls}>Application Deadline</label>
                <input id="employer-post-job-application-deadline" type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Requirements */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <Users size={14} />
              </div>
              2. Candidate Requirements &amp; Skills
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="employer-post-job-experience-level-required" className={labelCls}>Experience Level Required</label>
                <select id="employer-post-job-experience-level-required" value={form.experience} onChange={e => update('experience', e.target.value)} className={inputCls}>
                  <option value="">Select experience</option>
                  {EXPERIENCE_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="employer-post-job-minimum-qualification" className={labelCls}>Minimum Qualification</label>
                <select id="employer-post-job-minimum-qualification" value={form.education} onChange={e => update('education', e.target.value)} className={inputCls}>
                  <option value="">Select qualification</option>
                  {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="employer-post-job-required-skills-and-keywords-setnewskill" className={labelCls}>Required Skills &amp; Keywords</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  aria-label="e.g. Tally, GST, Photoshop, Java" placeholder="e.g. Tally, GST, Photoshop, Java"
                  className={inputCls + " flex-1"}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <Plus size={14} /> Add Skill
                </button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => setSkills(p => p.filter((_, idx) => idx !== i))}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3 — Salary & Benefits */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <Banknote size={14} />
              </div>
              3. Compensation &amp; Perks
            </h2>

            <div>
              <label className={labelCls}>Salary Frequency</label>
              <div className="flex gap-2 flex-wrap">
                {['monthly', 'yearly', 'daily', 'hourly'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update('salaryType', t)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border capitalize transition-all cursor-pointer ${
                      form.salaryType === t ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Minimum Salary (₹)</label>
                <input id="employer-post-job-required-skills-and-keywords-setnewskill"
                  type="number"
                  value={form.salaryMin}
                  onChange={e => update('salaryMin', e.target.value)}
                  placeholder="e.g. 15000"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="employer-post-job-maximum-salary" className={labelCls}>Maximum Salary (₹)</label>
                <input id="employer-post-job-maximum-salary"
                  type="number"
                  value={form.salaryMax}
                  onChange={e => update('salaryMax', e.target.value)}
                  placeholder="e.g. 25000"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 p-3.5 transition-all hover:bg-gray-50">
              <Switch
                checked={form.isNegotiable}
                onChange={(next) => update('isNegotiable', next)}
                label="Salary is negotiable based on candidate experience"
              />
              <span className="text-xs font-bold text-gray-800 sm:text-sm">Salary is negotiable based on candidate experience</span>
            </div>

            <div>
              <label className={labelCls}>Benefits &amp; Perks</label>
              <div className="flex flex-wrap gap-2">
                {BENEFITS_OPTIONS.map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBenefit(b)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      benefits.includes(b) ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {benefits.includes(b) ? '✓ ' : ''}{b}
                  </button>
                ))}
              </div>
            </div>

            {/* Boost options */}
            <div className="space-y-2.5 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Promotion Badges (Optional)</p>
              {[
                { key: 'isUrgent', label: '⚡ Mark as Urgent Hiring', desc: 'Highlight vacancy on landing page and daily jobs', bg: '#FFFBEB', color: '#D97706' },
                { key: 'isFeatured', label: '⭐ Featured Job Opportunity', desc: 'Pin to top of search results in Theni', bg: '#F5F3FF', color: '#7C3AED' },
                { key: 'isPremium', label: '👑 Premium Company Post', desc: 'Distinguished styling with gold verified border', bg: '#EFF6FF', color: '#2563EB' },
              ].map(({ key, label, desc, bg, color }) => {
                const isChecked = (form as any)[key];
                return (
                  <div
                    key={key}
                    onClick={() => update(key, !isChecked)}
                    className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
                      isChecked ? 'border-transparent shadow-xs' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={isChecked ? { background: bg, borderColor: color + '40' } : {}}
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900">{label}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{desc}</div>
                    </div>
                    <div
                      className={`w-10 h-6 rounded-full relative shrink-0 transition-all ${isChecked ? '' : 'bg-gray-300'}`}
                      style={isChecked ? { background: color } : {}}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-xs transition-all ${isChecked ? 'left-5' : 'left-1'}`} />
                    </div>
                  </div>
                );
              })}

              {/* Urgent Walk-in Drive Toggle & Venue */}
              <div className="p-4 rounded-2xl border border-red-200 bg-red-50/50 space-y-3 mt-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => update('isWalkIn', !form.isWalkIn)}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-red-950">🚨 24-48h Urgent Walk-in Interview Drive</h4>
                      <p className="text-[11px] text-red-700">Display top urgent countdown banner across the platform.</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative transition-all ${form.isWalkIn ? 'bg-red-600' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-xs transition-all ${form.isWalkIn ? 'left-5' : 'left-1'}`} />
                  </div>
                </div>

                {form.isWalkIn && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-red-200/60 animate-fade-in text-xs">
                    <div>
                      <label className="font-bold text-red-950 block mb-1">Walk-in Interview Date</label>
                      <input id="employer-post-job-update-isnegotiable-form-isnegotiable-cl"
                        type="date"
                        value={form.walkInDate}
                        onChange={e => update('walkInDate', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-red-300 text-base sm:text-xs text-gray-900"
                      />
                    </div>
                    <div>
                      <label htmlFor="employer-post-job-time-and-slots" className="font-bold text-red-950 block mb-1">Time &amp; Slots</label>
                      <input id="employer-post-job-time-and-slots"
                        type="text"
                        value={form.walkInTime}
                        onChange={e => update('walkInTime', e.target.value)}
                        placeholder="e.g. 10:00 AM – 4:00 PM"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-red-300 text-base sm:text-xs text-gray-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="employer-post-job-walk-in-venue-address-and-landmarks" className="font-bold text-red-950 block mb-1">Walk-in Venue Address &amp; Landmarks</label>
                      <input id="employer-post-job-walk-in-venue-address-and-landmarks"
                        type="text"
                        value={form.walkInVenue}
                        onChange={e => update('walkInVenue', e.target.value)}
                        placeholder="e.g. 45, NRT Road, Opp. Bus Stand, Theni"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-red-300 text-base sm:text-xs text-gray-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* STEP 4 — Preview & Post */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <FileText size={14} />
              </div>
              4. Review {getJobOrdinalName(activeJobsCount + 1)} Before Submission
            </h2>

            {/* Realistic preview card */}
            <div className="rounded-3xl border-2 overflow-hidden bg-white shadow-xs" style={{ borderColor: form.isFeatured ? '#FDE68A' : form.isPremium ? '#BFDBFE' : '#E5E7EB' }}>
              {(form.isFeatured || form.isPremium) && (
                <div
                  className="px-4 py-1.5 text-[10px] font-black text-center tracking-wider"
                  style={{ background: form.isFeatured ? '#FEF3C7' : '#DBEAFE', color: form.isFeatured ? '#92400E' : '#1E40AF' }}
                >
                  {form.isFeatured ? '⭐ FEATURED JOB VACANCY' : '👑 PREMIUM JOB OPPORTUNITY'}
                </div>
              )}

              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-blue-600 shrink-0 border border-blue-100 bg-blue-50">
                    {company?.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-gray-900 text-base">{form.title || 'Untitled Job'}</h3>
                      {form.isUrgent && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
                          <Zap size={9} /> URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{company?.name || 'Your Company'} · {form.district}{form.location ? `, ${form.location}` : ''}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700">
                    <Briefcase size={10} className="inline mr-1" /> {JOB_TYPES.find(t => t.id === form.jobType)?.label || 'Full Time'}
                  </span>
                  {form.salaryMin && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700">
                      <Banknote size={10} className="inline mr-1" /> ₹{Number(form.salaryMin).toLocaleString('en-IN')}{form.salaryMax ? ` – ₹${Number(form.salaryMax).toLocaleString('en-IN')}` : ''}/{form.salaryType}
                    </span>
                  )}
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-purple-50 text-purple-700">
                    <Users size={10} className="inline mr-1" /> {form.openings} Opening{parseInt(form.openings) > 1 ? 's' : ''}
                  </span>
                  {form.experience && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-800">
                      <Clock size={10} className="inline mr-1" /> {form.experience}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  {form.description || 'Job description details...'}
                </p>
              </div>
            </div>

            {/* Submission notice */}
            <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" /> Ready for Admin Approval Workflow
              </p>
              <p className="text-xs text-emerald-800 leading-relaxed">
                By clicking <strong>&quot;Post Job Now&quot;</strong>, your job will enter the Admin Review Queue. Once approved by our team, it will immediately go live across the platform.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
          {step === 4 && (
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="px-4 sm:px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold border-2 border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye size={14} /> Full Preview
            </button>
          )}
          <button
            type="button"
            onClick={step === 4 ? handlePost : () => setStep(s => s + 1)}
            disabled={loading || (step === 1 && !isStep1Valid)}
            className="flex-1 py-3.5 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-40"
            style={{ background: step === 4 ? '#10B981' : '#2563EB' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {step === 4 ? `🚀 Submit ${getJobOrdinalName(activeJobsCount + 1)}` : 'Continue'}
            {!loading && <ArrowRight size={15} />}
          </button>
        </div>

        {/* Full Modal Preview */}
        <JobPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          job={{
            title: form.title,
            description: form.description,
            district: form.district,
            location: form.location,
            salaryMin: form.salaryMin ? parseFloat(form.salaryMin) : undefined,
            salaryMax: form.salaryMax ? parseFloat(form.salaryMax) : undefined,
            jobType: form.jobType,
            openings: form.openings,
            experience: form.experience,
            education: form.education,
            skills,
            benefits,
            deadline: form.deadline,
            companyName: company?.name,
            isVerified: isCompanyVerified,
          }}
          companyData={company ? {
            name: company.name,
            logo: company.logoUrl,
            category: company.category,
            district: company.district,
            isVerified: isCompanyVerified,
            rating: company.rating,
            reviewCount: company.reviewCount,
          } : undefined}
        />

        {/* Success Modal */}
        <JobPostSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={() => {
            setIsSuccessModalOpen(false);
            router.push('/employer/jobs');
          }}
          onPostAnother={() => {
            resetForm();
          }}
          jobOrdinal={successJobData?.ordinal || 'Primary Job'}
          jobNumber={successJobData?.number || 1}
          maxPlanLimit={planCheck.limit}
          planName={planInfo.name}
          job={successJobData}
        />
      </div>
    </div>
  );
}
