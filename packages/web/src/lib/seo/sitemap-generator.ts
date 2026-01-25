/**
 * Enhanced Dynamic Sitemap Generator
 * Generates comprehensive sitemap with all routes for SEO
 */

import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://settler.dev';

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

/**
 * Get all static routes
 */
function getStaticRoutes(): SitemapEntry[] {
  const routes: Array<{ path: string; priority: number; changeFrequency: SitemapEntry['changeFrequency'] }> = [
    // High priority pages
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/product', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/open-source', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/docs', priority: 0.9, changeFrequency: 'daily' },
    { path: '/integrations', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/security-and-audit', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/enterprise', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.6, changeFrequency: 'yearly' },
    
    // Documentation pages
    { path: '/docs/quickstart', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/docs/api', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/docs/sdk', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/docs/cli', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/docs/examples', priority: 0.7, changeFrequency: 'monthly' },
    
    // Product pages
    { path: '/architecture', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/feature-flags', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/receipts', priority: 0.6, changeFrequency: 'monthly' },

    // Enterprise & Support
    { path: '/support', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/status', priority: 0.6, changeFrequency: 'daily' },
    { path: '/security-and-audit', priority: 0.7, changeFrequency: 'monthly' },
    
    // Legal
    { path: '/legal', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/legal/privacy', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/legal/terms', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/legal/dpa', priority: 0.5, changeFrequency: 'yearly' },
    
    // Community
    { path: '/community', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/changelog', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/roadmap', priority: 0.6, changeFrequency: 'monthly' },
    
    // Comparison
    { path: '/changelog', priority: 0.7, changeFrequency: 'monthly' },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

/**
 * Get dynamic use case routes
 */
function getUseCaseRoutes(): SitemapEntry[] {
  const useCases: string[] = [];

  return useCases.map((useCase) => ({
    url: `${baseUrl}/use-cases/${useCase}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
}

/**
 * Get integration routes
 */
function getIntegrationRoutes(): SitemapEntry[] {
  const integrations = [
    'stripe',
    'shopify',
    'paypal',
    'quickbooks',
    'xero',
    'square',
    'woocommerce',
    'bigcommerce',
    'magento',
    'salesforce',
  ];

  return integrations.map((integration) => ({
    url: `${baseUrl}/docs/integrations/${integration}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
}

/**
 * Generate complete sitemap
 */
export function generateSitemap(): MetadataRoute.Sitemap {
  const staticRoutes = getStaticRoutes();
  const useCaseRoutes = getUseCaseRoutes();
  const integrationRoutes = getIntegrationRoutes();

  return [...staticRoutes, ...useCaseRoutes, ...integrationRoutes];
}

/**
 * Generate sitemap index for large sites (future use)
 */
export function generateSitemapIndex(sitemaps: Array<{ url: string; lastModified: Date }>): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (sitemap) => `  <sitemap>
    <loc>${sitemap.url}</loc>
    <lastmod>${sitemap.lastModified.toISOString()}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;
}
