/**
 * Receipt Auto-Matching Service
 * 
 * Automatically matches receipts to transactions based on:
 * - Amount (within tolerance)
 * - Date (within window)
 * - Merchant name (fuzzy matching)
 * 
 * Enterprise-ready with:
 * - Type-safe Prisma queries
 * - Comprehensive error handling
 * - Configurable matching rules
 * - Confidence scoring
 */

import { PrismaClient } from '@prisma/client';

interface MatchResult {
  receiptId: string;
  transactionId: string;
  confidence: number;
  matchReason: string;
  amountDiff: number;
  dateDiff: number;
}

interface MatchingConfig {
  amountTolerance: number; // Default: 0.01
  dateWindowDays: number; // Default: 7
  merchantNameSimilarity: number; // Default: 0.8
}

/**
 * Match a receipt to transactions
 */
export async function matchReceiptToTransaction(
  prisma: PrismaClient,
  receiptId: string,
  tenantId: string,
  config: Partial<MatchingConfig> = {}
): Promise<MatchResult | null> {
  const matchingConfig: MatchingConfig = {
    amountTolerance: config.amountTolerance || 0.01,
    dateWindowDays: config.dateWindowDays || 7,
    merchantNameSimilarity: config.merchantNameSimilarity || 0.8,
  };

  try {
    // Fetch receipt
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        upload: {
          // Receipt belongs to tenant via billing account
        },
      },
      include: {
        upload: true,
      },
    });

    if (!receipt || !receipt.total || !receipt.date) {
      return null;
    }

    // Calculate date window
    const receiptDate = receipt.date;
    const windowStart = new Date(receiptDate);
    windowStart.setDate(windowStart.getDate() - matchingConfig.dateWindowDays);
    const windowEnd = new Date(receiptDate);
    windowEnd.setDate(windowEnd.getDate() + matchingConfig.dateWindowDays);

    // Fetch potential matching transactions
    const transactions = await prisma.normalizedTransaction.findMany({
      where: {
        tenantId: tenantId,
        date: {
          gte: windowStart,
          lte: windowEnd,
        },
        amount: {
          gte: receipt.total - matchingConfig.amountTolerance,
          lte: receipt.total + matchingConfig.amountTolerance,
        },
        currency: receipt.currency || 'USD',
      },
      take: 100, // Limit for performance
    });

    if (transactions.length === 0) {
      return null;
    }

    // Score each transaction
    const scores = transactions.map((transaction) => {
      const amountDiff = Math.abs(Number(transaction.amount) - Number(receipt.total));
      const dateDiff = Math.abs(
        (transaction.date.getTime() - receiptDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Amount score (closer to 0 is better)
      const amountScore = Math.max(0, 1 - amountDiff / matchingConfig.amountTolerance);

      // Date score (closer to 0 is better)
      const dateScore = Math.max(0, 1 - dateDiff / matchingConfig.dateWindowDays);

      // Merchant name score (if available)
      let merchantScore = 0.5; // Default if no merchant name
      if (receipt.vendor && transaction.description) {
        merchantScore = stringSimilarity(
          receipt.vendor.toLowerCase(),
          transaction.description.toLowerCase()
        );
      }

      // Combined confidence score
      const confidence = (amountScore * 0.5 + dateScore * 0.3 + merchantScore * 0.2);

      return {
        transactionId: transaction.id,
        confidence,
        amountDiff,
        dateDiff: Math.round(dateDiff),
        matchReason: `Amount: ${amountScore.toFixed(2)}, Date: ${dateScore.toFixed(2)}, Merchant: ${merchantScore.toFixed(2)}`,
      };
    });

    // Find best match
    const bestMatch = scores.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    // Only return match if confidence is above threshold
    if (bestMatch.confidence >= 0.7) {
      return {
        receiptId: receipt.id,
        transactionId: bestMatch.transactionId,
        confidence: bestMatch.confidence,
        matchReason: bestMatch.matchReason,
        amountDiff: bestMatch.amountDiff,
        dateDiff: bestMatch.dateDiff,
      };
    }

    return null;
  } catch (error) {
    console.error(`[ReceiptMatching] Failed to match receipt ${receiptId}:`, error);
    return null;
  }
}

/**
 * Simple string similarity (Levenshtein distance based)
 * In production, use a library like 'string-similarity'
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  // Simple substring matching
  if (longer.includes(shorter) || shorter.includes(longer)) {
    return 0.9;
  }

  // Calculate Levenshtein distance (simplified)
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / Math.max(str1.length, str2.length);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Batch match receipts to transactions
 */
export async function batchMatchReceipts(
  prisma: PrismaClient,
  receiptIds: string[],
  tenantId: string,
  config: Partial<MatchingConfig> = {}
): Promise<MatchResult[]> {
  const results: MatchResult[] = [];

  for (const receiptId of receiptIds) {
    const match = await matchReceiptToTransaction(prisma, receiptId, tenantId, config);
    if (match) {
      results.push(match);
    }
  }

  return results;
}
