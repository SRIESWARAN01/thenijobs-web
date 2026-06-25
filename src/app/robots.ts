import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/seeker/dashboard', '/employer/dashboard', '/profile', '/profile/', '/id', '/id/'],
      },
    ],
    sitemap: 'https://thenijobs.com/sitemap.xml',
    host: 'https://thenijobs.com',
  };
}
