/**
 * Job Drain Endpoint
 * 
 * Protected endpoint for draining jobs from the queue.
 * Called by Vercel Cron or worker process.
 */

// ROUTE_CLASS: admin-internal
// AUTH: JOB_DRAIN_SECRET bearer token

import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/middleware/api-security';

const DRAIN_SECRET = process.env.JOB_DRAIN_SECRET || '';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes


// SECURITY: This route is secured via:
// - Vercel Cron Secret (for cron routes)
// - Service Role API Key (for internal routes)
// - Not using billing gates (system/internal use)

export const POST = withSecurity(async function POST(request: NextRequest) {
  // Verify secret
  const authHeader = request.headers.get('authorization');
  const secret = authHeader?.replace('Bearer ', '') || request.nextUrl.searchParams.get('secret');

  if (!DRAIN_SECRET || secret !== DRAIN_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Job processing is handled by the reconciliation service directly.
  // This endpoint is retained for cron compatibility but is a no-op.
  return NextResponse.json({
    success: true,
    processed: 0,
    timestamp: new Date().toISOString(),
  });
},
  { rateLimit: { windowMs: 60000, maxRequests: 10 }, requireAuth: false }
);

// Allow GET for health checks
export const GET = withSecurity(async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/internal/jobs/drain',
    method: 'POST',
  });
},
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
