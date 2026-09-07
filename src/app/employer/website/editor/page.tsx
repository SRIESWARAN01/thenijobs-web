'use client';

import Link from 'next/link';
import { Globe, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import type { PortfolioSite } from '@/lib/types/portfolio';
import PortfolioSiteEditor from '@/components/portfolio/editor/PortfolioSiteEditor';

export default function WebsiteEditorPage() {
  const { user } = useAuth();

  const { data: companies } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies?.[0];

  const { data: sites, loading } = useCollection<any>('portfolioSites', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const site = sites?.[0] as PortfolioSite | undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Globe size={32} className="text-slate-500" />
        <p className="text-sm text-gray-500">No website found. Please select a template first.</p>
        <Link href="/employer/website/templates" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">
          Choose Template
        </Link>
      </div>
    );
  }

  return (
    <PortfolioSiteEditor
      initialSite={site}
      planSlug={company?.subscriptionPlan || 'free'}
      backHref="/employer/website"
      onSave={async (fields) => {
        await updateDocument('portfolioSites', site.id, { ...fields, updatedAt: new Date() });
      }}
      onPublishToggle={async (newStatus) => {
        await updateDocument('portfolioSites', site.id, {
          status: newStatus,
          visibility: newStatus === 'published' ? 'public' : 'private',
          publishedAt: newStatus === 'published' ? new Date() : null,
          updatedAt: new Date(),
        });
      }}
    />
  );
}
