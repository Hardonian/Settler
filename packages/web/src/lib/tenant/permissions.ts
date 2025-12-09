/**
 * Tenant Permission Utilities
 * 
 * Server-side permission checking for tenant operations.
 */

import { hasPermission, canAccessTenant, requirePermission, SiteBuilderPermission } from '@/shared/auth/roles';
import { createClient } from '@/lib/supabase/server';

/**
 * Get current user ID from session
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Require authentication
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

/**
 * Check permission for current user
 */
export async function checkPermission(
  permission: SiteBuilderPermission,
  tenantId?: string
): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return false;
  }
  return hasPermission(userId, permission, tenantId);
}

/**
 * Require permission for current user
 */
export async function requireTenantPermission(
  permission: SiteBuilderPermission,
  tenantId: string
): Promise<string> {
  const userId = await requireAuth();
  await requirePermission(userId, permission, tenantId);
  return userId;
}

/**
 * Check if current user can access tenant
 */
export async function checkTenantAccess(tenantId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return false;
  }
  return canAccessTenant(userId, tenantId);
}
