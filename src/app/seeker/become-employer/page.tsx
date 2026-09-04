'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Briefcase, CheckCircle2, Clock, AlertCircle, 
  ArrowRight, Sparkles, MapPin, Phone, Mail, FileText,
  ShieldCheck, Upload, Loader2, ArrowLeft, RefreshCw,
  Globe, Check, X, ChevronRight, MessageSquare, Plus, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, setDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';

const BUSINESS_CATEGORIES = [
  'Agriculture & Farming', 'Automobile & Transport', 'Banking & Finance',
  'Construction & Real Estate', 'Education & Training', 'Healthcare & Hospital',
  'Hotel, Food & Restaurant', 'IT, Software & Digital', 'Manufacturing & Industry',
  'Retail, Shop & Supermarket', 'Textiles & Garments', 'Security & Facility',
  'Professional & Business Services', 'General Commercial'
];

const DISTRICTS = [
  'Theni', 'Periyakulam', 'Cumbum', 'Bodinayakanur', 'Chinnamanur', 'Andipatti',
  'Uthamapalayam', 'Dindigul', 'Madurai', 'Coimbatore', 'Salem', 'Chennai', 'Other Tamil Nadu'
];

const PROOF_TYPES = [
  'MSME / Udyam Registration', 'GST Registration Certificate', 'Shop & Establishment Act License',
  'FSSAI Food License', 'Trade License / Gram Panchayat Proof', 'Individual Recruiter / Aadhaar Proof'
];

const STEPS = [
  { step: 1, label: 'Basic Info', desc: 'Name, Category & Tagline' },
  { step: 2, label: 'Contact Details', desc: 'Phone, WhatsApp & Address' },
  { step: 3, label: 'Media & Branding', desc: 'Logo, Banner & Website' },
  { step: 4, label: 'Services & Products', desc: 'Offerings & Team' },
  { step: 5, label: 'Verification Proof', desc: 'MSME/GST (Optional)' },
];

