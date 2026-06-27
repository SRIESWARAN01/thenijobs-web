'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Check, Briefcase, Building2, Loader2, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardPathForRole } from '@/lib/access';

const ROLES = [
  {
    id: 'job_seeker',
    label: 'Job Seeker',
    subLabel: 'வேலை தேடுகிறேன்',
    icon: Briefcase,
    desc: 'Find jobs, build profile, track applications',
    color: 'violet',
  },
  {
    id: 'business',
    label: 'Business / Employer',
    subLabel: 'Business நடத்துகிறேன்',
    icon: Building2,
    desc: 'Post jobs, showcase products & services, get client leads',
    color: 'emerald',
  },
];

const colorMap: Record<string, string> = {
  violet: 'border-violet-500 bg-violet-500/10',
  emerald: 'border-emerald-500 bg-emerald-500/10',
};

const iconColorMap: Record<string, string> = {
  violet: 'text-violet-400',
  emerald: 'text-emerald-400',
};

const iconTintMap: Record<string, string> = {
  violet: 'bg-violet-500/20',
  emerald: 'bg-emerald-500/20',
};

export default function RoleSelectionPage() {
  const router = useRouter();
  const { user, firebaseUser, loading: authLoading, loginWithCustomToken } = useAuth();
  
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    } else if (!authLoading && user?.role) {
      router.replace(getDashboardPathForRole(user.role));
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center font-outfit text-white">
        <Loader2 size={36} className="text-violet-500 animate-spin mb-4" />
        <p className="text-sm text-gray-400 font-medium">Loading auth details...</p>
      </main>
    );
  }

  if (!user) return null;

  const handleConfirmRole = async () => {
    if (!role) {
      setError('Please select a role to continue.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idToken = firebaseUser ? await firebaseUser.getIdToken() : null;
      const res = await fetch('/api/auth/select-role', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ uid: user.uid, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user role');
      }

      // Re-sign in client-side with new token to refresh claims
      if (data.customToken) {
        await loginWithCustomToken(data.customToken);
      }

      // Redirect directly to profile-setup
      router.replace('/profile-setup');
    } catch (err: any) {
      console.error('[Role Selection error]:', err);
      setError(err.message || 'Verification error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppContact = () => {
    const errorDetails = error ? ` Error details: ${error}` : '';
    const text = `Hi Admin, I am facing an issue with Role Selection on TheniJobs. UID: ${user.uid}.${errorDetails}`;
    window.open(`https://wa.me/917094826586?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4 blob-bg grid-pattern py-10 font-outfit">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Image src="/logo.png" alt="THENIJOBS Logo" width={160} height={40} className="h-10 w-auto object-contain" />
        </div>

        <div className="glass-card rounded-3xl p-7 shadow-2xl border border-white/5">
          <h1 className="text-2xl font-bold text-white mb-1 text-center">Account Registration</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Choose your account type to proceed</p>

          {error && (
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/15">
                <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
                <p className="text-[11px] text-rose-300">{error}</p>
              </div>
              <button
                type="button"
                onClick={handleWhatsAppContact}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
              >
                <Image src="/whatsapp-icon.png" alt="WhatsApp" width={14} height={14} className="brightness-0 invert error-icon-hide" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                Contact Admin (WhatsApp)
              </button>
            </div>
          )}

          <div className="space-y-3.5">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => { setRole(r.id); setError(null); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left
                  ${role === r.id ? `${colorMap[r.color]} border-2` : 'bg-white/[0.03] border-white/10 hover:bg-white/5'}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                  ${role === r.id ? iconTintMap[r.color] : 'bg-white/5'}`}>
                  <r.icon size={20} className={role === r.id ? iconColorMap[r.color] : 'text-gray-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm">{r.label}</div>
                  <div className="text-xs text-slate-350 mt-0.5">{r.subLabel}</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{r.desc}</div>
                </div>
                {role === r.id && <Check size={16} className={iconColorMap[r.color]} />}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleConfirmRole}
            disabled={!role || loading}
            className="w-full btn-gradient min-h-12 py-3.5 rounded-2xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2 mt-6 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Complete Setup
          </button>
        </div>
      </div>
    </div>
  );
}
