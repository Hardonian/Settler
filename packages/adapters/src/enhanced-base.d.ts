/**
 * Enhanced Adapter Interface
 *
 * Supports webhook ingestion, API polling, and comprehensive normalization
 * as specified in the Product & Technical Specification.
 */
import { Transaction, Settlement, Fee, RefundDispute, FXConversion } from "@settler/types";
export interface AdapterConfig {
  apiKey?: string;
  secret?: string;
  webhookSecret?: string;
  [key: string]: any;
}
export interface DateRange {
  start: Date;
  end: Date;
}
export interface NormalizedEvent {
  type:
    | "authorization"
    | "capture"
    | "refund"
    | "chargeback"
    | "dispute"
    | "payout"
    | "adjustment"
    | "fx_conversion";
  transaction?: Transaction;
  settlement?: Settlement;
  refundDispute?: RefundDispute;
  fxConversion?: FXConversion;
  rawPayload: Record<string, any>;
  timestamp: Date;
}
export interface WebhookVerificationResult {
  valid: boolean;
  event?: NormalizedEvent;
  error?: string;
}
/**
 * Enhanced Adapter Interface
 */
export interface EnhancedAdapter {
  name: string;
  version: string;
  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: string | Buffer, signature: string, secret: string): boolean;
  /**
   * Normalize webhook payload to canonical format
   */
  normalizeWebhook(payload: Record<string, any>, tenantId: string): NormalizedEvent[];
  /**
   * Poll transactions from provider API
   */
  pollTransactions(config: AdapterConfig, dateRange: DateRange): Promise<Transaction[]>;
  /**
   * Poll settlements from provider API
   */
  pollSettlements(config: AdapterConfig, dateRange: DateRange): Promise<Settlement[]>;
  /**
   * Extract fees from transaction payload
   */
  extractFees(transaction: Transaction, tenantId: string): Promise<Fee[]>;
  /**
   * Normalize transaction to canonical format
   */
  normalizeTransaction(raw: Record<string, any>, tenantId: string): Transaction;
  /**
   * Normalize settlement to canonical format
   */
  normalizeSettlement(raw: Record<string, any>, tenantId: string): Settlement;
  /**
   * Handle API version differences
   */
  handleVersionChange(oldVersion: string, newVersion: string): void;
}
//# sourceMappingURL=enhanced-base.d.ts.map
