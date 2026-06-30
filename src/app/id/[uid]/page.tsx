import { cache } from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import DigitalIdCardPageClient from './DigitalIdCardPageClient';
import { User } from 'lucide-react';

interface PageProps {
  params: Promise<{ uid: string }>;
}

// Memoize candidate profile fetch
const getProfile = cache(async (uid: string) => {
  try {
    const docSnap = await getDoc(doc(db, 'publicProfiles', uid));
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error('Error fetching profile for ID card:', err);
  }
  return null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { uid } = await params;
  const profile = await getProfile(uid);

  const title = profile
    ? `${profile.name || profile.displayName || 'Member'} - Digital ID Card`
    : 'ID Card Not Found';

  return {
    title,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default async function DigitalIdDynamicPage({ params }: PageProps) {
  const { uid } = await params;
  const profile = await getProfile(uid);

  const isSuspendedOrDeleted = profile && (
    profile.isActive === false || 
    profile.status === 'suspended' || 
    profile.status === 'deleted' || 
    profile.deleted === true
  );

  if (isSuspendedOrDeleted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070714] px-6 text-center text-white font-sans">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 max-w-md backdrop-blur-md shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-4 animate-bounce">
            <User size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ID Card not available</h1>
          <p className="mt-2 text-sm text-gray-400">
            This candidate ID card has been suspended, removed, or is currently undergoing review.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-xl bg-violet-600 px-6 text-xs font-bold text-white hover:bg-violet-700 transition-all shadow-md active:scale-95"
          >
            Go Back Home
          </a>
        </div>
      </main>
    );
  }

  return <DigitalIdCardPageClient uid={uid} />;
}
