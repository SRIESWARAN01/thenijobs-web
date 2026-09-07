'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { logActivity } from '@/lib/firebase/firestoreService';
import CompanyJobsListManager from '@/components/jobs/editor/CompanyJobsListManager';
import AdminContextBanner from '@/components/admin/AdminContextBanner';
import { Loader2, Building2 } from 'lucide-react';
import { EmptyState, PageShell, PageHeader } from '@/components/dashboard';

export default function AdminJobsListClient({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const { data: company, loading: companyLoading } = useDocument<any>('companies', companyId);

  const logJobsAction = (action: string, details: string) => {
    if (!user) return;
    void logActivity({
      userId: user.uid,
      userName: user.displayName || 'Admin',
      action,
      target: company?.name || companyId,
      targetId: companyId,
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
          title="Company jobs"
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
    <PageShell>
      <AdminContextBanner companyName={company.name} />
      <CompanyJobsListManager
        companyId={companyId}
        companyName={company.name}
        basePath={`/admin/businesses/${companyId}/jobs`}
        onWrite={logJobsAction}
      />
    </PageShell>
  );
}
