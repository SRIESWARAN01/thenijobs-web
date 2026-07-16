import { cache } from 'react';
import type { Metadata } from 'next';
import ServiceDetailPageClient from './ServiceDetailPageClient';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Memoize Firestore fetching to share between metadata and rendering
const getServiceData = cache(async (id: string) => {
  try {
    const docSnap = await getDoc(doc(db, 'services', id));
    if (docSnap.exists()) {
      const service = { id: docSnap.id, ...docSnap.data() } as any;
      
      // Fetch company by providerId (ownerId)
      const qCompany = query(
        collection(db, 'companies'),
        where('ownerId', '==', service.providerId),
        limit(1)
      );
      const snapCompany = await getDocs(qCompany);
      let company: any = null;
      if (!snapCompany.empty) {
        company = { id: snapCompany.docs[0].id, ...snapCompany.docs[0].data() };
      }
      
      // Fetch related services
      const qRelated = query(
        collection(db, 'services'),
        where('providerId', '==', service.providerId),
        where('status', '==', 'active'),
        limit(5)
      );
      const snapRelated = await getDocs(qRelated);
      const relatedServices = snapRelated.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((s: any) => s.id !== id);

      return { service, company, relatedServices };
    }
  } catch (err) {
    console.error('Failed to fetch service details:', err);
  }
  return null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getServiceData(id);

  if (!data || !data.service) {
    return {
      title: 'Service Not Found',
      description: 'The requested service listing may have been removed or is unavailable.',
    };
  }

  const { service, company } = data;
  const title = `${service.name} Services in ${service.location || service.district || 'Theni'}${company?.name ? ` by ${company.name}` : ''} | THENIJOBS`;
  const description = service.description
    ? String(service.description).replace(/\s+/g, ' ').slice(0, 160)
    : `Enquire about ${service.name} services in ${service.location || 'Theni'} on THENIJOBS.`;
  const imageUrl = service.imageUrl || company?.logoUrl || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `https://thenijobs.com/services/${id}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 },
    },
    openGraph: {
      title: `${title} — THENIJOBS`,
      description,
      type: 'website',
      url: `https://thenijobs.com/services/${id}`,
      ...(imageUrl ? { images: [{ url: imageUrl, width: 800, height: 600, alt: service.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — THENIJOBS`,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export async function generateStaticParams() {
  try {
    const q = query(
      collection(db, 'services'),
      where('status', '==', 'active'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [{ id: 'placeholder' }];
    }
    return snapshot.docs.map((d) => ({
      id: d.id,
    }));
  } catch (err) {
    console.error('Failed to generate static params for services:', err);
    return [{ id: 'placeholder' }];
  }
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getServiceData(id);

  if (!data || !data.service) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
        <div className="text-center">
          <h1 className="text-xl font-bold">Service listing not found</h1>
          <p className="mt-2 text-sm text-gray-400">This service is no longer active or approved.</p>
        </div>
      </main>
    );
  }

  const { service, company, relatedServices } = data;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': service.name,
    'description': service.description,
    'provider': company ? {
      '@type': 'LocalBusiness',
      'name': company.name,
      'image': company.logoUrl || undefined,
      'telephone': company.phone || undefined,
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': company.location || 'Theni',
        'addressRegion': 'Tamil Nadu',
        'addressCountry': 'IN'
      }
    } : {
      '@type': 'Organization',
      'name': 'Verified Service Provider'
    },
    'areaServed': {
      '@type': 'Place',
      'name': service.location || 'Theni'
    },
    'offers': service.price ? {
      '@type': 'Offer',
      'price': String(service.price),
      'priceCurrency': 'INR',
      'availability': 'https://schema.org/InStock'
    } : undefined
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thenijobs.com' },
      { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://thenijobs.com/services' },
      { '@type': 'ListItem', position: 3, name: service.name, item: `https://thenijobs.com/services/${id}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ServiceDetailPageClient
        service={service}
        company={company}
        relatedServices={relatedServices}
      />
    </>
  );
}
