'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, CheckCircle, Mail } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to send reset email.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4 blob-bg grid-pattern">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center glow-purple">
            <span className="text-white font-black text-base">T</span>
          </div>
          <span className="font-outfit font-bold text-2xl">
            <span className="gradient-text">THENI</span><span className="text-white">JOBS</span>
          </span>
        </Link>

        <div className="glass-card rounded-3xl p-7 shadow-2xl text-center">
          {!sent ? (
            <>
              <div className="text-5xl mb-4">🔐</div>
              <h1 className="text-xl font-outfit font-bold text-white mb-2">Forgot Password?</h1>
              <p className="text-gray-400 text-sm mb-6">Enter your email and we&apos;ll send you a reset link</p>
              {error && (
                <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-left text-xs text-rose-300">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="search-input w-full pl-10 pr-4 py-3 text-sm" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full btn-gradient py-3.5 rounded-2xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={15} /> Send Reset Link</>}
                </button>
              </form>
            </>
          ) : (
            <>
              <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
              <h1 className="text-xl font-outfit font-bold text-white mb-2">Email Sent!</h1>
              <p className="text-gray-400 text-sm mb-6">
                We&apos;ve sent a password reset link to <span className="text-white font-medium">{email}</span>. Check your inbox.
              </p>
              <button onClick={() => { setSent(false); setEmail(''); }}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                ← Try a different email
              </button>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Remember your password?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
