'use client';

import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployerCompany } from '@/hooks/useEmployerCompany';
import CompanyJobDetailManager from '@/components/jobs/editor/CompanyJobDetailManager';

export default function EmployerJobDetailClient({ jobId }: { jobId: string }) {
  const { user } = useAuth();
  const { companyId, loading: companyLoading } = useEmployerCompany();

  if (companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <CompanyJobDetailManager
      jobId={jobId}
      companyId={companyId || ''}
      basePath="/employer/jobs"
      breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }]}
    />
  );
}
