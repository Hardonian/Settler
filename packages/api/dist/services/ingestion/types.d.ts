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
    amount?: string;
    currency?: string;
    date?: string;
    description?: string;
    externalId?: string;
    category?: string;
    paymentMethod?: string;
    reference?: string;
}
/**
 * Normalized transaction schema (internal format)
 */
export declare const NormalizedTransactionSchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    date: z.ZodDate;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodOptional<z.ZodString>;
    reference: z.ZodOptional<z.ZodString>;
    externalId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    date: Date;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown> | undefined;
    category?: string | undefined;
    description?: string | undefined;
    paymentMethod?: string | undefined;
    reference?: string | undefined;
    externalId?: string | undefined;
}, {
    date: Date;
    amount: number;
    metadata?: Record<string, unknown> | undefined;
    category?: string | undefined;
    description?: string | undefined;
    currency?: string | undefined;
    paymentMethod?: string | undefined;
    reference?: string | undefined;
    externalId?: string | undefined;
}>;
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
    accountId?: string;
}
/**
 * Reconciliation matching configuration
 */
export interface ReconciliationConfig {
    dateWindowDays?: number;
    amountTolerance?: number;
    fuzzyDescriptionThreshold?: number;
    requireExactAmount?: boolean;
}
/**
 * Match result
 */
export interface MatchResult {
    sourceTransactionId: string;
    targetTransactionId?: string;
    matchType: "exact" | "fuzzy" | "manual" | "unmatched";
    confidence: number;
    matchReason?: string;
    amountDiff?: number;
    dateDiff?: number;
}
//# sourceMappingURL=types.d.ts.map