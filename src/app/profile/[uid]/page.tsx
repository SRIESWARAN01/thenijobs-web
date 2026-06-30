import type { Metadata } from 'next';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import PublicProfilePageClient from './PublicProfilePageClient';
import { User } from 'lucide-react';

interface PageProps {
  params: Promise<{ uid: string }>;
}

async function getProfile(uid: string) {
  try {
    const docSnap = await getDoc(doc(db, 'publicProfiles', uid));
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error('Error fetching profile for metadata:', err);
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { uid } = await params;
  const profile = await getProfile(uid);

  const isSuspendedOrDeleted = !profile || 
    profile.isActive === false || 
    profile.status === 'suspended' || 
    profile.status === 'deleted' || 
    profile.deleted === true;

  if (isSuspendedOrDeleted) {
    return {
      title: 'Profile Not Available | THENIJOBS',
      description: 'This profile is currently not available on THENIJOBS.',
      robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
        }
      }
    };
  }

  const name = profile.name || profile.displayName || 'THENIJOBS Member';
  const role = profile.currentRole || profile.qualification || 'Job Seeker';
  const district = profile.district || 'Theni';
  const description = `${name} is looking for ${role} opportunities in ${district} district. View full resume, skills, experience, and certifications on THENIJOBS.`;
  const profileUrl = `https://thenijobs.com/profile/${uid}`;
  const photoUrl = profile.photoUrl || profile.profilePhotoUrl || profile.photoURL || undefined;

  return {
    title: `${name} - ${role} Resume | THENIJOBS`,
    description,
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      title: `${name} | ${role} on THENIJOBS`,
      description,
      type: 'profile',
      url: profileUrl,
      ...(photoUrl ? { images: [{ url: photoUrl, alt: `${name} Photo` }] } : {}),
    },
    twitter: {
      card: 'summary',
      title: `${name} | ${role}`,
      description,
      ...(photoUrl ? { images: [photoUrl] } : {}),
    },
  };
}

export default async function PublicProfileDynamicPage({ params }: PageProps) {
  const { uid } = await params;
  const profile = await getProfile(uid);

  const isSuspendedOrDeleted = !profile || 
    profile.isActive === false || 
    profile.status === 'suspended' || 
    profile.status === 'deleted' || 
    profile.deleted === true;

  if (isSuspendedOrDeleted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070714] px-6 text-center text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 max-w-md backdrop-blur-md shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-4 animate-bounce">
            <User size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Profile not available</h1>
          <p className="mt-2 text-sm text-gray-400">
            This candidate profile has been suspended, removed, or is currently undergoing review.
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

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://thenijobs.com'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Candidates',
        'item': 'https://thenijobs.com/jobs'
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': profile?.name || 'Candidate Profile',
        'item': `https://thenijobs.com/profile/${uid}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <PublicProfilePageClient uid={uid} />
    </>
  );
}
