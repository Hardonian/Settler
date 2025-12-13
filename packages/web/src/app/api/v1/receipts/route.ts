/**
 * Receipts API - POST /api/v1/receipts
 * 
 * Accepts receipt images/PDFs and returns normalized JSON.
 */

import { NextRequest } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { recordServiceUsage } from '@/shared/usage/usageEvent';
import { prisma } from '@/shared/db/prismaClient';
import { getOcrProvider } from '@/domain/receipts/ocrProvider';
import { parseReceiptFromText } from '@/domain/receipts/parser';
import { checkRequestEntitlement, createEntitlementErrorResponse } from '@/shared/middleware/entitlements';
import { z } from 'zod';
import { createErrorResponse, handleApiError, createSuccessResponse } from '@/lib/api-response';
import { withRetry } from '@/lib/db/retry';
import { requestSizeLimits } from '@/middleware/request-size-limit';
import { redisRateLimiters } from '@/lib/security/rate-limiter-redis';
import { trackApiMetric } from '@/lib/monitoring/metrics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine
export const maxDuration = 60; // 60 seconds for OCR processing

const requestSchema = z.object({
    fileUrl: z.string().url().optional(),
    fileData: z.string().optional(), // Base64
    mimeType: z.string().optional(),
}).refine(data => data.fileUrl || data.fileData, {
    message: "Either fileUrl or fileData is required",
    path: ["fileUrl"]
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check request size
    const sizeCheck = requestSizeLimits.api(request);
    if (sizeCheck) {
      return sizeCheck;
    }

    // Apply rate limiting
    const rateLimitCheck = await redisRateLimiters.api(request);
    if (rateLimitCheck) {
      return rateLimitCheck;
    }

    // Authenticate API key
    const auth = await authenticateApiKey(request);

    // Get billing account (required for usage tracking)
    if (!auth.billingAccountId) {
        return createErrorResponse("BILLING_ACCOUNT_REQUIRED", "Billing account required", 400);
    }

    // Check entitlement
    const entitlement = await checkRequestEntitlement(auth, 'receipts');
    if (!entitlement.allowed && entitlement.error) {
       return createEntitlementErrorResponse(entitlement.error);
    }

    // Parse request body
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return createErrorResponse("BAD_REQUEST", "Invalid JSON", 400);
    }

    // Validate with Zod
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
        return createErrorResponse("VALIDATION_ERROR", "Invalid request data", 400, {
            issues: validation.error.issues
        });
    }

    const { fileUrl, fileData, mimeType } = validation.data;

    // Create receipt upload record (with retry)
    const upload = await withRetry(() => prisma.receiptUpload.create({
      data: {
        apiKeyId: auth.apiKeyId,
        billingAccountId: auth.billingAccountId,
        storageLocation: fileUrl || 'data://inline',
        originalFilename: 'receipt.jpg',
        mimeType: mimeType || 'image/jpeg',
        sizeBytes: fileData ? Buffer.from(fileData, 'base64').length : 0,
        status: 'processing',
      },
    }));

    try {
      // Get OCR provider and extract text
      const ocrProvider = getOcrProvider();
      let imageData: Buffer | string;
      
      if (fileUrl) {
        // Fetch image from URL
        const response = await fetch(fileUrl);
        if (!response.ok) {
           throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        imageData = Buffer.from(await response.arrayBuffer());
      } else {
        // Decode base64 data
        imageData = Buffer.from(fileData!, 'base64');
      }

      const ocrResult = await ocrProvider.extractText(
        imageData,
        mimeType || 'image/jpeg'
      );

      // Graceful degradation: If OCR returns empty text, throw specific error
      if (!ocrResult.text || ocrResult.text.trim().length === 0) {
          throw new Error("OCR_FAILED: No text extracted from image");
      }

      // Parse receipt from OCR text
      const parseResult = parseReceiptFromText(ocrResult.text);

      // Create receipt record (with retry)
      const receipt = await withRetry(() => prisma.receipt.create({
        data: {
          uploadId: upload.id,
          vendor: parseResult.receipt.vendor,
          date: parseResult.receipt.date,
          currency: parseResult.receipt.currency,
          subtotal: parseResult.receipt.subtotal,
          tax: parseResult.receipt.tax,
          total: parseResult.receipt.total,
          paymentMethod: parseResult.receipt.paymentMethod,
          confidenceScore: parseResult.confidenceScore,
          rawText: parseResult.rawText,
          metadata: {},
        },
      }));

      // Create receipt items (with retry)
      if (parseResult.receipt.items.length > 0) {
        await withRetry(() => prisma.receiptItem.createMany({
          data: parseResult.receipt.items.map(item => ({
            receiptId: receipt.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            category: item.category,
            metadata: {},
          })),
        }));
      }

      // Update upload status (with retry)
      await withRetry(() => prisma.receiptUpload.update({
        where: { id: upload.id },
        data: { status: 'completed' },
      }));

      // Record usage
      await recordServiceUsage({
        billingAccountId: auth.billingAccountId,
        service: 'settler-receipts',
        operation: 'parse_sync',
        quantity: 1,
        metadata: {
          receiptId: receipt.id,
          itemCount: parseResult.receipt.items.length,
        },
      });

      // Return normalized receipt (with retry)
      const receiptWithItems = await withRetry(() => prisma.receipt.findUnique({
        where: { id: receipt.id },
        include: { items: true },
      }));

      // Track metrics
      await trackApiMetric('/api/v1/receipts', 'POST', 200, Date.now() - startTime);

      return createSuccessResponse({
        id: receipt.id,
        uploadId: upload.id,
        vendor: receipt.vendor,
        date: receipt.date,
        currency: receipt.currency,
        subtotal: receipt.subtotal,
        tax: receipt.tax,
        total: receipt.total,
        paymentMethod: receipt.paymentMethod,
        confidenceScore: receipt.confidenceScore,
        items: receiptWithItems?.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity ? Number(item.quantity) : 0,
          unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
          lineTotal: item.lineTotal ? Number(item.lineTotal) : 0,
          category: item.category,
        })) || [],
        createdAt: receipt.createdAt,
      });

    } catch (error: unknown) {
      // Track error metrics
      await trackApiMetric('/api/v1/receipts', 'POST', 500, Date.now() - startTime);

      // Update upload status to failed (with retry)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await withRetry(() => prisma.receiptUpload.update({
        where: { id: upload.id },
        data: {
          status: 'failed',
          errorMessage: errorMessage,
        },
      })).catch(() => {
        // Ignore errors updating failed status
      });

      if (errorMessage.includes("OCR_FAILED")) {
          return createErrorResponse("OCR_FAILED", "Could not extract text from image", 422, { originalError: errorMessage });
      }

      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
