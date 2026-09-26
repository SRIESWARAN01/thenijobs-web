import type { Metadata } from 'next';

export const SITE_NAME = 'THENIJOBS';
export const SITE_URL = 'https://thenijobs.com';
export const DEFAULT_OG_IMAGE = '/og-image.jpg';

export interface PageMetadataInput {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
}

/**
 * Centralized SEO Metadata builder for THENIJOBS.
 * Standardizes canonical URLs, OpenGraph, Twitter Cards, and robots directives.
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonicalUrl = input.path
    ? input.path.startsWith('http')
      ? input.path
      : `${SITE_URL}${input.path.startsWith('/') ? input.path : `/${input.path}`}`
    : SITE_URL;

  const imageUrl = input.image || DEFAULT_OG_IMAGE;
  const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords || [
      'Theni Jobs',
      'Jobs in Theni',
      'Theni job vacancy',
      'Tamil Nadu Jobs',
      'THENIJOBS',
    ],
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: input.noIndex
      ? { index: false, follow: true }
      : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonicalUrl,
      type: input.type || 'website',
      locale: 'en_IN',
      siteName: SITE_NAME,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [fullImageUrl],
    },
  };
}
