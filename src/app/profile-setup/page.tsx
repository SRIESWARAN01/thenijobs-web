'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUploadFile } from '@/hooks/useStorage';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';

import Image from 'next/image';
import Link from 'next/link';
import {
  User, Phone, Mail, MapPin, Briefcase, Star, Wrench,
  Building2, Check, ArrowRight, ArrowLeft, Loader2, AlertCircle, Package
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { buildPublicSeekerProfile } from '@/lib/publicProfile';
import { createDocument, getAvailableCompanySlug } from '@/lib/firebase/firestoreService';
import { BUSINESS_CATEGORIES } from '@/lib/types';
import { useLocations } from '@/hooks/useLocations';
import { getDashboardPathForRole } from '@/lib/access';
import { getCompanyPortfolioPath } from '@/lib/companyPortfolio';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { allAreas, hierarchy } = useLocations();
  
  // Require auth but skip checking setup completion to prevent redirect loop
  const { user, loading: authLoading } = useRequireAuth(undefined, '/login');
  
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [seekerForm, setSeekerForm] = useState({
    name: '',
    gender: 'Male',
    dob: '',
    phone: '',
    district: '',
    address: '',
    currentRole: '',
    skills: '',
  });

  const [businessForm, setBusinessForm] = useState({
    name: '',
    tagline: '',
    category: '',
    phone: '',
    email: '',
    location: '',
    address: '',
    description: '',
    logoUrl: '',
    coverUrl: '',
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<'logo' | 'banner' | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const { uploadFile, progress: uploadProgress, loading: uploading } = useUploadFile();

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropType('logo');
    setShowCropper(true);
    if (e.target) e.target.value = '';
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropType('banner');
    setShowCropper(true);
    if (e.target) e.target.value = '';
  };

  // Prefill user details
  useEffect(() => {
    if (user) {
      // If setup is already complete, redirect away immediately
      if (user.setupCompleted) {
        router.replace(getDashboardPathForRole(user.role));
        return;
      }
      
      const phoneDigits = user.phone?.replace('+91', '') || '';
      setSeekerForm(prev => ({
        ...prev,
        name: user.displayName || '',
        phone: phoneDigits,
      }));

      setBusinessForm(prev => ({
        ...prev,
        phone: phoneDigits,
        email: user.email || '',
      }));
    }
  }, [user, router]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center font-outfit text-white">
        <Loader2 size={36} className="text-violet-500 animate-spin mb-4" />
        <p className="text-sm text-gray-400 font-medium">Checking authentication state...</p>
      </main>
    );
  }

  if (!user) return null;

  const isSeeker = user.role === 'job_seeker';
  const totalSteps = 3;

  const validateStep = () => {
    setError(null);
    if (isSeeker) {
      if (step === 1) {
        if (!seekerForm.name.trim()) return 'Name is required.';
      } else if (step === 2) {
        if (!seekerForm.phone.trim() || seekerForm.phone.length !== 10) return 'Valid 10-digit mobile number is required.';
      } else if (step === 3) {
        // All fields are optional
      }
    } else {
      if (step === 1) {
        if (!businessForm.phone.trim() || businessForm.phone.length !== 10) return 'Valid 10-digit mobile number is required.';
        if (!businessForm.email.trim()) return 'Contact email is required.';
      } else if (step === 2) {
        if (!businessForm.name.trim()) return 'Business/Company name is required.';
        if (!businessForm.category) return 'Please select a business category.';
        if (!businessForm.description.trim()) return 'Description is required.';
      } else if (step === 3) {
        if (!businessForm.location) return 'Please select your business area/town.';
        if (!businessForm.address.trim()) return 'Full business address is required.';
      }
    }
    return null;
  };

  const handleSkip = () => {
    setError(null);
    if (isSeeker) {
      if (step === 1) {
        if (!seekerForm.name.trim()) {
          setError('Name is required.');
          return;
        }
        setStep(2);
      } else if (step === 2) {
        if (!seekerForm.phone.trim() || seekerForm.phone.length !== 10) {
          setError('Valid 10-digit mobile number is required.');
          return;
        }
        setStep(3);
      } else if (step === 3) {
        handleSubmit();
      }
    }
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (step < totalSteps) {
      setStep(s => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep(s => s - 1);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const resolveArea = (area: string) => {
        for (const [state, districts] of Object.entries(hierarchy)) {
          for (const [district, areas] of Object.entries(districts)) {
            if (areas.includes(area)) {
              return { state, district };
            }
          }
        }
        return { state: '', district: '' };
      };

      if (isSeeker) {
        const skillsArray = seekerForm.skills.split(',').map(s => s.trim()).filter(Boolean);
        const seekerLocation = resolveArea(seekerForm.district);
        const profileData = {
          uid: user.uid,
          name: seekerForm.name,
          gender: seekerForm.gender,
          dob: seekerForm.dob,
          phone: `+91${seekerForm.phone}`,
          email: user.email || '',
          photoUrl: user.photoURL || '',
          address: seekerForm.address,
          district: seekerForm.district,
          state: seekerLocation.state,
          locationDistrict: seekerLocation.district,
          currentRole: seekerForm.currentRole,
          skills: skillsArray,
          experience: [],
          education: [],
          certifications: [],
          portfolio: [],
          isOpenToWork: true,
          profileStrength: 40,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Save seeker profiles
        await setDoc(doc(db, 'seekerProfiles', user.uid), profileData);
        await setDoc(doc(db, 'publicProfiles', user.uid), buildPublicSeekerProfile(user.uid, profileData, user));
      } else {
        // Create Company Profile
        const businessLocation = resolveArea(businessForm.location);
        const slug = await getAvailableCompanySlug(businessForm.name);
        const companyData = {
          ownerId: user.uid,
          name: businessForm.name,
          tagline: businessForm.tagline,
          category: businessForm.category,
          phone: `+91${businessForm.phone}`,
          email: businessForm.email,
          description: businessForm.description,
          location: businessForm.location,
          address: businessForm.address,
          logoUrl: businessForm.logoUrl || '',
          coverUrl: businessForm.coverUrl || '',
          coverImageUrl: businessForm.coverUrl || '',
          district: businessLocation.district,
          state: businessLocation.state,
          country: 'India',
          slug,
          portfolioPath: getCompanyPortfolioPath({ slug }),
          gallery: ['', '', '', ''],
          branches: [],
          verificationStatus: 'pending',
          verification: {
            email: user.emailVerified || false,
            gst: false,
            business: false,
          },
          isActive: true,
          isFeatured: false,
          isPremium: false,
          viewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await createDocument('companies', companyData);
      }

      // Mark user document as setupCompleted: true
      await setDoc(doc(db, 'users', user.uid), {
        setupCompleted: true,
        displayName: isSeeker ? seekerForm.name : user.displayName,
        phone: isSeeker ? `+91${seekerForm.phone}` : `+91${businessForm.phone}`,
        district: isSeeker ? seekerForm.district : businessForm.location,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Force route reload or redirect to role dashboard
      router.replace(getDashboardPathForRole(user.role));
    } catch (err: any) {
      console.error('[ProfileSetup] Submit failed:', err);
      let userFriendlyMsg = 'Failed to complete profile setup. Please try again.';
      if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) {
        userFriendlyMsg = 'Database permission error: You do not have permission to save this profile. Please make sure you are logged in and try again.';
      } else if (err.message) {
        userFriendlyMsg = err.message;
      }
      setError(userFriendlyMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 blob-bg grid-pattern font-outfit">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <Image src="/logo.png" alt="THENIJOBS Logo" width={40} height={40} className="h-10 w-10 object-contain rounded-xl" />
          <span className="font-outfit font-black text-2xl tracking-wider text-white">THENIJOBS</span>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Step {step} of {totalSteps}: {
            isSeeker 
              ? (step === 1 ? 'Personal Info' : step === 2 ? 'Contact & Area' : 'Professional Info')
              : (step === 1 ? 'Contact Details' : step === 2 ? 'Business Details' : 'Business Location')
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="glass-card py-8 px-4 shadow-2xl rounded-3xl sm:px-10 border border-white/5">
          {/* Progress Indicators */}
          <div className="flex items-center justify-between mb-8 px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                  s < step 
                    ? 'bg-emerald-500 text-white' 
                    : s === step 
                      ? 'bg-violet-600 text-white ring-4 ring-violet-500/20' 
                      : 'bg-white/5 text-gray-500'
                }`}>
                  {s < step ? <Check size={14} /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-0.5 mx-3 rounded-full ${s < step ? 'bg-emerald-500' : 'bg-white/5'}`} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-6">
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <span className="text-sm text-rose-300">{error}</span>
            </div>
          )}

          {/* STEP FIELDS */}
          <div className="space-y-6">
            {isSeeker ? (
              /* JOB SEEKER FORM */
              <>
                {step === 1 && (
                  <div className="space-y-5 animate-fade-in-up">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                          type="text"
                          required
                          value={seekerForm.name}
                          onChange={e => setSeekerForm(p => ({ ...p, name: e.target.value }))}
                          placeholder="Your full name"
                          className="search-input w-full pl-10 pr-4 py-3 text-sm bg-white/[0.02] border-white/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gender (Optional)</label>
                      <select
                        value={seekerForm.gender}
                        onChange={e => setSeekerForm(p => ({ ...p, gender: e.target.value }))}
                        className="search-input w-full px-4 py-3 text-sm bg-[#0d0d20] border-white/10"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Date of Birth (Optional)</label>
                      <input
                        type="date"
                        value={seekerForm.dob}
                        onChange={e => setSeekerForm(p => ({ ...p, dob: e.target.value }))}
                        className="search-input w-full px-4 py-3 text-sm bg-white/[0.02] border-white/10 text-white"
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5 animate-fade-in-up">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mobile Number *</label>
                      <div className="flex gap-2">
                        <div className="search-input px-3 py-3 text-sm text-gray-400 w-16 text-center rounded-xl bg-white/[0.02] border-white/10">+91</div>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            value={seekerForm.phone}
                            onChange={e => setSeekerForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                            placeholder="98765 43210"
                            className="search-input w-full pl-10 pr-4 py-3 text-sm bg-white/[0.02] border-white/10"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Town / Area in Theni (Optional)</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <select
                          value={seekerForm.district}
                          onChange={e => setSeekerForm(p => ({ ...p, district: e.target.value }))}
                          className="search-input w-full pl-10 pr-4 py-3 text-sm bg-[#0d0d20] border-white/10"
                        >
                          <option value="">Choose Town</option>
                          {allAreas.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Address (Optional)</label>
                      <input
                        type="text"
                        value={seekerForm.address}
                        onChange={e => setSeekerForm(p => ({ ...p, address: e.target.value }))}
                        placeholder="House No, Street, Ward, Village..."
                        className="search-input w-full px-4 py-3 text-sm bg-white/[0.02] border-white/10"
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5 animate-fade-in-up">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Preferred Job Role (Optional)</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                          type="text"
                          value={seekerForm.currentRole}
                          onChange={e => setSeekerForm(p => ({ ...p, currentRole: e.target.value }))}
                          placeholder="e.g. Sales Executive, Driver, Fresher..."
                          className="search-input w-full pl-10 pr-4 py-3 text-sm bg-white/[0.02] border-white/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Skills (Comma Separated) (Optional)</label>
                      <div className="relative">
                        <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                          type="text"
                          value={seekerForm.skills}
                          onChange={e => setSeekerForm(p => ({ ...p, skills: e.target.value }))}
                          placeholder="e.g. Tally, Customer Service, Driving License"
                          className="search-input w-full pl-10 pr-4 py-3 text-sm bg-white/[0.02] border-white/10"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1.5">Add skills separated by commas to help employers find you</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* EMPLOYER / BUSINESS / PROVIDER / SUPPLIER FORM */
              <>
                {step === 1 && (
                  <div className="space-y-5 animate-fade-in-up">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact Mobile Number *</label>
                      <div className="flex gap-2">
                        <div className="search-input px-3 py-3 text-sm text-gray-400 w-16 text-center rounded-xl bg-white/[0.02] border-white/10">+91</div>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            value={businessForm.phone}
                            onChange={e => setBusinessForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                            placeholder="98765 43210"
                            className="search-input w-full pl-10 pr-4 py-3 text-sm bg-white/[0.02] border-white/10"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                          type="email"
                          required
                          value={businessForm.email}
                          onChange={e => setBusinessForm(p => ({ ...p, email: e.target.value }))}
                          placeholder="contact@mybusiness.com"
                          className="search-input w-full pl-10 pr-4 py-3 text-sm bg-white/[0.02] border-white/10"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5 animate-fade-in-up">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Business / Company Name *</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                          type="text"
                          required
                          value={businessForm.name}
                          onChange={e => setBusinessForm(p => ({ ...p, name: e.target.value }))}
                          placeholder="My Company / Shop Name"
                          className="search-input w-full pl-10 pr-4 py-3 text-sm bg-white/[0.02] border-white/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Business Tagline</label>
                      <input
                        type="text"
                        value={businessForm.tagline}
                        onChange={e => setBusinessForm(p => ({ ...p, tagline: e.target.value }))}
                        placeholder="e.g. Best local organic suppliers in Theni"
                        className="search-input w-full px-4 py-3 text-sm bg-white/[0.02] border-white/10"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Business Category *</label>
                      <div className="relative">
                        <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <select
                          value={businessForm.category}
                          onChange={e => setBusinessForm(p => ({ ...p, category: e.target.value }))}
                          className="search-input w-full pl-10 pr-4 py-3 text-sm bg-[#0d0d20] border-white/10"
                        >
                          <option value="">Select Category</option>
                          {BUSINESS_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Business Description *</label>
                      <textarea
                        rows={3}
                        required
                        value={businessForm.description}
                        onChange={e => setBusinessForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Write a brief overview of your business or services..."
                        className="search-input w-full px-4 py-3 text-sm bg-white/[0.02] border-white/10 resize-none"
                      />
                    </div>

                    {/* Branding: Logo and Banner Upload */}
                    <div className="pt-3 border-t border-white/[0.06] space-y-4">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Business Branding</h4>
                      
                      {uploading && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                          <Loader2 size={12} className="text-violet-400 animate-spin" />
                          <span className="text-[10px] text-gray-300">Uploading: {uploadProgress}%</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Logo Upload Box */}
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Business Logo</label>
                          <div 
                            onClick={() => logoInputRef.current?.click()}
                            className="aspect-square rounded-2xl bg-white/[0.02] border-2 border-dashed border-white/10 hover:border-violet-500/40 hover:bg-white/[0.04] transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center p-4 text-center group"
                          >
                            <input 
                              ref={logoInputRef}
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleLogoChange}
                            />
                            {businessForm.logoUrl ? (
                              <>
                                <Image src={businessForm.logoUrl} alt="Logo Preview" fill sizes="160px" className="object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] text-white font-medium bg-black/50 px-2 py-1 rounded-lg">Change Logo</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <Building2 size={24} className="text-gray-500 mb-1 group-hover:text-violet-400 transition-colors" />
                                <span className="text-[10px] text-gray-400 font-semibold group-hover:text-gray-300">Upload Logo</span>
                                <span className="text-[8px] text-gray-500 mt-0.5">Recommended: 1:1 Square</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Banner Upload Box */}
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Cover Banner</label>
                          <div 
                            onClick={() => bannerInputRef.current?.click()}
                            className="aspect-square sm:aspect-auto sm:h-[136px] w-full rounded-2xl bg-white/[0.02] border-2 border-dashed border-white/10 hover:border-violet-500/40 hover:bg-white/[0.04] transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center p-4 text-center group"
                          >
                            <input 
                              ref={bannerInputRef}
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleBannerChange}
                            />
                            {businessForm.coverUrl ? (
                              <>
                                <Image src={businessForm.coverUrl} alt="Banner Preview" fill sizes="300px" className="object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] text-white font-medium bg-black/50 px-2 py-1 rounded-lg">Change Banner</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <Package size={24} className="text-gray-500 mb-1 group-hover:text-violet-400 transition-colors" />
                                <span className="text-[10px] text-gray-400 font-semibold group-hover:text-gray-300">Upload Cover</span>
                                <span className="text-[8px] text-gray-500 mt-0.5">Recommended: 4:1 Ratio</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5 animate-fade-in-up">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Town / Area in Theni *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <select
                          value={businessForm.location}
                          onChange={e => setBusinessForm(p => ({ ...p, location: e.target.value }))}
                          className="search-input w-full pl-10 pr-4 py-3 text-sm bg-[#0d0d20] border-white/10"
                        >
                          <option value="">Select Town/Area</option>
                          {allAreas.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Business Address *</label>
                      <input
                        type="text"
                        required
                        value={businessForm.address}
                        onChange={e => setBusinessForm(p => ({ ...p, address: e.target.value }))}
                        placeholder="Shop No, Street, Ward, Land Mark..."
                        className="search-input w-full px-4 py-3 text-sm bg-white/[0.02] border-white/10"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* BUTTON NAVIGATION */}
          <div className="mt-8 flex gap-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="btn-outline-glass px-5 py-3.5 rounded-2xl text-sm font-semibold flex items-center gap-2 hover:bg-white/5 transition-all text-white border border-white/10"
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}

            {isSeeker && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={saving}
                className="px-5 py-3.5 rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                Skip
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="flex-1 btn-gradient py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 text-white"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {step === totalSteps ? (saving ? 'Submitting...' : 'Finish Setup') : 'Continue'}
              {!saving && step < totalSteps && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>

      <ImageCropperModal
        open={showCropper}
        onClose={() => {
          setShowCropper(false);
          setCropFile(null);
          setCropType(null);
        }}
        file={cropFile}
        aspectRatio={cropType === 'logo' ? 1 : 4}
        cropWidth={cropType === 'logo' ? 400 : 1200}
        cropHeight={cropType === 'logo' ? 400 : 300}
        isCircular={cropType === 'logo'}
        title={cropType === 'logo' ? 'Crop Company Logo' : 'Crop Cover Banner'}
        uploadPath={user?.uid && cropType ? (cropType === 'logo' ? `companies/${user.uid}/logo_${Date.now()}` : `companies/${user.uid}/cover_${Date.now()}`) : undefined}
        onUploadComplete={async (url) => {
          if (!cropType) return;
          setBusinessForm(prev => ({
            ...prev,
            [cropType === 'logo' ? 'logoUrl' : 'coverUrl']: url
          }));
        }}
      />
    </div>
  );
}
