/**
 * Klarna BNPL Settlement Connector Driver
 *
 * Implements canonical ConnectorDriver contract for Klarna's Settlement & Order API.
 * Reconciles Buy Now Pay Later (BNPL) customer installments, merchant payout batches,
 * interchange/processing fee deductions, dispute reserves, and return clawbacks.
 *
 * Zero-float integer cents arithmetic throughout.
 */

import {
  ConnectorDriver,
  ConnectorMetadata,
  TestConnectionOptions,
  TestConnectionResult,
  SyncOptions,
  SyncResult,
  NormalizedPayout,
  NormalizedTransaction,
  WebhookPayload,
  ConnectorError,
} from "../connector-driver";
import { extractStringField } from "../types/api-responses";

export interface KlarnaPayoutSummary {
  payment_reference: string;
  payout_date: string;
  currency: string;
  totals: {
    commission_amount: number;
    fee_amount: number;
    gross_amount: number;
    net_amount: number;
    repay_amount: number;
    sale_amount: number;
    tax_amount: number;
  };
}

export interface KlarnaTransactionRecord {
  capture_id?: string;
  order_id: string;
  payment_reference: string;
  merchant_reference1?: string;
  type: "SALE" | "REFUND" | "RETURN" | "CHARGEBACK" | "DISPUTE_HOLD" | "FEE" | "PAYOUT";
  amount: number; // in integer cents/minor units
  fee_amount?: number;
  currency: string;
  transaction_time: string;
}

export class KlarnaDriver implements ConnectorDriver {
  readonly metadata: ConnectorMetadata = {
    id: "klarna",
    displayName: "Klarna",
    category: "payment_processor",
    authType: "api_key",
    description:
      "Reconcile Klarna BNPL multi-tranche settlements, merchant payout batches, fees, and dispute holdbacks",
    icon: "🛍️",
    documentationUrl: "https://docs.klarna.com/settlement-files",
    supportsWebhooks: true,
    supportsPolling: true,
    requiredConfig: ["api_username", "api_password"],
    optionalConfig: ["environment", "merchant_id", "region"],
  };

  private getBaseUrl(credentials: Record<string, unknown>): string {
    const environment = extractStringField(credentials, "environment") || "production";
    const region = extractStringField(credentials, "region") || "eu";

    if (environment === "playground" || environment === "sandbox") {
      if (region === "na") return "https://api-na.playground.klarna.com";
      if (region === "oc") return "https://api-oc.playground.klarna.com";
      return "https://api.playground.klarna.com";
    }

    if (region === "na") return "https://api-na.klarna.com";
    if (region === "oc") return "https://api-oc.klarna.com";
    return "https://api.klarna.com";
  }

  private getAuthHeader(credentials: Record<string, unknown>): string {
    const username = extractStringField(credentials, "api_username") ?? "";
    const password = extractStringField(credentials, "api_password") ?? "";
    return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  async testConnection(options: TestConnectionOptions): Promise<TestConnectionResult> {
    const { credentials } = options;
    const username = extractStringField(credentials, "api_username");
    const password = extractStringField(credentials, "api_password");

    if (!username || !password) {
      return {
        success: false,
        error: "Missing Klarna API credentials",
        message: "api_username and api_password are required",
      };
    }

    const baseUrl = this.getBaseUrl(credentials);
    const authHeader = this.getAuthHeader(credentials);

    try {
      // Probe settlements endpoint with a zero-limit range check
      const response = await fetch(`${baseUrl}/settlements/v1/payouts?limit=1`, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            error: "Authentication failed",
            message: "Invalid Klarna API username or password",
          };
        }
        return {
          success: false,
          error: `HTTP ${response.status}`,
          message: `Klarna returned status ${response.status}`,
        };
      }

      return {
        success: true,
        message: "Successfully connected to Klarna Settlements API",
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed";
      return {
        success: false,
        error: message,
        message: `Failed to connect to Klarna: ${message}`,
      };
    }
  }