export default function BecomeEmployerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const { data: userDoc, loading: userLoading } = useDocument<any>('users', user?.uid);
  const [existingCompany, setExistingCompany] = useState<any | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [form, setForm] = useState({
    name: '',
    category: 'Retail, Shop & Supermarket',
    district: 'Theni',
    address: '',
    phone: '',
    whatsapp: '',
    email: '',
    contactPerson: '',
    designation: 'Proprietor / Owner',
    tagline: '',
    description: '',
    website: '',
    logoUrl: '',
    bannerUrl: '',
    servicesText: '',
    employeeCount: '1-10 Employees',
    proofType: 'MSME / Udyam Registration',
    proofNumber: '',
  });

  // Pre-fill contact details from logged-in user
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        contactPerson: prev.contactPerson || user.displayName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || (user as any).phoneNumber || (user as any).phone || '',
        whatsapp: prev.whatsapp || (user as any).phoneNumber || (user as any).phone || '',
      }));
    }
  }, [user]);

  // Check if company already created for this user
  useEffect(() => {
    if (!user?.uid) return;
    async function checkUserCompany() {
      try {
        const q = query(collection(db, 'companies'), where('ownerId', '==', user!.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const cData: any = { id: snap.docs[0].id, ...(snap.docs[0].data() as any) };
          setExistingCompany(cData);
          setForm(prev => ({
            ...prev,
            name: cData.name || prev.name,
            category: cData.category || prev.category,
            district: cData.district || prev.district,
            address: cData.address || prev.address,
            phone: cData.phone || prev.phone,
            whatsapp: cData.whatsapp || prev.whatsapp,
            email: cData.email || prev.email,
            description: cData.description || prev.description,
            tagline: cData.tagline || prev.tagline,
            website: cData.website || prev.website,
            logoUrl: cData.logoUrl || prev.logoUrl,
            bannerUrl: cData.bannerUrl || prev.bannerUrl,
            employeeCount: cData.employeeCount || prev.employeeCount,
            proofType: cData.proofType || prev.proofType,
            proofNumber: cData.proofNumber || prev.proofNumber,
          }));
        }
      } catch (err) {
        console.error('Error fetching company application:', err);
      } finally {
        setLoadingCompany(false);
      }
    }
    checkUserCompany();
  }, [user?.uid]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!form.name.trim()) {
        toast.warning('Please enter your Business / Company Name.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!form.phone.trim() || !form.address.trim()) {
        toast.warning('Please provide official Phone Number and Office Address.');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSkip = () => {
    if (currentStep === 5) {
      handleSubmit();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user?.uid) {
      toast.error('Please login to submit employer application.');
      return;
    }

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.warning('Please fill in Company Name, Phone, and Address.');
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const companyPayload = {
        name: form.name.trim(),
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `company-${Date.now()}`,
        category: form.category,
        district: form.district,
        address: form.address.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || form.phone.trim(),
        email: form.email.trim(),
        contactPerson: form.contactPerson.trim(),
        designation: form.designation,
        tagline: form.tagline.trim(),
        description: form.description.trim() || `Verified local business in ${form.district}, Tamil Nadu.`,
        website: form.website.trim(),
        logoUrl: form.logoUrl.trim(),
        bannerUrl: form.bannerUrl.trim(),
        services: form.servicesText.split(',').map(s => s.trim()).filter(Boolean),
        employeeCount: form.employeeCount,
        proofType: form.proofType,
        proofNumber: form.proofNumber.trim(),
        ownerId: user.uid,
        ownerEmail: user.email || '',
        verificationStatus: 'pending',
        approvalStatus: 'pending',
        isActive: false,
        isVerified: false,
        jobCount: 0,
        rating: 5.0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      let companyDocId = existingCompany?.id;

      if (existingCompany?.id) {
        await setDoc(doc(db, 'companies', existingCompany.id), companyPayload, { merge: true });
      } else {
        const newDoc = await addDoc(collection(db, 'companies'), companyPayload);
        companyDocId = newDoc.id;
      }

      // Update user doc with employerApplication metadata
      await setDoc(doc(db, 'users', user.uid), {
        employerApplication: {
          status: 'pending',
          companyId: companyDocId,
          companyName: form.name.trim(),
          submittedAt: new Date().toISOString(),
        },
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Notify admin
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        type: 'system',
        title: 'New Employer Registration Application 🏢',
        message: `"${form.name.trim()}" (${form.district}) submitted an employer verification request with full details.`,
        actionUrl: '/admin/businesses',
        read: false,
        createdAt: serverTimestamp(),
      });

      setExistingCompany({ ...companyPayload, id: companyDocId });
      toast.success('🎉 Application Submitted Successfully!', 'Admin will review and approve your business profile shortly.');
    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error('Failed to submit application', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading || loadingCompany) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center font-outfit">
        <Loader2 size={36} className="text-blue-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Checking business registration status...</p>
      </div>
    );
  }

  const applicationStatus = existingCompany?.verificationStatus || userDoc?.employerApplication?.status || 'none';

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-outfit text-gray-900 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/seeker/dashboard" className="p-2.5 rounded-2xl bg-white border border-gray-200 text-gray-700 hover:text-gray-900 transition-all shadow-xs">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              Register Your Business / Become an Employer <Briefcase size={20} className="text-blue-600" />
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Post jobs, hire local candidates in Theni &amp; showcase your products &amp; services</p>
          </div>
        </div>

        {applicationStatus === 'verified' && (
          <Link
            href="/employer/dashboard"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20"
          >
            <Building2 size={15} /> Employer Portal <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {/* STATE 1: ALREADY VERIFIED */}
      {applicationStatus === 'verified' && (
        <div className="bg-white border-2 border-emerald-300 rounded-3xl p-6 sm:p-10 text-center space-y-4 shadow-sm animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
              Verified Employer Account
            </span>
            <h2 className="text-2xl font-black text-gray-900 mt-2">{existingCompany?.name}</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-md mx-auto leading-relaxed">
              Your business profile is fully approved! You have complete access to post jobs, manage candidate applications, and dispatch interview invitations.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
            <Link
              href="/employer/post-job"
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
            >
              <Briefcase size={15} /> Post New Job Now
            </Link>
            <Link
              href="/employer/dashboard"
              className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-800 font-bold text-xs flex items-center gap-2 hover:bg-gray-200 transition-all"
            >
              <Building2 size={15} /> Employer Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* STATE 2: PENDING REVIEW */}
      {applicationStatus === 'pending' && (
        <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 sm:p-10 text-center space-y-4 shadow-sm animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
            <Clock size={32} className="animate-pulse" />
          </div>
          <div>
            <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
              Pending Admin Verification
            </span>
            <h2 className="text-2xl font-black text-gray-900 mt-2">{existingCompany?.name || 'Your Business'}</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-md mx-auto leading-relaxed">
              Your registration application has been securely submitted and is in the <strong>Admin Review Queue</strong>. Admin verification usually completes within <strong>2 to 4 hours</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 max-w-md mx-auto text-left text-xs space-y-2 text-gray-700">
            <p className="flex items-center justify-between">
              <span className="text-gray-500">Business Category:</span>
              <span className="font-bold text-gray-900">{existingCompany?.category}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-gray-500">District:</span>
              <span className="font-bold text-gray-900">{existingCompany?.district}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-gray-500">Contact Number:</span>
              <span className="font-bold text-gray-900">{existingCompany?.phone}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-gray-500">Verification Status:</span>
              <span className="font-bold text-amber-700">⏳ In Review (Notification will be sent upon approval)</span>
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setExistingCompany(null)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Edit submitted details or re-upload information
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: MULTI-STEP REGISTRATION WIZARD */}
      {(applicationStatus === 'none' || !existingCompany || existingCompany.verificationStatus === 'rejected') && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Wizard Step Progress Bar */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 sm:p-5">
            <div className="grid grid-cols-5 gap-2 text-center">
              {STEPS.map((s) => {
                const isCurrent = currentStep === s.step;
                const isDone = currentStep > s.step;
                return (
                  <div key={s.step} className="space-y-1">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full mx-auto flex items-center justify-center text-xs font-black transition-all ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isDone ? <Check size={14} /> : s.step}
                    </div>
                    <p className={`text-[10px] sm:text-xs font-bold truncate ${isCurrent ? 'text-blue-700' : 'text-gray-500'}`}>
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Form Content */}
          <form onSubmit={e => e.preventDefault()} className="p-5 sm:p-8 space-y-5">
            {/* STEP 1: BASIC INFO */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-gray-900">Step 1: Business &amp; Company Overview</h3>
                  <p className="text-xs text-gray-500">Provide official trade name and core business category</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Company / Shop / Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Theni Textiles &amp; Garments Pvt Ltd"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 font-medium outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Business Category *</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm font-bold text-gray-700 outline-none"
                    >
                      {BUSINESS_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Primary District *</label>
                    <select
                      value={form.district}
                      onChange={e => setForm({ ...form, district: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm font-bold text-gray-700 outline-none"
                    >
                      {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Tagline / Motto</label>
                  <input
                    type="text"
                    placeholder="e.g. Quality Garments &amp; Retail Manufacturing Since 2012"
                    value={form.tagline}
                    onChange={e => setForm({ ...form, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 font-medium outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Business Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your business, products, services, and workforce requirements..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 font-medium outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: CONTACT & ADDRESS */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-gray-900">Step 2: Official Contact &amp; Workplace Address</h3>
                  <p className="text-xs text-gray-500">Contact details for applicant hiring and candidate inquiries</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Primary Calling Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 93605 19460"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 font-medium outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">WhatsApp Business Number</label>
                    <input
                      type="tel"
                      placeholder="+91 93605 19460"
                      value={form.whatsapp}
                      onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 font-medium outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Official Email Address</label>
                    <input
                      type="email"
                      placeholder="info@company.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 font-medium outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      placeholder="e.g. S. Murugesan"
                      value={form.contactPerson}
                      onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 font-medium outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Complete Office / Shop Address *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Door No, Street Name, Landmark, Theni - 625531"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 font-medium outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: MEDIA & BRANDING */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-gray-900">Step 3: Media, Branding &amp; Website</h3>
                  <p className="text-xs text-gray-500">Add company logo and showroom/shop front banner images</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Logo Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={form.logoUrl}
                    onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 font-medium outline-none focus:border-blue-600"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">If empty, a stylish avatar with company initials will be auto-generated.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Banner / Shop Front Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/shop-banner.jpg"
                    value={form.bannerUrl}
                    onChange={e => setForm({ ...form, bannerUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 font-medium outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Official Website URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://mycompany.com"
                    value={form.website}
                    onChange={e => setForm({ ...form, website: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 font-medium outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: SERVICES & OFFERINGS */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-gray-900">Step 4: Services &amp; Products Catalogue</h3>
                  <p className="text-xs text-gray-500">Highlight services offered to candidates, suppliers, and clients</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Key Services / Products (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Yarn Spinning, Cotton Weaving, Fabric Dyeing, Bulk Garment Supply"
                    value={form.servicesText}
                    onChange={e => setForm({ ...form, servicesText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 font-medium outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Company Size / Workforce</label>
                  <select
                    value={form.employeeCount}
                    onChange={e => setForm({ ...form, employeeCount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm font-bold text-gray-700 outline-none"
                  >
                    <option>1-10 Employees</option>
                    <option>11-50 Employees</option>
                    <option>51-200 Employees</option>
                    <option>201-500 Employees</option>
                    <option>500+ Employees</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 5: BUSINESS PROOF & VERIFICATION */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-gray-900">Step 5: Business Verification Proof (Optional)</h3>
                  <p className="text-xs text-gray-500">Provide official registration numbers for faster instant verification (or Skip)</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Government Proof Type</label>
                    <select
                      value={form.proofType}
                      onChange={e => setForm({ ...form, proofType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm font-bold text-gray-700 outline-none"
                    >
                      {PROOF_TYPES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Proof Registration Number</label>
                    <input
                      type="text"
                      placeholder="e.g. UDYAM-TN-XX-XXXXXXX or GSTIN"
                      value={form.proofNumber}
                      onChange={e => setForm({ ...form, proofNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 font-medium outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900">
                  <ShieldCheck size={18} className="text-blue-600 mt-0.5 shrink-0" />
                  <p className="leading-relaxed font-medium">
                    Verified businesses receive the official <strong>Blue Badge</strong> and get <strong>3x more candidate applications</strong>. If you do not have documents right now, you can <strong>Skip</strong> this step and submit.
                  </p>
                </div>
              </div>
            )}

            {/* Wizard Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-2.5 px-4 rounded-2xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all cursor-pointer"
                >
                  ← Back
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                {currentStep >= 3 && currentStep <= 5 && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="py-2.5 px-4 rounded-2xl text-gray-500 hover:text-gray-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    Skip Optional Step
                  </button>
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="py-2.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Next Step</span>
                    <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={submitting}
                    className="py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    <span>{submitting ? 'Submitting Application...' : 'Submit Business Registration'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
