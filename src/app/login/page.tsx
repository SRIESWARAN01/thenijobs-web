'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Phone, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { GoogleIcon } from '@/components/ui/BrandIcons';
import { useAuth } from '@/contexts/AuthContext';
import type { ConfirmationResult } from 'firebase/auth';

type AuthMode = 'email' | 'phone';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#F8FAFC' }} />}>
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
    signInWithEmail, signInWithGoogle, sendPhoneOTP, verifyPhoneOTP, clearError
  } = useAuth() as any;

  const [mode, setMode] = useState<AuthMode>('email');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState<string | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

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

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setLocalError(null);
    try { await signInWithEmail(email, password); }
    catch (err: any) { setLocalError(err.message || 'Login failed. Check your credentials.'); }
    finally { setLoading(false); }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) { setLocalError('Enter a valid 10-digit mobile number.'); return; }
    setLoading(true); setLocalError(null);
    try {
      const conf = await sendPhoneOTP(`+91${phone}`, 'recaptcha-container');
      confirmationResultRef.current = conf; setStep('otp');
    } catch (err: any) { setLocalError(err.message || 'Failed to send OTP.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.join('').length !== 6) { setLocalError('Enter the 6-digit OTP.'); return; }
    if (!confirmationResultRef.current) { setLocalError('Session expired. Request OTP again.'); setStep('input'); return; }
    setLoading(true); setLocalError(null);
    try { await verifyPhoneOTP(confirmationResultRef.current, otp.join('')); }
    catch (err: any) { setLocalError('Invalid OTP. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setLocalError(null);
    try { await signInWithGoogle(); }
    catch (err: any) { setLocalError('Google Sign-in failed.'); }
    finally { setLoading(false); }
  };



  const handleDemoLogin = async (role: 'seeker' | 'employer' | 'admin') => {
    setLoading(true); setLocalError(null);
    const emails = { seeker: 'jobseeker@thenijobs.com', employer: 'company@thenijobs.com', admin: 'admin@thenijobs.com' };
    const passwords = { seeker: 'Jobseeker@123', employer: 'Company@123', admin: 'Admin@123' };
    try { await signInWithEmail(emails[role], passwords[role]); }
    catch (err: any) { setLocalError(`Demo login failed. Please create '${emails[role]}' in Firebase Auth first.`); }
    finally { setLoading(false); }
  };

  const activeError = localError || authError;

  return (
    <div className="min-h-screen flex" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      <div id="recaptcha-container" />

      {/* Left panel — branding (desktop) */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-base">T</div>
          <span className="font-bold text-xl text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>Theni Jobs</span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Find Your Dream Job in Theni
          </h2>
          <p className="text-blue-100 text-base leading-relaxed mb-8">
            Join thousands of job seekers and employers across Tamil Nadu. Verified jobs, real employers, local opportunities.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[['1200+', 'Active Jobs'], ['500+', 'Companies'], ['98%', 'Satisfaction']].map(([v, l]) => (
              <div key={l} className="text-center p-4 rounded-2xl bg-white/10 backdrop-blur">
                <p className="text-2xl font-bold text-gray-900">{v}</p>
                <p className="text-xs text-blue-100 mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-200 text-xs relative z-10">© 2024 THENIJOBS. All rights reserved.</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: '#2563EB' }}>T</div>
              <span className="font-bold text-xl text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Theni Jobs</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-7">
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Welcome back 👋
            </h1>
            <p className="text-gray-500 text-sm mb-6">Sign in to your account</p>

            {/* Error */}
            {activeError && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 mb-4">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 leading-relaxed">{activeError}</p>
              </div>
            )}

            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 mb-5">
              {(['email', 'phone'] as AuthMode[]).map(m => (
                <button key={m} onClick={() => { setMode(m); setStep('input'); setLocalError(null); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                    mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {m === 'email' ? '✉️ Email' : '📱 Phone OTP'}
                </button>
              ))}
            </div>

            {step === 'input' ? (
              <form onSubmit={mode === 'email' ? handleEmailLogin : handlePhoneSubmit} className="space-y-4">
                {mode === 'email' ? (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="email" required placeholder="your@email.com"
                          value={email} onChange={e => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={showPass ? 'text' : 'password'} required placeholder="••••••••"
                          value={password} onChange={e => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all" />
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
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium whitespace-nowrap">
                        🇮🇳 +91
                      </div>
                      <div className="relative flex-1">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="tel" required maxLength={10} placeholder="98765 43210"
                          value={phone} onChange={e => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all" />
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {mode === 'phone' ? 'Send OTP' : 'Sign In'}
                  {!loading && <ArrowRight size={15} />}
                </button>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-medium">or continue with</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <button type="button" onClick={handleGoogleLogin} disabled={loading}
                  className="w-full py-3 rounded-2xl text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 flex items-center justify-center gap-2 hover:border-gray-300 hover:bg-gray-50 transition-all">
                  <GoogleIcon size={18} />
                  Continue with Google
                </button>


              </form>
            ) : (
              /* OTP Screen */
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                    <Phone size={28} className="text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">OTP sent to +91{phone}</p>
                  <p className="text-xs text-gray-500 mt-1">Enter the 6-digit verification code</p>
                </div>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, i) => (
                    <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      className="w-11 h-12 text-center text-gray-900 text-lg font-bold rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white outline-none transition-all" />
                  ))}
                </div>
                <button onClick={handleVerifyOtp} disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify OTP'}
                </button>
                <p className="text-center text-xs text-gray-500">
                  Didn&apos;t receive? <button onClick={() => setStep('input')} className="text-blue-600 font-semibold">Go back</button>
                </p>
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-5">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700">
                Join Free
              </Link>
            </p>

            {/* Demo Access — only visible in development */}
            {process.env.NODE_ENV === 'development' && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Demo Access</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'seeker' as const, label: '👤 Seeker', bg: '#EFF6FF', color: '#2563EB' },
                  { role: 'employer' as const, label: '🏢 Employer', bg: '#ECFDF5', color: '#059669' },
                  { role: 'admin' as const, label: '⚙️ Admin', bg: '#FFFBEB', color: '#D97706' },
                ].map(item => (
                  <button key={item.role} onClick={() => handleDemoLogin(item.role)} disabled={loading}
                    className="py-2 rounded-xl text-[11px] font-bold text-center transition-all hover:opacity-80 border"
                    style={{ background: item.bg, color: item.color, borderColor: item.bg }}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
