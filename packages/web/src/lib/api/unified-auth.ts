/**
 * Unified Authentication Middleware
 * 
 * Supports both session-based auth (Console UI) and API key auth (SDK/CLI)
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateApiKey, ApiKeyAuthContext } from '@/shared/auth/apiKey';

export interface UnifiedAuthContext {
  type: 'session' | 'api_key';
  userId: string;
  billingAccountId?: string;
  tenantId?: string;
  apiKeyId?: string;
  scopes?: string[];
}

/**
 * Authenticate request using either session or API key
 * Returns null if neither is available (unauthenticated)
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<UnifiedAuthContext | null> {
  // Try API key first (for SDK/CLI)
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (apiKey && apiKey.startsWith('rk_')) {
    try {
      const context = await authenticateApiKey(request);
      return {
        type: 'api_key',
        userId: context.userId,
        billingAccountId: context.billingAccountId,
        tenantId: context.tenantId,
        apiKeyId: context.apiKeyId,
        scopes: context.scopes,
      };
    } catch (error) {
      // API key invalid, try session auth
    }
  }

  // Try session auth (for Console UI)
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user && !error) {
      // Get billing account
      const { prisma } = await import('@/shared/db/prismaClient');
      const billingAccount = await prisma.billingAccount.findFirst({
        where: { userId: user.id },
        select: { id: true, tenantId: true },
      });

      return {
        type: 'session',
        userId: user.id,
        billingAccountId: billingAccount?.id,
        tenantId: billingAccount?.tenantId || undefined,
      };
    }
  } catch (error) {
    // Session auth failed
  }

  return null;
}

/**
 * Require authentication - throws if not authenticated
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
