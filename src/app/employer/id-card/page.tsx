'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { AlertCircle, Building2, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import CompanyIDCard, { type CompanyIDCardProps } from '@/components/id-card/CompanyIDCard';
import { Button, Card, CardBody, EmptyState, PageHeader, PageShell } from '@/components/dashboard';

type CompanyDoc = CompanyIDCardProps['company'];

export default function EmployerIDCardPage() {
  const { user } = useAuth();
  const { data: companies, loading } = useCollection<CompanyDoc>(
    'companies',
    [where('ownerId', '==', user?.uid || '')],
    { skip: !user?.uid },
  );
  const company = companies?.[0];

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-xs font-semibold text-slate-500">Generating your digital visiting card…</p>
        </div>
      </PageShell>
    );
  }

  if (!company) {
    return (
      <PageShell className="max-w-2xl">
        <EmptyState
          icon={Building2}
          title="No company registered"
          description="Register your business profile first to generate your THENIJOBS digital visiting card with a shareable QR pass."
          action={
            <Link href="/employer/company-profile">
              <Button variant="primary">Create company profile</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  const isVerified = company.verificationStatus === 'verified';

  return (
    <PageShell className="max-w-4xl">
      <PageHeader
        title="Digital business visiting card"
        description="Your company visiting card with instant QR portfolio pass, downloadable in high resolution for print and WhatsApp sharing."
        breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'ID card' }]}
      />

      {!isVerified && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-[#FFFBEB] p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="text-sm font-bold text-[#78350F]">Verification in progress</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#92400E]">
              Your company profile is currently being verified. This digital card is fully functional for preview and sharing.
            </p>
          </div>
        </div>
      )}

      <Card className="flex flex-col items-center p-6 sm:p-10">
        <CompanyIDCard company={company} />
      </Card>

      <Card className="border-blue-200 bg-[#EFF6FF]">
        <CardBody className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#1E3A8A]">
            <Sparkles size={16} className="text-blue-600" aria-hidden />
            How to use your digital visiting card
          </h2>
          <ul className="grid grid-cols-1 gap-2 text-xs font-medium text-[#1E40AF] sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">•</span>
              <span>Share via WhatsApp to clients &amp; job seekers for instant company credibility</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">•</span>
              <span>Print and place at your office front desk or trade fair booth</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">•</span>
              <span>QR code opens your live products &amp; services catalogue</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600">•</span>
              <span>Download anytime in high-resolution vector format</span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </PageShell>
  );
}
