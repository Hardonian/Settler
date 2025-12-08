/**
 * Enhanced Stripe Adapter
 * 
 * Implements webhook ingestion, API polling, and comprehensive normalization
 * as specified in the Product & Technical Specification.
 */

import { EnhancedAdapter, AdapterConfig, DateRange, NormalizedEvent } from './enhanced-base';
import { Transaction, Settlement, Fee, RefundDispute, TransactionType, TransactionStatus, SettlementStatus, RefundDisputeType, RefundDisputeStatus } from '@settler/types';
import crypto from 'crypto';
import Stripe from 'stripe';

export class StripeEnhancedAdapter implements EnhancedAdapter {
  name = 'stripe';
  version = '1.0.0';
  private supportedVersions = ['2023-10-16', '2024-01-01']; // Supported API versions

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: string | Buffer, signature: string, secret: string): boolean {
    try {
      const elements = signature.split(',');
      const timestamp = elements.find(e => e.startsWith('t='))?.substring(2);
      const signatures = elements.filter(e => e.startsWith('v1=')).map(e => e.substring(3));

      if (!timestamp || signatures.length === 0) {
        return false;
      }

      const signedPayload = `${timestamp}.${typeof payload === 'string' ? payload : payload.toString()}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

      return signatures.some(sig => crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature)));
    } catch (error) {
      return false;
    }
  }

  /**
   * Normalize webhook payload to canonical format
   */
  normalizeWebhook(payload: Record<string, any>, tenantId: string): NormalizedEvent[] {
    const events: NormalizedEvent[] = [];
    const eventType = payload.type;
    const data = payload.data?.object || payload;

    switch (eventType) {
      case 'charge.succeeded':
      case 'payment_intent.succeeded':
        events.push({
          type: 'capture',
          transaction: this.normalizeTransaction(data, tenantId),
          rawPayload: payload,
          timestamp: new Date(payload.created * 1000),
        });
        break;

      case 'charge.refunded':
      case 'refund.created':
        events.push({
          type: 'refund',
          refundDispute: this.normalizeRefundDispute(data, tenantId, 'refund'),
          rawPayload: payload,
          timestamp: new Date(payload.created * 1000),
        });
        break;

      case 'charge.dispute.created':
        events.push({
          type: 'chargeback',
          refundDispute: this.normalizeRefundDispute(data, tenantId, 'chargeback'),
          rawPayload: payload,
          timestamp: new Date(payload.created * 1000),
        });
        break;

      case 'payout.paid':
        events.push({
          type: 'payout',
          settlement: this.normalizeSettlement(data, tenantId),
          rawPayload: payload,
          timestamp: new Date(payload.created * 1000),
        });
        break;

      default:
        // Unknown event type, but still normalize if possible
        if (data.id && data.amount) {
          events.push({
            type: 'capture',
            transaction: this.normalizeTransaction(data, tenantId),
            rawPayload: payload,
            timestamp: new Date(payload.created * 1000),
          });
        }
    }

    return events;
  }

  /**
   * Poll transactions from Stripe API
   */
  async pollTransactions(config: AdapterConfig, dateRange: DateRange): Promise<Transaction[]> {
    const apiKey = config.apiKey;
    if (!apiKey) {
      throw new Error('Stripe API key is required');
    }

    const stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
    });

    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(dateRange.start.getTime() / 1000),
        lte: Math.floor(dateRange.end.getTime() / 1000),
      },
      limit: 100,
    });

    return charges.data.map((charge) => this.normalizeTransaction(charge, config.tenantId || 'default'));
  }

  /**
   * Poll settlements from Stripe API
   */
  async pollSettlements(config: AdapterConfig, dateRange: DateRange): Promise<Settlement[]> {
    const apiKey = config.apiKey;
    if (!apiKey) {
      throw new Error('Stripe API key is required');
    }

    const stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
    });

    const payouts = await stripe.payouts.list({
      created: {
        gte: Math.floor(dateRange.start.getTime() / 1000),
        lte: Math.floor(dateRange.end.getTime() / 1000),
      },
      limit: 100,
    });

    return payouts.data.map((payout) => this.normalizeSettlement(payout, config.tenantId || 'default'));
  }

  /**
   * Extract fees from transaction payload
   */
  async extractFees(transaction: Transaction, tenantId: string): Promise<Fee[]> {
    const fees: Fee[] = [];
    const payload = transaction.rawPayload;

    if (payload.balance_transaction) {
      const balanceTx = payload.balance_transaction;
      
      if (balanceTx.fee !== undefined) {
        fees.push({
          id: this.generateId(),
          tenantId,
          transactionId: transaction.id,
          type: 'processing',
          amount: {
            value: balanceTx.fee / 100,
            currency: transaction.amount.currency,
          },
          description: 'Stripe processing fee',
          rate: transaction.amount.value > 0 ? (balanceTx.fee / 100) / transaction.amount.value * 100 : 0,
          rawPayload: balanceTx,
          createdAt: new Date(),
        });
      }
    }

    return fees;
  }

  /**
   * Normalize transaction to canonical format
   */
  normalizeTransaction(raw: Record<string, any>, tenantId: string): Transaction {
    const charge = raw.charge || raw;
    
    const transaction: Transaction = {
      id: this.generateId(),
      tenantId,
      paymentId: charge.metadata?.payment_id,
      provider: 'stripe',
      providerTransactionId: charge.id,
      type: this.mapTransactionType(charge),
      amount: {
        value: charge.amount / 100, // Convert cents to dollars
        currency: charge.currency.toUpperCase(),
      },
      status: this.mapTransactionStatus(charge),
      rawPayload: charge,
      created_at: new Date(charge.created * 1000),
      updatedAt: new Date(charge.updated || charge.created * 1000),
    };

    if (charge.balance_transaction) {
      transaction.netAmount = {
        value: (charge.amount - charge.balance_transaction.fee) / 100,
        currency: charge.currency.toUpperCase(),
      };
    }

    return transaction;
  }

  /**
   * Normalize settlement to canonical format
   */
  normalizeSettlement(raw: Record<string, any>, tenantId: string): Settlement {
    const payout = raw.payout || raw;
    
    return {
      id: this.generateId(),
      tenantId,
      provider: 'stripe',
      providerSettlementId: payout.id,
      amount: {
        value: payout.amount / 100,
        currency: payout.currency.toUpperCase(),
      },
      currency: payout.currency.toUpperCase(),
      fxRate: payout.exchange_rate,
      settlementDate: new Date(payout.arrival_date * 1000),
      expectedDate: new Date(payout.arrival_date * 1000),
      status: this.mapSettlementStatus(payout),
      rawPayload: payout,
      createdAt: new Date(payout.created * 1000),
      updatedAt: new Date(payout.created * 1000),
    };
  }

  /**
   * Normalize refund/dispute
   */
  normalizeRefundDispute(raw: Record<string, any>, tenantId: string, type: RefundDisputeType): RefundDispute {
    return {
      id: this.generateId(),
      tenantId,
      transactionId: raw.charge || raw.payment_intent,
      type,
      amount: {
        value: raw.amount ? raw.amount / 100 : 0,
        currency: raw.currency ? raw.currency.toUpperCase() : 'USD',
      },
      status: this.mapRefundDisputeStatus(raw),
      reason: raw.reason || raw.dispute_reason,
      providerRefundId: type === 'refund' ? raw.id : undefined,
      providerDisputeId: type === 'chargeback' ? raw.id : undefined,
      rawPayload: raw,
      createdAt: new Date(raw.created * 1000),
      updatedAt: new Date(raw.updated || raw.created * 1000),
    };
  }

  /**
   * Handle API version changes
   */
  handleVersionChange(_oldVersion: string, newVersion: string): void {
    if (!this.supportedVersions.includes(newVersion)) {
      console.warn(`Stripe API version ${newVersion} is not officially supported. Supported versions: ${this.supportedVersions.join(', ')}`);
    }
  }

  /**
   * Map Stripe transaction type to canonical type
   */
  private mapTransactionType(charge: any): TransactionType {
    if (charge.refunded) return 'refund';
    if (charge.disputed) return 'chargeback';
    if (charge.captured) return 'capture';
    return 'authorization';
  }

  /**
   * Map Stripe status to canonical status
   */
  private mapTransactionStatus(charge: any): TransactionStatus {
    if (charge.refunded) return 'refunded';
    if (charge.disputed) return 'disputed';
    if (charge.paid) return 'succeeded';
    if (charge.failed) return 'failed';
    return 'pending';
  }

  /**
   * Map Stripe payout status to canonical status
   */
  private mapSettlementStatus(payout: any): SettlementStatus {
    if (payout.status === 'paid') return 'completed';
    if (payout.status === 'failed') return 'failed';
    return 'pending';
  }

  /**
   * Map Stripe refund/dispute status to canonical status
   */
  private mapRefundDisputeStatus(raw: any): RefundDisputeStatus {
    if (raw.status === 'succeeded' || raw.status === 'won') return 'completed';
    if (raw.status === 'failed' || raw.status === 'lost') return 'lost';
    if (raw.status === 'canceled') return 'reversed';
    return 'pending';
  }

  /**
   * Generate ID
   */
  private generateId(): string {
    return `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
