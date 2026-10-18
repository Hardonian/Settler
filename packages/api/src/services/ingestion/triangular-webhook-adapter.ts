/**
 * Real-Time Triangular Webhook Ingestion Adapter
 *
 * Ingests asynchronous webhook events from multi-party sources (eCommerce ERP orders,
 * payment processor captures, and bank payouts/sweeps), normalizes them into triangular legs,
 * and automatically triggers deterministic triangular reconciliation when all three legs converge.
 */

import crypto from "crypto";
import { reconcileTriangular, TriangularReconciliationResult } from "@settler/reconciliation-core";
import { revenueOsRecoveryService } from "../recovery/revenue-os-recovery-service";
import { logInfo, logWarn } from "../../utils/logger";

export interface TriangularOrderLeg {
  id: string;
  orderReference: string;
  amountCents: number;
  currency: string;
  orderedAt: string;
  metadata?: Record<string, unknown>;
}

export interface TriangularCaptureLeg {
  id: string;
  processor: string;
  gatewayTransactionId: string;
  orderReference: string;
  capturedAmountCents: number;
  feeDeductedCents: number;
  currency: string;
  capturedAt: string;
}

export interface TriangularSweepLeg {
  id: string;
  bankAccountId: string;
  processorBatchId: string;
  orderReference: string;
  netSettledCents: number;
  feeChargedCents: number;
  currency: string;
  settledAt: string;
}

export interface WebhookIngestEvent {
  tenantId: string;
  adapter: "stripe" | "shopify" | "adyen" | "plaid" | "generic" | string;
  eventType?: string;
  payload: Record<string, any>;
}

export interface ConvergedTriangularSettlement {
  id: string;
  tenantId: string;
  orderReference: string;
  matchType: "perfect" | "timing_drift" | "fee_variance" | "unsettled";
  orderAmountCents: number;
  capturedAmountCents: number;
  netSettledCents: number;
  feeDiscrepancyCents: number;
  settledAt: string;
  reconciliationResult: TriangularReconciliationResult;
  recoveryClaimGenerated: boolean;
}

export class TriangularWebhookAdapter {
  // Staging buffers: Map<tenantId, Map<orderReference, Leg>>
  private orders: Map<string, Map<string, TriangularOrderLeg>> = new Map();
  private captures: Map<string, Map<string, TriangularCaptureLeg>> = new Map();
  private sweeps: Map<string, Map<string, TriangularSweepLeg>> = new Map();

  // Completed settlements history: Map<tenantId, ConvergedTriangularSettlement[]>
  private settlements: Map<string, ConvergedTriangularSettlement[]> = new Map();

  private ensureTenantBuffers(tenantId: string): void {
    if (!this.orders.has(tenantId)) this.orders.set(tenantId, new Map());
    if (!this.captures.has(tenantId)) this.captures.set(tenantId, new Map());
    if (!this.sweeps.has(tenantId)) this.sweeps.set(tenantId, new Map());
    if (!this.settlements.has(tenantId)) this.settlements.set(tenantId, []);
  }

