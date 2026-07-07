import { MetadataRoute } from 'next';

/**
 * robots.txt — dynamically generated (no force-static).
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
          '/profile-setup',
          '/role-selection',
          '/forgot-password',
          '/verify/',
          '/login',
          '/shop/login',
          '/shop/checkout',
          '/shop/account/',
        ],
      },
    ],
    sitemap: 'https://thenijobs.com/sitemap.xml',
    host: 'https://thenijobs.com',
  };
}
