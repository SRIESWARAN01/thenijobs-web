import { cache } from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import CompanyDigitalCardPageClient from './CompanyDigitalCardPageClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Memoize company fetch
const getCompanyBySlug = cache(async (slug: string): Promise<any> => {
  try {
    const q = query(
      collection(db, 'companies'),
      where('slug', '==', slug),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }

    // Fallback 1: Extract possible ID from name-id slug structure (e.g., name-Js5S3mEMVKZz6WkOlonP)
    const lastHyphenIndex = slug.lastIndexOf('-');
    if (lastHyphenIndex !== -1) {
      const possibleId = slug.substring(lastHyphenIndex + 1);
      if (possibleId.length === 20 && /^[a-zA-Z0-9]+$/.test(possibleId)) {
        const docSnap = await getDoc(doc(db, 'companies', possibleId));
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
      }
    }

    // Fallback 2: Try fetching by document ID directly
    const docSnap = await getDoc(doc(db, 'companies', slug));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }

    // Fallback 3: Try checking aliases array (if company has redirects)
    const aliasQuery = query(
      collection(db, 'companies'),
      where('aliases', 'array-contains', slug),
      limit(1)
    );
    const aliasSnap = await getDocs(aliasQuery);
    if (!aliasSnap.empty) {
      return { id: aliasSnap.docs[0].id, ...aliasSnap.docs[0].data() };
    }
  } catch (err) {
    console.error('Failed to fetch company data for card:', err);
  }
  return null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const companyData = await getCompanyBySlug(slug);

  const title = companyData
    ? `${companyData.name || 'Business'} - Digital ID Card`
    : 'Business ID Card Not Found';

  return {
    title,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default async function CompanyDigitalCardPage({ params }: PageProps) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  return <CompanyDigitalCardPageClient slug={slug} initialCompany={company} />;
}
