import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const BASE = 'https://thenijobs.com';
  const now = new Date();

  const staticPages = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/jobs`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/businesses`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/services`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/daily-jobs`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/pricing`, changeFrequency: 'weekly', priority: 0.7 },
  ] as MetadataRoute.Sitemap;

  const categoryPages = [
    'agriculture', 'construction', 'education', 'healthcare',
    'it-software', 'textiles', 'manufacturing', 'retail', 'transport', 'finance',
  ].map(cat => ({
    url: `${BASE}/businesses/${cat}`,
    changeFrequency: 'daily' as const,
    priority: 0.8,
    lastModified: now,
  }));

  // Static company pages (would be dynamic from DB in production)
  const companyPages = [
    'digital-theni-solutions',
    'arasu-pandi-farm-services',
    'greenfield-agro-exports',
    'quickdeliver-logistics',
    'theni-textiles',
    'thenijobs-demo-company',
  ].map(slug => ({
    url: `${BASE}/company/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
    lastModified: now,
  }));

  return [...staticPages, ...categoryPages, ...companyPages];
}