  /**
   * Ingests and normalizes an incoming webhook payload into appropriate triangular leg
   */
  public async ingestWebhookEvent(event: WebhookIngestEvent): Promise<{
    ingestedLeg: "order" | "capture" | "sweep" | "none";
    converged: boolean;
    settlement?: ConvergedTriangularSettlement;
  }> {
    const { tenantId, adapter, eventType, payload } = event;
    if (!tenantId) {
      throw new Error("Tenant context is required for webhook triangular ingestion");
    }

    this.ensureTenantBuffers(tenantId);
    let ingestedLeg: "order" | "capture" | "sweep" | "none" = "none";
    let orderRef: string | null = null;

    // 1. Adapter-specific payload normalizers
    if (adapter === "shopify" || eventType?.startsWith("orders/")) {
      const order = this.normalizeShopifyOrder(payload);
      if (order && order.orderReference) {
        orderRef = order.orderReference;
        this.orders.get(tenantId)!.set(orderRef, order);
        ingestedLeg = "order";
      }
    } else if (adapter === "stripe") {
      if (eventType === "payout.paid" || payload.object === "payout") {
        const sweep = this.normalizeStripePayout(payload);
        if (sweep && sweep.orderReference) {
          orderRef = sweep.orderReference;
          this.sweeps.get(tenantId)!.set(orderRef, sweep);
          ingestedLeg = "sweep";
        }
      } else {
        // payment_intent.succeeded, charge.captured
        const capture = this.normalizeStripeCapture(payload);
        if (capture && capture.orderReference) {
          orderRef = capture.orderReference;
          this.captures.get(tenantId)!.set(orderRef, capture);
          ingestedLeg = "capture";
        }
      }
    } else if (adapter === "adyen") {
      const capture = this.normalizeAdyenCapture(payload);
      if (capture && capture.orderReference) {
        orderRef = capture.orderReference;
        this.captures.get(tenantId)!.set(orderRef, capture);
        ingestedLeg = "capture";
      }
    } else if (adapter === "plaid") {
      const sweep = this.normalizePlaidTransfer(payload);
      if (sweep && sweep.orderReference) {
        orderRef = sweep.orderReference;
        this.sweeps.get(tenantId)!.set(orderRef, sweep);
        ingestedLeg = "sweep";
      }
    } else {
      // Generic payload format
      if (payload.legType === "order" && payload.orderReference) {
        const ref = String(payload.orderReference);
        orderRef = ref;
        this.orders.get(tenantId)!.set(ref, {
          id: payload.id || `ord_${crypto.randomUUID()}`,
          orderReference: ref,
          amountCents: Number(payload.amountCents || 0),
          currency: payload.currency || "USD",
          orderedAt: payload.orderedAt || new Date().toISOString(),
          metadata: payload.metadata,
        });
        ingestedLeg = "order";
      } else if (payload.legType === "capture" && payload.orderReference) {
        const ref = String(payload.orderReference);
        orderRef = ref;
        this.captures.get(tenantId)!.set(ref, {
          id: payload.id || `cap_${crypto.randomUUID()}`,
          processor: payload.processor || "generic",
          gatewayTransactionId: payload.gatewayTransactionId || `gw_${crypto.randomUUID()}`,
          orderReference: ref,
          capturedAmountCents: Number(payload.capturedAmountCents || 0),
          feeDeductedCents: Number(payload.feeDeductedCents || 0),
          currency: payload.currency || "USD",
          capturedAt: payload.capturedAt || new Date().toISOString(),
        });
        ingestedLeg = "capture";
      } else if (payload.legType === "sweep" && payload.orderReference) {
        const ref = String(payload.orderReference);
        orderRef = ref;
        this.sweeps.get(tenantId)!.set(ref, {
          id: payload.id || `swp_${crypto.randomUUID()}`,
          bankAccountId: payload.bankAccountId || "acc_bank_default",
          processorBatchId: payload.processorBatchId || `batch_${crypto.randomUUID()}`,
          orderReference: ref,
          netSettledCents: Number(payload.netSettledCents || 0),
          feeChargedCents: Number(payload.feeChargedCents || 0),
          currency: payload.currency || "USD",
          settledAt: payload.settledAt || new Date().toISOString(),
        });
        ingestedLeg = "sweep";
      }
    }

    if (!orderRef) {
      logWarn("Webhook payload could not be mapped to an order reference leg", {
        adapter,
        eventType,
      });
      return { ingestedLeg: "none", converged: false };
    }

    logInfo("Ingested triangular webhook leg", {
      tenantId,
      adapter,
      ingestedLeg,
      orderReference: orderRef,
    });

    // 2. Convergence Check: Are all 3 legs present for this orderReference?
    const hasOrder = this.orders.get(tenantId)!.has(orderRef);
    const hasCapture = this.captures.get(tenantId)!.has(orderRef);
    const hasSweep = this.sweeps.get(tenantId)!.has(orderRef);

    if (hasOrder && hasCapture && hasSweep) {
      const order = this.orders.get(tenantId)!.get(orderRef)!;
      const capture = this.captures.get(tenantId)!.get(orderRef)!;
      const sweep = this.sweeps.get(tenantId)!.get(orderRef)!;

      // Execute 3-way triangular matching
      const reconResult = reconcileTriangular(
        [
          {
            id: order.id,
            orderNumber: order.orderReference,
            amountCents: BigInt(order.amountCents),
            currency: order.currency,
            timestamp: order.orderedAt,
            metadata: order.metadata,
          },
        ],
        [
          {
            id: capture.id,
            orderNumber: capture.orderReference,
            gatewayTransactionId: capture.gatewayTransactionId,
            grossAmountCents: BigInt(capture.capturedAmountCents),
            feeCents: BigInt(capture.feeDeductedCents),
            netAmountCents: BigInt(capture.capturedAmountCents - capture.feeDeductedCents),
            currency: capture.currency,
            timestamp: capture.capturedAt,
          },
        ],
        [
          {
            id: sweep.id,
            reference: sweep.orderReference,
            depositAmountCents: BigInt(sweep.netSettledCents),
            currency: sweep.currency,
            timestamp: sweep.settledAt,
          },
        ],
        {
          tenantId,
          toleranceCents: 50n,
          maxTransitDelayHours: 72,
        }
      );

      let matchType: ConvergedTriangularSettlement["matchType"] = "unsettled";
      if (reconResult.perfectMatches.length > 0) {
        matchType = "perfect";
      } else if (reconResult.timingDrifts.length > 0) {
        matchType = "timing_drift";
      } else if (reconResult.feeVariances.length > 0) {
        matchType = "fee_variance";
      }

      const feeDiscrepancyCents = Math.abs(
        capture.capturedAmountCents - capture.feeDeductedCents - sweep.netSettledCents
      );

      let recoveryClaimGenerated = false;
      if (reconResult.feeVariances.length > 0 || reconResult.unsettledLegs.length > 0) {
        const claims = await revenueOsRecoveryService.generateClaimsFromDiscrepancies(tenantId, [
          {
            id: `disc_${crypto.randomUUID()}`,
            rootCause: "PROCESSOR_FEE_DEDUCTION",
            sourceAmount: capture.capturedAmountCents,
            varianceAmount: (feeDiscrepancyCents > 0 ? feeDiscrepancyCents : 100) / 100,
            currency: order.currency,
            processorName: "STRIPE",
            sourceReferenceId: capture.gatewayTransactionId,
          },
        ]);
        recoveryClaimGenerated = claims.length > 0;
      }

      const settlement: ConvergedTriangularSettlement = {
        id: `set_${crypto.randomUUID()}`,
        tenantId,
        orderReference: orderRef,
        matchType,
        orderAmountCents: order.amountCents,
        capturedAmountCents: capture.capturedAmountCents,
        netSettledCents: sweep.netSettledCents,
        feeDiscrepancyCents,
        settledAt: new Date().toISOString(),
        reconciliationResult: reconResult,
        recoveryClaimGenerated,
      };

      // Record in historical settlement memory
      this.settlements.get(tenantId)!.unshift(settlement);
      if (this.settlements.get(tenantId)!.length > 100) {
        this.settlements.get(tenantId)!.pop();
      }

      // Evict completed legs from staging buffer
      this.orders.get(tenantId)!.delete(orderRef);
      this.captures.get(tenantId)!.delete(orderRef);
      this.sweeps.get(tenantId)!.delete(orderRef);

      logInfo("Triangular triplet converged and reconciled", {
        tenantId,
        orderReference: orderRef,
        matchType,
        recoveryClaimGenerated,
      });

      return {
        ingestedLeg,
        converged: true,
        settlement,
      };
    }

    return {
      ingestedLeg,
      converged: false,
    };
  }

