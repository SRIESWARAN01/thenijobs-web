'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Clock, ShieldAlert, ArrowLeft, LogOut, Check } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function EmployerPendingPage() {
  // Enforce pending_employer access (or admins)
  const { user, loading } = useRequireAuth(['pending_employer', 'admin', 'super_admin']);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center font-outfit">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4 blob-bg grid-pattern font-outfit">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <Image src="/logo.png" alt="THENIJOBS Logo" width={40} height={40} className="h-10 w-10 object-contain rounded-xl" />
          <span className="font-outfit font-black text-2xl tracking-wider text-white">THENIJOBS</span>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-2xl text-center border border-white/[0.08] relative overflow-hidden">
          {/* Decorative glowing background */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Pending Icon */}
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6 relative">
            <Clock size={36} className="text-amber-400 animate-pulse" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#0d0d20] border border-amber-500/30 flex items-center justify-center">
              <ShieldAlert size={12} className="text-amber-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">Verification Pending</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            வணக்கம் <span className="text-amber-400 font-semibold">{user.displayName || 'Employer'}</span>.
            Your employer registration request has been submitted successfully.
          </p>

          {/* Status Timeline */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-left space-y-4 mb-6">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Check size={12} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">1. Account Created</p>
                <p className="text-[10px] text-gray-500">Your account credentials and profile request were registered.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Clock size={12} className="text-amber-400 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300">2. Admin Verification (In Progress)</p>
                <p className="text-[10px] text-gray-400">Our team is reviewing your profile to approve employer/recruiter features. This usually takes 1-2 hours.</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-8">
            You will receive an email confirmation once approval is granted. For urgent approvals, please reach out to our support channel.
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-sm font-semibold text-white transition-colors hover:bg-white/[0.04] flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Home
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-sm font-semibold text-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
