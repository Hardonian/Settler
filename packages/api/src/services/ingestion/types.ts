/**
 * Ingestion Pipeline Types
 * Core types for the universal ingestion system
 */

import { z } from "zod";

/**
 * Supported connector types
 */
export type ConnectorType = "csv" | "stripe" | "shopify" | "manual";

/**
 * Ingestion status
 */
export type IngestionStatus = "pending" | "processing" | "completed" | "failed";

/**
 * CSV column mapping configuration
 */
export interface CSVColumnMapping {
  amount?: string; // Column name for amount
  currency?: string; // Column name for currency (defaults to "USD")
  date?: string; // Column name for date
  description?: string; // Column name for description
  externalId?: string; // Column name for external ID
  category?: string; // Column name for category
  paymentMethod?: string; // Column name for payment method
  reference?: string; // Column name for reference
}

/**
 * Normalized transaction schema (internal format)
 */
export const NormalizedTransactionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  date: z.coerce.date(),
  description: z.string().optional(),
  category: z.string().optional(),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  externalId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type NormalizedTransactionInput = z.infer<typeof NormalizedTransactionSchema>;

/**
 * CSV row data (before normalization)
 */
export interface CSVRow {
  [columnName: string]: string | number | null | undefined;
}

/**
 * Ingestion job configuration
 */
export interface IngestionJobConfig {
  sourceId: string;
  tenantId: string;
  userId: string;
  idempotencyKey?: string;
  traceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Connector configuration (encrypted)
 */
export interface ConnectorConfig {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookSecret?: string;
  accountId?: string;
  [key: string]: unknown;
}

/**
 * Stripe-specific connector config
 */
export interface StripeConnectorConfig extends ConnectorConfig {
  apiKey: string;
  accountId?: string; // For Connect accounts
}

/**
 * Reconciliation matching configuration
 */
export interface ReconciliationConfig {
  dateWindowDays?: number; // Default: 7
  amountTolerance?: number; // Default: 0.01
  fuzzyDescriptionThreshold?: number; // Default: 0.8 (0-1)
  requireExactAmount?: boolean; // Default: false
}

/**
 * Match result
 */
export interface MatchResult {
  sourceTransactionId: string;
  targetTransactionId?: string;
  matchType: "exact" | "fuzzy" | "manual" | "unmatched";
  confidence: number; // 0-1
  matchReason?: string;
  amountDiff?: number;
  dateDiff?: number; // Days
}