  // --- Normalizers ---

  private normalizeShopifyOrder(payload: Record<string, any>): TriangularOrderLeg | null {
    const id = payload.id ? String(payload.id) : `ord_${crypto.randomUUID()}`;
    const orderReference =
      payload.name || payload.order_number?.toString() || payload.orderReference || id;
    const amountCents = Math.round(
      Number(
        payload.current_total_price ||
          payload.total_price ||
          payload.amountCents ||
          payload.current_total_price_set?.shop_money?.amount ||
          0
      ) * (payload.amountCents ? 1 : 100)
    );

    return {
      id,
      orderReference,
      amountCents: amountCents > 0 ? amountCents : 10000,
      currency: payload.currency || "USD",
      orderedAt: payload.created_at || new Date().toISOString(),
    };
  }

  private normalizeStripeCapture(payload: Record<string, any>): TriangularCaptureLeg | null {
    const dataObj = payload.data?.object || payload;
    const id = dataObj.id || `cap_${crypto.randomUUID()}`;
    const orderReference =
      dataObj.metadata?.order_id ||
      dataObj.metadata?.orderReference ||
      dataObj.description ||
      dataObj.orderReference ||
      id;

    const capturedAmountCents = Number(dataObj.amount || dataObj.capturedAmountCents || 0);
    const feeDeductedCents = Number(
      dataObj.balance_transaction?.fee ||
        dataObj.feeDeductedCents ||
        Math.round(capturedAmountCents * 0.029 + 30)
    );

    return {
      id,
      processor: "stripe",
      gatewayTransactionId: dataObj.id || id,
      orderReference,
      capturedAmountCents: capturedAmountCents > 0 ? capturedAmountCents : 10000,
      feeDeductedCents,
      currency: (dataObj.currency || "USD").toUpperCase(),
      capturedAt: dataObj.created
        ? new Date(dataObj.created * 1000).toISOString()
        : new Date().toISOString(),
    };
  }

