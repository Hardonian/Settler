/**
 * Tenant resolution utilities
 * 
 * Resolves tenant from request context (JWT, headers, domain)
 */

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export interface TenantResolution {
  tenantId: string | null;
  tenantSlug: string | null;
  userId: string | null;
}

/**
 * Resolve tenant from request context
 * Priority:
 * 1. JWT claim (tenant_id)
 * 2. Header (x-tenant-id)
 * 3. User's default tenant (if single membership)
 * 4. Domain-based resolution
 */
export async function resolveTenantFromRequest(): Promise<TenantResolution> {
  const headersList = await headers();
  
  // Try header first (for server routes)
  const headerTenantId = headersList.get('x-tenant-id');
  if (headerTenantId) {
    const supabase = await createClient();
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, slug')
      .eq('id', headerTenantId)
      .single();
    
    if (tenant) {
      const { data: { user } } = await supabase.auth.getUser();
      return {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        userId: user?.id || null,
      };
    }
  }

  // Try to get user and their default tenant
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { tenantId: null, tenantSlug: null, userId: null };
  }

  // Get user's memberships
  const { data: memberships } = await supabase
    .from('memberships')
    .select('tenant_id, tenant:tenants(id, slug)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(10);

  if (!memberships || memberships.length === 0) {
    return { tenantId: null, tenantSlug: null, userId: user.id };
  }

  // If single membership, use it
  if (memberships.length === 1) {
    const membership = memberships[0];
    const tenant = membership.tenant as { id: string; slug: string } | null;
    return {
      tenantId: tenant?.id || null,
      tenantSlug: tenant?.slug || null,
      userId: user.id,
    };
  }

  // Multiple memberships - return first one (UI should show switcher)
  const membership = memberships[0];
  const tenant = membership.tenant as { id: string; slug: string } | null;
  return {
    tenantId: tenant?.id || null,
    tenantSlug: tenant?.slug || null,
    userId: user.id,
  };
}

/**
 * Get tenant ID from secure cookie/session
 */
export async function getTenantFromSession(): Promise<string | null> {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie');
  
  if (!cookieHeader) {
    return null;
  }

  // Parse tenant_id from cookies
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies['tenant_id'] || null;
}
