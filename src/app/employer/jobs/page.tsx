'use client';

import Link from 'next/link';
import { Briefcase, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import CompanyJobsListManager from '@/components/jobs/editor/CompanyJobsListManager';

export default function EmployerJobsPage() {
  const { user } = useAuth();

  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies?.[0];
  const companyId = company?.id;

  if (companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={32} className="text-blue-600 animate-spin" />
        <p className="text-xs text-gray-500 font-semibold">Loading job listings...</p>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 py-20 text-center px-4 font-outfit">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-200 shadow-xs">
          <Briefcase size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Company Profile</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
          Register your company profile first to post and manage job openings on THENIJOBS.
        </p>
        <Link
          href="/employer/company-profile"
          className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
        >
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <CompanyJobsListManager
      companyId={companyId}
      companyName={company?.name || 'Company'}
      basePath="/employer/jobs"
      postNewHref="/employer/post-job"
    />
  );
}
