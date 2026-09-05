'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Briefcase, CheckCircle2, Clock, AlertCircle,
  ArrowRight, Sparkles, MapPin, Phone, Mail, FileText,
  ShieldCheck, Upload, Loader2, ArrowLeft, Check, Lock,
  BadgePercent, Eye, ExternalLink, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, setDoc, getDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';
import { SITE_CONTACT } from '@/lib/constants';

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

export default function RegisterBusinessPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredCompanyId, setRegisteredCompanyId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: 'Retail, Shop & Supermarket',
    district: 'Theni',
    address: '',
    phone: '',
    whatsapp: '',
    email: '',
    contactPerson: '',
    designation: 'Proprietor / Managing Director',
    tagline: '',
    description: '',
    proofType: 'MSME / Udyam Registration',
    proofNumber: '',
    website: '',
    employeeCount: '1-10 Employees',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.warning('Please fill in Business Name, Phone Number, and Address.');
      return;
    }

    setSubmitting(true);
    try {
      const baseSlug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `biz-${Date.now()}`;
      
      // Prevent duplicate company registration with the same slug.
      // RULES-1 (D-SLUG): uniqueness is checked against the public `companySlugs` reservation
      // collection — other owners' pending companies are no longer readable.
      const existingSlug = await getDoc(doc(db, 'companySlugs', baseSlug));
      if (existingSlug.exists()) {
        toast.warning(`A registered business named "${form.name.trim()}" already exists. Please choose a unique name or add your location (e.g. ${form.name.trim()} ${form.district}).`);
        setSubmitting(false);
        return;
      }

      // Check if email already registered as a company owner (same reservation collection)
      if (form.email.trim()) {
        const qEmail = query(collection(db, 'companySlugs'), where('email', '==', form.email.trim().toLowerCase()));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          toast.warning(`A company with the email "${form.email.trim()}" is already registered. Please login or use a distinct business email.`);
          setSubmitting(false);
          return;
        }
      }

      const companySlug = baseSlug;
      const companyPayload = {
        name: form.name.trim(),
        slug: companySlug,
        category: form.category,
        district: form.district,
        address: form.address.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        contactPerson: form.contactPerson.trim(),
        designation: form.designation,
        tagline: form.tagline.trim(),
        description: form.description.trim() || `Verified registered business in ${form.district}, Tamil Nadu.`,
        proofType: form.proofType,
        proofNumber: form.proofNumber.trim(),
        website: form.website.trim(),
        employeeCount: form.employeeCount,
        ownerId: user?.uid || '',
        ownerEmail: user?.email || form.email.trim().toLowerCase(),
        verificationStatus: 'pending',
        isActive: false,   // RULES-1: activation is an admin decision (safeCompanyCreate); was `true`
        isVerified: false,
        jobCount: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const newDoc = await addDoc(collection(db, 'companies'), companyPayload);
      const companyDocId = newDoc.id;
      setRegisteredCompanyId(companyDocId);

      // RULES-1 (D-SLUG): reserve the slug publicly so later registrations can detect duplicates
      try {
        await setDoc(doc(db, 'companySlugs', companySlug), {
          slug: companySlug,
          email: form.email.trim().toLowerCase(),
          ownerId: user?.uid || '',
          companyId: companyDocId,
          createdAt: serverTimestamp(),
        });
      } catch (reserveErr) {
        console.warn('[register-business] slug reservation failed (registration itself succeeded):', reserveErr);
      }

      // If user is logged in, link employer application
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          employerApplication: {
            status: 'pending',
            companyId: companyDocId,
            companyName: form.name.trim(),
            submittedAt: new Date().toISOString(),
          },
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      // Notify admin
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        type: 'system',
        title: 'New Business Registration Request',
        message: `"${form.name.trim()}" (${form.district}) submitted registration. Review and verify now.`,
        actionUrl: '/admin/businesses',
        read: false,
        createdAt: serverTimestamp(),
      });

      setIsSubmitted(true);
      toast.success('🎉 Business Registration Submitted!', 'Admin will review and activate your employer access shortly.');
    } catch (err: any) {
      console.error('Business registration error:', err);
      toast.error('Registration failed', err.message || 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 font-outfit flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wider">
              Registration Under Review
            </span>
            <h1 className="text-2xl font-black text-gray-900 mt-2.5">
              Registration Received Successfully!
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
              Your business <strong>&quot;{form.name}&quot;</strong> is registered in the <strong>Admin Verification Queue</strong>. Verification usually takes <strong>2 to 4 hours</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left text-xs space-y-2 text-gray-700">
            <p className="flex justify-between">
              <span className="text-gray-500">Business Name:</span>
              <span className="font-bold text-gray-900">{form.name}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">Location:</span>
              <span className="font-bold text-gray-900">{form.district}, Tamil Nadu</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">Contact Number:</span>
              <span className="font-mono font-bold text-gray-900">{form.phone}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">Current Status:</span>
              <span className="font-bold text-amber-700">⏳ Pending Verification</span>
            </p>
          </div>

          <p className="text-xs text-gray-500">
            Once approved, you will receive WhatsApp/SMS confirmation and full Employer Portal &amp; Job Posting access.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/"
              className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md text-center"
            >
              Back to Home
            </Link>
            {user ? (
              <Link
                href="/seeker/become-employer"
                className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md text-center"
              >
                Track Status in Seeker Portal
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md text-center"
              >
                Login to Your Account
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 font-outfit text-gray-900">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Theni District Business Network
            </span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-blue-900/40">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              <Building2 size={13} /> Official Business Onboarding
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Register Your Business on THENIJOBS
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Showcase your enterprise across Theni District, hire qualified local talent, display products &amp; services, and get direct customer WhatsApp enquiries.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Section 1: Business Identity */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <Building2 size={16} className="text-blue-600" /> 1. Business Identity &amp; Category
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="register-business-registered-business-name" className="text-xs font-bold text-gray-700 block mb-1">Registered Business Name *</label>
                <input id="register-business-registered-business-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sri Murugan Textiles / Theni Fresh Spices"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label htmlFor="register-business-industry-category" className="text-xs font-bold text-gray-700 block mb-1">Industry / Category *</label>
                <select id="register-business-industry-category"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600 bg-white"
                >
                  {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="register-business-district-region" className="text-xs font-bold text-gray-700 block mb-1">District / Region *</label>
                <select id="register-business-district-region"
                  value={form.district}
                  onChange={e => setForm({ ...form, district: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600 bg-white"
                >
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="register-business-employee-team-size" className="text-xs font-bold text-gray-700 block mb-1">Employee Team Size</label>
                <select id="register-business-employee-team-size"
                  value={form.employeeCount}
                  onChange={e => setForm({ ...form, employeeCount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600 bg-white"
                >
                  <option>1-5 Employees</option>
                  <option>5-15 Employees</option>
                  <option>15-50 Employees</option>
                  <option>50-200 Employees</option>
                  <option>200+ Enterprise</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="register-business-complete-business-address" className="text-xs font-bold text-gray-700 block mb-1">Complete Business Address *</label>
                <textarea id="register-business-complete-business-address"
                  rows={2}
                  required
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Door No, Street Name, Landmark, Town/City, Pincode"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Official Verification */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <Phone size={16} className="text-blue-600" /> 2. Contact Details &amp; Representative
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="register-business-owner-contact-person" className="text-xs font-bold text-gray-700 block mb-1">Owner / Contact Person *</label>
                <input id="register-business-owner-contact-person"
                  type="text"
                  required
                  value={form.contactPerson}
                  onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                  placeholder="e.g. S. Ramasamy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label htmlFor="register-business-designation" className="text-xs font-bold text-gray-700 block mb-1">Designation</label>
                <input id="register-business-designation"
                  type="text"
                  value={form.designation}
                  onChange={e => setForm({ ...form, designation: e.target.value })}
                  placeholder="Proprietor / HR Manager / Founder"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label htmlFor="register-business-primary-calling-phone" className="text-xs font-bold text-gray-700 block mb-1">Primary Calling Phone *</label>
                <input id="register-business-primary-calling-phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 93605 19460"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600 font-mono"
                />
              </div>
              <div>
                <label htmlFor="register-business-business-whatsapp-number" className="text-xs font-bold text-gray-700 block mb-1">Business WhatsApp Number</label>
                <input id="register-business-business-whatsapp-number"
                  type="tel"
                  value={form.whatsapp}
                  onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+91 70948 26886"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600 font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="register-business-official-email-address" className="text-xs font-bold text-gray-700 block mb-1">Official Email Address</label>
                <input id="register-business-official-email-address"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@yourbusiness.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Verification Proof & Additional Info */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <ShieldCheck size={16} className="text-blue-600" /> 3. Verification &amp; Business Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="register-business-business-proof-type" className="text-xs font-bold text-gray-700 block mb-1">Business Proof Type</label>
                <select id="register-business-business-proof-type"
                  value={form.proofType}
                  onChange={e => setForm({ ...form, proofType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600 bg-white"
                >
                  {PROOF_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="register-business-proof-registration-number" className="text-xs font-bold text-gray-700 block mb-1">Proof / Registration Number</label>
                <input id="register-business-proof-registration-number"
                  type="text"
                  value={form.proofNumber}
                  onChange={e => setForm({ ...form, proofNumber: e.target.value })}
                  placeholder="e.g. UDYAM-TN-24-000000 / GSTIN"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600 font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="register-business-business-website-or-facebook-instagram-p" className="text-xs font-bold text-gray-700 block mb-1">Business Website or Facebook/Instagram Page (Optional)</label>
                <input id="register-business-business-website-or-facebook-instagram-p"
                  type="url"
                  value={form.website}
                  onChange={e => setForm({ ...form, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="register-business-brief-description-products-and-services-" className="text-xs font-bold text-gray-700 block mb-1">Brief Description / Products &amp; Services Scope</label>
                <textarea id="register-business-brief-description-products-and-services-"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what your business does, key products/services, and recruiting requirements..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-base sm:text-xs text-gray-900 font-medium outline-none focus:border-blue-600 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-gray-500 max-w-sm">
              By submitting, you agree to THENIJOBS Terms &amp; Conditions. Admin verifies each business within 2-4 hours.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
              <span>Submit Business for Verification</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
