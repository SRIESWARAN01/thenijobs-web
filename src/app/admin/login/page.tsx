'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Button, Card } from '@/components/dashboard';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Sign in via Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // 2. Fetch role from Firestore
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.role === 'admin' || data.role === 'super_admin') {
          router.push('/admin/dashboard');
          return;
        }
      }

      // Not an admin → log out and show error
      await auth.signOut();
      setError('Access Denied. You do not have administrative permissions.');
    } catch (err) {
      console.error('Admin login error:', err);
      const code = (err as { code?: string })?.code;
      if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please check your email and password.');
      } else {
        setError('Authentication failed. Please verify your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex select-none flex-col items-center">
          <Link href="/" className="mb-2 flex flex-col items-center">
            <div className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-1.5 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="THENIJOBS" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              THENIJOBS Admin
            </h1>
          </Link>
          <p className="text-xs font-medium text-slate-500">Secure administrative access</p>
        </div>

        <Card className="p-7 shadow-xl">
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-blue-200 bg-[#EFF6FF] px-3 py-2">
            <Shield size={14} className="shrink-0 text-blue-600" aria-hidden />
            <p className="text-[11px] font-semibold text-[#1E3A8A]">
              This portal is restricted to authorized administrators only.
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-[#FEF2F2] px-3 py-2.5">
              <AlertCircle size={14} className="shrink-0 text-rose-600" aria-hidden />
              <p className="text-xs font-medium text-[#991B1B]">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="admin-login-email" className="text-xs font-bold text-slate-700">Admin email</label>
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  id="admin-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@thenijobs.com"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-base font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="admin-login-password" className="text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  id="admin-login-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-10 text-base font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  className="tap-target-auto absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" block loading={loading} className="mt-2">
              {!loading && (
                <>
                  Access admin portal
                  <ArrowRight size={15} />
                </>
              )}
              {loading && 'Authenticating…'}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <Link href="/" className="text-xs font-semibold text-slate-600 transition-colors hover:text-blue-600">
              ← Back to THENIJOBS
            </Link>
          </div>
        </Card>

        <p className="mt-6 text-center text-[10px] font-medium text-slate-500">
          Protected by Firebase Auth · Secure Admin Dashboard
        </p>
      </div>
    </div>
  );
}
