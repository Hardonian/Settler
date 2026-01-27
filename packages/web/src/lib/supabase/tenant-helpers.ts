/**
 * Tenant Helper Functions
 * 
 * Provides helper functions for tenant membership checks and tenant context.
 * These functions work with Supabase RLS to ensure tenant isolation.
 */

import { createClient } from './server';
import { safeLogger } from '@/lib/observability/safe-logger';

/**
 * Check if the current authenticated user is a member of a tenant
 * 
 * @param tenantId - The tenant ID to check membership for
 * @returns Promise<boolean> - True if user is a member, false otherwise
 */
export async function isTenantMember(tenantId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Check if tenant_users table exists and user is a member
    const { data, error } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      // If table doesn't exist, return false (graceful degradation)
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        await safeLogger.debug('[isTenantMember] tenant_users table does not exist');
        return false;
      }
      await safeLogger.error('[isTenantMember] Error checking membership', {
        tenantId,
        error: error.message || String(error),
      });
      return false;
    }
    
    return data !== null;
  } catch {
    await safeLogger.error('[isTenantMember] Unexpected error', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

/**
 * Get all tenants the current authenticated user belongs to
 * 
 * @returns Promise<string[]> - Array of tenant IDs
 */
export async function getUserTenants(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id);
    
    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        await safeLogger.debug('[getUserTenants] tenant_users table does not exist');
        return [];
      }
      await safeLogger.error('[getUserTenants] Error fetching tenants', {
        error: error.message || String(error),
      });
      return [];
    }
    
    return (data || []).map((row: { tenant_id: string }) => row.tenant_id);
  } catch {
    await safeLogger.error('[getUserTenants] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}

/**
 * Get the primary tenant for the current authenticated user
 * (First tenant they belong to, or tenant from billing account)
 * 
 * @returns Promise<string | null> - Primary tenant ID or null
 */
export async function getPrimaryTenant(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    // Try to get tenant from billing account first
    const { prisma } = await import('@/shared/db/prismaClient');
    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { tenantId: true },
    });
    
    if (billingAccount?.tenantId) {
      return billingAccount.tenantId ?? null;
    }
    
    // Fallback to first tenant from tenant_users
    const tenants = await getUserTenants();
    return tenants.length > 0 ? (tenants[0] ?? null) : null;
  } catch {
    await safeLogger.error('[getPrimaryTenant] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}
