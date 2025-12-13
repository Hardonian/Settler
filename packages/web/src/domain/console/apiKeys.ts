/**
 * Console API Keys Domain
 * 
 * Manages API key operations for the Developer Console.
 */

import { createAdminClient } from '@/lib/supabase/server';
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
 * List API keys for the current user
 */
export async function listApiKeys(userId: string): Promise<ApiKeyListItem[]> {
  try {
    const supabase = await createAdminClient();
    
    // Check if Supabase client is properly initialized
    if (!supabase || typeof supabase.from !== 'function') {
      console.warn('[listApiKeys] Supabase client not available, returning empty list');
      return [];
    }
    
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, created_at, last_used_at, revoked_at, expires_at, scopes')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist (code 42P01), return empty array instead of throwing
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.warn('[listApiKeys] api_keys table does not exist, returning empty list');
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

    return ((keys || []) as ApiKeyRow[]).map(key => ({
      id: key.id,
      name: key.name || undefined,
      keyPrefix: key.key_prefix,
      createdAt: new Date(key.created_at),
      lastUsedAt: key.last_used_at ? new Date(key.last_used_at) : undefined,
      revokedAt: key.revoked_at ? new Date(key.revoked_at) : undefined,
      expiresAt: key.expires_at ? new Date(key.expires_at) : undefined,
      scopes: key.scopes || [],
    }));
  } catch (error) {
    console.error('[listApiKeys] Unexpected error:', error);
    // Return empty array instead of throwing to prevent 500 errors
    return [];
  }
}

/**
 * Create a new API key
 */
export async function createApiKey(
  userId: string,
  input: CreateApiKeyInput
): Promise<CreateApiKeyResult> {
  const { key, prefix } = generateApiKey();
  const keyHash = await hashApiKey(key);

  const supabase = await createAdminClient();
  
  const { data: newKey, error: insertError } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      key_prefix: prefix,
      key_hash: keyHash,
      name: input.name || null,
      scopes: input.scopes || ['*'],
      expires_at: input.expiresAt?.toISOString() || null,
    } as never)
    .select('id, name, created_at')
    .single();

  if (insertError || !newKey) {
    throw new Error(`Failed to create API key: ${insertError?.message || 'Unknown error'}`);
  }

  const keyData = newKey as {
    id: string;
    name: string | null;
    created_at: string;
  };

  return {
    id: keyData.id,
    key, // Return the full key only once
    name: keyData.name || undefined,
    createdAt: new Date(keyData.created_at),
  };
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(userId: string, keyId: string): Promise<void> {
  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() } as never)
    .eq('id', keyId)
    .eq('user_id', userId); // Ensure user owns the key

  if (error) {
    throw new Error(`Failed to revoke API key: ${error.message}`);
  }
}
