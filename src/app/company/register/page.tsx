'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Building2, MapPin, Phone, Mail, Globe, FileText, Image as ImageIcon,
  Video, Clock, ChevronRight, Check, ArrowLeft, ArrowRight,
  Loader2, Upload, Plus, X, BadgeCheck, AlertCircle, CheckCircle2,
  type LucideIcon
} from 'lucide-react';
import { BUSINESS_CATEGORIES } from '@/lib/types';
import { useLocations } from '@/hooks/useLocations';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, doc, setDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import { getAvailableCompanySlug, notifyAdminsNewRegistration } from '@/lib/firebase/firestoreService';
import { getCompanyPortfolioPath, normalizeExternalUrl, slugifyCompanyName } from '@/lib/companyPortfolio';

const STEPS: Array<{ id: number; label: string; icon: LucideIcon }> = [
  { id: 1, label: 'Basic Info', icon: Building2 },
  { id: 2, label: 'Contact & Location', icon: MapPin },
  { id: 3, label: 'Media Upload', icon: ImageIcon },
  { id: 4, label: 'Details & Social', icon: Globe },
  { id: 5, label: 'Services', icon: FileText },
  { id: 6, label: 'Preview & Submit', icon: Check },
];

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];
const COMPANY_SIZE_OPTIONS = COMPANY_SIZES.map(s => ({ value: s, label: `${s} employees` }));
const CATEGORY_OPTIONS = BUSINESS_CATEGORIES.map(c => ({ value: c, label: c }));
const HOURS = ['08:00 AM', '09:00 AM', '10:00 AM'] as const;

