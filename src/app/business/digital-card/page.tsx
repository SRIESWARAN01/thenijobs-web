'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { Building2, Loader2 } from 'lucide-react';
import CompanyDigitalCardPageClient from '@/app/id/company/[slug]/CompanyDigitalCardPageClient';

export default function BusinessDigitalCardPage() {
  const { user } = useAuth();

  // Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];

  if (companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-white">
        <Loader2 size={36} className="text-purple-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading business card details...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <Building2 size={48} className="text-gray-500 mb-4" />
        <h2 className="text-lg font-semibold text-white">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to view and download your professional Digital Business Card.</p>
        <Link href="/business/company-profile" className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CompanyDigitalCardPageClient slug={company.slug || company.id} initialCompany={company} />
    </div>
  );
}
