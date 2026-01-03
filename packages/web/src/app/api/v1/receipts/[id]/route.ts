/**
 * Receipts API - GET /api/v1/receipts/:id
 * 
 * Returns a stored receipt by ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { prisma } from '@/shared/db/prismaClient';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Try to authenticate, but allow unauthenticated access for playground
    let isAuthenticated = false;
    
    const authResult = await authenticateApiKey(request);
    if (authResult) {
      isAuthenticated = true;
    }
    // Unauthenticated access allowed for playground (graceful degradation)

    const { id } = await params;

    // For unauthenticated users, return demo response
    if (!isAuthenticated) {
      return NextResponse.json({
        id: `demo_${id}`,
        uploadId: `demo_upload_${id}`,
        vendor: "Demo Merchant",
        date: new Date().toISOString().split('T')[0],
        currency: "USD",
        subtotal: 0,
        tax: 0,
        total: 0,
        paymentMethod: "demo",
        confidenceScore: 0,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        demo: true,
        message: 'This is a demo response. Sign in to fetch real receipts.',
      }, { status: 200 });
    }

    // Get receipt
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        items: true,
        upload: true,
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: receipt.id,
      uploadId: receipt.uploadId,
      vendor: receipt.vendor,
      date: receipt.date,
      currency: receipt.currency,
      subtotal: receipt.subtotal,
      tax: receipt.tax,
      total: receipt.total,
      paymentMethod: receipt.paymentMethod,
      confidenceScore: receipt.confidenceScore,
      items: receipt.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity ? Number(item.quantity) : 0,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
        lineTotal: item.lineTotal ? Number(item.lineTotal) : 0,
        category: item.category,
      })),
      createdAt: receipt.createdAt,
      updatedAt: receipt.updatedAt,
    });
  } catch (error) {
    // Never return 500 - always return 200 with demo response for playground
    appLogger.error('Error fetching receipt', error);
    return NextResponse.json(
      {
        id: `demo_error_${Date.now()}`,
        vendor: "Demo Merchant",
        date: new Date().toISOString().split('T')[0],
        currency: "USD",
        subtotal: 0,
        tax: 0,
        total: 0,
        items: [],
        demo: true,
        error: 'Failed to fetch receipt',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
