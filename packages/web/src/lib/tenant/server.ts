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

// Default fallback tenant context
const DEFAULT_CONTEXT: TenantContext = {
  tenantId: '',
  tenantSlug: 'default',
  theme: null,
  branding: null,
  navigation: null,
};

/**
 * Check if we're in a build-time context (static generation)
 */
function isBuildTime(): boolean {
  // During build, headers() will throw or return empty values
  // Check for common build-time indicators
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL
  );
}

/**
 * Get tenant context for server components
 * Gracefully handles database connection failures and returns default tenant context
 * Optimized for build-time and runtime scenarios
 */
export async function getTenantContext(): Promise<TenantContext> {
  // Return default context immediately during build time
  if (isBuildTime()) {
    return DEFAULT_CONTEXT;
  }

  try {
    // Safely get headers - will throw if called during static generation
    let headersList;
    try {
      headersList = await headers();
    } catch (error) {
      // If headers() fails (e.g., during static generation), return default
      if (error instanceof Error && error.message.includes('DYNAMIC_SERVER_USAGE')) {
        return DEFAULT_CONTEXT;
      }
      throw error;
    }

    const host = headersList.get('host') || '';
    const pathname = headersList.get('x-pathname') || '';
    
    // If no host, we're likely in build context
    if (!host) {
      return DEFAULT_CONTEXT;
    }
    
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
      // Only log in development to avoid build noise
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to get user from Supabase:', error);
      }
    }

    // Resolve tenant - wrap in try-catch to handle database failures
    let resolution;
    try {
      resolution = await resolveTenant(request, userId);
    } catch (error) {
      // Only log errors in development or if it's not a build-time issue
      if (process.env.NODE_ENV === 'development' || !isBuildTime()) {
        console.error('Failed to resolve tenant:', error);
      }
      return DEFAULT_CONTEXT;
    }
    
    if (!resolution.tenantId) {
      return DEFAULT_CONTEXT;
    }

    // Fetch full tenant data with branding and navigation
    let tenant;
    try {
      tenant = await getTenantById(resolution.tenantId);
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch tenant by ID:', error);
      }
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
    // Only log in development to avoid build noise
    if (process.env.NODE_ENV === 'development') {
      console.error('Unexpected error in getTenantContext:', error);
    }
    return DEFAULT_CONTEXT;
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