export default function CompanyRegisterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { states, getDistricts, getAreas } = useLocations();
  const stateOptions = states.map((state) => ({ value: state, label: state }));
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [validatedSlug, setValidatedSlug] = useState('');
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newService, setNewService] = useState('');

  const [form, setForm] = useState({
    name: '', category: '', subcategory: '', foundedYear: '',
    companySize: '', gstNumber: '', registrationNumber: '', description: '',
    phone: '', alternatePhone: '', email: '', website: '', whatsapp: '',
    address: '', location: '', district: '', state: '', country: 'India',
    facebook: '', instagram: '', linkedin: '', youtube: '',
    openFrom: '09:00 AM', openTo: '06:00 PM',
    logoUrl: '', coverUrl: '',
  });

  const districtOptions = getDistricts(form.state).map((district) => ({ value: district, label: district }));
  const locationOptions = getAreas(form.state, form.district).map((area) => ({ value: area, label: area }));

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<'logo' | 'cover' | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [quickMode, setQuickMode] = useState(true);

  // Auto-fill email from authenticated user
  useEffect(() => {
    if (user?.email && !form.email) {
      setForm(f => ({ ...f, email: user.email || '' }));
    }
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropType('logo');
    setShowCropper(true);
    if (e.target) e.target.value = '';
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropType('cover');
    setShowCropper(true);
    if (e.target) e.target.value = '';
  };

  const handleUploadComplete = (url: string) => {
    if (cropType === 'logo') {
      update('logoUrl', url);
    } else if (cropType === 'cover') {
      update('coverUrl', url);
    }
    setShowCropper(false);
    setCropFile(null);
    setCropType(null);
  };

  const generateSlug = slugifyCompanyName;

  useEffect(() => {
    if (states.length === 0) return;

    setForm((current) => {
      const nextState = current.state && states.includes(current.state) ? current.state : states[0];
      const districts = getDistricts(nextState);
      const nextDistrict = current.district && districts.includes(current.district)
        ? current.district
        : (districts[0] || '');
      const areas = getAreas(nextState, nextDistrict);
      const nextLocation = current.location && areas.includes(current.location) ? current.location : '';

      if (
        nextState === current.state &&
        nextDistrict === current.district &&
        nextLocation === current.location
      ) {
        return current;
      }

      return {
        ...current,
        state: nextState,
        district: nextDistrict,
        location: nextLocation,
      };
    });
  }, [states, getDistricts, getAreas]);

  const checkSlugAvailability = useCallback(async (name: string) => {
    const slug = generateSlug(name);
    if (!slug || slug.length < 2) {
      setSlugStatus('idle');
      setValidatedSlug('');
      return;
    }
    setSlugStatus('checking');
    try {
      const uniqueSlug = await getAvailableCompanySlug(slug);
      setSlugStatus(uniqueSlug === slug ? 'available' : 'taken');
      setValidatedSlug(uniqueSlug);
    } catch (err) {
      console.error('Slug check error:', err);
      setSlugStatus('idle');
      setValidatedSlug(slug);
    }
  }, []);

  const update = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'name') {
      if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
      slugCheckTimer.current = setTimeout(() => {
        checkSlugAvailability(v);
      }, 600);
    }
  };
  const updateState = (state: string) => {
    const districts = getDistricts(state);
    const district = districts[0] || '';
    const areas = getAreas(state, district);
    setForm((current) => ({
      ...current,
      state,
      district,
      location: areas[0] || '',
    }));
  };
  const updateDistrict = (district: string) => {
    const areas = getAreas(form.state, district);
    setForm((current) => ({
      ...current,
      district,
      location: areas[0] || '',
    }));
  };
  const addService = () => { if (newService.trim()) { setServices(s => [...s, newService.trim()]); setNewService(''); } };
  const removeService = (i: number) => setServices(s => s.filter((_, idx) => idx !== i));

  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async () => {
    setSubmitError('');
    if (!user) {
      setSubmitError('Please login to register a business.');
      router.push('/login?redirect=/company/register');
      return;
    }
    if (!form.name.trim()) {
      setSubmitError('Please enter your business name.');
      return;
    }
    if (!form.category) {
      setSubmitError('Please select a business category.');
      return;
    }
    if (!form.phone || form.phone.replace(/\D/g, '').length < 10) {
      setSubmitError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setSubmitError('Please enter a valid email address.');
      return;
    }
    // Location/district/state validation only in full mode
    if (!quickMode) {
      if (!form.location) {
        setSubmitError('Please select your area / town.');
        return;
      }
      if (!form.district || !form.state) {
        setSubmitError('Please select your state and district.');
        return;
      }
    }
    setLoading(true);
    try {
      // Check for duplicate registration
      const existingQuery = query(
        collection(db, 'companies'),
        where('ownerId', '==', user.uid)
      );
      const existingSnap = await getDocs(existingQuery);
      if (!existingSnap.empty) {
        setSubmitError('You have already registered a business. You can manage it from your Business Dashboard.');
        setLoading(false);
        return;
      }

      const slug = await getAvailableCompanySlug(form.name);
      setValidatedSlug(slug);
      setSlugStatus(slug === generateSlug(form.name) ? 'available' : 'taken');

      const { gstNumber, registrationNumber, ...publicForm } = form;
      const normalizedForm = {
        ...publicForm,
        website: normalizeExternalUrl(publicForm.website),
      };

      const docRef = await addDoc(collection(db, 'companies'), {
        ...normalizedForm,
        foundedYear: form.foundedYear ? parseInt(form.foundedYear) : '',
        services,
        ownerId: user.uid,
        ownerName: user.displayName || form.name,
        status: 'pending',
        verificationStatus: 'pending',
        isVerified: false,
        isActive: false,
        isFeatured: false,
        isPremium: false,
        rating: 0,
        reviewCount: 0,
        viewCount: 0,
        enquiryCount: 0,
        followerCount: 0,
        slug,
        portfolioPath: getCompanyPortfolioPath({ slug }),
        verificationBadges: {
          emailVerified: !!form.email,
          gstVerified: !!gstNumber,
          businessVerified: false,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (gstNumber || registrationNumber) {
        try {
          await setDoc(doc(db, 'companies', docRef.id, 'private', 'verification'), {
            gstNumber: gstNumber || '',
            registrationNumber: registrationNumber || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (subDocErr) {
          // Subcollection write can occasionally fail right after parent creation;
          // log but don't block the registration flow.
          console.warn('[CompanyRegister] Verification subcollection write failed:', subDocErr);
        }
      }

      // Notify all admin users about the new registration (fire-and-forget)
      notifyAdminsNewRegistration(form.name, docRef.id).catch((notifErr) => {
        console.warn('[CompanyRegister] Admin notification failed:', notifErr);
      });

      setSubmitSuccess(true);
      setTimeout(() => router.push('/business/pending'), 2000);
    } catch (err: any) {
      console.error('[CompanyRegister] Registration error:', err);
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        setSubmitError('Unable to save your registration. Please make sure you are logged in and try again. If the issue persists, please contact support.');
      } else if (err?.code === 'unavailable') {
        setSubmitError('Network error. Please check your internet connection and try again.');
      } else {
        setSubmitError('Something went wrong while registering your business. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a1a]">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-28 md:pb-12">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-outfit font-bold text-white">
            Register Your <span className="gradient-text">Business</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Get your own SEO-friendly page on THENIJOBS. Google-ready from day one.
          </p>
        </div>

        {/* Quick Registration Mode */}
        {quickMode ? (
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
              <Building2 size={18} className="text-violet-400" /> Quick Business Registration
            </h2>

            <div className="space-y-4">
              {/* Owner Name (auto-filled, read-only) */}
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Owner Name</label>
                <input type="text" value={user?.displayName || ''} readOnly
                  className="search-input w-full px-4 py-3 text-sm opacity-70 cursor-not-allowed" />
              </div>

              {/* Email (auto-filled, read-only) */}
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Email (Verified ✓)</label>
                <div className="relative">
                  <input type="email" value={form.email} readOnly
                    className="search-input w-full px-4 py-3 text-sm opacity-70 cursor-not-allowed pr-10" />
                  <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Business Name *</label>
                <input type="text" placeholder="e.g. Theni Fresh Fruits"
                  value={form.name} onChange={e => update('name', e.target.value)}
                  className="search-input w-full px-4 py-3 text-sm" />
                {form.name.trim() && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">URL: thenijobs.com/company/<span className="text-violet-400">{validatedSlug || generateSlug(form.name) || 'your-business'}</span></p>
                    {slugStatus === 'checking' && <Loader2 size={12} className="animate-spin text-gray-400" />}
                    {slugStatus === 'available' && <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold"><CheckCircle2 size={11} /> Available</span>}
                  </div>
                )}
              </div>

              {/* Business Category */}
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Business Category *</label>
                <Select
                  value={form.category}
                  onChange={(val) => update('category', val)}
                  options={CATEGORY_OPTIONS}
                  placeholder="Select category"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Mobile Number *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-3 rounded-l-xl bg-white/[0.04] border border-r-0 border-white/[0.08] text-sm text-gray-400">+91</span>
                  <input type="tel" maxLength={10} placeholder="98765 43210"
                    value={form.phone} onChange={e => update('phone', e.target.value.replace(/\D/g, ''))}
                    className="search-input flex-1 px-4 py-3 text-sm rounded-l-none" />
                </div>
              </div>
            </div>

            {/* Error / Success Messages */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 mt-4">
                <AlertCircle size={16} className="text-rose-400 shrink-0" />
                <p className="text-xs text-rose-300 font-medium">{submitError}</p>
              </div>
            )}
            {submitSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-4">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-300 font-medium">Business registered successfully! Redirecting...</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || submitSuccess}
              className="w-full btn-gradient py-3.5 rounded-2xl font-semibold text-sm mt-6 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>

            {/* Toggle to full form */}
            <button
              onClick={() => { setQuickMode(false); setStep(1); }}
              className="w-full text-center text-xs text-gray-500 hover:text-violet-400 mt-4 transition-colors"
            >
              Want to add more details? Use the full registration form →
            </button>
          </div>
        ) : (
          <>
        {/* Step Indicator (full mode only) */}
        <div className="overflow-x-auto no-scrollbar mb-8">
          <div className="flex items-center gap-1 min-w-max mx-auto justify-center">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isDone = step > s.id;
              const isCurrent = step === s.id;
              return (
                <div key={s.id} className="flex items-center gap-1">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                    ${isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isCurrent ? 'bg-violet-600 text-white'
                        : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center">
                      {isDone ? <Check size={12} /> : <Icon size={12} />}
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-700" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8">

          {/* STEP 1 — Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building2 size={18} className="text-violet-400" /> Basic Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Company / Business Name *</label>
                  <input type="text"
                    value={form.name} onChange={e => update('name', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm" />
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">Your URL: thenijobs.com/company/<span className="text-violet-400">{validatedSlug || generateSlug(form.name) || 'your-business-name'}</span></p>
                    {slugStatus === 'checking' && <Loader2 size={12} className="animate-spin text-gray-400" />}
                    {slugStatus === 'available' && <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold"><CheckCircle2 size={11} /> Available</span>}
                    {slugStatus === 'taken' && <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold"><AlertCircle size={11} /> Name taken — will use: {validatedSlug}</span>}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Business Category *</label>
                  <Select
                    value={form.category}
                    onChange={(val) => update('category', val)}
                    options={CATEGORY_OPTIONS}
                    placeholder="Select category"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Sub-category</label>
                  <input type="text"
                    value={form.subcategory} onChange={e => update('subcategory', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Founded Year</label>
                  <input type="number" min="1900" max="2025"
                    value={form.foundedYear} onChange={e => update('foundedYear', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Company Size</label>
                  <Select
                    value={form.companySize}
                    onChange={(val) => update('companySize', val)}
                    options={COMPANY_SIZE_OPTIONS}
                    placeholder="Select size"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">GST Number (Optional)</label>
                  <input type="text" placeholder="33AABCA1234A1Z5"
                    value={form.gstNumber} onChange={e => update('gstNumber', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Registration Number (Optional)</label>
                  <input type="text" placeholder="UDYAM / Trade License No."
                    value={form.registrationNumber} onChange={e => update('registrationNumber', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Business Description * <span className="text-gray-500">(for SEO – min 100 words)</span></label>
                  <textarea rows={5} placeholder="Describe your business, services offered, and what makes you unique. This will appear on Google Search results."
                    value={form.description} onChange={e => update('description', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm resize-none leading-relaxed" />
                  <p className="text-xs text-gray-500 mt-1">{form.description.split(' ').filter(Boolean).length} words</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Contact & Location */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin size={18} className="text-violet-400" /> Contact & Location
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Mobile Number *</label>
                  <div className="flex gap-2">
                    <div className="search-input px-3 py-3 text-sm text-gray-400 w-14 text-center rounded-xl">+91</div>
                    <input type="tel" maxLength={10} placeholder="98765 43210"
                      value={form.phone} onChange={e => update('phone', e.target.value)}
                      className="search-input flex-1 px-4 py-3 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Alternate Number</label>
                  <div className="flex gap-2">
                    <div className="search-input px-3 py-3 text-sm text-gray-400 w-14 text-center rounded-xl">+91</div>
                    <input type="tel" maxLength={10} placeholder="Optional"
                      value={form.alternatePhone} onChange={e => update('alternatePhone', e.target.value)}
                      className="search-input flex-1 px-4 py-3 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Email Address *</label>
                  <input type="email" placeholder="contact@yourbusiness.com"
                    value={form.email} onChange={e => update('email', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">WhatsApp Number</label>
                  <div className="flex gap-2">
                    <div className="search-input px-3 py-3 text-sm text-gray-400 w-14 text-center rounded-xl">+91</div>
                    <input type="tel" maxLength={10} placeholder="98765 43210"
                      value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)}
                      className="search-input flex-1 px-4 py-3 text-sm" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Website URL</label>
                  <input type="url" placeholder="https://yourbusiness.com"
                    value={form.website} onChange={e => update('website', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Full Address *</label>
                  <textarea rows={2} placeholder="Door no., Street, Area, Town"
                    value={form.address} onChange={e => update('address', e.target.value)}
                    className="search-input w-full px-4 py-3 text-sm resize-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">State *</label>
                  <Select
                    value={form.state}
                    onChange={updateState}
                    options={stateOptions}
                    placeholder="Select state"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">District *</label>
                  <Select
                    value={form.district}
                    onChange={updateDistrict}
                    options={districtOptions}
                    placeholder="Select district"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Area / Town *</label>
                  <Select
                    value={form.location}
                    onChange={(val) => update('location', val)}
                    options={locationOptions}
                    placeholder="Select area"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Opening Time</label>
                  <input type="time" value="09:00" className="search-input w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Closing Time</label>
                  <input type="time" value="18:00" className="search-input w-full px-4 py-3 text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Media Upload */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-violet-400" /> Media Upload
              </h2>
              
              {/* Company Logo */}
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-2">Company Logo</label>
                {form.logoUrl ? (
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-white/10 group mb-2 bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => update('logoUrl', '')}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity duration-200"
                    >
                      Remove Logo
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-white/15 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer group">
                    <div className="text-4xl">🖼️</div>
                    <div className="text-center">
                      <div className="flex items-center gap-2 text-sm font-medium text-white group-hover:text-violet-300 transition-colors">
                        <Upload size={14} /> Click to upload
                      </div>
                      <p className="text-xs text-gray-500 mt-1">PNG/JPG, Square, min 200×200px</p>
                    </div>
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoChange}
                      accept=".png,.jpg,.jpeg"
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Cover Image */}
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-2">Cover Image</label>
                {form.coverUrl ? (
                  <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-white/10 group mb-2 bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => update('coverUrl', '')}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity duration-200"
                    >
                      Remove Cover
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-white/15 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer group">
                    <div className="text-4xl">🏞️</div>
                    <div className="text-center">
                      <div className="flex items-center gap-2 text-sm font-medium text-white group-hover:text-violet-300 transition-colors">
                        <Upload size={14} /> Click to upload
                      </div>
                      <p className="text-xs text-gray-500 mt-1">JPG/PNG, Landscape 1200×400px recommended</p>
                    </div>
                    <input
                      type="file"
                      ref={coverInputRef}
                      onChange={handleCoverChange}
                      accept=".png,.jpg,.jpeg"
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium block mb-2">Gallery Images (up to 10)</label>
                <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-white/15 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer group">
                  <div className="text-4xl">📷</div>
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-sm font-medium text-white group-hover:text-violet-300 transition-colors">
                      <Upload size={14} /> Upload multiple images
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Office, products, team, work site photos</p>
                  </div>
                  <input type="file" accept=".png,.jpg,.jpeg" multiple className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* STEP 4 — Details & Social */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Globe size={18} className="text-violet-400" /> Social Media & Additional Details
              </h2>
              <div className="space-y-4">
                {[
                  { key: 'facebook', label: 'Facebook Page URL', placeholder: 'https://facebook.com/yourpage', icon: '📘' },
                  { key: 'instagram', label: 'Instagram Profile URL', placeholder: 'https://instagram.com/yourhandle', icon: '📷' },
                  { key: 'linkedin', label: 'LinkedIn Company Page', placeholder: 'https://linkedin.com/company/...', icon: '💼' },
                  { key: 'youtube', label: 'YouTube Channel', placeholder: 'https://youtube.com/@yourchannel', icon: '▶️' },
                ].map(({ key, label, placeholder, icon }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-400 font-medium block mb-1.5">{icon} {label}</label>
                    <input type="url" placeholder={placeholder}
                      value={(form as any)[key]} onChange={e => update(key, e.target.value)}
                      className="search-input w-full px-4 py-3 text-sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5 — Services */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText size={18} className="text-violet-400" /> Business Services
              </h2>
              <p className="text-sm text-gray-400">Add the services your business offers. These help customers find you and improve SEO.</p>
              <div className="flex gap-2">
                <input type="text" value={newService} onChange={e => setNewService(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addService()}
                  placeholder="e.g. Tractor Rental, Harvesting Service..."
                  className="search-input flex-1 px-4 py-3 text-sm" />
                <button onClick={addService}
                  className="btn-gradient px-4 py-3 rounded-xl relative z-10 flex items-center gap-1 text-sm font-semibold">
                  <Plus size={15} /> Add
                </button>
              </div>
              {services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {services.map((s, i) => (
                    <span key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20 text-sm font-medium">
                      ✓ {s}
                      <button onClick={() => removeService(i)} className="hover:text-rose-400 transition-colors"><X size={13} /></button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-white/10 rounded-2xl">
                  Add at least 3 services to improve discoverability
                </div>
              )}
              <div className="glass-card rounded-2xl p-4 border border-emerald-500/20">
                <p className="text-xs text-emerald-400 font-medium mb-1">💡 SEO Tip</p>
                <p className="text-xs text-gray-400">Each service you add becomes a keyword that helps customers find you on Google. Add specific, detailed service names.</p>
              </div>
            </div>
          )}

          {/* STEP 6 — Preview & Submit */}
          {step === 6 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Check size={18} className="text-violet-400" /> Preview & Submit
              </h2>

              {/* Preview Card */}
              <div className="glass-card rounded-2xl p-5 border border-violet-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl">🏢</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{form.name || 'Your Business Name'}</h3>
                      <span className="badge-verified">PENDING</span>
                    </div>
                    <div className="text-sm text-gray-400">{form.category || 'Category'} • {form.location || form.district || 'Location'}</div>
                    <div className="text-xs text-violet-400 mt-0.5">
                      thenijobs.com/company/{validatedSlug || generateSlug(form.name || 'your-business')}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{form.description.slice(0, 200) || 'Your business description will appear here...'}</p>
                {services.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                    {services.map(s => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/15">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submission status messages */}
              {submitError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle size={16} className="text-rose-400 shrink-0" />
                  <p className="text-xs text-rose-300 font-medium">{submitError}</p>
                </div>
              )}
              {submitSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-300 font-medium">Business registered successfully! Redirecting to dashboard...</p>
                </div>
              )}

              {/* What happens next */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">What happens next?</p>
                {[
                  { step: '1', text: 'Your profile will be reviewed within 24 hours', icon: Clock },
                  { step: '2', text: 'Once approved, your SEO page goes live instantly', icon: BadgeCheck },
                  { step: '3', text: 'Google will index your page within 3–7 days', icon: Check },
                ].map(({ step, text, icon: Icon }) => (
                  <div key={step} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{step}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-300"><Icon size={13} className="text-emerald-400" />{text}</div>
                  </div>
                ))}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 accent-violet-600" />
                <span className="text-xs text-gray-400">
                  I agree to THENIJOBS <Link href="/terms" className="text-violet-400">Terms of Service</Link> and confirm that all information provided is accurate.
                </span>
              </label>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                className="btn-outline-glass px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button
              onClick={step === 6 ? handleSubmit : () => setStep(s => s + 1)}
              disabled={loading}
              className="flex-1 btn-gradient py-3 rounded-2xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {step === 6 ? 'Submit for Review' : 'Continue'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      <BottomNav />
      </>
      )}
      </div>
      {!quickMode && <BottomNav />}
      {showCropper && cropFile && (
        <ImageCropperModal
          open={showCropper}
          onClose={() => {
            setShowCropper(false);
            setCropFile(null);
            setCropType(null);
          }}
          file={cropFile}
          aspectRatio={cropType === 'logo' ? 1 : 3} // Square for logo, 3:1 for cover banner
          cropWidth={cropType === 'logo' ? 400 : 1200}
          cropHeight={cropType === 'logo' ? 400 : 400}
          uploadPath={user ? `companies/${user.uid}/${cropType}/crop_${Date.now()}` : undefined}
          onUploadComplete={handleUploadComplete}
          title={cropType === 'logo' ? 'Crop Company Logo' : 'Crop Cover Banner'}
          isCircular={cropType === 'logo'}
        />
      )}
    </main>
  );
}
