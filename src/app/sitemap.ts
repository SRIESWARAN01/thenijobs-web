import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const LOCATIONS = [
  'theni',
  'cumbum',
  'periyakulam',
  'bodinayakanur',
  'uthamapalayam',
  'andipatti',
  'chinnamanur',
  'madurai',
  'dindigul',
];

const CATEGORIES = [
  'freshers',
  'sales',
  'it',
  'accounts',
  'healthcare',
  'education',
  'banking',
  'hospitality',
  'manufacturing',
  'driving',
  'security',
  'customer-service',
  'part-time',
  'full-time',
  'work-from-home',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const BASE = 'https://thenijobs.com';
  const now = new Date();

  // Core static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1.0, lastModified: now },
    { url: `${BASE}/jobs`, changeFrequency: 'hourly', priority: 0.95, lastModified: now },
    { url: `${BASE}/businesses`, changeFrequency: 'daily', priority: 0.85, lastModified: now },
    { url: `${BASE}/services`, changeFrequency: 'daily', priority: 0.85, lastModified: now },
    { url: `${BASE}/daily-jobs`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { url: `${BASE}/contact`, changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { url: `${BASE}/pricing`, changeFrequency: 'weekly', priority: 0.7, lastModified: now },
    { url: `${BASE}/privacy`, changeFrequency: 'monthly', priority: 0.4, lastModified: now },
    { url: `${BASE}/terms`, changeFrequency: 'monthly', priority: 0.4, lastModified: now },
  ];

  // Location landing pages (/jobs-in-theni, /jobs-in-cumbum, etc.)
  const locationPages: MetadataRoute.Sitemap = LOCATIONS.map(loc => ({
    url: `${BASE}/jobs-in-${loc}`,
    changeFrequency: 'daily',
    priority: 0.95,
    lastModified: now,
  }));

  // Location x Category landing pages (/jobs-in-theni/freshers, /jobs-in-theni/sales, etc.)
  const locationCategoryPages: MetadataRoute.Sitemap = [];
  for (const loc of LOCATIONS) {
    for (const cat of CATEGORIES) {
      locationCategoryPages.push({
        url: `${BASE}/jobs-in-${loc}/${cat}`,
        changeFrequency: 'daily',
        priority: 0.9,
        lastModified: now,
      });
    }
  }

  // Business Category pages
  const businessCategoryPages: MetadataRoute.Sitemap = [
    'agriculture', 'construction', 'education', 'healthcare',
    'it-software', 'textiles', 'manufacturing', 'retail', 'transport', 'finance',
  ].map(cat => ({
    url: `${BASE}/businesses/${cat}`,
    changeFrequency: 'daily',
    priority: 0.8,
    lastModified: now,
  }));

  // Company pages
  const companyPages: MetadataRoute.Sitemap = [
    'digital-theni-solutions',
    'arasu-pandi-farm-services',
    'greenfield-agro-exports',
    'quickdeliver-logistics',
    'theni-textiles',
    'thenijobs-demo-company',
  ].map(slug => ({
    url: `${BASE}/company/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
    lastModified: now,
  }));

  return [
    ...staticPages,
    ...locationPages,
    ...locationCategoryPages,
    ...businessCategoryPages,
    ...companyPages,
  ];
}
