'use client';

import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { useEmployerCompany } from '@/hooks/useEmployerCompany';
import { createDocument, updateDocument } from '@/lib/firebase/firestoreService';
import { getUniqueCompanySlug, reserveCompanySlug, linkUserToCompany } from '@/lib/company/companyResolver';
import CompanyProfileEditor, { type CompanyProfileEditorSaveFields } from '@/components/company/editor/CompanyProfileEditor';

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  const { company: resolvedCompany, loading: companyLoading } = useEmployerCompany();

  if (companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit">
        <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-600">Loading company profile...</p>
      </div>
    );
  }

  const handleSave = async (docData: CompanyProfileEditorSaveFields) => {
    try {
      if (resolvedCompany?.id) {
        await updateDocument('companies', resolvedCompany.id, { ...docData, updatedAt: new Date() });
        if (resolvedCompany.verificationStatus === 'rejected') {
          toast.success('Profile updated! Please contact support or wait for admin to re-review your listing.');
        } else {
          toast.success('Company profile updated successfully!');
        }
      } else {
        const uniqueSlug = await getUniqueCompanySlug(docData.name || 'company', docData.district);
        const createdId = await createDocument('companies', {
          ...docData,
          slug: uniqueSlug,
          ownerId: user?.uid,
          ownerEmail: user?.email ? user.email.toLowerCase().trim() : '',
          verificationStatus: 'pending',
          isActive: false,
          viewCount: 0,
          updatedAt: new Date(),
        });

        if (user?.uid && createdId) {
          await reserveCompanySlug(uniqueSlug, createdId, user.uid, user.email);
          await linkUserToCompany(user.uid, createdId);
        }

        toast.success('Company profile created successfully! It is currently pending admin approval.');
      }
    } catch (err: any) {
      console.error('Error saving company profile:', err);
      toast.error('Failed to save company profile: ' + (err.message || ''));
    }
  };

  return (
    <CompanyProfileEditor
      initialCompany={resolvedCompany || undefined}
      title="Company profile"
      description="Manage your company branding, products, services and branches."
      breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Company profile' }]}
      onSave={handleSave}
    />
  );
}
