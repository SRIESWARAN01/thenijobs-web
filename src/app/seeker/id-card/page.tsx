'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import SeekerIDCard, { type SeekerIDCardProps } from '@/components/id-card/SeekerIDCard';
import { Card, CardBody, PageHeader, PageShell } from '@/components/dashboard';

interface SeekerProfileDoc {
  name?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  profilePhotoUrl?: string;
  district?: string;
  state?: string;
  address?: string;
  skills?: string[];
  currentRole?: string;
  designation?: string;
  experience?: unknown[];
  education?: unknown[];
}

export default function SeekerIDCardPage() {
  const auth = useAuth();
  const user = auth.user as { uid?: string; displayName?: string; email?: string | null; photoURL?: string; phoneNumber?: string } | null | undefined;
  const { data: profile, loading } = useDocument<SeekerProfileDoc>(
    'seekerProfiles',
    user?.uid,
  );

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
          <p className="text-xs font-semibold text-slate-500">Generating your digital candidate pass…</p>
        </div>
      </PageShell>
    );
  }

  const seekerData: SeekerIDCardProps['seeker'] = {
    uid: user?.uid || '',
    name: profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Job Seeker',
    phone: profile?.phone || user?.phoneNumber || '',
    email: profile?.email || user?.email || '',
    profilePhotoUrl: profile?.photoUrl || profile?.profilePhotoUrl || user?.photoURL || '',
    district: profile?.district || 'Theni',
    state: profile?.state || 'Tamil Nadu',
    address: profile?.address || '',
    skills: profile?.skills || [],
    currentRole: profile?.currentRole || profile?.designation || '',
    experience: (profile?.experience as SeekerIDCardProps['seeker']['experience']) || [],
    education: (profile?.education as SeekerIDCardProps['seeker']['education']) || [],
  };

  const isProfileComplete = Boolean(seekerData.name && (seekerData.skills?.length ?? 0) > 0);

  return (
    <PageShell className="max-w-4xl">
      <PageHeader
        title="Digital candidate pass & ID card"
        description="Your THENIJOBS digital candidate identity card with a live portfolio QR code."
        breadcrumbs={[{ label: 'Seeker', href: '/seeker/dashboard' }, { label: 'ID card' }]}
      />

      {!isProfileComplete && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-[#FFFBEB] p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-bold text-[#78350F]">Enhance your digital ID card</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#92400E]">
              Add your top skills, education and career experience to showcase on your digital card.
            </p>
            <Link href="/seeker/profile" className="mt-1.5 inline-block text-xs font-bold text-[#78350F] underline">
              Complete profile now →
            </Link>
          </div>
        </div>
      )}

      <Card className="flex flex-col items-center p-6 sm:p-10">
        <SeekerIDCard seeker={seekerData} />
      </Card>

      <Card className="border-emerald-200 bg-[#ECFDF5]">
        <CardBody className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#065F46]">
            <Sparkles size={16} className="text-emerald-600" aria-hidden />
            How to use your candidate pass
          </h2>
          <ul className="grid grid-cols-1 gap-2.5 text-xs font-medium text-[#065F46] sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600">•</span>
              <span>Share via WhatsApp to hiring managers for an instant 1-click CV link</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600">•</span>
              <span>Show at direct job interviews and walk-in drives across Theni district</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600">•</span>
              <span>QR code opens your live, mobile-responsive portfolio and qualifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600">•</span>
              <span>Download anytime in high-resolution vector PNG format</span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </PageShell>
  );
}
