'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, AlertCircle, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSafePostLoginRedirect } from '@/lib/access';
import { mapAuthError } from '@/lib/firebase/authErrors';


export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a1a]" />}>
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
      if (redirect) {
        setRedirectUrl(redirect);
      }
    }
  }, []);

  const {
    user,
    loading: authLoading,
    error: authError,
    signInWithEmail,
    signInWithGoogle,
    loginWithCustomToken,
    clearError
  } = useAuth();

  const [loginMethod, setLoginMethod] = useState<'email' | 'mobile'>('email');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);

  // Clear errors and verification session on mount or method change
  useEffect(() => {
    clearError();
    setLocalError(null);
    setOtpSent(false);
    setOtp('');
    setSessionId(null);
  }, [clearError, loginMethod]);

  // Role-based automatic redirect after successful login
  useEffect(() => {
    if (user) {
      router.replace(getSafePostLoginRedirect(redirectUrl, user.role, user.setupCompleted));
    }
  }, [user, router, redirectUrl]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      setLocalError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setLocalError(null);
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        throw new Error('Invalid phone number. Must be a 10-digit number.');
      }


      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP. Please try again.');
      }

      setSessionId(data.sessionId);
      setOtpSent(true);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) {
      setLocalError('Verification session expired. Please request a new OTP.');
      return;
    }
    setOtpLoading(true);
    setLocalError(null);

    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, sessionId, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired OTP. Please try again.');
      }

      await loginWithCustomToken(data.customToken);
    } catch (err: any) {
      setLocalError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      // For login, don't pass any role — let the backend detect new vs existing user
      await signInWithGoogle(null);
      // After successful sign-in:
      // - Existing users with a role: the useEffect above will redirect via getSafePostLoginRedirect
      // - New users (no role): getSafePostLoginRedirect returns /register?method=google
      // The redirect is handled by the useEffect watching `user` state
    } catch (err: any) {
      setLocalError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger Google Sign-in on native platform
  const autoTriggered = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isCapacitor = !!(window as any).Capacitor;
    if (isCapacitor && !user && !authLoading && !autoTriggered.current) {
      autoTriggered.current = true;
      handleGoogleLogin();
    }
  }, [user, authLoading]);

  const activeError = localError || authError;

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4 blob-bg grid-pattern">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
          <Image src="/logo.png" alt="THENIJOBS Logo" width={40} height={40} className="h-10 w-10 object-contain rounded-xl" />
          <span className="font-outfit font-black text-2xl tracking-wider text-white">THENIJOBS</span>
        </Link>

        <div className="glass-card rounded-3xl p-7 shadow-2xl">
          <h1 className="text-2xl font-outfit font-bold text-white text-center mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm text-center mb-7">Sign in to your account</p>

          {activeError && (
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/15">
                <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
                <p className="text-[11px] text-rose-300">{activeError}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const errorMsg = typeof activeError === 'string' ? activeError : 'Login conflict';
                  const text = `Hi Admin, I am facing an issue with login on TheniJobs. Phone: ${phone || 'N/A'}, Email: ${email || 'N/A'}. Error: ${errorMsg}`;
                  window.open(`https://wa.me/917094826586?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
              >
                Contact Admin (WhatsApp)
              </button>
            </div>
          )}

          {/* Method Tabs */}
          <div className="flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 mb-6 font-outfit">
            <button
              type="button"
              onClick={() => { setLoginMethod('email'); setLocalError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                loginMethod === 'email'
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              Email Sign In
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('mobile'); setLocalError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                loginMethod === 'mobile'
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              Mobile OTP
            </button>
          </div>

          {loginMethod === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="email" required placeholder="your@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="search-input w-full pl-10 pr-4 py-3 text-sm min-h-12" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type={showPass ? 'text' : 'password'} required placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="search-input w-full pl-10 pr-10 py-3 text-sm min-h-12" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                    style={{ minHeight: '48px' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors py-1.5">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={loading}
                className="w-full btn-gradient min-h-12 py-3.5 rounded-2xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2 mt-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                Sign In
                {!loading && <ArrowRight size={15} />}
              </button>
            </form>
          ) : (
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              <div id="recaptcha-container" className="hidden"></div>
              {!otpSent ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium">Mobile Number</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="tel" required placeholder="10-digit mobile number"
                        value={phone} onChange={e => setPhone(e.target.value)}
                        className="search-input w-full pl-10 pr-4 py-3 text-sm min-h-12" />
                    </div>
                  </div>
                  <button type="submit" disabled={otpLoading}
                    className="w-full btn-gradient min-h-12 py-3.5 rounded-2xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2 mt-2">
                    {otpLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    Send OTP
                    {!otpLoading && <ArrowRight size={15} />}
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-gray-400 font-medium">Enter OTP sent to +91 {phone}</label>
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }} className="text-[10px] text-violet-400 hover:underline">
                        Change
                      </button>
                    </div>
                    <div className="relative">
                      <input type="text" required maxLength={6} placeholder="••••"
                        value={otp} onChange={e => setOtp(e.target.value)}
                        className="search-input text-center tracking-widest font-mono font-bold w-full py-3 text-lg min-h-12" />
                    </div>
                  </div>
                  <button type="submit" disabled={otpLoading}
                    className="w-full btn-gradient min-h-12 py-3.5 rounded-2xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2 mt-2">
                    {otpLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    Verify & Sign In
                    {!otpLoading && <ArrowRight size={15} />}
                  </button>
                  <div className="flex justify-center mt-2">
                    <button type="button" onClick={handleSendOtp} disabled={otpLoading} className="text-xs text-gray-500 hover:text-white transition-colors">
                      Resend OTP
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] uppercase tracking-wider text-gray-500">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button type="button" onClick={handleGoogleLogin} disabled={loading}
            className="w-full min-h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <span aria-hidden className="grid h-4 w-4 place-items-center rounded-full bg-white text-[11px] font-bold text-slate-900">G</span>}
            Continue with Google
          </button>



          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors py-1 inline-block">
              Join Free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
