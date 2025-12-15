/**
 * OSS Stats API
 * Returns aggregated SDK statistics
 */

import { NextResponse } from 'next/server';
import { getCacheHeaders } from '@/lib/performance/cache-strategies';

export async function GET() {
  try {
    // TODO: Fetch from database and aggregate
    // For now, return mock data that matches the expected structure
    
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

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      {
        headers: getCacheHeaders('API'),
      }
    );
  } catch (error) {
    console.error('Failed to fetch OSS stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch OSS statistics',
      },
      { status: 500 }
    );
  }
}
