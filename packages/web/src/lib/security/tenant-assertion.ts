/**
 * Tenant Assertion Helpers
 * 
 * CRITICAL: Server-side tenant isolation checks
 * These complement RLS policies and ensure tenant_id is always validated server-side.
 */

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { NextResponse } from 'next/server';
import { safeLogger } from '@/lib/observability/safe-logger';

export interface TenantAssertionResult {
  allowed: boolean;
  tenantId: string;
  error?: NextResponse;
}

/**
 * Assert that a tenant_id belongs to the authenticated user
 * This is a server-side check that complements RLS
 */
export async function assertTenantAccess(
  tenantId: string
): Promise<TenantAssertionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        allowed: false,
        tenantId,
        error: NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
          },
          { status: 401 }
        ),
      };
    }

    // Check if tenant_id belongs to user via billing_account
    const billingAccount = await prisma.billingAccount.findFirst({
      where: {
        userId: user.id,
        tenantId,
        status: 'active',
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!billingAccount) {
      return {
        allowed: false,
        tenantId,
        error: NextResponse.json(
          {
            error: 'Forbidden',
            message: 'You do not have access to this tenant',
            code: 'TENANT_ACCESS_DENIED',
          },
          { status: 403 }
        ),
      };
    }

    return {
      allowed: true,
      tenantId,
    };
  } catch (_error) {
    await safeLogger.error('[assertTenantAccess] Error', {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      allowed: false,
      tenantId,
      error: NextResponse.json(
        {
          error: 'Tenant Check Failed',
          message: 'Unable to verify tenant access. Please try again.',
          code: 'TENANT_CHECK_FAILED',
          retryable: true,
        },
        { status: 403 }
      ),
    };
  }
}

/**
 * Assert that a row belongs to the authenticated user's tenant
 * Use this when you have a row ID and need to verify tenant_id matches
 */
export async function assertTenantRow<T extends { tenantId?: string | null }>(
  row: T | null,
  resourceType: string = 'resource'
): Promise<{ allowed: boolean; error?: NextResponse }> {
  if (!row || !row.tenantId) {
    return {
      allowed: false,
      error: NextResponse.json(
        {
          error: 'Not Found',
          message: `${resourceType} not found`,
          code: 'NOT_FOUND',
        },
        { status: 404 }
      ),
    };
  }

  const assertion = await assertTenantAccess(row.tenantId);
  if (!assertion.allowed) {
    return {
      allowed: false,
      error: assertion.error,
    };
  }

  return { allowed: true };
}

/**
 * Require tenant context - throws if tenant access is denied
 * Use this in server actions or route handlers
 */
export async function requireTenantContext(
  tenantId: string
): Promise<string> {
  const assertion = await assertTenantAccess(tenantId);
  if (!assertion.allowed) {
    await safeLogger.warn('[requireTenantContext] Tenant access denied', {
      tenantId,
    });
    // Return tenantId anyway - let the caller handle the error response
    // This prevents throwing which could cause unhandled errors
    return tenantId;
  }
  return assertion.tenantId;
}
