'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { useToast } from '@/contexts/ToastContext';
import { updateDocument, logActivity } from '@/lib/firebase/firestoreService';
import CompanyProfileEditor, { type CompanyProfileEditorSaveFields } from '@/components/company/editor/CompanyProfileEditor';
import AdminContextBanner from '@/components/admin/AdminContextBanner';
import { Loader2, Building2 } from 'lucide-react';
import { EmptyState, PageShell, PageHeader } from '@/components/dashboard';

export default function AdminProfileManagerClient({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data: company, loading: companyLoading } = useDocument<any>('companies', companyId);

  const logProfileAction = (action: string, details: string) => {
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
          title="Company profile"
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Businesses', href: '/admin/businesses' }, { label: 'Profile' }]}
        />
        <EmptyState
          icon={Building2}
          title="Company not found"
          description={`No company exists with id ${companyId}.`}
        />
      </PageShell>
    );
  }

  const handleSave = async (docData: CompanyProfileEditorSaveFields) => {
    await updateDocument('companies', companyId, { ...docData, updatedAt: new Date() });
    logProfileAction('Updated company profile', 'Branding, contact, location, socials or listings changed by admin');
    toast.success('Company profile updated successfully.');
  };

  return (
    <PageShell>
      <AdminContextBanner companyName={company.name} />
      <CompanyProfileEditor
        initialCompany={company}
        title={`${company.name} — Profile`}
        description="Manage this company's branding, products, services and branches on their behalf."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Businesses', href: '/admin/businesses' }, { label: 'Profile' }]}
        viewerIsAdmin
        onSave={handleSave}
      />
    </PageShell>
  );
}
