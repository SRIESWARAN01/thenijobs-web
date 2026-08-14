'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, CheckCircle, Mail, ArrowLeft } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
          <img src="/logo.png" alt="THENIJOBS" className="h-10 w-auto object-contain" />
          <span className="font-extrabold text-2xl text-gray-900 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            THENI<span className="text-blue-600">JOBS</span>
          </span>
        </Link>

        <div className="bg-white rounded-3xl p-7 shadow-lg border border-gray-200 text-center">
          {!sent ? (
            <>
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
                🔐
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Forgot Password?
              </h1>
              <p className="text-gray-600 text-sm mb-6">
                Enter your registered email address and we&apos;ll send you a password reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label className="text-xs text-gray-700 font-semibold block mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} /> Send Reset Link</>}
                </button>
              </form>
            </>
          ) : (
            <>
              <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Email Sent!
              </h1>
              <p className="text-gray-600 text-sm mb-6">
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

          <p className="text-center text-sm text-gray-600 mt-6 pt-4 border-t border-gray-100">
            Remember your password?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
