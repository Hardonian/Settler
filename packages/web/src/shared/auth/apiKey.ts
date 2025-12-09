/**
 * API Key Authentication for Next.js API Routes
 * 
 * Validates API keys from X-API-Key header and attaches auth context to request.
 * Uses Supabase client to query the api_keys table.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import bcrypt from 'bcrypt';
import { prisma } from '../db/prismaClient';

async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}

export interface ApiKeyAuthContext {
  apiKeyId: string;
  userId: string;
  billingAccountId?: string;
  tenantId?: string;
  scopes: string[];
}

/**
 * Extract API key from request headers
 */
export function extractApiKey(request: NextRequest): string | null {
  return request.headers.get('x-api-key') || null;
}

/**
 * Validate API key and return auth context
 */
export async function validateApiKey(apiKey: string): Promise<ApiKeyAuthContext> {
  if (!apiKey.startsWith('rk_')) {
    throw new Error('Invalid API key format');
  }

  // Extract prefix for database lookup
  const prefix = apiKey.substring(0, 12);

  // Lookup API key in database using Supabase
  const supabase = await createAdminClient();
  const { data: keyRecords, error } = await supabase
    .from('api_keys')
    .select('id, user_id, key_hash, scopes, revoked_at, expires_at')
    .eq('key_prefix', prefix)
    .limit(1)
    .single();

  if (error || !keyRecords) {
    throw new Error('Invalid API key');
  }

  const key = keyRecords as {
    id: string;
    user_id: string;
    key_hash: string;
    scopes: string[] | null;
    revoked_at: string | null;
    expires_at: string | null;
  };

  // Verify full key against hash
  const isValid = await verifyApiKey(apiKey, key.key_hash);
  if (!isValid) {
    throw new Error('Invalid API key');
  }

  // Check if key is revoked or expired
  if (key.revoked_at) {
    throw new Error('API key has been revoked');
  }

  if (key.expires_at && new Date(key.expires_at) < new Date()) {
    throw new Error('API key has expired');
  }

  // Get billing account for user (if exists)
  const billingAccount = await prisma.billingAccount.findFirst({
    where: { userId: key.user_id },
    select: { id: true, tenantId: true },
  });

  // Update last used timestamp
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() } as never)
    .eq('id', key.id);

  return {
    apiKeyId: key.id,
    userId: key.user_id,
    billingAccountId: billingAccount?.id,
    tenantId: billingAccount?.tenantId || undefined,
    scopes: key.scopes || [],
  };
}

/**
 * Middleware helper to authenticate API key from request
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<ApiKeyAuthContext> {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    throw new Error('API key required in X-API-Key header');
  }
  return validateApiKey(apiKey);
}
