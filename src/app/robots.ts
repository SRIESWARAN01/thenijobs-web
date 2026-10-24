import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/_next/static/',
        ],
        // Disallow auth-only, dashboard, and private routes from being indexed
        disallow: [
          '/admin/',
          '/seeker/',
          '/employer/',
          '/api/',
          '/login',
          '/register',
          '/register-business',
          '/forgot-password',
          '/profile',
          // Prevent crawling of internal search queries
          '/*?search=*',
        ],
      },
    ],
    sitemap: 'https://www.thenijobs.com/sitemap.xml',
    host: 'https://www.thenijobs.com',
  };
}
