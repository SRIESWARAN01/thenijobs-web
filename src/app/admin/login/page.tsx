'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

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
    } catch (err: any) {
      console.error('Admin login error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please check your email and password.');
      } else {
        setError('Authentication failed. Please verify your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 blob-bg grid-pattern">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 select-none">
          <Link href="/" className="flex flex-col items-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-md mb-3">
              <img src="/logo.png" alt="THENIJOBS" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>THENIJOBS Admin</h1>
          </Link>
          <p className="text-xs text-gray-500 font-medium">Secure Administrative Access</p>
        </div>

        <div className="bg-white rounded-3xl p-7 shadow-xl border border-slate-200">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 mb-6">
            <Shield size={14} className="text-blue-600 shrink-0" />
            <p className="text-[11px] text-blue-900 font-semibold">This portal is restricted to authorized administrators only.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 mb-4">
              <AlertCircle size={14} className="text-rose-600 flex-shrink-0" />
              <p className="text-xs text-rose-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-bold">Admin Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@thenijobs.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 outline-none font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-bold">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 outline-none font-medium"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Authenticating...' : 'Access Admin Portal'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              ← Back to THENIJOBS
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-500 font-medium mt-6">
          Protected by Firebase Auth · Secure Admin Dashboard
        </p>
      </div>
    </div>
  );
}
