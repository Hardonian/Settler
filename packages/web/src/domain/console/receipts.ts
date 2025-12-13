/**
 * Console Receipts Domain
 * 
 * Queries receipts for the Developer Console.
 * Uses Prisma with billing account scoping for tenant isolation.
 */

import { prisma } from '@/shared/db/prismaClient';
import { createClient } from '@/lib/supabase/server';

export interface ReceiptListItem {
  id: string;
  uploadId: string;
  vendor: string | null;
  date: Date | null;
  currency: string | null;
  total: number | null;
  confidenceScore: number | null;
  itemCount: number;
  createdAt: Date;
}

export interface ReceiptDetail extends ReceiptListItem {
  subtotal: number | null;
  tax: number | null;
  paymentMethod: string | null;
  rawText: string | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number | null;
    unitPrice: number | null;
    lineTotal: number | null;
    category: string | null;
  }>;
}

/**
 * Verify billing account belongs to authenticated user
 */
async function verifyBillingAccountAccess(billingAccountId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Check if billing account exists and belongs to user
    if (!prisma || typeof prisma.billingAccount === 'undefined') {
      return false;
    }
    
    const billingAccount = await prisma.billingAccount.findFirst({
      where: {
        id: billingAccountId,
        userId: user.id,
      },
    });
    
    return !!billingAccount;
  } catch (error) {
    console.error('[verifyBillingAccountAccess] Error:', error);
    return false;
  }
}

/**
 * List receipts for a billing account
 * Verifies the billing account belongs to the authenticated user
 */
export async function listReceipts(
  billingAccountId: string,
  limit = 50,
  offset = 0
): Promise<ReceiptListItem[]> {
  try {
    // Verify billing account access
    const hasAccess = await verifyBillingAccountAccess(billingAccountId);
    if (!hasAccess) {
      console.warn('[listReceipts] Access denied for billing account:', billingAccountId);
      return [];
    }
    
    // Check if Prisma is available
    if (!prisma || typeof prisma.receipt === 'undefined') {
      console.warn('[listReceipts] Prisma client not available, returning empty list');
      return [];
    }
    
    const receipts = await prisma.receipt.findMany({
      where: {
        upload: {
          billingAccountId,
        },
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return receipts.map((receipt: (typeof receipts)[number]) => ({
      id: receipt.id,
      uploadId: receipt.uploadId,
      vendor: receipt.vendor,
      date: receipt.date,
      currency: receipt.currency,
      total: receipt.total ? Number(receipt.total) : null,
      confidenceScore: receipt.confidenceScore ? Number(receipt.confidenceScore) : null,
      itemCount: receipt.items.length,
      createdAt: receipt.createdAt,
    }));
  } catch (error) {
    console.error('[listReceipts] Error:', error);
    // Return empty array instead of throwing to prevent 500 errors
    return [];
  }
}

/**
 * Get receipt details by ID
 * Verifies the billing account belongs to the authenticated user
 */
export async function getReceiptDetail(
  receiptId: string,
  billingAccountId: string
): Promise<ReceiptDetail | null> {
  try {
    // Verify billing account access
    const hasAccess = await verifyBillingAccountAccess(billingAccountId);
    if (!hasAccess) {
      console.warn('[getReceiptDetail] Access denied for billing account:', billingAccountId);
      return null;
    }
    
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        upload: {
          billingAccountId,
        },
      },
      include: {
        items: true,
        upload: true,
      },
    });

    if (!receipt) {
      return null;
    }

    return {
      id: receipt.id,
      uploadId: receipt.uploadId,
      vendor: receipt.vendor,
      date: receipt.date,
      currency: receipt.currency,
      total: receipt.total ? Number(receipt.total) : null,
      subtotal: receipt.subtotal ? Number(receipt.subtotal) : null,
      tax: receipt.tax ? Number(receipt.tax) : null,
      paymentMethod: receipt.paymentMethod,
      confidenceScore: receipt.confidenceScore ? Number(receipt.confidenceScore) : null,
      rawText: receipt.rawText,
      itemCount: receipt.items.length,
      createdAt: receipt.createdAt,
      items: receipt.items.map((item: { id: string; name: string; quantity: unknown; unitPrice: unknown; lineTotal: unknown; category: string | null }) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity ? Number(item.quantity) : null,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        lineTotal: item.lineTotal ? Number(item.lineTotal) : null,
        category: item.category,
      })),
    };
  } catch (error) {
    console.error('[getReceiptDetail] Error:', error);
    return null;
  }
}
