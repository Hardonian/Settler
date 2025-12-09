/**
 * Receipts API - POST /api/v1/receipts
 * 
 * Accepts receipt images/PDFs and returns normalized JSON.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { recordServiceUsage } from '@/shared/usage/usageEvent';
import { prisma } from '@/shared/db/prismaClient';
import { getOcrProvider } from '@/domain/receipts/ocrProvider';
import { parseReceiptFromText } from '@/domain/receipts/parser';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for OCR processing

export async function POST(request: NextRequest) {
  try {
    // Authenticate API key
    const auth = await authenticateApiKey(request);

    // Get billing account (required for usage tracking)
    if (!auth.billingAccountId) {
      return NextResponse.json(
        { error: 'Billing account required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { fileUrl, fileData, mimeType } = body;

    if (!fileUrl && !fileData) {
      return NextResponse.json(
        { error: 'Either fileUrl or fileData is required' },
        { status: 400 }
      );
    }

    // Create receipt upload record
    const upload = await prisma.receiptUpload.create({
      data: {
        apiKeyId: auth.apiKeyId,
        billingAccountId: auth.billingAccountId,
        storageLocation: fileUrl || 'data://inline',
        originalFilename: 'receipt.jpg',
        mimeType: mimeType || 'image/jpeg',
        sizeBytes: fileData ? Buffer.from(fileData, 'base64').length : 0,
        status: 'processing',
      },
    });

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
        imageData = Buffer.from(fileData, 'base64');
      }

      const ocrResult = await ocrProvider.extractText(
        imageData,
        mimeType || 'image/jpeg'
      );

      // Parse receipt from OCR text
      const parseResult = parseReceiptFromText(ocrResult.text);

      // Create receipt record
      const receipt = await prisma.receipt.create({
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
      });

      // Create receipt items
      if (parseResult.receipt.items.length > 0) {
        await prisma.receiptItem.createMany({
          data: parseResult.receipt.items.map(item => ({
            receiptId: receipt.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            category: item.category,
            metadata: {},
          })),
        });
      }

      // Update upload status
      await prisma.receiptUpload.update({
        where: { id: upload.id },
        data: { status: 'completed' },
      });

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

      // Return normalized receipt
      const receiptWithItems = await prisma.receipt.findUnique({
        where: { id: receipt.id },
        include: { items: true },
      });

      return NextResponse.json({
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
        items: receiptWithItems?.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          category: item.category,
        })) || [],
        createdAt: receipt.createdAt,
      });
    } catch (error) {
      // Update upload status to failed
      await prisma.receiptUpload.update({
        where: { id: upload.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  } catch (error) {
    console.error('Receipt parsing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to parse receipt',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
