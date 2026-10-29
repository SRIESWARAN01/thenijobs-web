'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Loader2, CheckCircle, Mail, ArrowLeft,
  Building2, Phone, ShieldCheck, AlertCircle, Copy, Check
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import AuthShell from '@/components/auth/AuthShell';
import { getEligibleBusinessesPublicList } from '@/lib/business/businessConstants';

const ELIGIBLE_BUSINESSES = getEligibleBusinessesPublicList();

export default function ForgotPasswordPage() {
  const [activeTab, setActiveTab] = useState<'business' | 'general'>('business');

  // Business recovery form state
  const [businessId, setBusinessId] = useState(ELIGIBLE_BUSINESSES[0].id);
  const [registeredMobile, setRegisteredMobile] = useState('');
  const [requesterMobile, setRequesterMobile] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [businessSubmitting, setBusinessSubmitting] = useState(false);
  const [businessError, setBusinessError] = useState('');
  const [businessResult, setBusinessResult] = useState<{
    referenceId: string;
    message: string;
  } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // General recovery form state
  const [generalEmail, setGeneralEmail] = useState('');
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalSent, setGeneralSent] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessError('');
    setBusinessSubmitting(true);

    try {
      const res = await fetch('/api/auth/business-recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          registeredMobile,
          requesterMobile,
          registeredEmail: registeredEmail.trim() || undefined,
        }),
      });

      let data: any = {};
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      if (data.success) {
        setBusinessResult({
          referenceId: data.referenceId,
          message: data.message,
        });
      } else {
        setBusinessError(data.error || 'Failed to submit recovery request. Please try again.');
      }
    } catch (err) {
      console.error('Recovery request error:', err);
      setBusinessError('A network error occurred. Please check your connection and try again.');
    } finally {
      setBusinessSubmitting(false);
    }
  };

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralLoading(true);
    setGeneralError('');
    try {
      await sendPasswordResetEmail(auth, generalEmail.trim());
      setGeneralSent(true);
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        setGeneralSent(true);
      } else {
        console.error('Password reset error:', err);
        setGeneralError('Could not send the reset email right now. Please try again in a moment.');
      }
    } finally {
      setGeneralLoading(false);
    }
  };

  const copyRefToClipboard = () => {
    if (businessResult?.referenceId) {
      navigator.clipboard.writeText(businessResult.referenceId);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  return (
    <AuthShell
      eyebrow="Account Recovery"
      heading={<>Get back into your <span className="text-blue-600">account</span></>}
      subheading="Recover access to your verified THENIJOBS business or candidate account securely."
      trustRow={['Authorized admin verification', 'Anti-account enumeration protection', 'Zero plaintext password exposure']}
      maxWidthClassName="max-w-lg"
    >
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-slate-200/60 p-[clamp(1.25rem,4dvh,2.25rem)]">
        {/* Portal Recovery Mode Switcher */}
        <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('business'); setBusinessError(''); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'business'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 size={14} />
            Business Account
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('general'); setGeneralError(''); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail size={14} />
            Job Seeker / General
          </button>
        </div>

        {activeTab === 'business' ? (
          /* ── Eligible Business Account Recovery ── */
          businessResult ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
                <CheckCircle size={32} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Recovery Request Submitted
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed px-2">
                  {businessResult.message}
                </p>
              </div>

              {/* Reference ID Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Request Reference ID</span>
                  <button
                    type="button"
                    onClick={copyRefToClipboard}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                  >
                    {copiedRef ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    {copiedRef ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-base sm:text-lg font-mono font-black text-slate-900 tracking-wider">
                  {businessResult.referenceId}
                </p>
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-amber-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Status: Pending Administrator Identity Verification
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Return to Sign In <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="text-center mb-2">
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Business Account Recovery
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Select your registered business and provide verified contact details for administrative review.
                </p>
              </div>

              <form onSubmit={handleBusinessSubmit} className="space-y-3.5 text-left">
                {/* 1. Business Name Dropdown */}
                <div>
                  <label htmlFor="business-name-select" className="text-xs text-gray-700 font-semibold block mb-1">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="business-name-select"
                      required
                      value={businessId}
                      onChange={(e) => setBusinessId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all cursor-pointer appearance-none"
                    >
                      {ELIGIBLE_BUSINESSES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} — {b.taluk}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      ▼
                    </div>
                  </div>
                </div>

                {/* 2. Registered Business Mobile Number */}
                <div>
                  <label htmlFor="reg-mobile-input" className="text-xs text-gray-700 font-semibold block mb-1">
                    Registered Business Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 text-xs font-bold border-r border-gray-300 pr-2">
                      <Phone size={13} className="text-gray-400" />
                      <span>+91</span>
                    </div>
                    <input
                      id="reg-mobile-input"
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit registered number"
                      value={registeredMobile}
                      onChange={(e) => setRegisteredMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-20 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Must match previously registered business contact.</p>
                </div>

                {/* 3. Requester's Contact Mobile Number */}
                <div>
                  <label htmlFor="req-mobile-input" className="text-xs text-gray-700 font-semibold block mb-1">
                    Requester&apos;s Contact Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 text-xs font-bold border-r border-gray-300 pr-2">
                      <Phone size={13} className="text-gray-400" />
                      <span>+91</span>
                    </div>
                    <input
                      id="req-mobile-input"
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="Your active mobile number"
                      value={requesterMobile}
                      onChange={(e) => setRequesterMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-20 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Number where our admin can reach you to verify request.</p>
                </div>

                {/* 4. Optional Registered Business Email */}
                <div>
                  <label htmlFor="reg-email-input" className="text-xs text-gray-700 font-semibold block mb-1">
                    Registered Business Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="reg-email-input"
                      type="email"
                      placeholder="business@example.com (if known)"
                      value={registeredEmail}
                      onChange={(e) => setRegisteredEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {businessError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                    <span>{businessError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={businessSubmitting}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {businessSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={16} /> Submit Recovery Request
                    </>
                  )}
                </button>
              </form>
            </div>
          )
        ) : (
          /* ── Standard Candidate / General User Email Reset ── */
          !generalSent ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="text-center mb-2">
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Candidate Password Reset
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your registered personal email address to receive a secure password reset link.
                </p>
              </div>

              <form onSubmit={handleGeneralSubmit} className="space-y-4 text-left">
                <div>
                  <label htmlFor="general-email-input" className="text-xs text-gray-700 font-semibold block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="general-email-input"
                      type="email"
                      required
                      value={generalEmail}
                      onChange={(e) => setGeneralEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {generalError && <p className="text-xs font-semibold text-rose-600">{generalError}</p>}

                <button
                  type="submit"
                  disabled={generalLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {generalLoading ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} /> Send Reset Link</>}
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <CheckCircle size={40} className="text-emerald-500 mx-auto" />
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Reset Email Sent!
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                If an account exists for <span className="text-gray-900 font-semibold">{generalEmail}</span>, a secure password reset link has been dispatched. Please check your inbox and spam folder.
              </p>
              <button
                type="button"
                onClick={() => { setGeneralSent(false); setGeneralEmail(''); }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <ArrowLeft size={13} /> Try another email
              </button>
            </div>
          )
        )}

        <p className="text-center text-xs sm:text-sm text-gray-600 mt-6 pt-4 border-t border-gray-100">
          Remember your password?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
