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
    return parts[0];
  }
  return null;
}

/**
 * Find tenant by domain (primary or custom)
 */
async function findTenantByDomain(host: string): Promise<typeof tenant | null> {
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
}

/**
 * Find tenant by slug
 */
async function findTenantBySlug(slug: string): Promise<typeof tenant | null> {
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
}

/**
 * Get default tenant (slug: "default")
 */
async function getDefaultTenant(): Promise<typeof tenant | null> {
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
}

/**
 * Check if user can access tenant (for preview mode)
 */
async function canAccessTenant(
  userId: string | null,
  tenantId: string
): Promise<boolean> {
  if (!userId) return false;
  
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
}

/**
 * Resolve tenant from request
 */
export async function resolveTenant(
  request: Request,
  userId?: string | null
): Promise<TenantResolutionResult> {
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
    const tenantBySlug = await findTenantBySlug(previewSlug);
    if (tenantBySlug && await canAccessTenant(userId, tenantBySlug.id)) {
      return {
        tenantId: tenantBySlug.id,
        tenantSlug: tenantBySlug.slug,
        tenant: tenantBySlug,
      };
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
  
  // Fallback: return null tenant (should not happen if default tenant exists)
  return {
    tenantId: '',
    tenantSlug: 'default',
    tenant: null,
  };
}

/**
 * Get tenant by ID (for server components)
 */
export async function getTenantById(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      branding: true,
      navigation: true,
    },
  });
}

/**
 * Get tenant by slug (for server components)
 */
export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
    include: {
      branding: true,
      navigation: true,
    },
  });
}
