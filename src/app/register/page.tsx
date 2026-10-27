'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, Check, Briefcase, Building2,
  Loader2, User, Phone, Mail, Lock, AlertCircle, Eye, EyeOff, ShieldCheck, Sparkles
} from 'lucide-react';
import { GoogleIcon } from '@/components/ui/BrandIcons';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { UserRole } from '@/lib/types';
import AuthShell from '@/components/auth/AuthShell';
import { useDocument } from '@/hooks/useFirestore';
import { resolveAuthRedirect, getFriendlyAuthErrorMessage } from '@/lib/authRedirect';

// Only TWO allowed public registration roles as per specification
const PUBLIC_ROLES = [
  {
    id: 'job_seeker' as const,
    label: 'Job Seeker',
    subLabel: 'வேலை தேடுகிறேன்',
    desc: 'Find jobs in Theni & Tamil Nadu in minutes.',
    supportingPoints: [
      'Free for job seekers.',
      'Verified local businesses.',
      'Setup in minutes.',
    ],
    icon: Briefcase,
    bg: '#EFF6FF',
    hoverBg: '#F8FAFC',
    color: '#2563EB',
    selectedBorder: '#2563EB',
    badge: 'Job Seeker',
  },
  {
    id: 'business_owner' as const,
    label: 'Business Owner',
    subLabel: 'Business வைத்திருக்கிறேன்',
    desc: 'List your business, get leads & enquiries.',
    supportingPoints: [
      'List your business, get leads & enquiries.',
      'Direct customer calls & WhatsApp leads.',
      'Post jobs & hire local talent.',
    ],
    icon: Building2,
    bg: '#FFFBEB',
    hoverBg: '#F8FAFC',
    color: '#D97706',
    selectedBorder: '#D97706',
    badge: 'Business & Hiring',
  },
];