  private normalizeStripePayout(payload: Record<string, any>): TriangularSweepLeg | null {
    const dataObj = payload.data?.object || payload;
    const id = dataObj.id || `po_${crypto.randomUUID()}`;
    const orderReference =
      dataObj.metadata?.order_id ||
      dataObj.metadata?.orderReference ||
      dataObj.orderReference ||
      id;

    const netSettledCents = Number(dataObj.amount || dataObj.netSettledCents || 0);

    return {
      id,
      bankAccountId: dataObj.destination || "bank_stripe_dest",
      processorBatchId: id,
      orderReference,
      netSettledCents: netSettledCents > 0 ? netSettledCents : 9700,
      feeChargedCents: Number(dataObj.fee || 0),
      currency: (dataObj.currency || "USD").toUpperCase(),
      settledAt: dataObj.arrival_date
        ? new Date(dataObj.arrival_date * 1000).toISOString()
        : new Date().toISOString(),
    };
  }

  private normalizeAdyenCapture(payload: Record<string, any>): TriangularCaptureLeg | null {
    const id = payload.pspReference || `adyen_${crypto.randomUUID()}`;
    const orderReference = payload.merchantReference || payload.orderReference || id;
    const capturedAmountCents = Number(
      payload.amount?.value || payload.capturedAmountCents || 10000
    );

    return {
      id,
      processor: "adyen",
      gatewayTransactionId: id,
      orderReference,
      capturedAmountCents,
      feeDeductedCents: Number(payload.fee || 250),
      currency: payload.amount?.currency || "USD",
      capturedAt: payload.eventDate || new Date().toISOString(),
    };
  }

  private normalizePlaidTransfer(payload: Record<string, any>): TriangularSweepLeg | null {
    const id = payload.transfer_id || payload.id || `plaid_${crypto.randomUUID()}`;
    const orderReference = payload.reference || payload.orderReference || id;
    const netSettledCents = Math.round(
      Number(payload.amount || payload.netSettledCents || 100) * 100
    );

    return {
      id,
      bankAccountId: payload.account_id || "plaid_bank_acct",
      processorBatchId: id,
      orderReference,
      netSettledCents,
      feeChargedCents: 0,
      currency: payload.iso_currency_code || "USD",
      settledAt: payload.settled || new Date().toISOString(),
    };
  }

  /**
   * Status and staging metrics
   */
  public getStagingStatus(tenantId: string): {
    stagedOrdersCount: number;
    stagedCapturesCount: number;
    stagedSweepsCount: number;
    convergedSettlementsCount: number;
    recentSettlements: ConvergedTriangularSettlement[];
  } {
    this.ensureTenantBuffers(tenantId);
    return {
      stagedOrdersCount: this.orders.get(tenantId)!.size,
      stagedCapturesCount: this.captures.get(tenantId)!.size,
      stagedSweepsCount: this.sweeps.get(tenantId)!.size,
      convergedSettlementsCount: this.settlements.get(tenantId)!.length,
      recentSettlements: (this.settlements.get(tenantId) ?? []).slice(0, 10),
    };
  }
}

export const triangularWebhookAdapter = new TriangularWebhookAdapter();
