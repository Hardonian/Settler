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
 */
export async function getTenantContext(): Promise<TenantContext> {
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
  }

  // Resolve tenant
  const resolution = await resolveTenant(request, userId);
  
  if (!resolution.tenantId) {
    return {
      tenantId: '',
      tenantSlug: 'default',
      theme: null,
      branding: null,
      navigation: null,
    };
  }

  // Fetch full tenant data with branding and navigation
  const tenant = await getTenantById(resolution.tenantId);
  
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
    ? brandingToTheme(tenant.branding)
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
}

/**
 * Get tenant page by slug
 */
export async function getTenantPage(tenantId: string, slug: string) {
  const { prisma } = await import('@/shared/db/prismaClient');

  return prisma.tenantPage.findUnique({
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
}
