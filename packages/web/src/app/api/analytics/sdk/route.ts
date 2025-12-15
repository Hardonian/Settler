/**
 * SDK Analytics API
 * Tracks SDK downloads, playground usage, and related metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const sdkEventSchema = z.object({
  type: z.enum(['download', 'playground', 'docs_view', 'github_star', 'stats_view']),
  data: z.record(z.any()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = sdkEventSchema.parse(body);

    // Get user info from request
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // TODO: Store in analytics database
    console.log('SDK analytics event:', {
      type: validated.type,
      data: {
        ...validated.data,
        userAgent,
        referrer,
        ip,
      },
      timestamp: new Date().toISOString(),
    });

    // Example: Store in database
    // await db.sdkAnalytics.create({
    //   data: {
    //     type: validated.type,
    //     data: validated.data,
    //     userAgent,
    //     referrer,
    //     ip,
    //     timestamp: new Date(),
    //   },
    // });

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
          details: error.errors,
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
export async function GET(request: NextRequest) {
  try {
    // TODO: Fetch from database
    // For now, return mock data
    const stats = {
      downloads: {
        total: 45000,
        weekly: 1250,
        monthly: 5200,
        byPackage: {
          '@settler/sdk': 35000,
          '@settler/react-settler': 8000,
          '@settler/cli': 2000,
        },
        trend: [
          { date: '2026-01-01', count: 1100 },
          { date: '2026-01-08', count: 1200 },
          { date: '2026-01-15', count: 1250 },
        ],
      },
      playground: {
        totalSessions: 8500,
        activeUsers: 320,
        usageByFeature: {
          reconcile: 4200,
          receipts: 2800,
          flags: 1500,
          convert: 800,
          cli: 200,
        },
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
