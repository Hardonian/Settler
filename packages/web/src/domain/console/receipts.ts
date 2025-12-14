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
 * 
 * CRITICAL: This function enforces tenant isolation when using Prisma (which bypasses RLS).
 * It ensures the billing_account_id belongs to the authenticated user before allowing access.
 */
async function verifyBillingAccountAccess(billingAccountId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('[verifyBillingAccountAccess] User not authenticated:', authError?.message);
      return false;
    }
    
    // Validate billingAccountId format (UUID)
    if (!billingAccountId || typeof billingAccountId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(billingAccountId)) {
      console.warn('[verifyBillingAccountAccess] Invalid billingAccountId format:', billingAccountId);
      return false;
    }
    
    // Check if Prisma is available
    if (!prisma || typeof prisma.billingAccount === 'undefined') {
      console.error('[verifyBillingAccountAccess] Prisma client not available');
      return false;
    }
    
    // CRITICAL: Verify billing account belongs to user (tenant isolation)
    // This check prevents cross-tenant data access when using Prisma (which bypasses RLS)
    const billingAccount = await prisma.billingAccount.findFirst({
      where: {
        id: billingAccountId,
        userId: user.id, // Enforce user ownership
      },
      select: {
        id: true,
        userId: true,
      },
    });
    
    if (!billingAccount) {
      console.warn('[verifyBillingAccountAccess] Billing account not found or access denied', {
        billingAccountId,
        userId: user.id,
      });
      return false;
    }
    
    // Double-check user ID matches (defense in depth)
    if (billingAccount.userId !== user.id) {
      console.error('[verifyBillingAccountAccess] User ID mismatch - potential security issue', {
        billingAccountUserId: billingAccount.userId,
        authenticatedUserId: user.id,
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[verifyBillingAccountAccess] Error:', error);
    // Fail closed - deny access on error
    return false;
  }
}

/**
 * List receipts for a billing account
 * Verifies the billing account belongs to the authenticated user
 * 
 * CRITICAL: Tenant isolation enforced via verifyBillingAccountAccess.
 * Prisma bypasses RLS, so we must verify ownership in application code.
 */
export async function listReceipts(
  billingAccountId: string,
  limit = 50,
  offset = 0
): Promise<ReceiptListItem[]> {
  try {
    // Validate inputs
    if (!billingAccountId || typeof billingAccountId !== 'string') {
      console.warn('[listReceipts] Invalid billingAccountId');
      return [];
    }
    
    const safeLimit = Math.min(Math.max(1, limit), 100); // Clamp between 1-100
    const safeOffset = Math.max(0, offset);
    
    // Verify billing account access (CRITICAL: tenant isolation)
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
    
    // Query receipts with explicit billing account filter
    // The join ensures we only get receipts for this billing account
    const receipts = await prisma.receipt.findMany({
      where: {
        upload: {
          billingAccountId, // Filter by billing account (tenant isolation)
        },
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      skip: safeOffset,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[listReceipts] Error:', {
      error: errorMessage,
      billingAccountId,
      limit,
      offset,
    });
    // Return empty array instead of throwing to prevent 500 errors
    return [];
  }
}

/**
 * Get receipt details by ID
 * Verifies the billing account belongs to the authenticated user
 * 
 * CRITICAL: Tenant isolation enforced via verifyBillingAccountAccess and explicit where clause.
 * Prisma bypasses RLS, so we must verify ownership in application code.
 */
export async function getReceiptDetail(
  receiptId: string,
  billingAccountId: string
): Promise<ReceiptDetail | null> {
  try {
    // Validate inputs
    if (!receiptId || typeof receiptId !== 'string') {
      console.warn('[getReceiptDetail] Invalid receiptId');
      return null;
    }
    
    if (!billingAccountId || typeof billingAccountId !== 'string') {
      console.warn('[getReceiptDetail] Invalid billingAccountId');
      return null;
    }
    
    // Verify billing account access (CRITICAL: tenant isolation)
    const hasAccess = await verifyBillingAccountAccess(billingAccountId);
    if (!hasAccess) {
      console.warn('[getReceiptDetail] Access denied for billing account:', billingAccountId);
      return null;
    }
    
    // Check if Prisma is available
    if (!prisma || typeof prisma.receipt === 'undefined') {
      console.warn('[getReceiptDetail] Prisma client not available');
      return null;
    }
    
    // Query receipt with explicit billing account filter
    // The join ensures we only get receipts for this billing account
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        upload: {
          billingAccountId, // Filter by billing account (tenant isolation)
        },
      },
      include: {
        items: true,
        upload: true,
      },
    });

    if (!receipt) {
      // Receipt not found or doesn't belong to this billing account
      return null;
    }

    // Double-check billing account matches (defense in depth)
    if (receipt.upload.billingAccountId !== billingAccountId) {
      console.error('[getReceiptDetail] Billing account mismatch - potential security issue', {
        receiptUploadBillingAccountId: receipt.upload.billingAccountId,
        requestedBillingAccountId: billingAccountId,
      });
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[getReceiptDetail] Error:', {
      error: errorMessage,
      receiptId,
      billingAccountId,
    });
    // Return null instead of throwing to prevent 500 errors
    return null;
  }
}
