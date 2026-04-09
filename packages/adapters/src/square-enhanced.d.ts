/**
 * Enhanced Square Adapter
 *
 * Implements webhook ingestion, API polling, and comprehensive normalization
 * as specified in the Product & Technical Specification.
 */
import { EnhancedAdapter, AdapterConfig, DateRange, NormalizedEvent } from "./enhanced-base";
import { Transaction, Settlement, Fee, RefundDispute, RefundDisputeType } from "@settler/types";
export declare class SquareEnhancedAdapter implements EnhancedAdapter {
  name: string;
  version: string;
  private supportedVersions;
  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: string | Buffer, signature: string, secret: string): boolean;
  /**
   * Normalize webhook payload to canonical format
   */
  normalizeWebhook(payload: Record<string, any>, tenantId: string): NormalizedEvent[];
  /**
   * Poll transactions from Square API
   */
  pollTransactions(config: AdapterConfig, _dateRange: DateRange): Promise<Transaction[]>;
  /**
   * Poll settlements from Square API
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
   * Map Square transaction type to canonical type
   */
  private mapTransactionType;
  /**
   * Map Square status to canonical status
   */
  private mapTransactionStatus;
  /**
   * Map Square settlement status to canonical status
   */
  private mapSettlementStatus;
  /**
   * Map Square refund/dispute status to canonical status
   */
  private mapRefundDisputeStatus;
  /**
   * Generate ID
   */
  private generateId;
}
//# sourceMappingURL=square-enhanced.d.ts.map
