/**
 * API v1 Base Route
 * 
 * Provides API versioning information and health check.
 */

import { NextResponse } from 'next/server';
import { publicRoute } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';

export const GET = publicRoute(async function GET() {
  return NextResponse.json({
    version: '1.0.0',
    status: 'active',
    endpoints: {
      receipts: '/api/v1/receipts',
      featureFlags: '/api/v1/feature-flags',
      convert: '/api/v1/convert',
    },
    documentation: 'https://settler.dev/docs/api',
    support: 'https://settler.dev/support',
  });
});
