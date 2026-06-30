import type { Metadata } from 'next';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import PublicProfilePageClient from './PublicProfilePageClient';

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

  if (!profile) {
    return {
      title: 'Profile Not Found | THENIJOBS',
      description: 'This profile is not available or has been set to private on THENIJOBS.',
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
