/**
 * Investor Relations API
 * Provides key metrics and data for investor presentations
 * Note: This should be protected with authentication in production
 */

import { NextRequest, NextResponse } from 'next/server';

// TODO: Replace with actual database queries
// This is a mock implementation for demonstration
async function getInvestorMetrics() {
  // In production, fetch from database
  return {
    customers: {
      total: 500,
      active: 485,
      churned: 15,
      growthRate: 0.15, // 15% MoM
    },
    revenue: {
      mrr: 50000,
      arr: 600000,
      growthRate: 0.12, // 12% MoM
      ltv: 1800,
      cac: 200,
      ltvCacRatio: 9,
    },
    usage: {
      totalReconciliations: 2500000,
      totalReceiptParses: 125000,
      totalFlagEvaluations: 50000000,
      averageTransactionsPerCustomer: 5000,
    },
    engagement: {
      activeUsers: 450,
      dailyActiveUsers: 320,
      weeklyActiveUsers: 410,
      averageSessionDuration: 12, // minutes
    },
    support: {
      tickets: 45,
      averageResponseTime: 2.5, // hours
      satisfactionScore: 4.8, // out of 5
    },
    product: {
      integrations: 10,
      apiCalls: 10000000,
      uptime: 99.9,
      averageLatency: 28, // ms
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { checkInvestorAuth } = await import('@/lib/auth/investor-auth');
    const auth = await checkInvestorAuth(request);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const metrics = await getInvestorMetrics();

    return NextResponse.json({
      success: true,
      data: metrics,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Investor metrics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch investor metrics',
      },
      { status: 500 }
    );
  }
}
