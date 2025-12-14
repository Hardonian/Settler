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
import { createLogger, addCorrelationHeaders } from '@/lib/monitoring/correlation';
import { validateReceipt, sanitizeReceiptData, validateReceiptTotals } from '@/domain/receipts/validation';

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
  const logger = await createLogger({ route: '/api/v1/receipts', method: 'POST' });
  
  // Get correlation ID for tracing (initialize early)
  const { getCorrelationId } = await import('@/lib/monitoring/correlation');
  const correlationId = await getCorrelationId();
  logger.info('Receipt parse request started', { correlationId });

  try {

    // Check request size
    const sizeCheck = requestSizeLimits.api(request);
    if (sizeCheck) {
      logger.warn('Request size limit exceeded', { correlationId });
      return addCorrelationHeaders(sizeCheck, correlationId);
    }

    // Apply rate limiting
    const rateLimitCheck = await redisRateLimiters.api(request);
    if (rateLimitCheck) {
      logger.warn('Rate limit exceeded', { correlationId });
      return addCorrelationHeaders(rateLimitCheck, correlationId);
    }

    // Authenticate API key
    const auth = await authenticateApiKey(request);
    logger.info('API key authenticated', { correlationId, userId: auth.userId, apiKeyId: auth.apiKeyId });

    // Get billing account (required for usage tracking)
    if (!auth.billingAccountId) {
        const response = createErrorResponse("BILLING_ACCOUNT_REQUIRED", "Billing account required", 400);
        return addCorrelationHeaders(response, correlationId);
    }

    // Check entitlement
    const entitlement = await checkRequestEntitlement(auth, 'receipts');
    if (!entitlement.allowed && entitlement.error) {
       const response = createEntitlementErrorResponse(entitlement.error);
       return addCorrelationHeaders(response, correlationId);
    }

    // Parse request body
    let body;
    try {
        body = await request.json();
    } catch (e) {
        const response = createErrorResponse("BAD_REQUEST", "Invalid JSON", 400);
        return addCorrelationHeaders(response, correlationId);
    }

    // Validate with Zod
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
        const response = createErrorResponse("VALIDATION_ERROR", "Invalid request data", 400, {
            issues: validation.error.issues
        });
        return addCorrelationHeaders(response, correlationId);
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
      logger.info('Receipt parsed from OCR', { correlationId, itemCount: parseResult.receipt.items.length });

      // Validate and sanitize receipt data
      const sanitizedData = sanitizeReceiptData(parseResult.receipt as unknown as Record<string, unknown>);
      const validation = validateReceipt(sanitizedData);

      if (!validation.valid) {
        logger.warn('Receipt validation failed', { 
          correlationId, 
          errors: validation.errors?.issues.map((e) => e.message) || []
        });
        // Continue with sanitized data even if validation fails (graceful degradation)
      }

      // Validate receipt totals (business logic)
      const totalsValidation = validateReceiptTotals(sanitizedData as {
        subtotal?: number | null;
        tax?: number | null;
        total?: number | null;
        items?: Array<{ lineTotal?: number | null }>;
      });
      if (!totalsValidation.valid) {
        logger.warn('Receipt totals validation failed', { 
          correlationId, 
          errors: totalsValidation.errors 
        });
        // Log but continue (data might still be useful)
      }

      // Create receipt record (with retry)
      const receipt = await withRetry(() => prisma.receipt.create({
        data: {
          uploadId: upload.id,
          vendor: sanitizedData.vendor as string | null,
          date: sanitizedData.date as Date | null,
          currency: sanitizedData.currency as string | null,
          subtotal: sanitizedData.subtotal as number | null,
          tax: sanitizedData.tax as number | null,
          total: sanitizedData.total as number | null,
          paymentMethod: sanitizedData.paymentMethod as string | null,
          confidenceScore: sanitizedData.confidenceScore as number | null,
          rawText: sanitizedData.rawText as string | null,
          metadata: {},
        },
      }));
      logger.info('Receipt created', { correlationId, receiptId: receipt.id });

      // Create receipt items (with retry)
      // Use original parsed items (they're already validated by parser)
      // but ensure they match the sanitized structure
      if (parseResult.receipt.items.length > 0) {
        const itemsToCreate = parseResult.receipt.items.map(item => ({
          receiptId: receipt.id,
          name: item.name || 'Unknown',
          quantity: item.quantity ?? null,
          unitPrice: item.unitPrice ?? null,
          lineTotal: item.lineTotal ?? null,
          category: item.category ?? null,
          metadata: {},
        }));
        
        await withRetry(() => prisma.receiptItem.createMany({
          data: itemsToCreate,
        }));
        logger.info('Receipt items created', { correlationId, itemCount: itemsToCreate.length });
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
      const duration = Date.now() - startTime;
      await trackApiMetric('/api/v1/receipts', 'POST', 200, duration);
      logger.info('Receipt parse request completed', { correlationId, duration });

      const response = createSuccessResponse({
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
        items: receiptWithItems?.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity ? Number(item.quantity) : 0,
          unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
          lineTotal: item.lineTotal ? Number(item.lineTotal) : 0,
          category: item.category,
        })) || [],
        createdAt: receipt.createdAt,
      });

      return addCorrelationHeaders(response, correlationId);

    } catch (error: unknown) {
      // Track error metrics
      const duration = Date.now() - startTime;
      await trackApiMetric('/api/v1/receipts', 'POST', 500, duration);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Receipt parse request failed', { 
        correlationId, 
        error: errorMessage,
        duration,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Update upload status to failed (with retry)
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
          const response = createErrorResponse("OCR_FAILED", "Could not extract text from image", 422, { originalError: errorMessage });
          return addCorrelationHeaders(response, correlationId);
      }

      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Receipt parse request error', { 
      correlationId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    const response = handleApiError(error);
    return addCorrelationHeaders(response, correlationId);
  }
}
