'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, Check, Briefcase, Building2,
  Package, Wrench, Users, Loader2, User, Phone, Mail, Lock, AlertCircle,
  Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/types';
import { getDashboardPathForRole } from '@/lib/access';
import { mapAuthError } from '@/lib/firebase/authErrors';


const ROLES = [
  { id: 'job_seeker', label: 'Job Seeker', subLabel: 'வேலை தேடுகிறேன்', icon: Briefcase, desc: 'Find jobs, build resume, track applications', color: 'violet' },
  { id: 'business', label: 'Business', subLabel: 'Business நடத்துகிறேன்', icon: Building2, desc: 'Post jobs, manage products, offer services, generate leads — all in one', color: 'emerald' },
];

const colorMap: Record<string, string> = {
  violet: 'border-violet-500 bg-violet-500/10',
  cyan: 'border-cyan-500 bg-cyan-500/10',
  emerald: 'border-emerald-500 bg-emerald-500/10',
  amber: 'border-amber-500 bg-amber-500/10',
  rose: 'border-rose-500 bg-rose-500/10',
};

const iconColorMap: Record<string, string> = {
  violet: 'text-violet-400', cyan: 'text-cyan-400',
  emerald: 'text-emerald-400', amber: 'text-amber-400', rose: 'text-rose-400',
};

const iconTintMap: Record<string, string> = {
  violet: 'bg-violet-500/20',
  cyan: 'bg-cyan-500/20',
  emerald: 'bg-emerald-500/20',
  amber: 'bg-amber-500/20',
  rose: 'bg-rose-500/20',
};

export default function RegisterPage() {
  const router = useRouter();
  const { user, createAccount, signInWithGoogle, error: authError, clearError } = useAuth();
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const totalSteps = 2;

  // Redirect automatically on login / registration success
  useEffect(() => {
    if (user) {
      router.replace(getDashboardPathForRole(user.role));
    }
  }, [user, router]);

  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [step, clearError]);

  const next = async () => {
    setLocalError(null);
    if (step === 1) {
      if (!role) {
        setLocalError('Please select a role to continue.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!form.name || !form.email || !form.password || !form.confirmPassword) {
        setLocalError('Please fill in all required fields.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setLocalError('Please enter a valid email address.');
        return;
      }
      if (form.phone && !/^\d{10}$/.test(form.phone)) {
        setLocalError('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (form.password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        const normalizedPhone = form.phone ? `+91${form.phone}` : undefined;

        // Verify uniqueness with Firestore backend
        const checkRes = await fetch('/api/auth/check-unique', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, phone: form.phone }),
        });
        const checkData = await checkRes.json();
        if (!checkRes.ok || !checkData.unique) {
          throw new Error(`An account with this ${checkData.exists || 'email/phone'} already exists. Please choose a different one or Contact Admin.`);
        }

        await createAccount(form.email, form.password, form.name, role as UserRole, normalizedPhone);
        setSuccessMessage('Account created. Please verify your email using the link we sent, then sign in.');
      } catch (err: any) {
        console.error(err);
        setLocalError(err.message || mapAuthError(err));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleRegister = async () => {
    if (!role) {
      setLocalError('Please select a role before continuing with Google.');
      setStep(1);
      return;
    }

    if (!form.phone) {
      setLocalError('Please enter your mobile number. It is required for Google registration.');
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setLocalError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setLocalError(null);
    try {
      const normalizedPhone = `+91${form.phone}`;
      await signInWithGoogle(role as UserRole, normalizedPhone);
    } catch (err: any) {
      console.error(err);
      setLocalError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const activeError = localError || authError;

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4 blob-bg grid-pattern py-10">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/logo.png" alt="THENIJOBS Logo" width={160} height={40} className="h-10 w-auto object-contain" />
        </Link>

        <form onSubmit={(e) => { e.preventDefault(); next(); }} className="glass-card rounded-3xl p-7 shadow-2xl">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-7">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="flex items-center flex-1 gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                  ${i + 1 < step ? 'bg-emerald-500 text-white' : i + 1 === step ? 'bg-violet-600 text-white' : 'bg-white/10 text-gray-500'}`}>
                  {i + 1 < step ? <Check size={13} /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full ${i + 1 < step ? 'bg-emerald-500' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          {activeError && (
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/15">
                <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
                <p className="text-[11px] text-rose-300">{activeError}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const errorMsg = typeof activeError === 'string' ? activeError : 'Registration conflict';
                  const text = `Hi Admin, I am facing an issue with registration on TheniJobs. Phone: ${form.phone || 'N/A'}, Email: ${form.email || 'N/A'}. Error: ${errorMsg}`;
                  window.open(`https://wa.me/917094826586?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
              >
                Contact Admin (WhatsApp)
              </button>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 mb-5">
              <Check size={14} className="text-emerald-400 flex-shrink-0" />
              <p className="text-[11px] text-emerald-300">{successMessage}</p>
            </div>
          )}

          {/* STEP 1 — Role Selection */}
          {step === 1 && (
            <div>
              <h1 className="text-xl font-outfit font-bold text-white mb-1">I am a...</h1>
              <p className="text-gray-400 text-sm mb-5">Select your role to get a personalised experience</p>
              <div className="space-y-2.5">
                {ROLES.map(r => (
                  <button key={r.id} onClick={() => setRole(r.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left
                      ${role === r.id ? `${colorMap[r.color]} border` : 'bg-white/[0.03] border-white/10 hover:bg-white/5'}`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                      ${role === r.id ? iconTintMap[r.color] : 'bg-white/5'}`}>
                      <r.icon size={20} className={role === r.id ? iconColorMap[r.color] : 'text-gray-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">{r.label}</div>
                      <div className="text-xs text-gray-500">{r.subLabel}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{r.desc}</div>
                    </div>
                    {role === r.id && <Check size={16} className={iconColorMap[r.color]} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — Basic Details */}
          {step === 2 && (
            <div>
              <h1 className="text-xl font-outfit font-bold text-white mb-1">Create Account</h1>
              <p className="text-gray-400 text-sm mb-5">Fill in your basic details</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" required placeholder="Your full name" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="search-input w-full pl-10 pr-4 py-3 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Mobile Number * <span className="text-violet-400 font-normal">(Required for Google)</span></label>
                  <div className="flex gap-2">
                    <div className="search-input px-3 py-3 text-sm text-gray-400 w-16 text-center rounded-xl">+91</div>
                    <div className="relative flex-1">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="tel" maxLength={10} placeholder="98765 43210" value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="search-input w-full pl-10 pr-4 py-3 text-sm" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Email Address *</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="email" required placeholder="your@email.com" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="search-input w-full pl-10 pr-4 py-3 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type={showPassword ? 'text' : 'password'} required minLength={6} placeholder="Min. 6 characters" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="search-input w-full pl-10 pr-10 py-3 text-sm" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type={showConfirmPassword ? 'text' : 'password'} required minLength={6} placeholder="Confirm your password" value={form.confirmPassword}
                      onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                      className="search-input w-full pl-10 pr-10 py-3 text-sm" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] uppercase tracking-wider text-gray-500">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button type="button" onClick={handleGoogleRegister} disabled={loading}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <span aria-hidden className="grid h-4 w-4 place-items-center rounded-full bg-white text-[11px] font-bold text-slate-900">G</span>}
                Continue with Google
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="btn-outline-glass px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button type="submit" disabled={(step === 1 && !role) || loading}
              className="flex-1 btn-gradient py-3 rounded-2xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {step === totalSteps ? 'Create Account' : 'Continue'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </div>

          {step === 1 && (
            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{' '}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Sign In</Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
