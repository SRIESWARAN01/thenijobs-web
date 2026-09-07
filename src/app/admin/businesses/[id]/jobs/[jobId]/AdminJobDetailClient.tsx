'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { logActivity } from '@/lib/firebase/firestoreService';
import CompanyJobDetailManager from '@/components/jobs/editor/CompanyJobDetailManager';
import AdminContextBanner from '@/components/admin/AdminContextBanner';
import { Loader2, Building2 } from 'lucide-react';
import { EmptyState, PageShell, PageHeader } from '@/components/dashboard';

export default function AdminJobDetailClient({ companyId, jobId }: { companyId: string; jobId: string }) {
  const { user } = useAuth();
  const { data: company, loading: companyLoading } = useDocument<any>('companies', companyId);

  const logJobAction = (action: string, details: string) => {
    if (!user) return;
    void logActivity({
      userId: user.uid,
      userName: user.displayName || 'Admin',
      action,
      target: company?.name || companyId,
      targetId: jobId,
      details,
    });
  };

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!company) {
    return (
      <PageShell className="max-w-3xl">
        <PageHeader
          title="Job detail"
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Businesses', href: '/admin/businesses' }, { label: 'Jobs' }]}
        />
        <EmptyState
          icon={Building2}
          title="Company not found"
          description={`No company exists with id ${companyId}.`}
        />
      </PageShell>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-4 sm:space-y-6">
      <AdminContextBanner companyName={company.name} />
      <CompanyJobDetailManager
        jobId={jobId}
        companyId={companyId}
        basePath={`/admin/businesses/${companyId}/jobs`}
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Businesses', href: '/admin/businesses' }]}
        onWrite={logJobAction}
      />
    </div>
  );
}
