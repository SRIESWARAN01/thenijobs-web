'use client';

import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { useCollection } from '@/hooks/useFirestore';
import { createDocument, updateDocument } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';
import CompanyProfileEditor, { type CompanyProfileEditorSaveFields } from '@/components/company/editor/CompanyProfileEditor';

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const toast = useToast();

  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const resolvedCompany = companies[0];

  if (companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit">
        <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-600">Loading company profile...</p>
      </div>
    );
  }

  const handleSave = async (docData: CompanyProfileEditorSaveFields) => {
    if (resolvedCompany?.id) {
      await updateDocument('companies', resolvedCompany.id, { ...docData, updatedAt: new Date() });
      if (resolvedCompany.verificationStatus === 'rejected') {
        toast.success('Profile updated! Please contact support or wait for admin to re-review your listing.');
      } else {
        toast.success('Company profile updated successfully!');
      }
    } else {
      await createDocument('companies', {
        ...docData,
        ownerId: user?.uid,
        verificationStatus: 'pending',
        isActive: false,
        viewCount: 0,
        updatedAt: new Date()
      });
      toast.success('Company profile created successfully! It is currently pending admin approval.');
    }
  };

  return (
    <CompanyProfileEditor
      initialCompany={resolvedCompany}
      title="Company profile"
      description="Manage your company branding, products, services and branches."
      breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Company profile' }]}
      onSave={handleSave}
    />
  );
}
