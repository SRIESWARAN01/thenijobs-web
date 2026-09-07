'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDocument, useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { updateDocument, logActivity } from '@/lib/firebase/firestoreService';
import type { PortfolioSite } from '@/lib/types/portfolio';
import PortfolioSiteEditor from '@/components/portfolio/editor/PortfolioSiteEditor';
import { Loader2, Globe } from 'lucide-react';
import { EmptyState, PageShell, PageHeader } from '@/components/dashboard';

export default function AdminWebsiteManagerClient({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const { data: company, loading: companyLoading } = useDocument<any>('companies', companyId);
  const { data: sites, loading: sitesLoading } = useCollection<any>('portfolioSites', [
    where('companyId', '==', companyId)
  ]);
  const site = sites?.[0] as PortfolioSite | undefined;

  const logWebsiteAction = (action: string, details: string) => {
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

  if (companyLoading || sitesLoading) {
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
          title="Company website"
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Businesses', href: '/admin/businesses' }, { label: 'Website' }]}
        />
        <EmptyState
          icon={Globe}
          title="Company not found"
          description={`No company exists with id ${companyId}.`}
        />
      </PageShell>
    );
  }

  if (!site) {
    return (
      <PageShell className="max-w-3xl">
        <PageHeader
          title={`${company.name} — Website`}
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Businesses', href: '/admin/businesses' }, { label: 'Website' }]}
        />
        <EmptyState
          icon={Globe}
          title="This company has not created a website yet"
          description="The employer picks a starting template from their own dashboard (Website → Templates) before a site exists to edit. Admin editing begins once that first choice is made."
        />
      </PageShell>
    );
  }

  return (
    <PortfolioSiteEditor
      initialSite={site}
      planSlug={company.subscriptionPlan || 'free'}
      backHref="/admin/businesses"
      onSave={async (fields) => {
        await updateDocument('portfolioSites', site.id, { ...fields, updatedAt: new Date() });
        logWebsiteAction('Updated company website', 'Sections, theme, branding, or SEO changed by admin');
      }}
      onPublishToggle={async (newStatus) => {
        await updateDocument('portfolioSites', site.id, {
          status: newStatus,
          visibility: newStatus === 'published' ? 'public' : 'private',
          publishedAt: newStatus === 'published' ? new Date() : null,
          updatedAt: new Date(),
        });
        logWebsiteAction(
          newStatus === 'published' ? 'Published company website' : 'Unpublished company website',
          `Status changed to ${newStatus} by admin`
        );
      }}
    />
  );
}
