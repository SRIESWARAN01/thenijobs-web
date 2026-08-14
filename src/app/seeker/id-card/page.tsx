'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-500" size={28} />
      </div>
    );
  }

  const seekerData = {
    uid: user?.uid || '',
    name: profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Job Seeker',
    phone: profile?.phone || '',
    email: profile?.email || user?.email || '',
    profilePhotoUrl: profile?.profilePhotoUrl || user?.photoURL || '',
    district: profile?.district || '',
    state: profile?.state || 'Tamil Nadu',
    address: profile?.address || '',
    skills: profile?.skills || [],
    currentRole: profile?.currentRole || profile?.designation || '',
    experience: profile?.experience || [],
    education: profile?.education || [],
  };

  const isProfileComplete = seekerData.name && seekerData.skills?.length > 0;

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CreditCard size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              My Digital ID Card
            </h1>
            <p className="text-xs text-gray-500">Your professional THENIJOBS identity card</p>
          </div>
        </div>
      </div>

      {!isProfileComplete && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Complete Your Profile</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Add your skills, education, and experience to make your ID Card more professional.
            </p>
            <Link href="/seeker/profile" className="text-xs text-amber-700 font-semibold underline mt-1 inline-block">
              Complete Profile →
            </Link>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col items-center">
        <SeekerIDCard seeker={seekerData} />
      </div>

      {/* Info */}
      <div className="mt-6 bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
        <h3 className="text-sm font-semibold text-emerald-800 mb-2">💡 How to use your Digital ID Card</h3>
        <ul className="space-y-1.5 text-xs text-emerald-700">
          <li>• Share with employers when applying for jobs</li>
          <li>• Present at job interviews as a quick reference</li>
          <li>• QR code links to your private THENIJOBS portfolio</li>
          <li>• Download as PNG for sharing via WhatsApp or email</li>
        </ul>
      </div>
    </div>
  );
}
