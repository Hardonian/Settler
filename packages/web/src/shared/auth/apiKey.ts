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
import type { Database } from '@/types/database.types';

type ApiKeyRow = {
  id: string;
  user_id: string;
  key_hash: string;
  scopes: string[] | null;
  revoked_at: string | null;
  expires_at: string | null;
};

type ApiKeyUpdate = {
  last_used_at: string;
};

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
 * Supports both X-API-Key header and Authorization: Bearer <key>
 */
export function extractApiKey(request: NextRequest): string | null {
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }
  
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    // Only return if it looks like an API key (starts with rk_)
    if (token.startsWith('rk_')) {
      return token;
    }
  }
  
  return null;
}

/**
 * Validate API key and return auth context
 */
export async function validateApiKey(apiKey: string): Promise<ApiKeyAuthContext | null> {
  if (!apiKey.startsWith('rk_')) {
    // Return null instead of throwing - graceful degradation
    return null;
  }

  // Extract prefix for database lookup
  const prefix = apiKey.substring(0, 12);

  // Lookup API key in database using Supabase
  const supabase = (await createAdminClient()) as any;
  const { data: keyRecords, error } = await supabase
    .from('api_keys')
    .select('id, user_id, key_hash, scopes, revoked_at, expires_at')
    .eq('key_prefix', prefix)
    .limit(1)
    .single();

  if (error || !keyRecords) {
    // Return null instead of throwing - graceful degradation
    return null;
  }

  const key = keyRecords as ApiKeyRow;

  // Verify full key against hash
  const isValid = await verifyApiKey(apiKey, key.key_hash);
  if (!isValid) {
    // Return null instead of throwing - graceful degradation
    return null;
  }

  // Check if key is revoked or expired
  if (key.revoked_at) {
    // Return null instead of throwing - graceful degradation
    return null;
  }

  if (key.expires_at && new Date(key.expires_at) < new Date()) {
    // Return null instead of throwing - graceful degradation
    return null;
  }

  // Get billing account for user (if exists)
  const billingAccount = await prisma.billingAccount.findFirst({
    where: { userId: key.user_id },
    select: { 
      id: true, 
      tenantId: true,
    },
  });

  // Update last used timestamp
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() } satisfies ApiKeyUpdate)
    .eq('id', key.id);

  return {
    apiKeyId: key.id,
    userId: key.user_id,
    billingAccountId: billingAccount?.id,
    tenantId: billingAccount?.tenantId || undefined,
    scopes: key.scopes ?? [],
  };
}

/**
 * Middleware helper to authenticate API key from request
 * Supports both X-API-Key header and Authorization: Bearer <key>
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<ApiKeyAuthContext | null> {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    // Return null instead of throwing - graceful degradation
    return null;
  }
  return validateApiKey(apiKey);
}
