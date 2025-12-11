/**
 * Receipts API - GET /api/v1/receipts/:id
 * 
 * Returns a stored receipt by ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { prisma } from '@/shared/db/prismaClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate API key
    await authenticateApiKey(request);

    const { id } = await params;

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
      items: receipt.items.map((item: any) => ({
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
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch receipt',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