  async sync(
    credentials: Record<string, unknown>,
    options: SyncOptions = {}
  ): Promise<
    SyncResult & {
      payouts?: NormalizedPayout[];
      transactions?: NormalizedTransaction[];
    }
  > {
    const baseUrl = this.getBaseUrl(credentials);
    const authHeader = this.getAuthHeader(credentials);

    const payouts: NormalizedPayout[] = [];
    const transactions: NormalizedTransaction[] = [];
    const warnings: string[] = [];

    const queryParams = new URLSearchParams();
    if (options.limit) {
      queryParams.set("limit", Math.min(options.limit, 100).toString());
    } else {
      queryParams.set("limit", "50");
    }

    if (options.since) {
      queryParams.set("start_date", options.since.toISOString().split("T")[0]!);
    }
    if (options.until) {
      queryParams.set("end_date", options.until.toISOString().split("T")[0]!);
    }
    if (options.cursor) {
      queryParams.set("offset", options.cursor);
    }

    let rawPayouts: KlarnaPayoutSummary[] = [];

    try {
      const response = await fetch(`${baseUrl}/settlements/v1/payouts?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new ConnectorError(
          `Klarna payouts sync failed with HTTP ${response.status}`,
          "KLARNA_SYNC_ERROR",
          "klarna"
        );
      }

      const body = (await response.json()) as {
        payouts?: KlarnaPayoutSummary[];
        pagination?: { offset?: number; count?: number; total?: number };
      };
      rawPayouts = body.payouts ?? [];
    } catch (err: unknown) {
      if (err instanceof ConnectorError) throw err;
      throw new ConnectorError(
        `Failed to fetch Klarna settlements: ${err instanceof Error ? err.message : "Network error"}`,
        "KLARNA_NETWORK_ERROR",
        "klarna"
      );
    }

    for (const p of rawPayouts) {
      const payoutDate = new Date(p.payout_date);
      const grossCents = Math.round(p.totals?.gross_amount ?? 0);
      const feeCents = Math.round((p.totals?.commission_amount ?? 0) + (p.totals?.fee_amount ?? 0));
      const netCents = Math.round(p.totals?.net_amount ?? grossCents - feeCents);

      const normalizedPayout: NormalizedPayout = {
        externalId: p.payment_reference,
        amountCents: netCents,
        currency: p.currency,
        status: "paid",
        initiatedAt: payoutDate,
        completedAt: payoutDate,
        feeCents,
        netAmountCents: netCents,
        destinationType: "bank_account",
        description: `Klarna Settlement Payout ${p.payment_reference}`,
        providerMetadata: {
          gross_amount_cents: grossCents,
          sale_amount_cents: p.totals?.sale_amount,
          commission_amount_cents: p.totals?.commission_amount,
          tax_amount_cents: p.totals?.tax_amount,
          repay_amount_cents: p.totals?.repay_amount,
        },
        rawPayload: p,
        idempotencyKey: `klarna-payout-${p.payment_reference}`,
      };

      payouts.push(normalizedPayout);

      // Create a synthetic summary fee transaction for ledger balancing if fee exists
      if (feeCents > 0) {
        transactions.push({
          externalId: `fee-${p.payment_reference}`,
          transactionType: "fee",
          amountCents: feeCents,
          currency: p.currency,
          occurredAt: payoutDate,
          description: `Klarna Merchant Processing & BNPL Fee for Payout ${p.payment_reference}`,
          referenceId: p.payment_reference,
          referenceType: "payout",
          idempotencyKey: `klarna-fee-${p.payment_reference}`,
          providerMetadata: {
            payout_reference: p.payment_reference,
            rate_type: "bnpl_merchant_fee",
          },
        });
      }
    }

    const nextOffset = (Number(options.cursor || "0") + rawPayouts.length).toString();
    const hasMore = rawPayouts.length >= Number(queryParams.get("limit") || 50);

    return {
      hasMore,
      nextCursor: hasMore ? nextOffset : undefined,
      counts: {
        payouts: payouts.length,
        transactions: transactions.length,
      },
      payouts,
      transactions,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Parse Klarna Settlement Transactions CSV / JSON line items
   */
  normalizeTransactionRecord(
    record: KlarnaTransactionRecord,
    currency = "USD"
  ): NormalizedTransaction {
    let txType: NormalizedTransaction["transactionType"] = "credit";
    if (record.type === "REFUND" || record.type === "RETURN") {
      txType = "refund";
    } else if (record.type === "FEE") {
      txType = "fee";
    } else if (record.type === "CHARGEBACK" || record.type === "DISPUTE_HOLD") {
      txType = "debit";
    }

    const txDate = new Date(record.transaction_time || Date.now());
    const amountCents = Math.abs(Math.round(record.amount));

    return {
      externalId: record.capture_id || `${record.order_id}-${record.type}-${txDate.getTime()}`,
      transactionType: txType,
      amountCents,
      currency: record.currency || currency,
      occurredAt: txDate,
      description: `Klarna ${record.type} for Order ${record.order_id}`,
      referenceId: record.order_id,
      referenceType: "order",
      idempotencyKey: `klarna-tx-${record.order_id}-${record.capture_id || txDate.getTime()}`,
      providerMetadata: {
        order_id: record.order_id,
        merchant_reference: record.merchant_reference1,
        payment_reference: record.payment_reference,
        fee_cents: record.fee_amount ? Math.round(record.fee_amount) : undefined,
      },
      rawPayload: record,
    };
  }

  async validateWebhook(payload: WebhookPayload): Promise<boolean> {
    // Klarna sends webhooks for order status changes and settlement readiness
    if (!payload.payload) return false;
    return true;
  }
}
