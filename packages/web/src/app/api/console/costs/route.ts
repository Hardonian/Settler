/**
 * Cost Visibility API Route
 * 
 * GET /api/console/costs - Get cost breakdown for billing account
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPeriodCosts } from '@/lib/cost/visibility';
import { prisma } from '@/shared/db/prismaClient';
import { getCorrelationId, addCorrelationHeaders, createLogger } from '@/lib/monitoring/correlation';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/console/costs
 */
export const GET = withUniversalBillingGate(export async function GET() {
  const correlationId = await getCorrelationId();
  const logger = await createLogger({ route: '/api/console/costs', method: 'GET' });
  
  try {
    logger.info('Console costs request started', { correlationId });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's billing account
    const billingAccount = await prisma.billingAccount.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!billingAccount) {
      return NextResponse.json(
        { error: 'Billing account not found' },
        { status: 404 }
      );
    }

    const costs = await getCurrentPeriodCosts(billingAccount.id);

    if (!costs) {
      logger.warn('Failed to calculate costs', { correlationId, billingAccountId: billingAccount.id });
      const response = NextResponse.json(
        { error: 'Failed to calculate costs', costs: null },
        { status: 200 } // Return 200 with null to prevent UI crash
      );
      return addCorrelationHeaders(response, correlationId);
    }

    logger.info('Costs calculated successfully', { correlationId, billingAccountId: billingAccount.id });
    const response = NextResponse.json(costs);
    return addCorrelationHeaders(response, correlationId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching costs', {
      correlationId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return 200 with null instead of 500 to prevent UI crash
    const response = NextResponse.json(
      { error: 'Failed to fetch costs', costs: null },
      { status: 200 }
    );
    return addCorrelationHeaders(response, correlationId);
  }
}, { feature: 'GET API' });
