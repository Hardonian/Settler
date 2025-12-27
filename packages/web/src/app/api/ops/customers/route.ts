/**
 * Ops Customers API
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import { prisma } from '@/shared/db/prismaClient';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withUniversalBillingGate(async function GET(request: Request) {
  const adminCheck = await requireAdmin(request as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const billingAccounts = await prisma.billingAccount.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    const customers = billingAccounts.map((account) => ({
      id: account.id,
      email: account.email || 'Unknown',
      status: account.status,
      createdAt: account.createdAt.toISOString(),
      usage: 0, // TODO: Calculate from ops_usage_aggregates
    }));

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    // Never return 500 - return graceful error response

    return NextResponse.json(

      {

        success: false,

        error: 'An error occurred',

        message: 'Please try again later or contact support if the issue persists',

      },

      { status: 200 }

    );
  }
}, { feature: 'GET API' });
