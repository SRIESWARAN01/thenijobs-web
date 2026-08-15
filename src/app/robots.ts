import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Disallow auth-only and private routes from being indexed
        disallow: [
          '/admin/',
          '/seeker/',
          '/employer/',
          '/api/',
          '/login',
          '/register',
          '/forgot-password',
          '/profile',
          '/jobs?',  // Prevent indexing of filter/search query pages
        ],
      },
    ],
    sitemap: 'https://thenijobs.com/sitemap.xml',
    host: 'https://thenijobs.com',
  };
}
