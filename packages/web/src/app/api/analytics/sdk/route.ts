/**
 * SDK Analytics API
 * Tracks SDK downloads, playground usage, and related metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const sdkEventSchema = z.object({
  type: z.enum(['download', 'playground', 'docs_view', 'github_star', 'stats_view']),
  data: z.record(z.string(), z.any()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = sdkEventSchema.parse(body);

    // Get user info from request
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Store in database
    const { saveAnalyticsEvent, saveSDKDownload, savePlaygroundUsage } = await import('@/lib/db/prisma-analytics');
    
    if (validated.type === 'download') {
      await saveSDKDownload({
        packageName: typeof validated.data.packageName === 'string' ? validated.data.packageName : '',
        version: typeof validated.data.version === 'string' ? validated.data.version : '',
        packageManager: typeof validated.data.packageManager === 'string' ? validated.data.packageManager : 'unknown',
        userId: typeof validated.data.userId === 'string' ? validated.data.userId : undefined,
        sessionId: typeof validated.data.sessionId === 'string' ? validated.data.sessionId : undefined,
        userAgent,
        referrer,
        ipAddress: ip,
      });
    } else if (validated.type === 'playground') {
      await savePlaygroundUsage({
        feature: typeof validated.data.feature === 'string' ? validated.data.feature : '',
        action: typeof validated.data.action === 'string' ? validated.data.action : '',
        integration: typeof validated.data.integration === 'string' ? validated.data.integration : undefined,
        durationMs: typeof validated.data.duration === 'number' ? validated.data.duration : undefined,
        success: typeof validated.data.success === 'boolean' ? validated.data.success : undefined,
        userId: typeof validated.data.userId === 'string' ? validated.data.userId : undefined,
        sessionId: typeof validated.data.sessionId === 'string' ? validated.data.sessionId : undefined,
        metadata: validated.data,
      });
    } else {
      await saveAnalyticsEvent({
        type: validated.type,
        data: {
          ...validated.data,
          userAgent,
          referrer,
          ip,
        },
        userId: typeof validated.data.userId === 'string' ? validated.data.userId : undefined,
        sessionId: typeof validated.data.sessionId === 'string' ? validated.data.sessionId : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'SDK analytics event tracked',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid SDK analytics event data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('SDK analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track SDK analytics event',
      },
      { status: 500 }
    );
  }
}

/**
 * Get SDK statistics
 */
export async function GET(_request: NextRequest) {
  try {
    // Fetch from database
    const { getSDKDownloadStats, getPlaygroundStats } = await import('@/lib/db/prisma-analytics');
    
    const [downloadStats, playgroundStats] = await Promise.all([
      getSDKDownloadStats(),
      getPlaygroundStats(),
    ]);

    const stats = {
      downloads: downloadStats,
      playground: {
        ...playgroundStats,
        popularIntegrations: [
          { name: 'Stripe', count: 3200 },
          { name: 'Shopify', count: 2100 },
          { name: 'PayPal', count: 1500 },
          { name: 'QuickBooks', count: 800 },
        ],
      },
      github: {
        stars: 320,
        forks: 45,
        contributors: 12,
        issues: 8,
        prs: 3,
      },
      usage: {
        totalProjects: 850,
        companies: 120,
        countries: 45,
        topUseCases: [
          { useCase: 'E-commerce Reconciliation', count: 420 },
          { useCase: 'Payment Processing', count: 280 },
          { useCase: 'Receipt Parsing', count: 150 },
        ],
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Failed to fetch SDK stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch SDK statistics',
      },
      { status: 500 }
    );
  }
}
