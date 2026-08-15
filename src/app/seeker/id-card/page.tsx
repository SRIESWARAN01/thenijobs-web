'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { Loader2, CreditCard, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import Link from 'next/link';
import SeekerIDCard from '@/components/id-card/SeekerIDCard';

export default function SeekerIDCardPage() {
  const { user } = useAuth();
  const { data: profile, loading } = useDocument<any>(
    'seekerProfiles',
    user?.uid,
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 font-outfit">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
        <p className="text-xs text-gray-500 font-semibold">Generating your digital candidate pass...</p>
      </div>
    );
  }

  const seekerData = {
    uid: user?.uid || '',
    name: profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Job Seeker',
    phone: profile?.phone || (user as any)?.phoneNumber || (user as any)?.phone || '',
    email: profile?.email || user?.email || '',
    profilePhotoUrl: profile?.photoUrl || profile?.profilePhotoUrl || user?.photoURL || '',
    district: profile?.district || 'Theni',
    state: profile?.state || 'Tamil Nadu',
    address: profile?.address || '',
    skills: profile?.skills || [],
    currentRole: profile?.currentRole || profile?.designation || '',
    experience: profile?.experience || [],
    education: profile?.education || [],
  };

  const isProfileComplete = Boolean(seekerData.name && seekerData.skills?.length > 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-outfit text-gray-900 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">
          Digital Candidate Pass &amp; ID Card
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Your official THENIJOBS verified candidate identity card with live portfolio QR code
        </p>
      </div>

      {!isProfileComplete && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-xs">
          <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-bold text-amber-950">Enhance Your Digital ID Card</p>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Add your top skills, education, and career experience to showcase on your digital card.
            </p>
            <Link href="/seeker/profile" className="text-xs text-amber-950 font-black underline mt-1.5 inline-block">
              Complete Profile Now →
            </Link>
          </div>
        </div>
      )}

      {/* Card Container */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-xs flex flex-col items-center">
        <SeekerIDCard seeker={seekerData} />
      </div>

      {/* Usage Guide */}
      <div className="bg-emerald-50/70 rounded-3xl p-5 sm:p-6 border border-emerald-200 space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-600" />
          How to utilize your Verified Candidate Pass:
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-emerald-900 font-medium">
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">•</span>
            <span>Share via WhatsApp to hiring managers for instant 1-click CV verification</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">•</span>
            <span>Show at direct job interviews and walk-in drives across Theni district</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">•</span>
            <span>QR code opens your live mobile-responsive portfolio and verified qualifications</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">•</span>
            <span>Download anytime in high-resolution vector PNG format</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
