/**
 * OSS Stats API
 * Returns aggregated SDK statistics
 */

import { NextResponse } from 'next/server';
import { getCacheHeaders } from '@/lib/performance/cache-strategies';
import { publicRoute } from '@/middleware/billing-gate-universal';

export const GET = publicRoute(async function GET() {
  try {
    // TODO: Fetch from database and aggregate
    // For now, return mock data that matches the expected structure
    
    const downloadStats = {
      total: 45000,
      weekly: 1250,
      monthly: 5200,
      byPackage: {
        '@settler/sdk': 35000,
        '@settler/react-settler': 10000,
      },
    };
    
    const playgroundStats = {
      totalSessions: 3200,
      activeUsers: 850,
      usageByFeature: {
        'reconciliation': 1200,
        'receipts': 800,
        'feature-flags': 600,
        'conversion': 400,
        'cli': 200,
      },
    };
    
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
    // Never return 500 - return empty stats with graceful error message
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch OSS statistics',
        message: 'Please try again later',
        data: {
          downloads: { total: 0, weekly: 0, monthly: 0, byPackage: {} },
          playground: { totalSessions: 0, activeUsers: 0, usageByFeature: {}, popularIntegrations: [] },
          github: { stars: 0, forks: 0, contributors: 0, issues: 0, prs: 0 },
          usage: { totalProjects: 0, companies: 0, countries: 0, topUseCases: [] },
        },
      },
      { status: 200 }
    );
  }
});;
