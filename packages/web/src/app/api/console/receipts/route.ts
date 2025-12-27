/**
 * Console Receipts API Route
 * 
 * Supports both session auth (Console UI) and API key auth (SDK/CLI)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { listReceipts } from '@/domain/console/receipts';
import { getCorrelationId, addCorrelationHeaders, createLogger } from '@/lib/monitoring/correlation';
import { getBillingAccountOptimized } from '@/lib/db/query-optimizer';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withUniversalBillingGate(export async function GET(request: NextRequest) {
  const correlationId = await getCorrelationId();
  const logger = await createLogger({ route: '/api/console/receipts', method: 'GET' });
  
  try {
    logger.info('Console receipts list request started', { correlationId });
    
    // Authenticate using unified auth (session or API key)
    const authContext = await requireAuth(request);
    logger.info('Authentication successful', { correlationId, userId: authContext.userId, type: authContext.type });

    // Validate billing account exists
    if (!authContext.billingAccountId) {
      logger.info('No billing account in auth context, looking up', { correlationId, userId: authContext.userId });
      
      // Use optimized billing account lookup with caching
      const billingAccount = await getBillingAccountOptimized(authContext.userId, true);

      if (!billingAccount) {
        // No billing account - return empty array (user hasn't created one yet)
        logger.info('No billing account found, returning empty list', { correlationId });
        const response = NextResponse.json({ receipts: [] });
        return addCorrelationHeaders(response, correlationId);
      }

      // Use found billing account
      logger.info('Found billing account, listing receipts', { correlationId, billingAccountId: billingAccount.id });
      const receipts = await listReceipts(billingAccount.id, 50);
      logger.info('Receipts listed successfully', { correlationId, count: receipts.length });
      
      const response = NextResponse.json({ receipts });
      return addCorrelationHeaders(response, correlationId);
    }

    // Use billing account from auth context
    logger.info('Using billing account from auth context', { correlationId, billingAccountId: authContext.billingAccountId });
    const receipts = await listReceipts(authContext.billingAccountId, 50);
    logger.info('Receipts listed successfully', { correlationId, count: receipts.length });

    const response = NextResponse.json({ receipts });
    return addCorrelationHeaders(response, correlationId);
  } catch (error) {
    // If auth error, return 401
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      logger.warn('Authentication failed', { correlationId, error: error.message });
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorrelationHeaders(response, correlationId);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error listing receipts', {
      correlationId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return 200 with empty array instead of 500 to prevent page crashes
    // The UI will show "No receipts" message
    const response = NextResponse.json({ receipts: [] });
    return addCorrelationHeaders(response, correlationId);
  }
}, { feature: 'GET API' });
