/**
 * Dynamic Tenant Page Route
 * 
 * Renders tenant pages based on slug.
 * Falls back to default pages if no tenant page exists.
 */

import { notFound } from 'next/navigation';
import { getTenantContext, getTenantPage } from '@/lib/tenant/server';
import { PageRenderer } from '@/domain/siteBuilder/pageRenderer';
import { TenantThemeProvider } from '@/components/tenant/TenantThemeProvider';
import { TenantNavigation } from '@/components/tenant/TenantNavigation';
import { Footer } from '@/components/Footer';
import { ExperimentTrackerClient } from '@/components/tenant/ExperimentTracker';
import { Metadata } from 'next';
import { PageBlockSchema } from '@/domain/siteBuilder/pageSchema';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tenantContext = await getTenantContext();
  
  if (!tenantContext.tenantId) {
    return {};
  }
  
  const page = await getTenantPage(tenantContext.tenantId, slug);
  
  if (!page) {
    return {};
  }
  
  const title = typeof page.seoTitle === 'string' ? page.seoTitle : page.slug;
  const description = typeof page.seoDescription === 'string' ? page.seoDescription : undefined;
  const seoImageUrl = typeof page.seoImageUrl === 'string' ? page.seoImageUrl : undefined;

  return {
    title: title || 'Page',
    description,
    openGraph: {
      images: seoImageUrl ? [seoImageUrl] : undefined,
    },
  };
}

export default async function TenantPageRoute({ params }: PageProps) {
  const { slug } = await params;
  
  // Exclude known static routes - these should be handled by their specific route handlers
  // This prevents the [slug] route from catching routes like /docs, /pricing, etc.
  const STATIC_ROUTES = [
    'docs', 'pricing', 'playground', 'signup', 'enterprise', 
    'community', 'support', 'cookbooks', 'receipts', 'feature-flags', 
    'console', 'dashboard', 'legal', 'mobile', 'status', 'founder',
    'how-it-works', 'comparison', 'edge-ai', 'react-settler-demo',
    'realtime-dashboard'
  ];
  
  if (STATIC_ROUTES.includes(slug)) {
    notFound();
  }
  
  const tenantContext = await getTenantContext();
  
  if (!tenantContext.tenantId) {
    notFound();
  }
  
  // Try to get tenant page
  const page = await getTenantPage(tenantContext.tenantId, slug);
  
  // If no tenant page, fall back to default pages (existing behavior)
  if (!page) {
    notFound();
  }
  
  // Validate blocks against schema for server-side logging/metrics
  const parsedBlocks = PageBlockSchema.array().safeParse(page.blocks);
  
  if (!parsedBlocks.success) {
    console.warn(`[TenantRenderer] Invalid blocks for page ${slug}:`, parsedBlocks.error);
    // We continue rendering, letting PageRenderer handle/skip invalid individual blocks
  }
  
  return (
    <TenantThemeProvider
      theme={tenantContext.theme}
      tenantId={tenantContext.tenantId}
      tenantSlug={tenantContext.tenantSlug}
    >
      <div className="min-h-screen">
        <TenantNavigation
          navItems={tenantContext.navigation?.navItems || []}
          logoUrl={tenantContext.branding?.logoUrl || undefined}
          tenantName={tenantContext.tenantSlug || 'Settler'}
        />
        <main className="pt-16">
          <PageRenderer blocks={page.blocks} />
        </main>
        <Footer />
      </div>
      {page.experiment && (
        <ExperimentTrackerClient
          experimentId={page.experiment.id}
          variantKey={page.experiment.variantKey}
        />
      )}
    </TenantThemeProvider>
  );
}
