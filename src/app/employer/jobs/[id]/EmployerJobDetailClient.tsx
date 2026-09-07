'use client';

import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import CompanyJobDetailManager from '@/components/jobs/editor/CompanyJobDetailManager';

export default function EmployerJobDetailClient({ jobId }: { jobId: string }) {
  const { user } = useAuth();

  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const companyId = companies?.[0]?.id;

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
