/**
 * Super Admin Access Control
 * 
 * Utilities for checking super admin access for Settler management.
 * Super admins can observe all tenants, metrics, and usage data.
 */

import { createClient } from '@/lib/supabase/server';
import { UserRole, getUserRole } from '@/shared/auth/roles';

/**
 * Check if current user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Check role via getUserRole
    const role = await getUserRole(user.id);
    if (role === UserRole.SUPER_ADMIN) {
      return true;
    }
    
    // Fallback: Check user metadata for admin flag
    // This allows setting super admin via Supabase user metadata
    const userMetadata = user.user_metadata as Record<string, unknown> | undefined;
    if (userMetadata?.role === 'SUPER_ADMIN' || userMetadata?.role === 'super_admin') {
      return true;
    }
    
    // Fallback: Check email domain (for Settler team)
    if (user.email?.endsWith('@settler.dev')) {
      return true;
    }
    
    return false;
  } catch (_error) {
    console.error('[isSuperAdmin] Error checking super admin status:', error);
    return false;
  }
}

/**
 * Require super admin access or throw error
 */
export async function requireSuperAdmin(): Promise<void> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    throw new Error('Super admin access required');
  }
}

/**
 * Get super admin status with user info
 */
export async function getSuperAdminStatus(): Promise<{
  isSuperAdmin: boolean;
  userId?: string;
  email?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { isSuperAdmin: false };
    }
    
    const isAdmin = await isSuperAdmin();
    
    return {
      isSuperAdmin: isAdmin,
      userId: user.id,
      email: user.email || undefined,
    };
  } catch (_error) {
    console.error('[getSuperAdminStatus] Error:', error);
    return { isSuperAdmin: false };
  }
}
