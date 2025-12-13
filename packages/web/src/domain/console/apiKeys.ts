/**
 * Console API Keys Domain
 * 
 * Manages API key operations for the Developer Console.
 * Uses authenticated Supabase client with RLS for tenant isolation.
 */

import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/console/activity-logger';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

function generateApiKey(): { key: string; prefix: string } {
  const randomBytes = crypto.randomBytes(32);
  const key = `rk_${randomBytes.toString('base64url')}`;
  const prefix = key.substring(0, 12); // First 12 characters for lookup
  return { key, prefix };
}

async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, SALT_ROUNDS);
}

export interface ApiKeyListItem {
  id: string;
  name?: string;
  keyPrefix: string;
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
  expiresAt?: Date;
  scopes: string[];
}

export interface CreateApiKeyInput {
  name?: string;
  scopes?: string[];
  expiresAt?: Date;
}

export interface CreateApiKeyResult {
  id: string;
  key: string; // Only shown once on creation
  name?: string;
  createdAt: Date;
}

/**
 * Get authenticated user and verify session
 */
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized: Please sign in to access API keys');
  }
  
  return { supabase, user };
}

/**
 * List API keys for the current authenticated user
 * Uses RLS to ensure tenant isolation
 */
export async function listApiKeys(userId?: string): Promise<ApiKeyListItem[]> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    
    // Use authenticated user's ID (RLS will enforce tenant isolation)
    const queryUserId = userId || user.id;
    
    // Verify user is querying their own keys
    if (userId && userId !== user.id) {
      console.warn('[listApiKeys] User attempted to query another user\'s keys');
      return [];
    }
    
    // Check if Supabase client is properly initialized
    if (!supabase || typeof supabase.from !== 'function') {
      console.warn('[listApiKeys] Supabase client not available, returning empty list');
      return [];
    }
    
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, created_at, last_used_at, revoked_at, expires_at, scopes')
      .eq('user_id', queryUserId)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist (code 42P01), return empty array instead of throwing
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.warn('[listApiKeys] api_keys table does not exist, returning empty list');
        return [];
      }
      // If RLS denies access (code 42501), return empty array
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.warn('[listApiKeys] Permission denied by RLS, returning empty list');
        return [];
      }
      console.error('[listApiKeys] Supabase error:', error);
      // Return empty array instead of throwing to prevent 500 errors
      return [];
    }

  type ApiKeyRow = {
    id: string;
    name: string | null;
    key_prefix: string;
    created_at: string;
    last_used_at: string | null;
    revoked_at: string | null;
    expires_at: string | null;
    scopes: string[] | null;
  };

    const mappedKeys = ((keys || []) as ApiKeyRow[]).map(key => ({
      id: key.id,
      name: key.name || undefined,
      keyPrefix: key.key_prefix,
      createdAt: new Date(key.created_at),
      lastUsedAt: key.last_used_at ? new Date(key.last_used_at) : undefined,
      revokedAt: key.revoked_at ? new Date(key.revoked_at) : undefined,
      expiresAt: key.expires_at ? new Date(key.expires_at) : undefined,
      scopes: key.scopes || [],
    }));

    // Log activity
    await logActivity({
      activityType: 'api_key',
      action: 'viewed',
      title: 'Listed API keys',
      metadata: { count: mappedKeys.length },
    }).catch(() => {}); // Don't fail if logging fails

    return mappedKeys;
  } catch (error) {
    // If it's an auth error, re-throw it so caller can handle redirect
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      throw error;
    }
    console.error('[listApiKeys] Unexpected error:', error);
    // Return empty array instead of throwing to prevent 500 errors
    return [];
  }
}

/**
 * Create a new API key for the authenticated user
 * Uses RLS to ensure tenant isolation
 */
export async function createApiKey(
  userId?: string,
  input?: CreateApiKeyInput
): Promise<CreateApiKeyResult> {
  const { supabase, user } = await getAuthenticatedUser();
  
  // Use authenticated user's ID (RLS will enforce tenant isolation)
  const queryUserId = userId || user.id;
  
  // Verify user is creating their own key
  if (userId && userId !== user.id) {
    throw new Error('Unauthorized: Cannot create API key for another user');
  }
  
  const { key, prefix } = generateApiKey();
  const keyHash = await hashApiKey(key);
  
  // Get user's tenant_id from billing account
  // RLS will enforce tenant isolation, but we need tenant_id for the insert
  let tenantId: string | null = null;
  try {
    const { prisma } = await import('@/shared/db/prismaClient');
    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: queryUserId },
      select: { tenantId: true },
    });
    tenantId = billingAccount?.tenantId || null;
  } catch (error) {
    console.warn('[createApiKey] Could not fetch tenant_id, RLS will handle isolation');
  }
  
  const { data: newKey, error: insertError } = await supabase
    .from('api_keys')
    .insert({
      user_id: queryUserId,
      tenant_id: tenantId,
      key_prefix: prefix,
      key_hash: keyHash,
      name: input?.name || null,
      scopes: input?.scopes || ['*'],
      expires_at: input?.expiresAt?.toISOString() || null,
    } as never)
    .select('id, name, created_at')
    .single();

  if (insertError || !newKey) {
    // If RLS denies access, provide user-friendly error
    if (insertError?.code === '42501' || insertError?.message.includes('permission denied')) {
      throw new Error('Permission denied: Unable to create API key. Please check your account permissions.');
    }
    throw new Error(`Failed to create API key: ${insertError?.message || 'Unknown error'}`);
  }

  const keyData = newKey as {
    id: string;
    name: string | null;
    created_at: string;
  };

  // Log activity
  await logActivity({
    activityType: 'api_key',
    action: 'created',
    title: `Created API key${input?.name ? `: ${input.name}` : ''}`,
    status: 'success',
    resourceId: keyData.id,
    resourceType: 'api_key',
    metadata: { name: input?.name, hasScopes: !!input?.scopes },
  }).catch(() => {}); // Don't fail if logging fails

  return {
    id: keyData.id,
    key, // Return the full key only once
    name: keyData.name || undefined,
    createdAt: new Date(keyData.created_at),
  };
}

/**
 * Revoke an API key for the authenticated user
 * Uses RLS to ensure tenant isolation
 */
export async function revokeApiKey(keyId: string, userId?: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser();
  
  // Use authenticated user's ID (RLS will enforce tenant isolation)
  const queryUserId = userId || user.id;
  
  // Verify user is revoking their own key
  if (userId && userId !== user.id) {
    throw new Error('Unauthorized: Cannot revoke API key for another user');
  }
  
  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() } as never)
    .eq('id', keyId)
    .eq('user_id', queryUserId); // Ensure user owns the key

  if (error) {
    // If RLS denies access, provide user-friendly error
    if (error.code === '42501' || error.message.includes('permission denied')) {
      throw new Error('Permission denied: Unable to revoke API key. Please check your account permissions.');
    }
    throw new Error(`Failed to revoke API key: ${error.message}`);
  }

  // Log activity
  await logActivity({
    activityType: 'api_key',
    action: 'revoked',
    title: 'Revoked API key',
    status: 'success',
    resourceId: keyId,
    resourceType: 'api_key',
  }).catch(() => {}); // Don't fail if logging fails
}
