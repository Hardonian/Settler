/**
 * Server-side tenant utilities
 * 
 * For use in Server Components, Server Actions, and Route Handlers
 */

import { headers } from 'next/headers';
import { resolveTenant, getTenantById } from '@/shared/tenant/tenantResolver';
import { brandingToTheme } from '@/components/tenant/TenantThemeProvider';
import { TenantTheme } from '@/shared/tenant/types';
import { createClient } from '@/lib/supabase/server';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  theme: TenantTheme | null;
  branding: {
    logoUrl?: string | null;
    faviconUrl?: string | null;
  } | null;
  navigation: {
    navItems: any[];
    footerItems: any[];
  } | null;
}

/**
 * Get tenant context for server components
 * Gracefully handles database connection failures and returns default tenant context
 */
export async function getTenantContext(): Promise<TenantContext> {
  // Default fallback tenant context
  const defaultContext: TenantContext = {
    tenantId: '',
    tenantSlug: 'default',
    theme: null,
    branding: null,
    navigation: null,
  };

  try {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const pathname = headersList.get('x-pathname') || '';
    
    // Create a mock Request object for tenant resolution
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const url = `${protocol}://${host}${pathname}`;
    const request = new Request(url, {
      headers: {
        host,
      },
    });

    // Get current user if available
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch (error) {
      // Auth not available, continue without user
      console.warn('Failed to get user from Supabase:', error);
    }

    // Resolve tenant - wrap in try-catch to handle database failures
    let resolution;
    try {
      resolution = await resolveTenant(request, userId);
    } catch (error) {
      console.error('Failed to resolve tenant:', error);
      // Return default context if tenant resolution fails
      return defaultContext;
    }
    
    if (!resolution.tenantId) {
      return defaultContext;
    }

    // Fetch full tenant data with branding and navigation
    let tenant;
    try {
      tenant = await getTenantById(resolution.tenantId);
    } catch (error) {
      console.error('Failed to fetch tenant by ID:', error);
      // Return context with tenant ID but no branding/navigation if fetch fails
      return {
        tenantId: resolution.tenantId,
        tenantSlug: resolution.tenantSlug,
        theme: null,
        branding: null,
        navigation: null,
      };
    }
    
    if (!tenant) {
      return {
        tenantId: resolution.tenantId,
        tenantSlug: resolution.tenantSlug,
        theme: null,
        branding: null,
        navigation: null,
      };
    }

    // Convert branding to theme
    const theme = tenant.branding
      ? brandingToTheme({
          ...tenant.branding,
          borderRadiusScale: tenant.branding.borderRadiusScale ? Number(tenant.branding.borderRadiusScale) : null,
        })
      : null;

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      theme,
      branding: tenant.branding
        ? {
            logoUrl: tenant.branding.logoUrl,
            faviconUrl: tenant.branding.faviconUrl,
          }
        : null,
      navigation: tenant.navigation
        ? {
            navItems: tenant.navigation.navItems as any[],
            footerItems: tenant.navigation.footerItems as any[],
          }
        : null,
    };
  } catch (error) {
    // Catch any unexpected errors and return default context
    console.error('Unexpected error in getTenantContext:', error);
    return defaultContext;
  }
}

/**
 * Get tenant page by slug with experiment variant
 */
export async function getTenantPage(tenantId: string, slug: string) {
  const { prisma } = await import('@/shared/db/prismaClient');
  const { resolveExperimentVariant } = await import('./experimentResolver');

  const page = await prisma.tenantPage.findUnique({
    where: {
      tenantId_slug: {
        tenantId,
        slug,
      },
    },
    include: {
      tenant: {
        include: {
          branding: true,
          navigation: true,
        },
      },
    },
  });

  if (!page || page.isDraft) {
    return null;
  }

  // Resolve experiment variant if active
  const experiment = await resolveExperimentVariant(tenantId, page.id);
  
  // Merge experiment blocks override with base blocks
  let finalBlocks = page.blocks as unknown[];
  if (experiment.blocksOverride && Array.isArray(experiment.blocksOverride)) {
    // Simple merge: experiment blocks override base blocks
    // In production, you might want more sophisticated merging
    finalBlocks = experiment.blocksOverride.length > 0 
      ? experiment.blocksOverride 
      : finalBlocks;
  }

  return {
    ...page,
    blocks: finalBlocks,
    experiment: experiment.experimentId ? {
      id: experiment.experimentId,
      variantKey: experiment.variantKey,
    } : null,
  };
}
