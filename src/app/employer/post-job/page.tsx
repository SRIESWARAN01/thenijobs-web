'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase, Banknote, FileText, Users, Clock,
  ArrowLeft, ArrowRight, Check, Loader2, Plus, X, Zap, ShieldAlert, Eye
} from 'lucide-react';
import JobPreviewModal from '@/components/employer/JobPreviewModal';
import { TN_DISTRICTS } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { createDocument, logActivity } from '@/lib/firebase/firestoreService';
import { notifyAllAdmins } from '@/lib/firebase/adminNotify';
import { where } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';

import { canPostNewJob, getPlan } from '@/lib/plans';

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

const inputCls = "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all";
const labelCls = "text-xs font-semibold text-gray-600 block mb-1.5";

export default function PostJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies?.[0];
  const companyId = company?.id;

  const { data: existingJobs } = useCollection<any>('jobs', [
    where('companyId', '==', companyId || ''),
    where('isActive', '==', true)
  ], { skip: !companyId });

  const activeJobsCount = existingJobs?.length || 0;
  const planCheck = canPostNewJob(company?.subscriptionPlan || 'free', activeJobsCount);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', jobType: 'full_time', location: '', district: '',
    openings: '1', experience: '', education: '',
    salaryMin: '', salaryMax: '', salaryType: 'monthly',
    isNegotiable: false, deadline: '',
    isPremium: false, isUrgent: false, isFeatured: false });

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(s => [...s, newSkill.trim()]); setNewSkill('');
    }
  };
  const toggleBenefit = (b: string) => setBenefits(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]);

  const handlePost = async () => {
    if (!companyId) { toast.warning('You must have a registered company profile to post a job.'); return; }
    setLoading(true);
    try {
      const jobData = {
        title: form.title, description: form.description, jobType: form.jobType,
        location: form.location, district: form.district,
        openings: parseInt(form.openings) || 1, experience: form.experience, education: form.education,
        skills, salaryMin: form.salaryMin ? parseFloat(form.salaryMin) : null,
        salaryMax: form.salaryMax ? parseFloat(form.salaryMax) : null,
        salaryType: form.salaryType, isNegotiable: form.isNegotiable, benefits,
        isPremium: form.isPremium, isUrgent: form.isUrgent, isFeatured: form.isFeatured,
        companyId, companyName: company.name, companyLogoUrl: company.logoUrl || '',
        postedBy: user?.uid, status: 'pending', isActive: false, viewCount: 0, applicationsCount: 0 };
      const jobId = await createDocument('jobs', jobData);
      await logActivity({ userId: user?.uid || '', userName: user?.displayName || user?.email || 'Employer', action: 'Posted a job listing', target: form.title, targetId: jobId });
      await notifyAllAdmins(
        'New Job Pending Approval 💼',
        `"${form.title}" posted by ${company.name} is awaiting review.`,
        '/admin/jobs',
      );
      toast.success('Job submitted successfully!', 'It will go live once admin approves.');
      router.push('/employer/jobs');
    } catch (err) { console.error(err); toast.error('Failed to post job listing.'); }
    finally { setLoading(false); }
  };

  if (companyLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Loading details...</p>
    </div>
  );

  const isCompanyVerified = company?.verificationStatus === 'verified' || company?.isVerified === true;

  if (!isCompanyVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 py-20 text-center px-4 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Company Verification Pending
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 max-w-md mb-6 leading-relaxed">
          Only <strong>Admin-Verified Companies</strong> can post active job openings on THENIJOBS. Our verification team is reviewing your profile (GST / Mobile / Business proof).
        </p>
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600 max-w-sm mb-6">
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
    <div className="max-w-2xl mx-auto px-4 py-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3" style={{ background: '#EFF6FF', color: '#2563EB' }}>
          <Briefcase size={12} /> Post a Job Opportunity
        </div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Reach Thousands of Local Candidates
        </h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details below to create your job listing</p>
      </div>

      {/* Plan Active Job Limit Banner */}
      {!planCheck.allowed ? (
        <div className="mb-6 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">Posting Limit Reached ({activeJobsCount}/{planCheck.limit} Jobs)</h3>
            <p className="text-xs text-amber-700 mt-1">
              Your current tier allows up to <strong>{planCheck.limit} active job postings</strong>. Upgrade to <strong>Standard Plan (₹999/year)</strong> for 15 active jobs!
            </p>
          </div>
          <Link
            href="/employer/billing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-sm"
          >
            Upgrade Plan to Post More <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="mb-6 px-4 py-2.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <span>Active Jobs on Current Plan: <strong>{activeJobsCount} / {planCheck.limit}</strong></span>
          <Link href="/employer/billing" className="font-bold text-blue-600 hover:underline">
            Upgrade Plan →
          </Link>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              step > s.id ? 'bg-emerald-500 text-white' :
              step === s.id ? 'text-white' : 'bg-gray-100 text-gray-400'
            }`} style={step === s.id ? { background: '#2563EB' } : {}}>
              {step > s.id ? <Check size={12} /> : s.id}
            </div>
            <span className={`text-xs hidden sm:block font-medium transition-colors ${
              step === s.id ? 'text-blue-600 font-semibold' : step > s.id ? 'text-emerald-600' : 'text-gray-400'
            }`}>{s.label}</span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full ml-1 transition-all ${step > s.id ? 'bg-emerald-400' : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">

        {/* STEP 1 — Job Details */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                <Briefcase size={14} style={{ color: '#2563EB' }} />
              </div>
              Job Details
            </h2>

            <div>
              <label className={labelCls}>Job Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => update('title', e.target.value)}
                placeholder="Job title" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Job Type <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map(t => (
                  <button key={t.id} onClick={() => update('jobType', t.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      form.jobType === t.id ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`} style={form.jobType === t.id ? { background: '#2563EB' } : {}}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Job Description <span className="text-red-500">*</span></label>
              <textarea rows={6} value={form.description} onChange={e => update('description', e.target.value)}
                placeholder="Describe job responsibilities, working hours, day-to-day tasks, work environment..."
                className={inputCls + " resize-none"} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>District <span className="text-red-500">*</span></label>
                <select value={form.district} onChange={e => update('district', e.target.value)} className={inputCls}>
                  <option value="">Select district</option>
                  {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Location (Area / Town)</label>
                <input type="text" value={form.location} onChange={e => update('location', e.target.value)}
                  placeholder="Job location" className={inputCls} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Number of Openings <span className="text-red-500">*</span></label>
                <select value={form.openings} onChange={e => update('openings', e.target.value)} className={inputCls}>
                  {OPENINGS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Application Deadline</label>
                <input type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Requirements */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#ECFDF5' }}>
                <Users size={14} style={{ color: '#059669' }} />
              </div>
              Candidate Requirements
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Experience Required</label>
                <select value={form.experience} onChange={e => update('experience', e.target.value)} className={inputCls}>
                  <option value="">Select experience</option>
                  {EXPERIENCE_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Minimum Education</label>
                <select value={form.education} onChange={e => update('education', e.target.value)} className={inputCls}>
                  <option value="">Select education</option>
                  {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Required Skills</label>
              <div className="flex gap-2 mb-3">
                <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill" className={inputCls + " flex-1"} />
                <button type="button" onClick={addSkill}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-900 flex items-center gap-1 transition-all hover:opacity-90"
                  style={{ background: '#2563EB' }}>
                  <Plus size={14} /> Add
                </button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border"
                      style={{ background: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' }}>
                      {s}
                      <button type="button" onClick={() => setSkills(p => p.filter((_, idx) => idx !== i))}
                        className="hover:text-red-500 transition-colors"><X size={11} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3 — Compensation */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FFFBEB' }}>
                <Banknote size={14} style={{ color: '#D97706' }} />
              </div>
              Salary & Benefits
            </h2>

            <div>
              <label className={labelCls}>Salary Rate</label>
              <div className="flex gap-2 flex-wrap">
                {['monthly', 'yearly', 'daily', 'hourly'].map(t => (
                  <button key={t} onClick={() => update('salaryType', t)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${
                      form.salaryType === t ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-600'
                    }`} style={form.salaryType === t ? { background: '#D97706' } : {}}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Minimum Salary (₹)</label>
                <input type="number" value={form.salaryMin} onChange={e => update('salaryMin', e.target.value)}
                  placeholder="Min salary" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Maximum Salary (₹)</label>
                <input type="number" value={form.salaryMax} onChange={e => update('salaryMax', e.target.value)}
                  placeholder="Max salary" className={inputCls} />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
              <div onClick={() => update('isNegotiable', !form.isNegotiable)}
                className={`w-10 h-6 rounded-full relative transition-all cursor-pointer ${form.isNegotiable ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm transition-all ${form.isNegotiable ? 'left-5' : 'left-1'}`} />
              </div>
              <span className="text-sm text-gray-700 font-medium">Salary is negotiable</span>
            </label>

            <div>
              <label className={labelCls}>Benefits / Perks</label>
              <div className="flex flex-wrap gap-2">
                {BENEFITS_OPTIONS.map(b => (
                  <button key={b} onClick={() => toggleBenefit(b)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      benefits.includes(b) ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`} style={benefits.includes(b) ? { background: '#10B981' } : {}}>
                    {benefits.includes(b) ? '✓ ' : ''}{b}
                  </button>
                ))}
              </div>
            </div>

            {/* Boost options */}
            <div className="space-y-2.5 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Boost Options (Optional)</p>
              {[
                { key: 'isUrgent', label: '⚡ Mark as Urgent Hiring', desc: 'Get 3× more visibility on listings', bg: '#FFFBEB', color: '#D97706' },
                { key: 'isFeatured', label: '⭐ Featured Job Listing', desc: 'Positioned prominently on the homepage', bg: '#F5F3FF', color: '#7C3AED' },
                { key: 'isPremium', label: '👑 Premium Badge', desc: 'Highlighted list styling for more views', bg: '#EFF6FF', color: '#2563EB' },
              ].map(({ key, label, desc, bg, color }) => {
                const isChecked = (form as any)[key];
                return (
                  <div key={key} onClick={() => update(key, !isChecked)}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      isChecked ? 'border-transparent shadow-sm' : 'border-gray-100 hover:border-gray-200'
                    }`} style={isChecked ? { background: bg, borderColor: color + '30' } : {}}>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative flex-shrink-0 transition-all ${isChecked ? '' : 'bg-gray-200'}`}
                      style={isChecked ? { background: color } : {}}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm transition-all ${isChecked ? 'left-5' : 'left-1'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4 — Preview & Post */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#ECFDF5' }}>
                <FileText size={14} style={{ color: '#059669' }} />
              </div>
              Preview — How Job Seekers Will See Your Listing
            </h2>

            {/* Realistic preview card */}
            <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: form.isFeatured ? '#FDE68A' : form.isPremium ? '#BFDBFE' : '#E5E7EB' }}>
              {/* Featured/Premium banner */}
              {(form.isFeatured || form.isPremium) && (
                <div className="px-4 py-1.5 text-[10px] font-bold text-center tracking-wider"
                  style={{ background: form.isFeatured ? '#FEF3C7' : '#DBEAFE', color: form.isFeatured ? '#92400E' : '#1E40AF' }}>
                  {form.isFeatured ? '⭐ FEATURED LISTING' : '👑 PREMIUM LISTING'}
                </div>
              )}

              <div className="p-5 bg-white">
                {/* Company header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-blue-600 flex-shrink-0 border border-blue-100"
                    style={{ background: '#EFF6FF' }}>
                    {company?.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base">{form.title || 'Untitled Job'}</h3>
                      {form.isUrgent && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"
                          style={{ background: '#FEF2F2', color: '#DC2626' }}>
                          <Zap size={9} /> URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{company?.name || 'Your Company'} · {form.district || 'Location'}{form.location ? `, ${form.location}` : ''}</p>
                  </div>
                </div>

                {/* Job meta chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    <Briefcase size={9} className="inline mr-0.5" /> {JOB_TYPES.find(t => t.id === form.jobType)?.label || 'Full Time'}
                  </span>
                  {form.salaryMin && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ background: '#ECFDF5', color: '#059669' }}>
                      <Banknote size={9} className="inline mr-0.5" /> ₹{Number(form.salaryMin).toLocaleString('en-IN')}{form.salaryMax ? ` – ₹${Number(form.salaryMax).toLocaleString('en-IN')}` : ''}/{form.salaryType || 'month'}
                    </span>
                  )}
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                    <Users size={9} className="inline mr-0.5" /> {form.openings} opening{parseInt(form.openings) > 1 ? 's' : ''}
                  </span>
                  {form.experience && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: '#FFFBEB', color: '#D97706' }}>
                      <Clock size={9} className="inline mr-0.5" /> {form.experience}
                    </span>
                  )}
                  {form.education && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: '#FFF1F2', color: '#BE123C' }}>
                      {form.education}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="mb-4">
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-5">
                    {form.description || 'Add a job description to see it here...'}
                  </p>
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                  <div className="mb-4 pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map(s => (
                        <span key={s} className="text-[10px] px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#EFF6FF', color: '#2563EB' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Benefits */}
                {benefits.length > 0 && (
                  <div className="mb-4 pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Benefits</p>
                    <div className="flex flex-wrap gap-1.5">
                      {benefits.map(b => (
                        <span key={b} className="text-[10px] px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#ECFDF5', color: '#059669' }}>✓ {b}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Apply button preview */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <div className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold text-center" style={{ background: '#2563EB' }}>
                    Apply Now
                  </div>
                  <div className="py-2.5 px-4 rounded-xl text-white text-xs font-bold flex items-center gap-1" style={{ background: '#25D366' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                    WhatsApp
                  </div>
                </div>
              </div>
            </div>

            {/* Submission notice */}
            <div className="rounded-2xl p-4 border" style={{ background: '#ECFDF5', borderColor: '#BBF7D0' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#059669' }}>✅ Ready for Review</p>
              <p className="text-xs leading-relaxed" style={{ color: '#047857' }}>
                By clicking &quot;Post Job Now&quot;, your listing will be submitted for admin approval.
                Once approved, it will be visible in public search and alerts.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-5 py-3 rounded-2xl text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all">
              <ArrowLeft size={14} /> Back
            </button>
          )}
          {step === 4 && (
            <button onClick={() => setShowPreview(true)}
              className="px-5 py-3 rounded-2xl text-sm font-semibold border-2 border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-all">
              <Eye size={14} /> Preview
            </button>
          )}
          <button
            onClick={step === 4 ? handlePost : () => setStep(s => s + 1)}
            disabled={loading || (step === 1 && !isStep1Valid)}
            className="flex-1 py-3 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: step === 4 ? '#10B981' : '#2563EB' }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {step === 4 ? '🚀 Post Job Now' : 'Continue'}
            {!loading && <ArrowRight size={14} />}
          </button>
        </div>

        {/* Job Preview Modal */}
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
      </div>
    </div>
  );
}
