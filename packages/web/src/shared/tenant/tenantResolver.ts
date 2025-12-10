/**
 * Tenant Resolution
 * 
 * Determines which tenant is being served based on:
 * - Request host/domain (primary domain or custom domain)
 * - URL path (optional /t/[tenantSlug] for preview)
 * - Default to main Settler tenant if no match
 */

import { prisma } from '../db/prismaClient';

export interface TenantResolutionResult {
  tenantId: string;
  tenantSlug: string;
  tenant: {
    id: string;
    slug: string;
    name: string;
    primaryDomain: string | null;
    customDomain: string | null;
    isActive: boolean;
  } | null;
}

/**
 * Extract subdomain from host
 */
function extractSubdomain(host: string): string | null {
  const parts = host.split('.');
  if (parts.length >= 3) {
    return parts[0] ?? null;
  }
  return null;
}

type TenantSelect = {
  id: string;
  slug: string;
  name: string;
  primaryDomain: string | null;
  customDomain: string | null;
  isActive: boolean;
};

/**
 * Find tenant by domain (primary or custom)
 */
async function findTenantByDomain(host: string): Promise<TenantSelect | null> {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { primaryDomain: host },
          { customDomain: host },
        ],
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        primaryDomain: true,
        customDomain: true,
        isActive: true,
      },
    });
    return tenant;
  } catch (error) {
    console.error('Failed to find tenant by domain:', error);
    return null;
  }
}

/**
 * Find tenant by slug
 */
async function findTenantBySlug(slug: string): Promise<TenantSelect | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        primaryDomain: true,
        customDomain: true,
        isActive: true,
      },
    });
    return tenant;
  } catch (error) {
    console.error('Failed to find tenant by slug:', error);
    return null;
  }
}

/**
 * Get default tenant (slug: "default")
 */
async function getDefaultTenant(): Promise<TenantSelect | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'default' },
      select: {
        id: true,
        slug: true,
        name: true,
        primaryDomain: true,
        customDomain: true,
        isActive: true,
      },
    });
    return tenant;
  } catch (error) {
    console.error('Failed to get default tenant:', error);
    return null;
  }
}

/**
 * Check if user can access tenant (for preview mode)
 */
async function canAccessTenant(
  userId: string | null,
  tenantId: string
): Promise<boolean> {
  if (!userId) return false;
  
  try {
    // TODO: Implement role-based access check
    // For now, allow if user has billing account linked to tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        billingAccount: {
          select: { userId: true },
        },
      },
    });
    
    if (!tenant) return false;
    
    // Allow if user owns the billing account
    if (tenant.billingAccount?.userId === userId) {
      return true;
    }
    
    // TODO: Check for SUPER_ADMIN role
    return false;
  } catch (error) {
    console.error('Failed to check tenant access:', error);
    return false;
  }
}

/**
 * Resolve tenant from request
 * Gracefully handles database connection failures
 */
export async function resolveTenant(
  request: Request,
  userId?: string | null
): Promise<TenantResolutionResult> {
  try {
    const host = request.headers.get('host') || '';
    const url = new URL(request.url);
    
    // 1. Check custom domain or primary domain
    const tenantByDomain = await findTenantByDomain(host);
    if (tenantByDomain) {
      return {
        tenantId: tenantByDomain.id,
        tenantSlug: tenantByDomain.slug,
        tenant: tenantByDomain,
      };
    }
    
    // 2. Check subdomain
    const subdomain = extractSubdomain(host);
    if (subdomain) {
      const tenantBySlug = await findTenantBySlug(subdomain);
      if (tenantBySlug && tenantBySlug.isActive) {
        return {
          tenantId: tenantBySlug.id,
          tenantSlug: tenantBySlug.slug,
          tenant: tenantBySlug,
        };
      }
    }
    
    // 3. Check path-based preview (if authenticated)
    const pathMatch = url.pathname.match(/^\/t\/([^/]+)/);
    if (pathMatch && userId) {
      const previewSlug = pathMatch[1];
      if (previewSlug) {
        const tenantBySlug = await findTenantBySlug(previewSlug);
        if (tenantBySlug && await canAccessTenant(userId, tenantBySlug.id)) {
          return {
            tenantId: tenantBySlug.id,
            tenantSlug: tenantBySlug.slug,
            tenant: tenantBySlug,
          };
        }
      }
    }
    
    // 4. Default tenant
    const defaultTenant = await getDefaultTenant();
    if (defaultTenant) {
      return {
        tenantId: defaultTenant.id,
        tenantSlug: defaultTenant.slug,
        tenant: defaultTenant,
      };
    }
  } catch (error) {
    console.error('Error resolving tenant:', error);
  }
  
  // Fallback: return null tenant (used when database is unavailable)
  return {
    tenantId: '',
    tenantSlug: 'default',
    tenant: null,
  };
}

/**
 * Get tenant by ID (for server components)
 * Returns null if database connection fails
 */
export async function getTenantById(tenantId: string) {
  try {
    return await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branding: true,
        navigation: true,
      },
    });
  } catch (error) {
    console.error('Failed to get tenant by ID:', error);
    return null;
  }
}

/**
 * Get tenant by slug (for server components)
 * Returns null if database connection fails
 */
export async function getTenantBySlug(slug: string) {
  try {
    return await prisma.tenant.findUnique({
      where: { slug },
      include: {
        branding: true,
        navigation: true,
      },
    });
  } catch (error) {
    console.error('Failed to get tenant by slug:', error);
    return null;
  }
}
