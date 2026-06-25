'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { browserLocalPersistence, setPersistence, signInWithEmailAndPassword } from 'firebase/auth';
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
      await setPersistence(auth, browserLocalPersistence);
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
  const handleDemoAdminLogin = async () => {
    const demoEmail = 'admin@thenijobs.com';
    const demoPass = 'admin@123';
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setError('');
    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.role === 'admin' || data.role === 'super_admin') {
          router.push('/admin/dashboard');
          return;
        }
      }
      await auth.signOut();
      setError('Access Denied. You do not have administrative permissions.');
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError('Authentication failed. Please verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4 blob-bg grid-pattern">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4 glow-purple">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white font-outfit">THENIJOBS Admin</h1>
          <p className="text-xs text-gray-500 mt-1">Secure Administrative Access</p>
        </div>

        <div className="glass-card rounded-3xl p-7 shadow-2xl">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/15 mb-6">
            <Shield size={14} className="text-violet-400" />
            <p className="text-[10px] text-violet-300 font-medium">This portal is restricted to authorized administrators only.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/15 mb-4">
              <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
              <p className="text-[11px] text-rose-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Admin Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@thenijobs.com"
                  className="search-input w-full pl-10 pr-4 py-3 text-sm animate-fade-in min-h-12"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="search-input w-full pl-10 pr-10 py-3 text-sm animate-fade-in min-h-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                  style={{ minHeight: '48px' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient min-h-12 py-3.5 rounded-2xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Authenticating...' : 'Access Admin Portal'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Quick Demo Login */}
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <p className="text-[10px] font-bold tracking-wider uppercase text-gray-500 mb-3 text-center">Quick Demo Login</p>
            <button
              type="button"
              onClick={handleDemoAdminLogin}
              disabled={loading}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 text-left transition-all group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">🔑</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-gray-300 group-hover:text-white transition-colors truncate">Demo Platform Admin</p>
                <p className="text-[9px] text-gray-500 truncate">admin@thenijobs.com</p>
              </div>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-400 transition-colors py-1.5 inline-block">
              ← Back to THENIJOBS
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-600 mt-6">
          Protected by Firebase Auth · Secure Admin Dashboard
        </p>
      </div>
    </div>
  );
}
