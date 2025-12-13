/**
 * Robots.txt Generator
 * 
 * Generates robots.txt for SEO.
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://settler.dev';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/console/',
          '/dashboard/',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/console/',
          '/dashboard/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
