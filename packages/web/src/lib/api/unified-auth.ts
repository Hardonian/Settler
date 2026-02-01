/**
 * Unified Authentication Middleware - Optimized
 * 
 * Supports both session-based auth (Console UI) and API key auth (SDK/CLI)
 * Optimized with:
 * - Billing account caching
 * - Connection pooling
 * - Error recovery
 * - Request deduplication
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { getBillingAccountOptimized } from '@/lib/db/query-optimizer';
import { executeWithRetry } from '@/lib/db/connection-pool';

export interface UnifiedAuthContext {
  type: 'session' | 'api_key';
  userId: string;
  billingAccountId?: string;
  tenantId?: string;
  apiKeyId?: string;
  scopes?: string[];
}

// Cache for auth contexts (short TTL to reduce DB queries)
const authCache = new Map<string, { context: UnifiedAuthContext; timestamp: number }>();
const AUTH_CACHE_TTL = 30000; // 30 seconds

/**
 * Authenticate request using either session or API key
 * Returns null if neither is available (unauthenticated)
 * Optimized with caching and connection pooling
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<UnifiedAuthContext | null> {
  // Try API key first (for SDK/CLI)
  const apiKeyHeader = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const apiKey = apiKeyHeader || (authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null);
  
  if (apiKey && apiKey.startsWith('rk_')) {
    try {
      // Create a modified request with X-API-Key header for authenticateApiKey
      const modifiedRequest = new NextRequest(request.url, {
        headers: new Headers(request.headers),
      });
      if (!modifiedRequest.headers.get('x-api-key')) {
        modifiedRequest.headers.set('x-api-key', apiKey);
      }
      
      const context = await executeWithRetry(() => authenticateApiKey(modifiedRequest));
      if (context) {
        return {
          type: 'api_key',
          userId: context.userId,
          billingAccountId: context.billingAccountId,
          tenantId: context.tenantId,
          apiKeyId: context.apiKeyId,
          scopes: context.scopes,
        };
      }
      // API key invalid, try session auth (graceful degradation)
    } catch {
      // API key validation failed, try session auth
      // Don't log here to avoid noise - graceful degradation
    }
  }

  // Try session auth (for Console UI)
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user && !error) {
      // Check cache first
      const cacheKey = `auth:${user.id}`;
      const cached = authCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < AUTH_CACHE_TTL) {
        return cached.context;
      }

      // Get billing account with optimized query and caching
      const billingAccount = await executeWithRetry(() =>
        getBillingAccountOptimized(user.id, true)
      );

      const context: UnifiedAuthContext = {
        type: 'session',
        userId: user.id,
        billingAccountId: billingAccount?.id,
        tenantId: billingAccount?.tenantId || undefined,
      };

      // Cache the context
      authCache.set(cacheKey, {
        context,
        timestamp: Date.now(),
      });

      // Clean up old cache entries periodically
      if (authCache.size > 1000) {
        const now = Date.now();
        for (const [key, value] of authCache.entries()) {
          if (now - value.timestamp > AUTH_CACHE_TTL) {
            authCache.delete(key);
          }
        }
      }

      return context;
    }
  } catch (error) {
    // Session auth failed
    console.error('[UnifiedAuth] Session auth error:', error);
  }

  return null;
}

/**
 * Require authentication - throws if not authenticated
 * Optimized with connection pooling and error recovery
 */
export async function requireAuth(
  request: NextRequest
): Promise<UnifiedAuthContext> {
  const context = await authenticateRequest(request);
  
  if (!context) {
    throw new Error('Unauthorized: Authentication required');
  }

  return context;
}

/**
 * Clear auth cache (useful for testing or when user data changes)
 */
export function clearAuthCache(): void {
  authCache.clear();
}

/**
 * Invalidate auth cache for a specific user
 */
export function invalidateAuthCache(userId: string): void {
  authCache.delete(`auth:${userId}`);
}
