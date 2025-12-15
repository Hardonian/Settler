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
