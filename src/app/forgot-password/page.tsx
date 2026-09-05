'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, CheckCircle, Mail, ArrowLeft } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  return (
    <AuthShell
      eyebrow="Account Recovery"
      heading={<>Get back into your <span className="text-blue-600">account</span></>}
      subheading="We'll email you a secure link to reset your password and get you straight back to job hunting or hiring."
      trustRow={['Secure reset link', 'Expires in 1 hour', 'No password stored in plain text']}
      maxWidthClassName="max-w-md"
    >
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-slate-200/60 p-[clamp(1rem,3.5dvh,2rem)] text-center">
          {!sent ? (
            <>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-[clamp(0.5rem,1.6dvh,1rem)] text-xl shadow-xs">
                🔐
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Forgot Password?
              </h1>
              <p className="text-gray-600 text-sm mb-[clamp(0.75rem,2.4dvh,1.5rem)]">
                Enter your registered email address and we&apos;ll send you a password reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-[clamp(0.625rem,2dvh,1rem)] text-left">
                <div>
                  <label className="text-xs text-gray-700 font-semibold block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      aria-label="your@email.com" placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} /> Send Reset Link</>}
                </button>
              </form>
            </>
          ) : (
            <>
              <CheckCircle size={40} className="text-emerald-500 mx-auto mb-[clamp(0.5rem,1.6dvh,1rem)]" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Email Sent!
              </h1>
              <p className="text-gray-600 text-sm mb-[clamp(0.75rem,2.4dvh,1.5rem)]">
                We&apos;ve sent a password reset link to <span className="text-gray-900 font-semibold">{email}</span>. Please check your inbox.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <ArrowLeft size={13} /> Try a different email
              </button>
            </>
          )}

        <p className="text-center text-sm text-gray-600 mt-[clamp(0.75rem,2.4dvh,1.5rem)] pt-4 border-t border-gray-100">
          Remember your password?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
