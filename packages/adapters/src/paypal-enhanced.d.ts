/**
 * Enhanced PayPal Adapter
 *
 * Implements webhook ingestion, API polling, and comprehensive normalization
 * as specified in the Product & Technical Specification.
 */
import { EnhancedAdapter, AdapterConfig, DateRange, NormalizedEvent } from "./enhanced-base";
import { Transaction, Settlement, Fee, RefundDispute, RefundDisputeType } from "@settler/types";
export declare class PayPalEnhancedAdapter implements EnhancedAdapter {
  name: string;
  version: string;
  private supportedVersions;
  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: string | Buffer, _signature: string, _secret: string): boolean;
  /**
   * Normalize webhook payload to canonical format
   */
  normalizeWebhook(payload: Record<string, any>, tenantId: string): NormalizedEvent[];
  /**
   * Poll transactions from PayPal API
   */
  pollTransactions(config: AdapterConfig, _dateRange: DateRange): Promise<Transaction[]>;
  /**
   * Poll settlements from PayPal API
   */
  pollSettlements(config: AdapterConfig, _dateRange: DateRange): Promise<Settlement[]>;
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
   * Normalize refund/dispute
   */
  normalizeRefundDispute(
    raw: Record<string, any>,
    tenantId: string,
    type: RefundDisputeType
  ): RefundDispute;
  /**
   * Handle API version changes
   */
  handleVersionChange(_oldVersion: string, newVersion: string): void;
  /**
   * Map PayPal transaction type to canonical type
   */
  private mapTransactionType;
  /**
   * Map PayPal status to canonical status
   */
  private mapTransactionStatus;
  /**
   * Map PayPal payout status to canonical status
   */
  private mapSettlementStatus;
  /**
   * Map PayPal refund/dispute status to canonical status
   */
  private mapRefundDisputeStatus;
  /**
   * Generate ID
   */
  private generateId;
}
//# sourceMappingURL=paypal-enhanced.d.ts.map
