'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, Mail, Lock, Phone, ArrowRight, Loader2,
  AlertCircle, CheckCircle2, MessageSquare, PhoneCall, RefreshCw, Info
} from 'lucide-react';
import { GoogleIcon } from '@/components/ui/BrandIcons';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import AuthShell from '@/components/auth/AuthShell';

type AuthMode = 'phone' | 'email';

// Mobile OTP is temporarily unavailable — flip this back on to restore the toggle once
// the phone-auth provider is stable again. All OTP logic below is left intact.
const PHONE_LOGIN_ENABLED = false;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#F8FAFC]" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) setRedirectUrl(redirect);
    }
  }, []);

  const {
    user, loading: authLoading, error: authError,
    signInWithEmail, signInWithGoogle, clearError
  } = useAuth() as any;

  const [mode, setMode] = useState<AuthMode>('email');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sessionId, setSessionId] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Dual independent timers: SMS & Call (2:00 / 120s each) ───────────────
  const [smsTimer, setSmsTimer] = useState<number>(120);
  const [callTimer, setCallTimer] = useState<number>(120);
  const [smsActive, setSmsActive] = useState<boolean>(false);
  const [callActive, setCallActive] = useState<boolean>(false);
  const [resendingSms, setResendingSms] = useState(false);
  const [callingOtp, setCallingOtp] = useState(false);

  // SMS Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (smsActive && smsTimer > 0) {
      interval = setInterval(() => setSmsTimer(t => t - 1), 1000);
    } else if (smsTimer === 0) {
      setSmsActive(false);
    }
    return () => clearInterval(interval);
  }, [smsActive, smsTimer]);

  // Call Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callActive && callTimer > 0) {
      interval = setInterval(() => setCallTimer(t => t - 1), 1000);
    } else if (callTimer === 0) {
      setCallActive(false);
    }
    return () => clearInterval(interval);
  }, [callActive, callTimer]);

  useEffect(() => { clearError?.(); setLocalError(null); }, [mode]);

  useEffect(() => {
    if (user) {
      if (redirectUrl) { router.push(redirectUrl); return; }
      const role = (user as any).role;
      if (role === 'admin' || role === 'super_admin') router.push('/admin/dashboard');
      else if (role === 'employer' || role === 'business_owner') router.push('/employer/dashboard');
      else router.push('/seeker/dashboard');
    }
  }, [user, router, redirectUrl]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    
    // Handle paste event (full 6 digit OTP)
    if (val.length > 1) {
      const digits = val.slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, idx) => {
        if (idx < 6) newOtp[idx] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      document.getElementById(`otp-${nextIdx}`)?.focus();
      return;
    }

    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setLocalError(null);
    try { await signInWithEmail(email, password); }
    catch (err: any) { setLocalError(err.message || 'Login failed. Check your credentials.'); }
    finally { setLoading(false); }
  };

  // ── Phone Submit -> Trigger SMS & initialize both timers ──────────────────
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) { 
      setLocalError('Please enter a valid 10-digit mobile number.'); 
      return; 
    }
    setLoading(true); setLocalError(null); setSuccessMessage(null);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP.');
      }

      setSessionId(data.sessionId);
      setStep('otp');
      setOtp(['', '', '', '', '', '']);
      // Start both 2:00 timers simultaneously
      setSmsTimer(120);
      setSmsActive(true);
      setCallTimer(120);
      setCallActive(true);
      setSuccessMessage('OTP sent via SMS! Enter the code below.');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend SMS OTP ────────────────────────────────────────────────────────
  const handleResendSms = async () => {
    if (smsActive && smsTimer > 0) return;
    setResendingSms(true); setLocalError(null); setSuccessMessage(null);
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend SMS OTP.');
      }
      setSessionId(data.sessionId);
      setSmsTimer(120);
      setSmsActive(true);
      setSuccessMessage('New OTP sent via SMS successfully!');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to resend OTP.');
    } finally {
      setResendingSms(false);
    }
  };

  // ── Send Voice Call OTP ───────────────────────────────────────────────────
  const handleSendCallOtp = async () => {
    if (callActive && callTimer > 0) return;
    setCallingOtp(true); setLocalError(null); setSuccessMessage(null);
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const res = await fetch('/api/otp/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate Voice Call.');
      }
      if (data.sessionId) setSessionId(data.sessionId);
      setCallTimer(120);
      setCallActive(true);
      setSuccessMessage('Calling your mobile number with the OTP code...');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to trigger Voice Call OTP.');
    } finally {
      setCallingOtp(false);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const fullCode = otp.join('');
    if (fullCode.length !== 6) { 
      setLocalError('Please enter all 6 digits of the OTP.'); 
      return; 
    }
    setLoading(true); setLocalError(null);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, otp: fullCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'Invalid OTP. Please check the code and try again.');
      }

      // Verified successfully — create a real Firebase Auth session
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      // Sign in anonymously to create a persistent Firebase Auth session
      // This ensures onAuthStateChanged fires and useRequireAuth works
      const { signInAnonymously, updateProfile: updateFbProfile } = await import('firebase/auth');
      const { auth: firebaseAuth } = await import('@/lib/firebase/config');
      const credential = await signInAnonymously(firebaseAuth);
      const fbUser = credential.user;

      // Update the Firebase Auth profile with phone info
      await updateFbProfile(fbUser, {
        displayName: `User ${cleanPhone.slice(-4)}`,
      });

      // Create/update the Firestore user document using the real Firebase Auth UID
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: fbUser.uid,
          phone: `+91${cleanPhone}`,
          displayName: `User ${cleanPhone.slice(-4)}`,
          email: '',
          role: 'job_seeker',
          isVerified: true,
          authMethod: 'phone_otp',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Update existing user with phone verification
        await setDoc(userRef, {
          phone: `+91${cleanPhone}`,
          isVerified: true,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      setSuccessMessage('Verified successfully! Redirecting...');
      // onAuthStateChanged in AuthContext will now fire with the real Firebase user
      // and redirect automatically via the useEffect on line 86-94
    } catch (err: any) {
      setLocalError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setLocalError(null);
    try { 
      await signInWithGoogle(); 
    } catch (err: any) { 
      console.error('Google Sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setLocalError('Sign-in cancelled. The popup was closed.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setLocalError('Domain not authorized in Firebase. Please use http://localhost:3001 or add your domain in Firebase Console.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        setLocalError('Google Sign-In is not enabled in Firebase Authentication console.');
      } else {
        setLocalError(err?.message || 'Google Sign-in failed. Please try again.');
      }
    } finally { 
      setLoading(false); 
    }
  };

  const activeError = localError || authError;

  return (
    <AuthShell>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-slate-200/60 p-[clamp(0.875rem,3.5dvh,1.5rem)] sm:p-8">
        <p className="text-[11px] font-bold tracking-[0.14em] text-blue-600 uppercase mb-[clamp(0.25rem,0.8dvh,0.375rem)]">Member Sign In</p>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Welcome back 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1 mb-[clamp(0.5rem,1.6dvh,1rem)]">Sign in to continue</p>

        {/* Primary/secondary auth-method toggle — plain text link, not a tab control */}
        {PHONE_LOGIN_ENABLED && step === 'input' && (
          <div className="mb-5">
            <button
              type="button"
              onClick={() => { setMode(mode === 'email' ? 'phone' : 'email'); setLocalError(null); setSuccessMessage(null); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
            >
              {mode === 'email' ? (
                <>Sign in with mobile number instead <Phone size={12} /></>
              ) : (
                <>← Use email &amp; password instead</>
              )}
            </button>
          </div>
        )}

        {/* Phone/OTP sign-in temporarily unavailable notice */}
        {!PHONE_LOGIN_ENABLED && step === 'input' && (
          <div className="flex items-start gap-2 px-3 py-[clamp(0.3rem,1dvh,0.5rem)] rounded-xl bg-amber-50 border border-amber-200 mb-[clamp(0.5rem,1.6dvh,1rem)]">
            <Info size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-snug font-medium">
              Mobile OTP is temporarily unavailable. Use email or Google below.
            </p>
          </div>
        )}

        {/* Error banner */}
        {activeError && (
          <div className="flex items-start gap-2 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 mb-4 animate-in fade-in">
            <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed font-medium">{activeError}</p>
          </div>
        )}

        {/* Success banner */}
        {successMessage && (
          <div className="flex items-start gap-2 px-3.5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 mb-4 animate-in fade-in">
            <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 leading-relaxed font-medium">{successMessage}</p>
          </div>
        )}

        {step === 'input' ? (
              <form onSubmit={mode === 'email' ? handleEmailLogin : handlePhoneSubmit} className="space-y-[clamp(0.5rem,1.8dvh,0.875rem)]">
                {mode === 'phone' ? (
                  <div>
                    <label htmlFor="login-mobile-number-91-setphone-e-target-value" className="text-xs font-semibold text-gray-700 block mb-1.5">Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-semibold whitespace-nowrap">
                        🇮🇳 +91
                      </div>
                      <div className="relative flex-1">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="tel" required maxLength={10} aria-label="Enter 10-digit mobile" placeholder="Enter 10-digit mobile"
                          value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all font-medium" />
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">We will send an OTP via SMS and voice call options</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input id="login-mobile-number-91-setphone-e-target-value" type="email" required placeholder="your@email.com"
                          value={email} onChange={e => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="login-password" className="text-xs font-semibold text-gray-700 block mb-1.5">Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input id="login-password" type={showPass ? 'text' : 'password'} required placeholder="••••••••"
                          value={password} onChange={e => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all" />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Link href="/forgot-password" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
                        Forgot password?
                      </Link>
                    </div>
                  </>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {mode === 'phone' ? 'Get OTP' : 'Sign In'}
                  {!loading && <ArrowRight size={15} />}
                </button>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-medium">or continue with</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <button type="button" onClick={handleGoogleLogin} disabled={loading}
                  className="w-full py-2.5 rounded-2xl text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 flex items-center justify-center gap-2 hover:border-gray-300 hover:bg-gray-50 transition-all">
                  <GoogleIcon size={18} />
                  Continue with Google
                </button>
              </form>
            ) : (
              /* ── Full OTP Screen with Dual Independent Timers ── */
              <div className="space-y-5 animate-in fade-in">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
                    <Phone size={24} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">OTP Verification</p>
                  <p className="text-xs text-gray-500 mt-0.5">Enter 6-digit code sent to +91 {phone}</p>
                </div>

                {/* 6 Digit Input Boxes */}
                <div className="flex justify-center gap-1.5 sm:gap-2">
                  {otp.map((digit, i) => (
                    <input 
                      key={i} 
                      id={`otp-${i}`} 
                      type="text" 
                      inputMode="numeric"
                      maxLength={1} 
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className="w-10 sm:w-11 h-12 text-center text-gray-900 text-lg font-bold rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner" 
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <button onClick={handleVerifyOtp} disabled={loading || otp.join('').length !== 6}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify & Continue'}
                  {!loading && <ArrowRight size={15} />}
                </button>

                {/* ── Dual Independent Timers Section ── */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  {/* SMS OTP Row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                      <MessageSquare size={13} className="text-blue-600" />
                      <span>SMS OTP</span>
                    </div>
                    {smsActive && smsTimer > 0 ? (
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        ⏳ {formatTime(smsTimer)}
                      </span>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleResendSms} 
                        disabled={resendingSms}
                        className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                      >
                        {resendingSms ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                        Resend SMS
                      </button>
                    )}
                  </div>

                  {/* Call OTP Row */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                      <PhoneCall size={13} className="text-emerald-600" />
                      <span>Voice Call OTP</span>
                    </div>
                    {callActive && callTimer > 0 ? (
                      <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                        ⏳ {formatTime(callTimer)}
                      </span>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleSendCallOtp} 
                        disabled={callingOtp}
                        className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                      >
                        {callingOtp ? <Loader2 size={11} className="animate-spin" /> : <PhoneCall size={11} />}
                        Call Again
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <button onClick={() => { setStep('input'); setLocalError(null); setSuccessMessage(null); }} className="text-xs text-gray-500 hover:text-gray-800 font-medium">
                    ← Change phone number
                  </button>
                </div>
              </div>
            )}

        <p className="text-center text-sm text-gray-500 mt-[clamp(0.5rem,1.6dvh,1rem)]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700">
            Join Free
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
