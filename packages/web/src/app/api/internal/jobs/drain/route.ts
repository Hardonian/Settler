/**
 * Job Drain Endpoint
 * 
 * Protected endpoint for draining jobs from the queue.
 * Called by Vercel Cron or worker process.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processJobs } from '@/lib/jobs/worker';
import { processRunJob } from '@/lib/jobs/handlers/run-processor';
import { createLogger } from '@/lib/logger';
import { withSecurity } from '@/lib/middleware/api-security';

const DRAIN_SECRET = process.env.JOB_DRAIN_SECRET || '';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes


// SECURITY: This route is secured via:
// - Vercel Cron Secret (for cron routes)
// - Service Role API Key (for internal routes)
// - Not using billing gates (system/internal use)

export const POST = withSecurity(async function POST(request: NextRequest) {
  const logger = createLogger();

  // Verify secret
  const authHeader = request.headers.get('authorization');
  const secret = authHeader?.replace('Bearer ', '') || request.nextUrl.searchParams.get('secret');

  if (!DRAIN_SECRET || secret !== DRAIN_SECRET) {
    logger.warn('Unauthorized job drain attempt');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const maxJobs = parseInt(request.nextUrl.searchParams.get('max') || '10', 10);
    
    logger.info('Starting job drain', { maxJobs });

    // Process run.process jobs
    const processed = await processJobs(processRunJob, maxJobs);

    logger.info('Job drain completed', { processed });

    return NextResponse.json({
      success: true,
      processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Job drain failed', error as Error);
    // Never return 500 - return graceful error response (cron can retry)
    return NextResponse.json(
      {
        success: false,
        processed: 0,
        error: 'Failed to drain jobs',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
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