type PublicRoleType = 'job_seeker' | 'business_owner';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, createAccount, signInWithGoogle, error: authError, clearError } = useAuth() as any;

  // Fail-open registration feature flag
  const { data: platformPublic } = useDocument<{ features?: { registrationEnabled?: boolean } }>('platformSettings', 'public');
  const registrationEnabled = platformPublic?.features?.registrationEnabled !== false;

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<PublicRoleType>('job_seeker');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Pre-select role from URL if provided (e.g. /register?role=business_owner)
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'business_owner' || roleParam === 'employer') {
      setRole('business_owner');
    } else if (roleParam === 'job_seeker' || roleParam === 'seeker') {
      setRole('job_seeker');
    } else {
      try {
        const cached = sessionStorage.getItem('tj_reg_role');
        if (cached === 'business_owner' || cached === 'job_seeker') {
          setRole(cached);
        }
      } catch {}
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const destination = resolveAuthRedirect(user);
      router.push(destination);
    }
  }, [user, router]);

  useEffect(() => {
    clearError?.();
    setLocalError(null);
  }, [step]);

  const selectRole = (selectedRole: PublicRoleType) => {
    setRole(selectedRole);
    setLocalError(null);
    try {
      sessionStorage.setItem('tj_reg_role', selectedRole);
    } catch {}
  };

  const handleGoogleRegister = async (overrideRole?: PublicRoleType) => {
    const targetRole = overrideRole || role;
    setLoading(true);
    setLocalError(null);
    try {
      const res = await signInWithGoogle(targetRole);
      if (res && typeof res === 'object' && res.user) {
        const destination = resolveAuthRedirect(res.user);
        router.push(destination);
      }
    } catch (err: any) {
      console.error('Google register error:', err);
      setLocalError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (rawPhone: string): { valid: boolean; clean: string; error?: string } => {
    const clean = rawPhone.replace(/\D/g, '').slice(-10);
    if (!clean) {
      return { valid: false, clean: '', error: 'Mobile number is mandatory.' };
    }
    if (clean.length !== 10) {
      return { valid: false, clean, error: 'Please enter a valid 10-digit mobile number.' };
    }
    if (!/^[6-9]\d{9}$/.test(clean)) {
      return { valid: false, clean, error: 'Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.' };
    }
    return { valid: true, clean };
  };

  const next = async () => {
    setLocalError(null);

    // STEP 1 Validation: Ensure exactly one of the two allowed public roles is selected
    if (step === 1) {
      if (!role || (role !== 'job_seeker' && role !== 'business_owner')) {
        setLocalError('Please select your role (Job Seeker or Business Owner) to continue.');
        return;
      }
      // Business Owner navigates directly to /register-business per registration architecture
      if (role === 'business_owner') {
        router.push('/register-business');
        return;
      }
      setStep(2);
      return;
    }

    // STEP 2 Validation: Basic registration details
    if (step === 2) {
      // 1. Full Name check
      const trimmedName = form.name.trim();
      if (!trimmedName || trimmedName.length < 2) {
        setLocalError('Please enter your full name (at least 2 characters).');
        return;
      }

      // 2. Mobile number mandatory check
      const phoneValidation = validatePhone(form.phone);
      if (!phoneValidation.valid) {
        setLocalError(phoneValidation.error || 'Please enter a valid 10-digit mobile number.');
        return;
      }
      const cleanPhone = phoneValidation.clean;
      const normalizedPhone = `+91${cleanPhone}`;

      // 3. Email validation (Required)
      const trimmedEmail = form.email.trim().toLowerCase();
      if (!trimmedEmail) {
        setLocalError('Please enter your email address.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setLocalError('Please enter a valid email address.');
        return;
      }

      // 4. Password and Confirm Password validation
      if (!form.password) {
        setLocalError('Please create a password for your account.');
        return;
      }
      if (form.password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
      }
      if (!form.confirmPassword) {
        setLocalError('Please confirm your password.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setLocalError('Passwords do not match. Please verify your password confirmation.');
        return;
      }

      // 5. Backend role security check
      if (role !== 'job_seeker' && role !== 'business_owner') {
        setLocalError('Invalid user role selected.');
        return;
      }

      setLoading(true);

      try {
        // Duplicate check: verify that this phone number is not already registered in Firestore
        try {
          const phoneQuery = query(
            collection(db, 'users'),
            where('phone', 'in', [normalizedPhone, cleanPhone])
          );
          const phoneSnap = await getDocs(phoneQuery);
          if (!phoneSnap.empty) {
            setLocalError(`An account with mobile number +91 ${cleanPhone} already exists. Please sign in instead.`);
            setLoading(false);
            return;
          }
        } catch (phoneCheckErr) {
          // If Firestore security rules restrict unauthenticated collection queries,
          // Firebase Auth's unique email/identity constraint will reliably prevent duplicate accounts.
          console.warn('Firestore phone duplicate check restricted:', phoneCheckErr);
        }

        // Email to use for Firebase Auth: provided email or generated standard alias
        const emailToUse = trimmedEmail || `${cleanPhone}@thenijobs.com`;

        // Create account via Firebase Auth + Firestore seed
        const newUid = await createAccount(
          emailToUse,
          form.password,
          trimmedName,
          role as UserRole,
          normalizedPhone
        );

        if (newUid) {
          // Explicitly save the normalized mobile number and verified role in user doc
          await setDoc(doc(db, 'users', newUid), {
            uid: newUid,
            displayName: trimmedName,
            phone: normalizedPhone,
            email: emailToUse,
            role: role,
            isVerified: false,
            accountStatus: role === 'business_owner' ? 'pending_admin_approval' : 'active',
            subscriptionStatus: role === 'business_owner' ? 'pending_plan_selection' : 'none',
            updatedAt: serverTimestamp(),
          }, { merge: true });

          // Redirect to appropriate destination:
          // Business owners are guided to select their subscription or 15-day free trial;
          // Job seekers are routed to their personal dashboard.
          if (role === 'business_owner') {
            router.push('/pricing?registered=true&role=business_owner');
          } else {
            router.push('/seeker/dashboard');
          }
        }
      } catch (err: any) {
        console.error('Registration failed:', err);
        if (err?.code === 'auth/email-already-in-use') {
          setLocalError('An account with this mobile number or email already exists. Please sign in instead.');
        } else if (err?.code === 'auth/weak-password') {
          setLocalError('Password is too weak. Please use at least 6 characters with letters and numbers.');
        } else {
          setLocalError(err.message || 'Registration failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const activeError = localError || authError;
  const selectedRoleMeta = PUBLIC_ROLES.find(r => r.id === role) || PUBLIC_ROLES[0];

  if (!registrationEnabled) {
    return (
      <AuthShell
        eyebrow="Registration Paused"
        heading="New sign-ups are temporarily paused"
        subheading="We're not accepting new account registrations right now. Please check back soon."
        maxWidthClassName="max-w-lg"
      >
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-slate-200/60 p-8 text-center">
          <p className="text-sm text-gray-600">
            If you already have an account, you can still{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:underline">sign in</Link>.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Join THENIJOBS Free"
      heading={<>Start your <span className="text-blue-600">free</span> journey with THENIJOBS</>}
      subheading="Connect with local employers, list your business, or find jobs across Theni & Tamil Nadu."
      trustRow={['Free for job seekers', 'Verified local businesses', 'Setup in minutes']}
      maxWidthClassName="max-w-lg"
    >
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-slate-200/60 p-5 sm:p-8">
        
        {/* Step Progress Bar */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s, i) => (
            <div key={s} className="flex items-center flex-1 gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  s < step
                    ? 'bg-blue-600 text-white'
                    : s === step
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {s < step ? <Check size={14} className="stroke-[3]" /> : s}
              </div>
              <span className={`text-xs font-semibold ${s === step ? 'text-gray-900 font-bold' : 'text-slate-500'}`}>
                {s === 1 ? 'Select Role' : 'Basic Details'}
              </span>
              {i < 1 && (
                <div
                  className="flex-1 h-0.5 rounded-full transition-all"
                  style={{ background: step > 1 ? '#2563EB' : '#E5E7EB' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Validation / Auth Error Banner */}
        {activeError && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-rose-50 border border-rose-200 mb-5 animate-in fade-in duration-200">
            <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 font-medium leading-relaxed">{activeError}</p>
          </div>
        )}

        {/* ── STEP 1: Two Role Selection (Job Seeker vs Business Owner) ── */}
        {step === 1 && (
          <div>
            <div className="mb-5">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                I am a... 👋
              </h1>
              <p className="text-sm text-slate-600 font-normal">
                Select your role for a personalised experience
              </p>
            </div>

            <div className="space-y-3.5">
              {PUBLIC_ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.id;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectRole(r.id)}
                    className={`w-full min-w-0 p-4 sm:p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-600/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105"
                        style={{ background: r.bg }}
                      >
                        <Icon size={24} style={{ color: r.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="font-bold text-gray-900 text-base">{r.label}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                            {r.subLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mb-2 leading-relaxed font-normal">
                          {r.desc}
                        </p>

                        {/* Bullet supporting points */}
                        <div className="space-y-1">
                          {r.supportingPoints.map((point, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                              <Check size={12} className="text-emerald-600 shrink-0 stroke-[2.5]" />
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Radio Indicator */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 group-hover:border-gray-400'
                        }`}
                      >
                        {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 1-Click Google Sign-up with Pre-selected Role */}
            <div className="pt-4 space-y-2">
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">or 1-click register</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={() => handleGoogleRegister(role)}
                disabled={loading}
                className="w-full py-3 rounded-2xl text-xs sm:text-sm font-semibold text-gray-800 bg-white border-2 border-gray-200 flex items-center justify-center gap-2.5 hover:border-blue-300 hover:bg-blue-50/30 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <GoogleIcon size={18} />
                <span>Continue with Google as {selectedRoleMeta.label}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Basic Registration Details ── */}
        {step === 2 && (
          <div>
            <div className="mb-5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Create Account
                </h1>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  Change role
                </button>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Registering as <strong className="text-gray-900">{selectedRoleMeta.label}</strong> ({selectedRoleMeta.subLabel})
              </p>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="register-full-name" className="text-xs font-bold text-gray-700 block mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    id="register-full-name"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Mobile Number (Mandatory) */}
              <div>
                <label htmlFor="register-mobile" className="text-xs font-bold text-gray-700 block mb-1.5">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 py-2.5 bg-gray-100/80 border border-gray-200 rounded-xl text-sm text-gray-700 font-semibold whitespace-nowrap select-none">
                    🇮🇳 +91
                  </div>
                  <div className="relative flex-1">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      id="register-mobile"
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={10}
                      placeholder="93605 19460"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">10-digit Indian mobile number for account verification & updates.</p>
              </div>

              {/* Email Address (Required) */}
              <div>
                <label htmlFor="register-email" className="text-xs font-bold text-gray-700 block mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    id="register-email"
                    type="email"
                    required
                    placeholder="your.name@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Used for sign in, password recovery, and official notifications.</p>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="register-password" className="text-xs font-bold text-gray-700 block mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="register-confirm-password" className="text-xs font-bold text-gray-700 block mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Terms Note */}
              <p className="text-[11px] text-gray-500 leading-relaxed">
                By creating an account, you agree to the{' '}
                <Link href="/terms" target="_blank" className="text-blue-600 hover:underline">Terms of Service</Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</Link>.
              </p>

              {/* Divider */}
              <div className="relative flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Google 1-Click Sign-in */}
              <button
                type="button"
                onClick={() => handleGoogleRegister(role)}
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 flex items-center justify-center gap-2 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-2xs disabled:opacity-50"
              >
                <GoogleIcon size={18} /> Continue with Google
              </button>
            </div>
          </div>
        )}

        {/* Navigation / Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}

          <button
            type="button"
            onClick={next}
            disabled={(step === 1 && !role) || loading}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-95 shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>{step === 1 && role === 'business_owner' ? 'Create Account' : step === 2 ? 'Create Account' : 'Continue'}</span>
            {!loading && <ArrowRight size={16} />}
          </button>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-xs sm:text-sm text-gray-500 mt-6 pt-4 border-t border-gray-100">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 hover:underline">
            Sign In
          </Link>
        </p>

      </div>
    </AuthShell>
  );
}
