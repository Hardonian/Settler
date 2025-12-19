/**
 * Authorization utilities for workspace and role checks
 * 
 * Ensures all console/admin queries are scoped by workspace_id and role.
 */

import { createClient } from '@/lib/supabase/server';

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

export interface AuthzResult {
  authorized: boolean;
  workspaceId?: string;
  role?: string;
  error?: string;
}

/**
 * Get current user's workspace membership
 */
export async function getWorkspaceMembership(
  workspaceId: string
): Promise<AuthzResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        authorized: false,
        error: 'Not authenticated',
      };
    }

    // Check workspace membership via Supabase (tenant_users table)
    // workspace_id maps to tenant_id in this system
    const { data: membership, error: membershipError } = await (supabase
      .from('tenant_users' as any)
      .select('role')
      .eq('tenant_id', workspaceId)
      .eq('user_id', user.id)
      .single() as any);

    if (membershipError || !membership) {
      return {
        authorized: false,
        error: 'Not a member of this workspace',
      };
    }

    return {
      authorized: true,
      workspaceId,
      role: membership.role,
    };
  } catch (error) {
    console.error('[authz] Error checking workspace membership:', error);
    return {
      authorized: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if user is admin (workspace admin or system admin)
 */
export async function isAdmin(workspaceId?: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return false;
    }

    // Check system admin role
    const { data: profile } = await (supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as any);

    if (profile?.role === 'admin') {
      return true;
    }

    // Check workspace admin if workspaceId provided
    if (workspaceId) {
      const membership = await getWorkspaceMembership(workspaceId);
      return membership.authorized && (membership.role === 'admin' || membership.role === 'owner');
    }

    return false;
  } catch (error) {
    console.error('[authz] Error checking admin status:', error);
    return false;
  }
}

/**
 * Require workspace membership or throw
 */
export async function requireWorkspaceMembership(
  workspaceId: string
): Promise<WorkspaceMember> {
  const result = await getWorkspaceMembership(workspaceId);
  
  if (!result.authorized) {
    throw new Error(result.error || 'Unauthorized');
  }

  return {
    workspaceId: result.workspaceId!,
    userId: '', // Will be populated by caller
    role: result.role as WorkspaceMember['role'],
  };
}

/**
 * Require admin role or throw
 */
export async function requireAdmin(workspaceId?: string): Promise<void> {
  const admin = await isAdmin(workspaceId);
  
  if (!admin) {
    throw new Error('Admin access required');
  }
}
