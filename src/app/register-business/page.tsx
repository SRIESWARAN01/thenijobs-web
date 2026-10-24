'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Clock, AlertCircle, ArrowRight, ShieldCheck,
  Loader2, Check, Lock, Eye, EyeOff, User, Phone, Mail,
  LogOut, RefreshCw, CheckCircle2, XCircle, MessageCircle,
  CreditCard, Sparkles, Zap, Shield, Star, Award
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth, db } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';
import AuthShell from '@/components/auth/AuthShell';
import { SUBSCRIPTION_PLANS, SITE_CONTACT } from '@/lib/constants';
import PaymentCheckoutModal, { PlanDetails } from '@/components/payment/PaymentCheckoutModal';

export default function RegisterBusinessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { user, refreshUserProfile, loading: authLoading } = useAuth() as any;

  // Step state: auto-detect from query param or user state
  const stepParam = searchParams.get('step');
  const [forcePlanStep, setForcePlanStep] = useState(stepParam === 'plan');

  // Form State (Step 1)
  const [form, setForm] = useState({
    fullName: '',
    countryCode: '+91',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status check & trial loading states
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);

  // Payment checkout modal state
  const [checkoutPlan, setCheckoutPlan] = useState<PlanDetails | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // If already logged in and approved, redirect to dashboard
  useEffect(() => {
    if (user && user.role === 'business_owner') {
      if (user.approvalStatus === 'approved' || user.accountStatus === 'active') {
        router.push('/employer/dashboard');
      }
    }
  }, [user, router]);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Check Approval Status manually
  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.approvalStatus === 'approved' || data.accountStatus === 'active') {
            toast.success('Your account has been approved! Redirecting to Dashboard...');
            await refreshUserProfile?.();
            router.push('/employer/dashboard');
            return;
          } else if (data.approvalStatus === 'rejected') {
            toast.error('Your registration was not approved. See details below.');
            await refreshUserProfile?.();
            return;
          }
        }
      }
      toast.info('Your registration is still under review by Admin. Please check back shortly.');
    } catch (err: any) {
      console.error('Status check error:', err);
      toast.error('Failed to refresh status. Please try again.');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Sign out handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Step 1: Submit Registration Form
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Full Name Validation
    const trimmedName = form.fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    // 2. Email Validation
    const trimmedEmail = form.email.toLowerCase().trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    // 3. Mobile Number Validation (Optional, but if given, validate 10 digits)
    const cleanPhone = form.mobileNumber.replace(/\D/g, '').slice(-10);
    if (form.mobileNumber.trim() && cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number, or leave it blank.');
      return;
    }

    // 4. Password Validation
    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Firebase Authentication Account
      const userCred = await createUserWithEmailAndPassword(auth, trimmedEmail, form.password);
      const fbUser = userCred.user;

      // 2. Update Firebase Display Name
      await updateProfile(fbUser, { displayName: trimmedName });

      // 3. Create Firestore User Document with Initial State
      const newUserDoc = {
        uid: fbUser.uid,
        fullName: trimmedName,
        displayName: trimmedName,
        email: trimmedEmail,
        phone: cleanPhone ? `+91${cleanPhone}` : '',
        mobileNumber: cleanPhone || '',
        countryCode: '+91',
        role: 'business_owner',
        approvalStatus: 'pending',
        accountStatus: 'pending_approval',
        subscriptionStatus: 'plan_not_selected',
        selectedPlan: '',
        paymentStatus: 'unpaid',
        isEmployer: true,
        canPostJobs: false,
        isVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', fbUser.uid), newUserDoc);

      // Force refresh user profile state
      await refreshUserProfile?.();

      toast.success('Account created successfully! Please select your plan or start the 15-day free trial.');
      setForcePlanStep(true);
    } catch (err: any) {
      console.error('Business Owner Registration failed:', err);
      if (err?.code === 'auth/email-already-in-use') {
        setError('An account with this email address already exists. Please sign in instead.');
      } else if (err?.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters with mixed characters.');
      } else if (err?.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else {
        setError(err?.message || 'Registration failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Request 15-Day Free Trial
  const handleRequestFreeTrial = async () => {
    setTrialLoading(true);
    try {
      const uid = auth.currentUser?.uid || user?.uid;
      const res = await fetch('/api/subscription/request-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request free trial.');
      }
      toast.success('15-Day Free Trial requested! Your account is now waiting for Admin approval.');
      await refreshUserProfile?.();
      setForcePlanStep(false);
    } catch (err: any) {
      console.error('Free trial request error:', err);
      toast.error(err.message || 'Failed to request free trial. Please try again.');
    } finally {
      setTrialLoading(false);
    }
  };

  // Step 2: Open Payment Checkout for Paid Plan
  const handleOpenCheckout = (plan: (typeof SUBSCRIPTION_PLANS)[number]) => {
    setCheckoutPlan({
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      dailyEquivalent: plan.dailyEquivalent,
      monthlyEquivalent: plan.monthlyEquivalent,
      features: plan.features,
      badge: plan.badge,
    });
    setIsCheckoutOpen(true);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW LOGIC
  // ───────────────────────────────────────────────────────────────────────────

  // Determine current screen state
  const isBusinessOwner = user && user.role === 'business_owner';
  const hasSelectedPlan = user?.selectedPlan || user?.trialRequested || user?.paymentStatus === 'paid';
  const shouldShowPlanSelection = isBusinessOwner && (forcePlanStep || !hasSelectedPlan);

  // ── SCREEN A: REJECTION SCREEN ─────────────────────────────────────────────
  if (isBusinessOwner && (user.approvalStatus === 'rejected' || user.accountStatus === 'rejected')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-outfit">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-red-200 shadow-xl p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-inner">
            <XCircle size={32} />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider">
              <AlertCircle size={12} /> Registration Requires Revision
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
              Registration Not Approved
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Your business registration was reviewed by THENIJOBS Admin and requires changes before access can be granted.
            </p>
          </div>

          {/* Rejection Details Box */}
          <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 text-left space-y-2">
            <p className="text-xs font-bold text-red-900 uppercase tracking-wide flex items-center gap-1.5">
              <AlertCircle size={14} className="text-red-600" />
              Reason for Revision
            </p>
            <p className="text-xs text-red-800 font-medium bg-white p-3 rounded-xl border border-red-100 leading-relaxed whitespace-pre-wrap">
              {user.rejectionReason || 'Registration details could not be verified. Please provide official business documentation.'}
            </p>
          </div>

          {/* Account Details */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Applicant Name</span>
              <span className="font-bold text-slate-900">{user.fullName || user.displayName || 'Business Owner'}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Registered Email</span>
              <span className="font-bold text-slate-900">{user.email}</span>
            </div>
            {(user.mobileNumber || user.phone) && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Mobile</span>
                <span className="font-bold text-slate-900">{user.mobileNumber ? `+91 ${user.mobileNumber}` : user.phone}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <a
              href={`https://wa.me/${SITE_CONTACT.whatsapp}?text=${encodeURIComponent(`Hi THENIJOBS Admin, my business account registration was not approved (${user.email}). Rejection reason: ${user.rejectionReason || 'Details required'}. I would like to resolve this.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <MessageCircle size={16} />
              <span>Contact Admin on WhatsApp (+91 93605 19460)</span>
            </a>

            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {checkingStatus ? (
                <>
                  <Loader2 size={14} className="animate-spin text-slate-500" />
                  <span>Checking Status...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={14} className="text-slate-500" />
                  <span>Check Approval Status</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 mx-auto text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-1 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN B: PAYMENT SUCCESSFUL – WAITING FOR ADMIN APPROVAL ─────────────
  if (isBusinessOwner && user.paymentStatus === 'paid' && user.approvalStatus !== 'approved' && !forcePlanStep) {
    const formattedDate = user.createdAt
      ? new Date(user.createdAt?.seconds ? user.createdAt.seconds * 1000 : user.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const selectedPlanMeta = SUBSCRIPTION_PLANS.find(p => p.slug === (user.subscriptionPlan || user.selectedPlan)) || SUBSCRIPTION_PLANS[1];

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-outfit">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-emerald-200 shadow-xl p-6 sm:p-8 text-center space-y-6">
          {/* Status Icon */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={34} />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <span>💳</span> Payment Verified • Waiting for Admin Approval
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
              Payment Successful – Waiting for Admin Approval
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Your payment for the <strong>{selectedPlanMeta.name} Plan</strong> has been confirmed and verified. Your business account is currently waiting for Admin approval before Dashboard access is unlocked.
            </p>
          </div>

          {/* Payment & Account Dossier */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Payment Status</span>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check size={12} strokeWidth={3} /> Paid &amp; Verified
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Selected Plan</span>
              <span className="font-bold text-slate-900">
                {selectedPlanMeta.name} Plan (₹{selectedPlanMeta.price.toLocaleString('en-IN')}/year)
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Approval Status</span>
              <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Pending Admin Review
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Business Owner</span>
              <span className="font-bold text-slate-900">{user.fullName || user.displayName || 'Business Owner'}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Registered Email</span>
              <span className="font-bold text-slate-900">{user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Submission Date</span>
              <span className="font-bold text-slate-900">{formattedDate}</span>
            </div>
          </div>

          {/* Notice Box */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-left space-y-2 text-xs text-emerald-950">
            <p className="font-bold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              What Happens Next?
            </p>
            <ul className="space-y-1 text-emerald-800 text-[11px]">
              <li>✓ Admin verifies your registered business details.</li>
              <li>✓ Full 1-year annual subscription activates from approval date.</li>
              <li>✓ Your company profile, job postings, and customer leads unlock immediately.</li>
            </ul>
            <p className="text-[11px] text-emerald-700 pt-1 border-t border-emerald-200">
              Typically reviewed and activated within 2–4 hours on business days.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {checkingStatus ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Checking Status...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>Check Approval Status</span>
                </>
              )}
            </button>

            <a
              href={`https://wa.me/${SITE_CONTACT.whatsapp}?text=${encodeURIComponent(`Hi THENIJOBS Admin, I completed payment of ₹${selectedPlanMeta.price} for the ${selectedPlanMeta.name} Plan (${user.email}). Please review and approve my business account.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle size={15} className="text-emerald-600" />
              <span>Contact Admin on WhatsApp (+91 93605 19460)</span>
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 mx-auto text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-1 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN C: 15-DAY FREE TRIAL SELECTED – WAITING FOR ADMIN APPROVAL ──────
  if (isBusinessOwner && (user.selectedPlan === 'trial' || user.trialRequested) && user.approvalStatus !== 'approved' && !forcePlanStep) {
    const formattedDate = user.createdAt
      ? new Date(user.createdAt?.seconds ? user.createdAt.seconds * 1000 : user.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-outfit">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-amber-200 shadow-xl p-6 sm:p-8 text-center space-y-6">
          {/* Status Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Clock size={32} />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <Clock size={12} /> 15-Day Free Trial • Pending Admin Approval
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
              Your 15-Day Free Trial Is Waiting for Admin Approval
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Thank you for registering with THENIJOBS. Your 15-day free trial request has been submitted successfully and is waiting for Admin approval. <strong>No payment is required.</strong>
            </p>
          </div>

          {/* Submitted Information Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Selected Option</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                15-Day Free Trial (Standard Plan)
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Payment Status</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                No Payment Required (₹0)
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Approval Status</span>
              <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Pending Admin Review
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Business Owner</span>
              <span className="font-bold text-slate-900">{user.fullName || user.displayName || 'Business Owner'}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Registered Email</span>
              <span className="font-bold text-slate-900">{user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Submitted On</span>
              <span className="font-bold text-slate-900">{formattedDate}</span>
            </div>
          </div>

          {/* Trial Duration Rule */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-left space-y-2 text-xs text-amber-950">
            <p className="font-bold text-amber-900 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-600" />
              Trial Activation Rules:
            </p>
            <ul className="space-y-1 text-amber-800 text-[11px]">
              <li>✓ The trial does not start today — it starts <strong>only after Admin approval</strong>.</li>
              <li>✓ You get <strong>exactly 15 days</strong> of Standard plan features (10 jobs, 20 products, 10 services).</li>
              <li>✓ Upgrade to an annual plan anytime without losing your business data.</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {checkingStatus ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Checking Status...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>Check Approval Status</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setForcePlanStep(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Zap size={14} className="text-indigo-600" />
              <span>Upgrade to Annual Paid Plan Instead</span>
            </button>

            <a
              href={`https://wa.me/${SITE_CONTACT.whatsapp}?text=${encodeURIComponent(`Hi THENIJOBS Admin, I requested the 15-day Free Trial for my business account (${user.email}). Please review and approve my account.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle size={15} className="text-emerald-600" />
              <span>Contact Admin on WhatsApp (+91 93605 19460)</span>
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 mx-auto text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-1 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN D: STEP 2 – PLAN SELECTION & PAYMENT PAGE ───────────────────────
  if (shouldShowPlanSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-100 py-10 px-4 font-outfit">
        <div className="max-w-6xl w-full mx-auto space-y-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold uppercase tracking-wider">
              Step 2 of 2: Select Your Subscription Plan
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Choose Your Plan or Start Free Trial
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Welcome, <strong>{user.fullName || user.displayName || user.email}</strong>! Select the 15-Day Free Trial to try THENIJOBS with zero payment, or choose an annual subscription to get priority leads and hiring capabilities.
            </p>
          </div>

          {/* Option 1: 15-DAY FREE TRIAL BANNER (Distinct & Prominent) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-1 shadow-xl">
            <div className="rounded-[22px] bg-white p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-center lg:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold uppercase tracking-wide">
                  <Sparkles size={13} className="text-amber-600" />
                  <span>Zero Payment Required</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                  Start 15 Days Free Trial
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-xl leading-relaxed">
                  Try THENIJOBS for 15 days. No payment required to start your trial. Admin approval is required. Experience Standard plan features (10 active job postings, 20 products, 10 services, company landing website).
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-gray-700 pt-1">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <Check size={14} className="text-emerald-600" strokeWidth={3} /> 15 Days Free
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <Check size={14} className="text-emerald-600" strokeWidth={3} /> No Payment Required
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-800">
                    <Clock size={14} className="text-amber-600" /> Trial Starts After Admin Approval
                  </span>
                </div>
              </div>

              <div className="shrink-0 w-full lg:w-auto text-center">
                <button
                  type="button"
                  onClick={handleRequestFreeTrial}
                  disabled={trialLoading}
                  className="w-full lg:w-auto px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
                >
                  {trialLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-slate-950" />
                      <span>Requesting Trial...</span>
                    </>
                  ) : (
                    <>
                      <span>Start 15-Day Free Trial</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-gray-400 mt-2 font-medium">Admin verification required before activation</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              Or Choose an Annual Paid Plan (Instant Priority)
            </span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          {/* Option 2: 4 ANNUAL PAID PLANS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isPopular = plan.recommended || plan.slug === 'standard';

              return (
                <div
                  key={plan.slug}
                  className={`rounded-3xl p-5 sm:p-6 border transition-all flex flex-col justify-between relative bg-white ${
                    isPopular
                      ? 'border-blue-600 ring-2 ring-blue-600/30 shadow-xl -translate-y-1'
                      : 'border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {plan.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs whitespace-nowrap ${
                      isPopular ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
                    }`}>
                      {plan.badge}
                    </span>
                  )}

                  <div className="space-y-4">
                    <div className="text-center pt-2">
                      <h3 className="text-lg font-black text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{plan.bestFor}</p>
                    </div>

                    <div className={`text-center py-3 rounded-2xl border ${isPopular ? 'bg-blue-50/70 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="text-2xl sm:text-3xl font-black text-gray-900">
                        ₹{plan.price.toLocaleString('en-IN')}
                        <span className="text-xs text-gray-500 font-normal"> /yr</span>
                      </div>
                      <div className="text-xs font-semibold text-emerald-600 mt-0.5">
                        ~₹{plan.dailyEquivalent}/day <span className="text-gray-400 font-normal">(₹{plan.monthlyEquivalent}/mo)</span>
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-gray-600 pt-1">
                      {plan.features.slice(0, 6).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                          <span className="line-clamp-2">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-5 mt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(plan)}
                      className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.02] ${
                        isPopular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <CreditCard size={14} />
                      <span>Choose &amp; Pay ₹{plan.price.toLocaleString('en-IN')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 text-xs text-gray-500">
            <p>
              🔒 Payments processed securely via Razorpay (UPI, Credit/Debit Cards, Net Banking).
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-bold cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Embedded Checkout Modal */}
        {checkoutPlan && (
          <PaymentCheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            plan={checkoutPlan}
            companyName={user.fullName || user.displayName || 'Business Owner'}
            companyPhone={user.mobileNumber || user.phone}
            onSuccess={async () => {
              setIsCheckoutOpen(false);
              toast.success('Payment verified! Your account is now pending Admin approval.');
              await refreshUserProfile?.();
              setForcePlanStep(false);
            }}
          />
        )}
      </div>
    );
  }

  // ── SCREEN E: STEP 1 – REGISTRATION FORM ───────────────────────────────────
  return (
    <AuthShell
      eyebrow="BUSINESS OWNER REGISTRATION"
      heading={
        <>
          Grow your <span className="text-blue-600">business</span> in Theni
        </>
      }
      subheading="Register your company, list products &amp; services, post vacancies, and receive direct enquiries from across Theni district."
      maxWidthClassName="max-w-lg"
    >
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Create Account</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Fill in your basic details to get started</p>
      </div>

      <form onSubmit={handleSubmitRegistration} className="space-y-4">
        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User size={16} />
            </div>
            <input
              type="text"
              name="fullName"
              required
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. Ramesh Kumar"
              className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Mobile Number <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <div className="relative flex">
            <div className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-gray-600 text-xs font-bold select-none">
              🇮🇳 +91
            </div>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Phone size={15} />
              </div>
              <input
                type="tel"
                name="mobileNumber"
                maxLength={10}
                value={form.mobileNumber}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Mail size={16} />
            </div>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="name@company.com"
              className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Lock size={16} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Lock size={16} />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin text-white" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Continue to Plan Selection</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Sign in redirect */}
        <div className="text-center pt-2 text-xs text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700">
            Sign In
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
