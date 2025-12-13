/**
 * Sitemap Generator
 * 
 * Generates sitemap.xml for SEO.
 */

import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://settler.dev';

  const routes = [
    '',
    '/pricing',
    '/docs',
    '/docs/quickstart',
    '/docs/api',
    '/docs/sdk',
    '/signup',
    '/status',
    '/security',
    '/why-settler',
    '/how-it-works',
    '/architecture',
    '/feature-flags',
    '/receipts',
    '/enterprise',
    '/support',
    '/legal',
    '/legal/privacy',
    '/legal/terms',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route.startsWith('/docs') ? 0.8 : 0.6,
  }));
}
