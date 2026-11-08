/**
 * Enhanced Gumroad Adapter
 *
 * Implements Gumroad webhook ingestion and normalization.
 * Gumroad signs webhooks with HMAC-SHA256 using the application's webhook
 * secret (from the Gumroad dashboard) over the raw request body.
 * Event payload: { "email", "product_id", "product_name", "price",
 * "quantity", "purchaser_id", "order_id", "sale_id", "variant",
 * "full_name", "ip_address", "created_at" }
 */

import { EnhancedAdapter, AdapterConfig, DateRange, NormalizedEvent } from "./enhanced-base";
import { Transaction, Settlement, Fee } from "@settler/types";
import crypto from "crypto";

export class GumroadEnhancedAdapter implements EnhancedAdapter {
  name = "gumroad";
  version = "1.0.0";
  private processedNonces = new Map<string, number>();
  private maxClockDriftSeconds = 300;

  private cleanupStaleNonces(): void {
    const now = Date.now();
    const expiry = this.maxClockDriftSeconds * 2 * 1000;
    for (const [nonce, ts] of this.processedNonces.entries()) {
      if (now - ts > expiry) {
        this.processedNonces.delete(nonce);
      }
    }
  }

  /**
   * Verify a Gumroad webhook signature.
   * Gumroad does NOT include a timestamp in the signature header; the
   * signature is `HMAC_SHA256(webhook_secret, raw_body)`.
   * Replay protection is enforced via the `sale_id` nonce cache.
   */
  verifyWebhook(
    payload: string | Buffer,
    signature: string,
    secret: string,
    options?: { enforceReplayProtection?: boolean }
  ): boolean {
    try {
      const body = typeof payload === "string" ? payload : payload.toString("utf8");
      const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");

      const provided = signature.trim();
      if (!provided) {
        return false;
      }

      const isValid = crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

      if (!isValid) {
        return false;
      }

      if (options?.enforceReplayProtection !== false) {
        this.cleanupStaleNonces();
        let nonce = provided;
        try {
          const parsed = JSON.parse(body) as Record<string, unknown>;
          if (typeof parsed.sale_id === "string" && parsed.sale_id.length > 0) {
            nonce = parsed.sale_id;
          }
        } catch {
          /* fall back to signature */
        }
        if (this.processedNonces.has(nonce)) {
          return false;
        }
        this.processedNonces.set(nonce, Date.now());
      }

      return true;
    } catch {
      return false;
    }
  }

  normalizeWebhook(payload: Record<string, unknown>, tenantId: string): NormalizedEvent[] {
    const events: NormalizedEvent[] = [];

    const amountCents =
      typeof payload.price === "number"
        ? Math.round(payload.price * 100)
        : typeof payload.price === "string"
          ? Math.round(parseFloat(payload.price) * 100)
          : 0;

    const createdAt =
      typeof payload.created_at === "string" ? new Date(payload.created_at) : new Date();

    const transaction: Transaction = {
      id: this.generateId(),
      tenantId,
      provider: "gumroad",
      providerTransactionId: String(payload.sale_id ?? payload.order_id ?? ""),
      type: "capture",
      amount: {
        value: amountCents / 100,
        currency: "USD",
      },
      status: "succeeded",
      rawPayload: payload,
      created_at: createdAt,
      updatedAt: createdAt,
    };

    events.push({
      type: "capture",
      transaction,
      rawPayload: payload,
      timestamp: createdAt,
    });

    return events;
  }

  pollTransactions(_config: AdapterConfig, _dateRange: DateRange): Promise<Transaction[]> {
    return Promise.resolve([]);
  }

  pollSettlements(_config: AdapterConfig, _dateRange: DateRange): Promise<Settlement[]> {
    return Promise.resolve([]);
  }

  async extractFees(_transaction: Transaction, _tenantId: string): Promise<Fee[]> {
    return [];
  }

  normalizeTransaction(raw: Record<string, any>, tenantId: string): Transaction {
    const price =
      typeof raw.price === "number"
        ? raw.price
        : typeof raw.price === "string"
          ? parseFloat(raw.price)
          : 0;
    const created = typeof raw.created_at === "string" ? new Date(raw.created_at) : new Date();

    return {
      id: this.generateId(),
      tenantId,
      provider: "gumroad",
      providerTransactionId: String(raw.sale_id ?? raw.order_id ?? ""),
      type: "capture",
      amount: { value: price, currency: "USD" },
      status: "succeeded",
      rawPayload: raw,
      created_at: created,
      updatedAt: created,
    };
  }

  normalizeSettlement(raw: Record<string, any>, tenantId: string): Settlement {
    const amount =
      typeof raw.amount === "number"
        ? raw.amount
        : typeof raw.amount === "string"
          ? parseFloat(raw.amount)
          : 0;
    const date =
      typeof raw.settlement_date === "string" ? new Date(raw.settlement_date) : new Date();

    return {
      id: this.generateId(),
      tenantId,
      provider: "gumroad",
      providerSettlementId: String(raw.id ?? raw.settlement_id ?? ""),
      amount: { value: amount, currency: "USD" },
      currency: "USD",
      settlementDate: date,
      expectedDate: date,
      status: "completed",
      rawPayload: raw,
      createdAt: date,
      updatedAt: date,
    };
  }

  handleVersionChange(_oldVersion: string, _newVersion: string): void {
    // Gumroad has no versioned webhook API; no-op.
  }

  private generateId(): string {
    return "gumroad_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
  }
}
