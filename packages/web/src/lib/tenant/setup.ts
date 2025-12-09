/**
 * Tenant Setup Utilities
 * 
 * Helper functions to set up default tenant and migrate existing pages.
 */

import { prisma } from '@/shared/db/prismaClient';

/**
 * Create default tenant for main Settler site
 */
export async function createDefaultTenant() {
  // Check if default tenant already exists
  const existing = await prisma.tenant.findUnique({
    where: { slug: 'default' },
  });
  
  if (existing) {
    return existing;
  }
  
  // Create default tenant
  const tenant = await prisma.tenant.create({
    data: {
      slug: 'default',
      name: 'Settler',
      primaryDomain: process.env.NEXT_PUBLIC_SITE_URL 
        ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname 
        : 'settler.dev',
      isActive: true,
    },
  });
  
  // Create default branding
  await prisma.tenantBranding.create({
    data: {
      tenantId: tenant.id,
      primaryColor: '#2563eb',
      secondaryColor: '#7c3aed',
      accentColor: '#06b6d4',
      backgroundColor: '#ffffff',
      borderRadiusScale: 1.0,
    },
  });
  
  // Create default navigation
  await prisma.tenantNavigation.create({
    data: {
      tenantId: tenant.id,
      navItems: [
        { href: '/docs', label: 'Docs', type: 'internal' },
        { href: '/cookbooks', label: 'Cookbooks', type: 'internal' },
        { href: '/receipts', label: 'Receipts API', type: 'internal' },
        { href: '/feature-flags', label: 'Feature Flags', type: 'internal' },
        { href: '/console', label: 'Console', type: 'internal' },
        { href: '/pricing', label: 'Pricing', type: 'internal' },
        { href: '/enterprise', label: 'Enterprise', type: 'internal' },
        { href: '/community', label: 'Community', type: 'internal' },
        { href: '/support', label: 'Support', type: 'internal' },
        { href: '/playground', label: 'Playground', type: 'internal' },
      ] as unknown as any[],
      footerItems: [] as unknown as any[],
    },
  });
  
  return tenant;
}

/**
 * Migrate existing homepage to tenant page
 * This is a one-time migration utility
 */
export async function migrateHomepageToTenantPage(tenantId: string) {
  // Check if homepage already exists
  const existing = await prisma.tenantPage.findUnique({
    where: {
      tenantId_slug: {
        tenantId,
        slug: '',
      },
    },
  });
  
  if (existing) {
    return existing;
  }
  
  // Create a basic homepage with hero block
  const homepage = await prisma.tenantPage.create({
    data: {
      tenantId,
      slug: '',
      pageType: 'marketing',
      seoTitle: 'Settler - Reconciliation as a Service API',
      seoDescription: 'Automate financial data reconciliation across fragmented SaaS and e-commerce ecosystems.',
      blocks: [
        {
          id: 'hero-1',
          type: 'hero',
          visible: true,
          title: 'Automate Payment Reconciliation in Minutes',
          description: 'Connect Shopify, Stripe, PayPal, and 50+ platforms. Automatically match transactions, orders, and payments with 99.7% accuracy.',
          primaryCta: {
            label: 'Start Free Trial',
            href: '/signup',
            variant: 'primary',
          },
          secondaryCta: {
            label: 'View Documentation',
            href: '/docs',
            variant: 'outline',
          },
          alignment: 'center',
        },
      ] as unknown as any[],
      isDraft: false,
    },
  });
  
  return homepage;
}
