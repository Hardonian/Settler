"use strict";
/**
 * Enhanced Stripe Adapter
 *
 * Implements webhook ingestion, API polling, and comprehensive normalization
 * as specified in the Product & Technical Specification.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeEnhancedAdapter = void 0;
const crypto_1 = __importDefault(require("crypto"));
class StripeEnhancedAdapter {
    name = 'stripe';
    version = '1.0.0';
    supportedVersions = ['2023-10-16', '2024-01-01']; // Supported API versions
    /**
     * Verify webhook signature
     */
    verifyWebhook(payload, signature, secret) {
        try {
            const elements = signature.split(',');
            const timestamp = elements.find(e => e.startsWith('t='))?.substring(2);
            const signatures = elements.filter(e => e.startsWith('v1=')).map(e => e.substring(3));
            if (!timestamp || signatures.length === 0) {
                return false;
            }
            const signedPayload = `${timestamp}.${typeof payload === 'string' ? payload : payload.toString()}`;
            const expectedSignature = crypto_1.default
                .createHmac('sha256', secret)
                .update(signedPayload)
                .digest('hex');
            return signatures.some(sig => crypto_1.default.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature)));
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Normalize webhook payload to canonical format
     */
    normalizeWebhook(payload, tenantId) {
        const events = [];
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
    async pollTransactions(config, _dateRange) {
        const apiKey = config.apiKey;
        if (!apiKey) {
            throw new Error('Stripe API key is required');
        }
        // In production, use Stripe SDK
        // const stripe = new Stripe(apiKey);
        // const charges = await stripe.charges.list({
        //   created: {
        //     gte: Math.floor(dateRange.start.getTime() / 1000),
        //     lte: Math.floor(dateRange.end.getTime() / 1000),
        //   },
        //   limit: 100,
        // });
        // Mock implementation for now
        return [];
    }
    /**
     * Poll settlements from Stripe API
     */
    async pollSettlements(config, _dateRange) {
        const apiKey = config.apiKey;
        if (!apiKey) {
            throw new Error('Stripe API key is required');
        }
        // In production, use Stripe SDK
        // const stripe = new Stripe(apiKey);
        // const payouts = await stripe.payouts.list({
        //   created: {
        //     gte: Math.floor(dateRange.start.getTime() / 1000),
        //     lte: Math.floor(dateRange.end.getTime() / 1000),
        //   },
        //   limit: 100,
        // });
        // Mock implementation for now
        return [];
    }
    /**
     * Extract fees from transaction payload
     */
    async extractFees(transaction, tenantId) {
        const fees = [];
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
    normalizeTransaction(raw, tenantId) {
        const charge = raw.charge || raw;
        const transaction = {
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
    normalizeSettlement(raw, tenantId) {
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
    normalizeRefundDispute(raw, tenantId, type) {
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
    handleVersionChange(_oldVersion, newVersion) {
        if (!this.supportedVersions.includes(newVersion)) {
            console.warn(`Stripe API version ${newVersion} is not officially supported. Supported versions: ${this.supportedVersions.join(', ')}`);
        }
    }
    /**
     * Map Stripe transaction type to canonical type
     */
    mapTransactionType(charge) {
        if (charge.refunded)
            return 'refund';
        if (charge.disputed)
            return 'chargeback';
        if (charge.captured)
            return 'capture';
        return 'authorization';
    }
    /**
     * Map Stripe status to canonical status
     */
    mapTransactionStatus(charge) {
        if (charge.refunded)
            return 'refunded';
        if (charge.disputed)
            return 'disputed';
        if (charge.paid)
            return 'succeeded';
        if (charge.failed)
            return 'failed';
        return 'pending';
    }
    /**
     * Map Stripe payout status to canonical status
     */
    mapSettlementStatus(payout) {
        if (payout.status === 'paid')
            return 'completed';
        if (payout.status === 'failed')
            return 'failed';
        return 'pending';
    }
    /**
     * Map Stripe refund/dispute status to canonical status
     */
    mapRefundDisputeStatus(raw) {
        if (raw.status === 'succeeded' || raw.status === 'won')
            return 'completed';
        if (raw.status === 'failed' || raw.status === 'lost')
            return 'lost';
        if (raw.status === 'canceled')
            return 'reversed';
        return 'pending';
    }
    /**
     * Generate ID
     */
    generateId() {
        return `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.StripeEnhancedAdapter = StripeEnhancedAdapter;
//# sourceMappingURL=stripe-enhanced.js.map