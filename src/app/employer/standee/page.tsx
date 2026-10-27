'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { Building2, Loader2, Printer, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button, EmptyState, PageHeader, PageShell } from '@/components/dashboard';
import TableTopStandeeGenerator from '@/components/company/TableTopStandeeGenerator';

interface CompanyDoc {
  id: string;
  slug?: string;
  name: string;
  tagline?: string;
  location?: string;
  district?: string;
  phone?: string;
  whatsapp?: string;
  verificationStatus?: string;
}

export default function EmployerStandeePage() {
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
          <p className="text-xs font-semibold text-slate-500">Preparing your printable table-top standee studio…</p>
        </div>
      </PageShell>
    );
  }

  if (!company) {
    return (
      <PageShell className="max-w-2xl">
        <EmptyState
          icon={Building2}
          title="No business profile registered"
          description="Register your business profile first to generate custom QR table-top standees and posters for your shop counter or hospital reception."
          action={
            <Link href="/employer/company-profile">
              <Button variant="primary">Create business profile</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-5xl">
      <PageHeader
        title="Printable QR Table-Top Standee (PDF)"
        description="Generate ready-to-print A4 / A5 table-top acrylic standees with high-contrast QR codes, THENIJOBS verification seal, and Tamil/English hiring & catalog copy."
        breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'QR Standee Generator' }]}
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <Sparkles size={13} className="text-emerald-600" /> Print-Ready 300 DPI Vector PDF
            </span>
          </div>
        }
      />

      <TableTopStandeeGenerator company={company} />
    </PageShell>
  );
}
