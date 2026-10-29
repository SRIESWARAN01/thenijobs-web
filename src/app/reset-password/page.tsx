'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
  Loader2, ArrowRight, ShieldCheck, Building2
} from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#F8FAFC]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const requestId = searchParams.get('requestId') || '';

  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [verificationError, setVerificationError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!token || !requestId) {
        setVerificationError('Invalid password reset link. Please request a new recovery link.');
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/business-recovery/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, token }),
        });
        const data = await res.json();
        if (data.valid) {
          setValid(true);
          setBusinessName(data.businessName || 'Business Account');
        } else {
          setVerificationError(data.error || 'This password reset link is invalid, expired, or has already been used.');
        }
      } catch (err) {
        console.error('Verification failed:', err);
        setVerificationError('Could not verify reset link. Please check your network connection.');
      } finally {
        setVerifying(false);
      }
    }

    verify();
  }, [token, requestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (password.length < 6) {
      setSubmitError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/business-recovery/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, token, newPassword: password }),
      });
      const data = await res.json();
      if (data.success) {
        setCompleted(true);
      } else {
        setSubmitError(data.error || 'Failed to update password. Please try again.');
      }
    } catch (err) {
      console.error('Password reset submit error:', err);
      setSubmitError('Network error while resetting password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Business Account Security"
      heading={<>Set New <span className="text-blue-600">Password</span></>}
      subheading="Create a new secure password for your verified THENIJOBS business account."
      trustRow={['256-bit SSL encryption', 'Single-use verified token', 'Zero plaintext password exposure']}
      maxWidthClassName="max-w-md"
    >
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-slate-200/60 p-[clamp(1.25rem,4dvh,2.25rem)]">
        {verifying ? (
          <div className="text-center py-10 space-y-3">
            <Loader2 size={36} className="animate-spin text-blue-600 mx-auto" />
            <p className="text-sm font-semibold text-gray-600">Verifying security token...</p>
          </div>
        ) : verificationError ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recovery Link Invalid</h2>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{verificationError}</p>
            </div>
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              Request New Recovery Link
            </Link>
          </div>
        ) : completed ? (
          <div className="text-center py-6 space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Password Reset Successful!</h2>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                Your password for <strong className="text-gray-900">{businessName}</strong> has been updated securely.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
            >
              Log In Now <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/80 border border-blue-200/60">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Building2 size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-blue-900 truncate">{businessName}</p>
                <p className="text-[11px] text-blue-700 font-medium">Verified Business Recovery</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <><ShieldCheck size={16} /> Save New Password</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
