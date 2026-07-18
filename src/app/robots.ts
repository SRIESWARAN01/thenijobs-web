import { MetadataRoute } from 'next';

/**
 * robots.txt — content is static (no DB calls), so no need for force-dynamic.
 * Disallows dashboard/auth pages and points to the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/business/',
          '/seeker/',
          '/employer/',
          '/service/',
          '/id/',
          '/id',
          '/feed',
          '/hub',
          '/profile-setup',
          '/role-selection',
          '/forgot-password',
          '/verify/',
          '/login',
          '/shop/login',
          '/shop/checkout',
          '/shop/account/',
          '/register',
        ],
      },
    ],
    sitemap: 'https://thenijobs.com/sitemap.xml',
    host: 'https://thenijobs.com',
  };
}
