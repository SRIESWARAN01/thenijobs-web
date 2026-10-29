'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Building2, MapPin, Banknote, Clock, Users,
  CheckCircle2, AlertCircle, ArrowLeft, Eye, Save, Send,
  Sparkles, ShieldCheck, Phone, Mail, MessageSquare, Copy,
  Check, Calendar, FileText, ChevronRight, Loader2, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { getEligibleBusinessesPublicList } from '@/lib/business/businessConstants';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { TN_DISTRICTS } from '@/lib/types';
import { safeParseResponse } from '@/lib/api/safeResponse';

const ELIGIBLE_BUSINESSES = getEligibleBusinessesPublicList();

const JOB_CATEGORIES = [
  'IT & Software',
  'Marketing & Advertising',
  'Sales & Business Development',
  'Retail & Supermarket',
  'Healthcare & Pharmacy',
  'Education & Teaching',
  'Manufacturing & Industrial',
  'Agriculture & Plantation',
  'Hospitality & Catering',
  'Security & Surveillance',
  'Accounting & Finance',
  'Logistics & Warehouse',
  'Construction & Real Estate',
  'General Administration',
];

const JOB_TYPES = [
  { id: 'full_time', label: 'Full Time' },
  { id: 'part_time', label: 'Part Time' },
  { id: 'internship', label: 'Internship' },
  { id: 'remote', label: 'Remote / Work from Home' },
  { id: 'fresher', label: 'Fresher Opportunity' },
  { id: 'contract', label: 'Contract' },
];

const EXPERIENCE_OPTIONS = [
  'Fresher (0 yrs)',
  '0–1 years',
  '1–2 years',
  '2–5 years',
  '5–10 years',
  '10+ years',
];

const QUALIFICATION_OPTIONS = [
  '10th Pass / SSLC',
  '12th Pass / HSC',
  'Diploma / ITI',
  'Any Bachelor Degree',
  'B.E / B.Tech / BCA / B.Sc',
  'MBA / PG / Master Degree',
  'Any Qualification',
];

const SALARY_TYPES = [
  { id: 'monthly', label: 'Per Month' },
  { id: 'daily', label: 'Per Day' },
  { id: 'annual', label: 'Per Year (LPA)' },
  { id: 'negotiable', label: 'Negotiable' },
];

const BENEFIT_OPTIONS = [
  'PF (Provident Fund)',
  'ESI Medical Insurance',
  'Health Insurance',
  'Food Allowance / Canteen',
  'Travel Allowance / Conveyance',
  'Performance Bonus',
  'Accommodation / Hostel',
  'Paid Leave / Holidays',
  'Uniform Provided',
];

const SHIFT_OPTIONS = [
  'Day Shift (9:00 AM – 6:00 PM)',
  'Day Shift (10:00 AM – 7:00 PM)',
  'Night Shift (8:00 PM – 5:00 AM)',
  'Rotational Shifts',
  'Morning Shift (6:00 AM – 2:00 PM)',
  'Flexible Hours',
];

const APPLICATION_METHODS = [
  { id: 'whatsapp', label: 'Direct WhatsApp Contact' },
  { id: 'call', label: 'Direct Phone Call' },
  { id: 'walkin', label: 'Walk-in Interview' },
  { id: 'online', label: 'Online Application on THENIJOBS' },
];

export default function AdminCreateJobForCompanyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [companyId, setCompanyId] = useState(ELIGIBLE_BUSINESSES[0]?.id || '');
  const [companyData, setCompanyData] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(JOB_CATEGORIES[0]);
  const [openings, setOpenings] = useState('1');
  const [description, setDescription] = useState('');
  const [qualifications, setQualifications] = useState(QUALIFICATION_OPTIONS[3]);
  const [experience, setExperience] = useState(EXPERIENCE_OPTIONS[0]);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryType, setSalaryType] = useState('monthly');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState('Theni');
  const [jobType, setJobType] = useState('full_time');
  const [workingHours, setWorkingHours] = useState(SHIFT_OPTIONS[0]);
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>(['PF (Provident Fund)', 'ESI Medical Insurance']);
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [applicationMethod, setApplicationMethod] = useState('whatsapp');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Modals & submission state
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [successData, setSuccessData] = useState<{
    jobId: string;
    slug: string;
    publicUrl: string;
    status: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Fetch Company details when companyId changes
  useEffect(() => {
    if (!companyId) return;
    async function loadCompany() {
      setLoadingCompany(true);
      try {
        const snap = await getDoc(doc(db, 'companies', companyId));
        if (snap.exists()) {
          const d = snap.data();
          setCompanyData(d);
          setLocation(d.address || d.taluk || d.district || 'Theni');
          setDistrict(d.district || 'Theni');
          setPhone(d.phone || '');
          setWhatsapp(d.whatsapp || d.phone || '');
          setEmail(d.email || d.contactEmail || '');
          setContactPerson(d.contactPerson || d.ownerName || d.name || '');
        }
      } catch (err) {
        console.error('Failed to load company details:', err);
      } finally {
        setLoadingCompany(false);
      }
    }
    loadCompany();
  }, [companyId]);

  const toggleBenefit = (b: string) => {
    setSelectedBenefits(prev =>
      prev.includes(b) ? prev.filter(item => item !== b) : [...prev, b]
    );
  };

  const validateForm = () => {
    if (!companyId) {
      toast.warning('Please select a company.');
      return false;
    }
    if (!title.trim()) {
      toast.warning('Please enter a job title.');
      return false;
    }
    if (!category.trim()) {
      toast.warning('Please select a job category.');
      return false;
    }
    if (!description.trim()) {
      toast.warning('Please enter a job description.');
      return false;
    }
    if (!openings || Number(openings) < 1) {
      toast.warning('Please specify at least 1 vacancy.');
      return false;
    }
    if (!deadline) {
      toast.warning('Please specify an application deadline.');
      return false;
    }
    return true;
  };

  const handlePostJob = async (action: 'draft' | 'pending' | 'publish') => {
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        toast.error('Authentication Error', 'Please log in again as administrator.');
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/admin/jobs/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          title,
          category,
          openings: Number(openings),
          description,
          qualifications: [qualifications],
          experience,
          salaryMin: salaryMin ? Number(salaryMin) : 0,
          salaryMax: salaryMax ? Number(salaryMax) : 0,
          salaryType,
          location,
          district,
          jobType,
          workingHours,
          benefits: selectedBenefits,
          deadline,
          applicationMethod,
          contactPerson,
          phone,
          whatsapp,
          email,
          additionalInstructions,
          action,
        }),
      });

      const parsed = await safeParseResponse<any>(res);
      const data = parsed.data || {};
      if (!parsed.ok || !data.success) {
        throw new Error(parsed.error || data.error || 'Failed to create job posting.');
      }

      setShowPreview(false);
      if (action === 'publish') {
        setSuccessData({
          jobId: data.jobId,
          slug: data.slug,
          publicUrl: data.publicUrl,
          status: 'Published & Live',
        });
        toast.success('Job Published Successfully! 🚀', `"${title}" is now live on THENIJOBS.`);
      } else {
        toast.success(
          action === 'draft' ? 'Draft Saved Successfully' : 'Submitted for Approval',
          `"${title}" saved as ${action}.`
        );
        router.push(`/admin/jobs?status=${action}`);
      }
    } catch (err: any) {
      console.error('Job creation error:', err);
      toast.error('Submission Failed', err.message || 'Please check your inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBusinessName = ELIGIBLE_BUSINESSES.find(b => b.id === companyId)?.name || 'Selected Company';
  const salaryDisplayText = salaryMin && salaryMax
    ? `₹${Number(salaryMin).toLocaleString('en-IN')} – ₹${Number(salaryMax).toLocaleString('en-IN')} / ${salaryType}`
    : salaryMin
    ? `₹${Number(salaryMin).toLocaleString('en-IN')}+ / ${salaryType}`
    : salaryType === 'negotiable'
    ? 'Salary Negotiable'
    : 'Not Disclosed';

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-24 text-slate-900 font-sans">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/admin/jobs" className="hover:text-indigo-600 transition-colors">
              Jobs Management
            </Link>
            <ChevronRight size={13} />
            <span className="text-indigo-600 font-bold">Create Job for Company</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Post a Job on Behalf of a Company
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Publish verified employment opportunities for the 8 registered partner businesses
          </p>
        </div>

        <Link
          href="/admin/jobs"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs self-start sm:self-auto transition-all"
        >
          <ArrowLeft size={14} /> Back to All Jobs
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-7">
        {/* SECTION 1: Company Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Select Eligible Partner Business</h2>
              <p className="text-xs text-slate-500">Company details will be auto-filled from verified database records</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Eligible Business Name <span className="text-rose-500">*</span>
              </label>
              <select
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
              >
                {ELIGIBLE_BUSINESSES.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.taluk}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Company Info Card */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-blue-50/50 p-3.5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-indigo-200 flex items-center justify-center shrink-0 shadow-xs text-indigo-700">
                <Building2 size={20} />
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 truncate">{selectedBusinessName}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
                <p className="text-slate-500 mt-0.5 truncate">
                  {companyData?.taluk || 'Theni District'} · Phone: {companyData?.phone || 'On file'}
                </p>
                <p className="text-[11px] text-indigo-700 font-semibold mt-1">
                  Database ID: <code className="bg-white/80 px-1 py-0.5 rounded text-[10px]">{companyId}</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* SECTION 2: Job Overview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Job Title, Category &amp; Vacancies</h2>
              <p className="text-xs text-slate-500">Define the core vacancy details shown to applicants</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sales Executive, Store Manager, Accountant, Cashier"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Number of Vacancies <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={openings}
                onChange={e => setOpenings(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Job Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              >
                {JOB_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Employment Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={jobType}
                onChange={e => setJobType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              >
                {JOB_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Job Description &amp; Responsibilities <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Describe candidate responsibilities, day-to-day duties, work environment, and key expectations..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* SECTION 3: Requirements & Eligibility */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Eligibility &amp; Work Shifts</h2>
              <p className="text-xs text-slate-500">Specify qualifications, experience level, and working shift</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Required Qualifications
              </label>
              <select
                value={qualifications}
                onChange={e => setQualifications(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              >
                {QUALIFICATION_OPTIONS.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Experience Required
              </label>
              <select
                value={experience}
                onChange={e => setExperience(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              >
                {EXPERIENCE_OPTIONS.map(exp => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Working Hours / Shifts
              </label>
              <select
                value={workingHours}
                onChange={e => setWorkingHours(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              >
                {SHIFT_OPTIONS.map(sh => (
                  <option key={sh} value={sh}>{sh}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* SECTION 4: Salary, Benefits & Location */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Salary, Location &amp; Benefits</h2>
              <p className="text-xs text-slate-500">Provide attractive compensation and perks for candidates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Salary Type
              </label>
              <select
                value={salaryType}
                onChange={e => setSalaryType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              >
                {SALARY_TYPES.map(st => (
                  <option key={st.id} value={st.id}>{st.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Minimum Salary (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 12000"
                value={salaryMin}
                onChange={e => setSalaryMin(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Maximum Salary (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 20000"
                value={salaryMax}
                onChange={e => setSalaryMax(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Work Location / Town <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chinnamanur, Theni Main Road, Uthamapalayam"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                District <span className="text-rose-500">*</span>
              </label>
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              >
                {TN_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Benefits Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Benefits &amp; Perks
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BENEFIT_OPTIONS.map(b => {
                const checked = selectedBenefits.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBenefit(b)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      checked
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                      checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {checked && <Check size={11} />}
                    </div>
                    <span className="truncate">{b}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* SECTION 5: Application Details & Contact */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
              5
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Application Method &amp; Company Contact</h2>
              <p className="text-xs text-slate-500">Contact details can be customized for this specific opening</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Application Method
              </label>
              <select
                value={applicationMethod}
                onChange={e => setApplicationMethod(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              >
                {APPLICATION_METHODS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Application Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Contact Person
              </label>
              <input
                type="text"
                placeholder="Manager / HR Name"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Contact Phone Number
              </label>
              <input
                type="tel"
                placeholder="10-digit Mobile"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                WhatsApp Inquiries Number
              </label>
              <input
                type="tel"
                placeholder="WhatsApp Number"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Additional Instructions / Walk-in Interview Guidelines
            </label>
            <input
              type="text"
              placeholder="e.g. Bring updated resume and Aadhaar card; walk-in interviews from 10 AM to 1 PM daily."
              value={additionalInstructions}
              onChange={e => setAdditionalInstructions(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none transition-all"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* SECTION 6: Actions Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (validateForm()) setShowPreview(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            <Eye size={16} /> Preview Job Before Publishing
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handlePostJob('draft')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save size={15} /> Save as Draft
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handlePostJob('pending')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Send size={15} /> Submit for Approval
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handlePostJob('publish')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              <span>Approve &amp; Publish</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE PREVIEW MODAL (Exact Public Look) ── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-300">
                <Eye size={14} /> Public Website Job Preview
              </span>
              <button
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Public Job Card Layout */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {selectedBusinessName}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {category}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {title || 'Job Title Placeholder'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" /> {location}, {district}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase size={13} className="text-slate-400" /> {jobType.replace(/_/g, ' ')}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      <Banknote size={13} /> {salaryDisplayText}
                    </span>
                  </div>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-lg border border-indigo-100 flex items-center justify-center shrink-0">
                  {selectedBusinessName.slice(0, 2).toUpperCase()}
                </div>
              </div>

              {/* Key Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Openings</span>
                  <span className="font-bold text-slate-800">{openings} Vacancy</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Experience</span>
                  <span className="font-bold text-slate-800">{experience}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Qualification</span>
                  <span className="font-bold text-slate-800 truncate block">{qualifications}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Deadline</span>
                  <span className="font-bold text-rose-600">{deadline}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase text-slate-400">Job Description</h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {description || 'No description provided.'}
                </p>
              </div>

              {/* Benefits */}
              {selectedBenefits.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase text-slate-400">Benefits &amp; Perks</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBenefits.map(b => (
                      <span key={b} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                        ✓ {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Shift & Instructions */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <Clock size={13} className="text-slate-500" /> Shift: {workingHours}
                </div>
                {additionalInstructions && (
                  <p className="text-slate-600 text-[11px] pt-1">
                    <strong>Note:</strong> {additionalInstructions}
                  </p>
                )}
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                  <span>Contact: <strong>{contactPerson || selectedBusinessName}</strong></span>
                  {phone && <span>Phone: <strong>{phone}</strong></span>}
                  {whatsapp && <span>WhatsApp: <strong>{whatsapp}</strong></span>}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Edit Job Details
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handlePostJob('draft')}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handlePostJob('pending')}
                  className="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold hover:bg-amber-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  Submit for Approval
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handlePostJob('publish')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Publishing...' : 'Approve & Publish Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS DIALOG ON PUBLISH ── */}
      {successData && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Live on THENIJOBS
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">
                Job Published Successfully!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                The opening for <strong>{selectedBusinessName}</strong> is now accessible to all job seekers across Tamil Nadu.
              </p>
            </div>

            {/* Public Job URL Box */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Public Job Link</span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-indigo-700 font-bold truncate">
                  {successData.publicUrl}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(successData.publicUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shrink-0"
                  title="Copy Link"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <a
                href={successData.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>View Job on Website</span> <ExternalLink size={14} />
              </a>

              <Link
                href="/admin/jobs"
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all"
              >
                Return to Jobs Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
