'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, Check, Briefcase, Building2,
  Package, Wrench, Users, Loader2, User, Phone, Mail, Lock, AlertCircle
} from 'lucide-react';
import { GoogleIcon } from '@/components/ui/BrandIcons';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { UserRole } from '@/lib/types';
import AuthShell from '@/components/auth/AuthShell';

const ROLES = [
  {
    id: 'job_seeker', label: 'Job Seeker', subLabel: 'வேலை தேடுகிறேன்',
    icon: Briefcase, desc: 'Find jobs, build resume, track applications',
    bg: '#EFF6FF', color: '#2563EB', selectedBorder: '#BFDBFE'
  },
  {
    id: 'employer', label: 'Employer / HR', subLabel: 'ஆட்களை எடுக்கிறேன்',
    icon: Building2, desc: 'Post jobs, search candidates, hire talent',
    bg: '#ECFDF5', color: '#059669', selectedBorder: '#A7F3D0'
  },
  {
    id: 'business_owner', label: 'Business Owner', subLabel: 'Business வைத்திருக்கிறேன்',
    icon: Users, desc: 'List your business, get leads & enquiries',
    bg: '#FFFBEB', color: '#D97706', selectedBorder: '#FDE68A'
  },
  {
    id: 'supplier', label: 'Supplier / B2B', subLabel: 'Products விற்கிறேன்',
    icon: Package, desc: 'List products, receive RFQs from buyers',
    bg: '#F5F3FF', color: '#7C3AED', selectedBorder: '#DDD6FE'
  },
  {
    id: 'service_provider', label: 'Service Provider', subLabel: 'Service வழங்குகிறேன்',
    icon: Wrench, desc: 'Offer services, get bookings & reviews',
    bg: '#FFF1F2', color: '#E11D48', selectedBorder: '#FECDD3'
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { user, createAccount, signInWithGoogle, error: authError, clearError } = useAuth() as any;

  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });

  useEffect(() => {
    if (user) {
      const r = user.role;
      if (r === 'admin' || r === 'super_admin') router.push('/admin/dashboard');
      else if (r === 'employer' || r === 'business_owner') router.push('/employer/dashboard');
      else router.push('/seeker/dashboard');
    }
  }, [user, router]);

  useEffect(() => { clearError?.(); setLocalError(null); }, [step]);

  const handleGoogleRegister = async () => {
    setLoading(true); setLocalError(null);
    try { 
      await signInWithGoogle(); 
    } catch (err: any) { 
      console.error('Google register error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setLocalError('Registration cancelled. The popup was closed.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setLocalError('Domain not authorized in Firebase. Please use http://localhost:3001 or add your domain in Firebase Console.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        setLocalError('Google Sign-In is not enabled in Firebase Authentication console.');
      } else {
        setLocalError(err?.message || 'Google registration failed.');
      }
    } finally { 
      setLoading(false); 
    }
  };



  const next = async () => {
    setLocalError(null);
    if (step === 1) {
      if (!role) { setLocalError('Please select a role to continue.'); return; }
      setStep(2); return;
    }
    if (step === 2) {
      if (!form.name || !form.email || !form.password) { setLocalError('Please fill in all required fields.'); return; }
      if (form.password.length < 6) { setLocalError('Password must be at least 6 characters.'); return; }
      setLoading(true);
      try {
        // P1 FIX: use returned uid directly — avoids stale user state race condition
        const newUid = await createAccount(form.email, form.password, form.name, role as UserRole);
        if (form.phone && newUid) {
          await updateDoc(doc(db, 'users', newUid), { phone: `+91${form.phone}`, updatedAt: new Date() });
        }
      } catch (err: any) {
        setLocalError(err.message || 'Registration failed. Please try again.');
      } finally { setLoading(false); }
    }
  };

  const activeError = localError || authError;

  return (
    <AuthShell
      eyebrow="Create Your Account"
      heading={<>Start your <span className="text-blue-600">free</span> journey with THENIJOBS</>}
      subheading="Post jobs, list your business, or find local talent across Theni & Tamil Nadu in minutes."
      trustRow={['Free for job seekers', 'Verified local businesses', 'Setup in minutes']}
      maxWidthClassName="max-w-lg"
    >
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-slate-200/60 p-[clamp(0.625rem,3dvh,1.5rem)] sm:p-8">
          {/* Step progress */}
          <div className="flex items-center gap-2 mb-[clamp(0.5rem,1.6dvh,1.25rem)]">
            {[1, 2].map((s, i) => (
              <div key={s} className="flex items-center flex-1 gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  s < step ? 'text-white' : s === step ? 'text-white' : 'bg-gray-100 text-gray-400'
                }`} style={s <= step ? { background: '#2563EB' } : {}}>
                  {s < step ? <Check size={13} /> : s}
                </div>
                {i < 1 && (
                  <div className="flex-1 h-0.5 rounded-full transition-all"
                    style={{ background: s < step ? '#2563EB' : '#E5E7EB' }} />
                )}
              </div>
            ))}
          </div>

          {/* Error */}
          {activeError && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 mb-5">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 leading-relaxed">{activeError}</p>
            </div>
          )}

          {/* STEP 1 — Role Selection */}
          {step === 1 && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                I am a... 👋
              </h1>
              <p className="text-sm text-gray-500 mb-[clamp(0.375rem,1.3dvh,1.25rem)]">Select your role for a personalised experience</p>
              <div className="space-y-[clamp(0.125rem,0.7dvh,0.5rem)]">
                {ROLES.map(r => {
                  const Icon = r.icon;
                  const selected = role === r.id;
                  return (
                    <button key={r.id} onClick={() => setRole(r.id)}
                      className="w-full min-w-0 flex items-center gap-2.5 p-[clamp(0.25rem,1.3dvh,0.875rem)] rounded-2xl border-2 transition-all text-left"
                      style={{
                        background: selected ? r.bg : '#FFFFFF',
                        borderColor: selected ? r.color : '#E5E7EB',
                      }}>
                      <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: r.bg }}>
                        <Icon size={14} style={{ color: r.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="leading-snug truncate">
                          <span className="font-semibold text-gray-900 text-sm">{r.label}</span>{' '}
                          <span className="text-gray-400 text-xs">· {r.subLabel}</span>
                        </p>
                        <p className="text-xs text-gray-400 leading-snug mt-0.5 hidden sm:block">{r.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selected ? 'border-current' : 'border-gray-300'
                      }`} style={selected ? { borderColor: r.color, background: r.color } : {}}>
                        {selected && <Check size={11} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2 — Basic Details */}
          {step === 2 && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Create Account
              </h1>
              <p className="text-sm text-gray-500 mb-[clamp(0.5rem,1.8dvh,1rem)]">Fill in your basic details to get started</p>
              <div className="space-y-[clamp(0.5rem,1.6dvh,0.75rem)]">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" aria-label="Your full name" placeholder="Your full name" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Mobile Number <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium whitespace-nowrap">🇮🇳 +91</div>
                    <div className="relative flex-1">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" maxLength={10} aria-label="93605 19460" placeholder="93605 19460" value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" aria-label="your@email.com" placeholder="your@email.com" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" aria-label="Min. 6 characters" placeholder="Min. 6 characters" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all" />
                  </div>
                </div>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-medium">or</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <button type="button" onClick={handleGoogleRegister} disabled={loading}
                  className="w-full py-2.5 rounded-2xl text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 flex items-center justify-center gap-2 hover:border-gray-300 hover:bg-gray-50 transition-all">
                  <GoogleIcon size={18} /> Continue with Google
                </button>

              </div>
            </div>
          )}

          {/* Nav Buttons */}
          <div className="flex gap-3 mt-[clamp(0.75rem,2.2dvh,1.25rem)]">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all">
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button onClick={next} disabled={(step === 1 && !role) || loading}
              className="flex-1 py-2.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {step === 2 ? 'Create Account' : 'Continue'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </div>

        {step === 1 && (
          <p className="text-center text-sm text-gray-500 mt-[clamp(0.5rem,1.6dvh,1rem)]">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">Sign In</Link>
          </p>
        )}
      </div>
    </AuthShell>
  );
}
