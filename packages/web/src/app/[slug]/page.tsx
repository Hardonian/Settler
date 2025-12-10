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
  
  return {
    title: page.seoTitle || page.slug || 'Page',
    description: page.seoDescription || undefined,
    openGraph: {
      images: page.seoImageUrl ? [page.seoImageUrl] : undefined,
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
  
  // Track experiment view if experiment is active
  if (page.experiment) {
    // This will be handled client-side via useEffect
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
          <PageRenderer blocks={page.blocks as unknown[]} />
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

