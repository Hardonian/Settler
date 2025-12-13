/**
 * Admin Billing Reconciliation Endpoint
 * 
 * Manually reconcile billing account status from Stripe.
 * Admin-only endpoint for fixing webhook misses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reconcileBillingAccount, reconcileAllActiveSubscriptions } from '@/domain/billing/reconciliation';
import { createErrorResponse, ErrorCodes } from '@/lib/server-error-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/billing/reconcile
 * Reconcile a specific billing account or all accounts
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return createErrorResponse(new Error('Unauthorized'), 401, ErrorCodes.UNAUTHORIZED);
    }

    // Check if user is admin (you may need to adjust this based on your auth setup)
    const isAdmin = user.user_metadata?.role === 'admin' || 
                    user.email?.endsWith('@settler.dev') ||
                    process.env.ADMIN_EMAILS?.split(',').includes(user.email || '');

    if (!isAdmin) {
      return createErrorResponse(new Error('Forbidden'), 403, ErrorCodes.FORBIDDEN);
    }

    const body = await request.json().catch(() => ({}));
    const { billingAccountId, reconcileAll } = body;

    if (reconcileAll) {
      // Reconcile all active subscriptions
      const result = await reconcileAllActiveSubscriptions();
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    if (!billingAccountId) {
      return createErrorResponse(
        new Error('billingAccountId is required'),
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Reconcile specific account
    const result = await reconcileBillingAccount(billingAccountId);
    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * GET /api/admin/billing/reconcile
 * Check for out-of-sync subscriptions
 */
export async function GET() {
  try {
    // Check admin access
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return createErrorResponse(new Error('Unauthorized'), 401, ErrorCodes.UNAUTHORIZED);
    }

    const isAdmin = user.user_metadata?.role === 'admin' || 
                    user.email?.endsWith('@settler.dev') ||
                    process.env.ADMIN_EMAILS?.split(',').includes(user.email || '');

    if (!isAdmin) {
      return createErrorResponse(new Error('Forbidden'), 403, ErrorCodes.FORBIDDEN);
    }

    const { findOutOfSyncSubscriptions } = await import('@/domain/billing/reconciliation');
    const issues = await findOutOfSyncSubscriptions();

    return NextResponse.json({
      success: true,
      count: issues.length,
      issues,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
