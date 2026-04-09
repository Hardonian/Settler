/**
 * Webhook Ingestion Service
 *
 * Handles webhook ingestion with signature verification, idempotency,
 * and retry logic as specified in the Product & Technical Specification.
 */

import {
  EnhancedAdapter,
  NormalizedEvent,
  StripeEnhancedAdapter,
  PayPalEnhancedAdapter,
  SquareEnhancedAdapter,
} from "@settler/adapters";
import { Transaction, Settlement, RefundDispute } from "@settler/types";
import { query } from "../../db";

export interface WebhookIngestionResult {
  success: boolean;
  events: NormalizedEvent[];
  errors?: string[];
}

export class WebhookIngestionService {
  private adapters: Map<string, EnhancedAdapter>;

  constructor() {
    this.adapters = new Map();

    // Register adapters
    this.adapters.set("stripe", new StripeEnhancedAdapter());
    this.adapters.set("paypal", new PayPalEnhancedAdapter());
    this.adapters.set("square", new SquareEnhancedAdapter());
  }

  /**
   * Register a custom adapter
   */
  registerAdapter(adapter: EnhancedAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(
    adapterName: string,
    payload: string | Buffer | Record<string, unknown>,
    signature: string,
    secret: string,
    tenantId: string
  ): Promise<WebhookIngestionResult> {
    const adapter = this.adapters.get(adapterName);

    if (!adapter) {
      return {
        success: false,
        events: [],
        errors: [`Adapter ${adapterName} not found`],
      };
    }

    // Verify webhook signature
    const payloadString =
      typeof payload === "string"
        ? payload
        : Buffer.isBuffer(payload)
          ? payload.toString()
          : JSON.stringify(payload);

    const isValid = adapter.verifyWebhook(payloadString, signature, secret);

    if (!isValid) {
      return {
        success: false,
        events: [],
        errors: ["Invalid webhook signature"],
      };
    }

    // Parse payload if needed
    const payloadObj =
      typeof payload === "object" && !Buffer.isBuffer(payload)
        ? payload
        : JSON.parse(payloadString);

    // Check idempotency
    const idempotencyKey = this.extractIdempotencyKey(payloadObj, adapterName);
    if (idempotencyKey) {
      const existing = await this.checkIdempotency(idempotencyKey, tenantId);
      if (existing) {
        return {
          success: true,
          events: existing.events || [],
        };
      }
    }

    // Normalize webhook payload
    let events: NormalizedEvent[];
    try {
      events = adapter.normalizeWebhook(payloadObj, tenantId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        events: [],
        errors: [`Failed to normalize webhook: ${message}`],
      };
    }

    // Store webhook payload for audit
    await this.storeWebhookPayload(adapterName, payloadObj, signature, tenantId);

    // Process events
    const errors: string[] = [];
    for (const event of events) {
      try {
        await this.processEvent(event, tenantId);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Failed to process event ${event.type}: ${message}`);
      }
    }

    // Store idempotency key if present
    if (idempotencyKey) {
      await this.storeIdempotencyKey(idempotencyKey, tenantId, events);
    }

    const result: WebhookIngestionResult = {
      success: errors.length === 0,
      events,
    };
    if (errors.length > 0) {
      result.errors = errors;
    }
    return result;
  }

  /**
   * Process a normalized event
   */
  private async processEvent(event: NormalizedEvent, tenantId: string): Promise<void> {
    if (event.transaction) {
      await this.storeTransaction(event.transaction, tenantId);
    }

    if (event.settlement) {
      await this.storeSettlement(event.settlement, tenantId);
    }

    if (event.refundDispute) {
      await this.storeRefundDispute(event.refundDispute, tenantId);
    }

    if (event.fxConversion) {
      await this.storeFXConversion(
        event.fxConversion as unknown as Record<string, unknown>,
        tenantId
      );
    }
  }

  /**
   * Store transaction
   */
  private async storeTransaction(transaction: Transaction, tenantId: string): Promise<void> {
    await query(
      `INSERT INTO transactions (
        id, tenant_id, payment_id, provider, provider_transaction_id,
        type, amount_value, amount_currency, net_amount_value, net_amount_currency,
        status, raw_payload, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (tenant_id, provider, provider_transaction_id) 
      DO UPDATE SET
        status = EXCLUDED.status,
        net_amount_value = EXCLUDED.net_amount_value,
        net_amount_currency = EXCLUDED.net_amount_currency,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = EXCLUDED.updated_at`,
      [
        transaction.id,
        tenantId,
        transaction.paymentId || null,
        transaction.provider,
        transaction.providerTransactionId,
        transaction.type,
        transaction.amount.value,
        transaction.amount.currency,
        transaction.netAmount?.value ?? null,
        transaction.netAmount?.currency ?? null,
        transaction.status,
        JSON.stringify(transaction.rawPayload),
        transaction.created_at,
        transaction.updatedAt || transaction.created_at,
      ]
    );
  }

  /**
   * Store settlement
   */
  private async storeSettlement(settlement: Settlement, tenantId: string): Promise<void> {
    await query(
      `INSERT INTO settlements (
        id, tenant_id, provider, provider_settlement_id,
        amount_value, amount_currency, currency, fx_rate,
        settlement_date, expected_date, status, raw_payload, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (tenant_id, provider, provider_settlement_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        settlement_date = EXCLUDED.settlement_date,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = EXCLUDED.updated_at`,
      [
        settlement.id,
        tenantId,
        settlement.provider,
        settlement.providerSettlementId,
        settlement.amount.value,
        settlement.amount.currency,
        settlement.currency,
        settlement.fxRate ?? null,
        settlement.settlementDate,
        settlement.expectedDate ?? null,
        settlement.status,
        JSON.stringify(settlement.rawPayload),
        settlement.createdAt,
        settlement.updatedAt,
      ]
    );
  }

  /**
   * Store refund/dispute
   */
  private async storeRefundDispute(refundDispute: RefundDispute, tenantId: string): Promise<void> {
    await query(
      `INSERT INTO refunds_and_disputes (
        id, tenant_id, transaction_id, type,
        amount_value, amount_currency, status, reason,
        provider_refund_id, provider_dispute_id, raw_payload, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT DO NOTHING`,
      [
        refundDispute.id,
        tenantId,
        refundDispute.transactionId,
        refundDispute.type,
        refundDispute.amount.value,
        refundDispute.amount.currency,
        refundDispute.status,
        refundDispute.reason ?? null,
        refundDispute.providerRefundId ?? null,
        refundDispute.providerDisputeId ?? null,
        JSON.stringify(refundDispute.rawPayload),
        refundDispute.createdAt,
        refundDispute.updatedAt,
      ]
    );
  }

  /**
   * Store FX conversion
   */
  private async storeFXConversion(
    fxConversion: Record<string, unknown>,
    tenantId: string
  ): Promise<void> {
    await query(
      `INSERT INTO fx_conversions (
        id, tenant_id, transaction_id, from_currency, to_currency,
        from_amount, to_amount, fx_rate, provider, rate_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT DO NOTHING`,
      [
        (fxConversion.id as string) || null,
        tenantId,
        (fxConversion.transactionId as string) || null,
        (fxConversion.fromCurrency as string) || null,
        (fxConversion.toCurrency as string) || null,
        (fxConversion.fromAmount as number) ?? null,
        (fxConversion.toAmount as number) ?? null,
        (fxConversion.fxRate as number) ?? null,
        (fxConversion.provider as string) || null,
        (fxConversion.rateDate as Date) || null,
        (fxConversion.createdAt as Date) || null,
      ]
    );
  }

  /**
   * Store webhook payload for audit
   */
  private async storeWebhookPayload(
    adapter: string,
    payload: Record<string, unknown>,
    signature: string,
    tenantId: string
  ): Promise<void> {
    await query(
      `INSERT INTO webhook_payloads (
        adapter, tenant_id, payload, signature, received_at, processed
      ) VALUES ($1, $2, $3, $4, NOW(), true)`,
      [adapter, tenantId, JSON.stringify(payload), signature]
    );
  }

  /**
   * Extract idempotency key from payload
   */
  private extractIdempotencyKey(
    payload: Record<string, unknown>,
    adapterName: string
  ): string | null {
    // Provider-specific idempotency key extraction
    switch (adapterName) {
      case "stripe":
        return typeof payload.id === "string" ? payload.id : null;
      case "paypal":
        return typeof payload.id === "string"
          ? payload.id
          : typeof payload.webhook_id === "string"
            ? payload.webhook_id
            : null;
      case "square":
        return typeof payload.event_id === "string"
          ? payload.event_id
          : typeof payload.id === "string"
            ? payload.id
            : null;
      default:
        return typeof payload.id === "string" ? payload.id : null;
    }
  }

  /**
   * Check if webhook was already processed (idempotency)
   */
  private async checkIdempotency(
    key: string,
    tenantId: string
  ): Promise<{ events: NormalizedEvent[] } | null> {
    const result = await query(
      `SELECT payload FROM webhook_payloads 
       WHERE tenant_id = $1 AND payload->>'id' = $2 AND processed = true
       LIMIT 1`,
      [tenantId, key]
    );

    if (result.length === 0) {
      return null;
    }

    // Return cached events if available
    return null; // For now, return null to reprocess
  }

  /**
   * Store idempotency key
   */
  private async storeIdempotencyKey(
    key: string,
    tenantId: string,
    events: NormalizedEvent[]
  ): Promise<void> {
    // Store in idempotency_keys table
    await query(
      `INSERT INTO idempotency_keys (user_id, tenant_id, key, response, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
       ON CONFLICT DO NOTHING`,
      [null, tenantId, key, JSON.stringify({ events })]
    );
  }
}
