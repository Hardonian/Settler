/**
 * Tenants Observability API Route
 * 
 * GET - List all tenants with metrics (super admin only)
 * 
 * Features:
 * - Rate limiting (stricter for admin)
 * - Response caching
 * - Request validation
 * - Automatic API logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { createAdminClient } from '@/lib/supabase/server';
import { sanitizeUserData } from '@/lib/privacy/pii-filter';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { withCache, CACHE_CONFIGS } from '@/lib/cache/api-cache';
import { validatePagination } from '@/lib/security/request-validator';
import { withApiLogging } from '@/middleware/api-logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handleGet(request: NextRequest) {
  // Require super admin
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Super admin access required' },
      { status: 403 }
    );
  }
  
  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);
  const includeMetrics = searchParams.get('includeMetrics') === 'true';
  
  // Validate pagination if provided
  const pagination = validatePagination({
    limit: searchParams.get('limit') || undefined,
    offset: searchParams.get('offset') || undefined,
  });
  
  if (pagination.errors) {
    return NextResponse.json(
      { error: 'Invalid pagination parameters', errors: pagination.errors },
      { status: 400 }
    );
  }
  
  try {
    
    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select(`
        id,
        name,
        slug,
        status,
        created_at,
        updated_at,
        metadata,
        billing_accounts (
          id,
          user_id,
          status,
          email,
          users:user_id (
            id,
            email,
            user_metadata
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);
    
    if (tenantsError) {
      console.error('[tenants] Error fetching tenants:', tenantsError);
      return NextResponse.json(
        { error: 'Failed to fetch tenants', message: tenantsError.message },
        { status: 500 }
      );
    }
    
    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });
    
    // Get metrics for each tenant if requested (batch queries for performance)
    const tenantsWithMetrics = await Promise.all(
      (tenants || []).map(async (tenant) => {
        const tenantData: Record<string, unknown> = {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
          createdAt: tenant.created_at,
          updatedAt: tenant.updated_at,
        };
        
        // Sanitize billing account data
        if (tenant.billing_accounts && Array.isArray(tenant.billing_accounts)) {
          tenantData.billingAccounts = tenant.billing_accounts.map((ba: any) => ({
            id: ba.id,
            status: ba.status,
            email: ba.email ? `***@${ba.email.split('@')[1]}` : undefined,
            userId: ba.user_id,
          }));
        }
        
        if (includeMetrics) {
          // Get API call count for this tenant
          const { count: apiCallCount } = await supabase
            .from('api_call_logs')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id);
          
          // Get active users count
          const { count: activeUsersCount } = await supabase
            .from('billing_accounts')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .eq('status', 'active');
          
          tenantData.metrics = {
            apiCalls: apiCallCount || 0,
            activeUsers: activeUsersCount || 0,
          };
        }
        
        return tenantData;
      })
    );
    
    return NextResponse.json({
      tenants: tenantsWithMetrics,
      count: tenantsWithMetrics.length,
      total: totalCount || 0,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  } catch (error) {
    console.error('[tenants] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Apply middleware: rate limiting -> caching -> handler
export const GET = withRateLimit(
  RATE_LIMIT_CONFIGS.admin,
  withCache(
    CACHE_CONFIGS.tenant,
    withApiLogging(handleGet)
  )
);
