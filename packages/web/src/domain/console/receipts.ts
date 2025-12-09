/**
 * Console Receipts Domain
 * 
 * Queries receipts for the Developer Console.
 */

import { prisma } from '@/shared/db/prismaClient';

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
 * List receipts for a billing account
 */
export async function listReceipts(
  billingAccountId: string,
  limit = 50,
  offset = 0
): Promise<ReceiptListItem[]> {
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

  return receipts.map((receipt) => ({
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
}

/**
 * Get receipt details by ID
 */
export async function getReceiptDetail(
  receiptId: string,
  billingAccountId: string
): Promise<ReceiptDetail | null> {
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
}
