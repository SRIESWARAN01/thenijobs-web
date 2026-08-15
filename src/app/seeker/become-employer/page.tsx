'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Briefcase, CheckCircle2, Clock, AlertCircle, 
  ArrowRight, Sparkles, MapPin, Phone, Mail, FileText,
  ShieldCheck, Upload, Loader2, ArrowLeft, RefreshCw
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

export default function BecomeEmployerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const { data: userDoc, loading: userLoading } = useDocument<any>('users', user?.uid);
  const [existingCompany, setExistingCompany] = useState<any | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    proofType: 'MSME / Udyam Registration',
    proofNumber: '',
    website: '',
    logoUrl: '',
    employeeCount: '1-10 Employees',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uid) {
      toast.error('Please login to submit employer application.');
      return;
    }

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.warning('Please fill in Company Name, Phone, and Address.');
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
        proofType: form.proofType,
        proofNumber: form.proofNumber.trim(),
        website: form.website.trim(),
        employeeCount: form.employeeCount,
        ownerId: user.uid,
        ownerEmail: user.email || '',
        verificationStatus: 'pending',
        isActive: true,
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
        title: 'New Employer Registration Application',
        message: `"${form.name.trim()}" (${form.district}) submitted an employer verification request.`,
        actionUrl: '/admin/businesses',
        read: false,
        createdAt: serverTimestamp(),
      });

      setExistingCompany({ ...companyPayload, id: companyDocId });
      toast.success('🎉 Application Submitted Successfully!', 'Admin will review and approve your business within 2-4 hours.');
    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error('Failed to submit application', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading || loadingCompany) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center font-outfit">
        <Loader2 size={36} className="text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-gray-700">Checking employer access status...</p>
      </div>
    );
  }

  const applicationStatus = existingCompany?.verificationStatus || userDoc?.employerApplication?.status || 'none';

  return (
    <div className="animate-fade-in-up space-y-6 max-w-4xl mx-auto font-outfit text-gray-900 pb-16">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/seeker/dashboard" className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-gray-900 transition-all shadow-xs">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Post a Job / Become an Employer <Briefcase size={18} className="text-blue-600" />
            </h1>
            <p className="text-xs text-gray-500">Register your business, hire talent in Theni &amp; manage applicants</p>
          </div>
        </div>

        {applicationStatus === 'verified' && (
          <Link
            href="/employer/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
          >
            <Building2 size={14} /> Open Employer Dashboard <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {/* STATE 1: ALREADY VERIFIED */}
      {applicationStatus === 'verified' && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-200 text-emerald-900 text-xs font-extrabold uppercase tracking-wider">
              Verified Employer Account
            </span>
            <h2 className="text-2xl font-black text-gray-900 mt-2">{existingCompany?.name}</h2>
            <p className="text-xs text-gray-600 mt-1 max-w-md mx-auto">
              Your business is fully approved! You have complete access to post jobs, manage candidates, and showcase products.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/employer/post-job"
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Briefcase size={15} /> Post New Job Now
            </Link>
            <Link
              href="/employer/dashboard"
              className="px-6 py-3 rounded-2xl bg-white border border-gray-300 text-gray-800 font-bold text-xs flex items-center gap-2 hover:bg-gray-50 transition-all shadow-xs"
            >
              <Building2 size={15} /> Employer Portal
            </Link>
          </div>
        </div>
      )}

      {/* STATE 2: PENDING REVIEW */}
      {applicationStatus === 'pending' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Clock size={32} className="animate-pulse" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-950 text-xs font-extrabold uppercase tracking-wider">
              Application Under Review
            </span>
            <h2 className="text-2xl font-black text-gray-900 mt-2">{existingCompany?.name || 'Your Business'}</h2>
            <p className="text-xs text-amber-950 mt-1 max-w-md mx-auto leading-relaxed">
              Your business registration has been submitted and is currently in the <strong>Admin Verification Queue</strong>. Verification usually completes within <strong>2 to 4 hours</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-amber-200 max-w-md mx-auto text-left text-xs space-y-1.5 text-gray-700">
            <p className="flex items-center justify-between">
              <span className="text-gray-500">Category:</span>
              <span className="font-bold">{existingCompany?.category}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-gray-500">District:</span>
              <span className="font-bold">{existingCompany?.district}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-gray-500">Contact Person:</span>
              <span className="font-bold">{existingCompany?.contactPerson || user?.displayName}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="font-bold text-amber-700">⏳ Pending Admin Approval</span>
            </p>
          </div>

          <p className="text-[11px] text-gray-500">
            Need urgent approval? Contact our support team at <strong className="text-gray-700">+91 93605 19460</strong>.
          </p>
        </div>
      )}

      {/* STATE 3: REJECTED (SHOW REASON & EDIT FORM) */}
      {applicationStatus === 'rejected' && (
        <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-6 text-left space-y-3 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-red-950">Application Requires Revision</h3>
              <p className="text-xs text-red-800 mt-0.5">
                {existingCompany?.rejectionReason || userDoc?.employerApplication?.rejectionReason || 'Please verify your business address and contact details and resubmit below.'}
              </p>
              <p className="text-[11px] text-red-600 mt-1 font-semibold">
                You can update your business details in the form below and click &quot;Resubmit Application&quot;.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION / UPDATE FORM */}
      {(applicationStatus === 'none' || applicationStatus === 'rejected') && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" /> Business / Employer Registration
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Fill in your business details. Your Job Seeker profile will remain active while Employer access is enabled upon approval.
            </p>
          </div>

          {/* 1. Basic Company Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">1. Business Profile</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 block mb-1">Company / Shop / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sri Krishna Textiles / Theni Tech Services / ABC Automobiles"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Industry / Category *</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none font-medium cursor-pointer"
                >
                  {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">District / Town *</label>
                <select
                  value={form.district}
                  onChange={e => setForm({ ...form, district: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none font-medium cursor-pointer"
                >
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 block mb-1">Office / Shop Full Address *</label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Door No, Street Name, Landmark, Theni - 625531"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 block mb-1">Short Tagline / Catchphrase</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={e => setForm({ ...form, tagline: e.target.value })}
                  placeholder="e.g. Leading wholesale cotton suppliers in Theni since 2010"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 block mb-1">About Company / Business Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your company services, core team, products, or what type of candidates you hire..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Authorized Contact Info */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">2. Authorized Recruiter / Contact Details</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  value={form.contactPerson}
                  onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                  placeholder="Your Name / HR Manager"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Designation</label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={e => setForm({ ...form, designation: e.target.value })}
                  placeholder="Proprietor / HR / Managing Director"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Official Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit mobile"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">WhatsApp Number (for applicant messages)</label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="WhatsApp number"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Verification Document */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">3. Business Verification Proof</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Proof Document Type</label>
                <select
                  value={form.proofType}
                  onChange={e => setForm({ ...form, proofType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                >
                  {PROOF_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Registration / Certificate / Proof Number</label>
                <input
                  type="text"
                  value={form.proofNumber}
                  onChange={e => setForm({ ...form, proofNumber: e.target.value })}
                  placeholder="e.g. UDYAM-TN-XX-XXXXXXX or GSTIN"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-blue-600" />
              <span>Admin reviews and verifies all employer accounts.</span>
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
              {applicationStatus === 'rejected' ? 'Resubmit Application' : 'Submit Employer Application'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
