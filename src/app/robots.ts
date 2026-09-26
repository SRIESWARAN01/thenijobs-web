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
          // Prevent indexing of dynamic query-string filters and search variations
          '/jobs?*',
          '/jobs/*?*',
          '/*?search=*',
          '/*?category=*',
        ],
      },
    ],
    sitemap: 'https://thenijobs.com/sitemap.xml',
    host: 'https://thenijobs.com',
  };
}
