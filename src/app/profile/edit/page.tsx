'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';

export default function ProfileEditPage() {
  const { user, firebaseUser, loading } = useAuth() as any;
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const uid = user?.uid || firebaseUser?.uid;
    if (!uid) {
      router.replace('/login?redirect=/profile/edit');
      return;
    }

    const role = user?.role;
    if (role === 'employer' || role === 'business_owner' || role === 'supplier' || role === 'service_provider') {
      router.replace('/employer/company-profile');
    } else if (role === 'admin' || role === 'super_admin') {
      router.replace('/admin/settings');
    } else {
      router.replace('/seeker/profile');
    }
  }, [user, firebaseUser, loading, router]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans font-outfit pb-24">
      <Header />
      <div className="pt-24 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-500">Redirecting to profile editor...</p>
      </div>
      <BottomNav />
    </main>
  );
}
