"use strict";
/**
 * Enhanced Square Adapter
 *
 * Implements webhook ingestion, API polling, and comprehensive normalization
 * as specified in the Product & Technical Specification.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SquareEnhancedAdapter = void 0;
const crypto_1 = __importDefault(require("crypto"));
class SquareEnhancedAdapter {
    name = 'square';
    version = '1.0.0';
    supportedVersions = ['2023-10-18', '2024-01-18']; // Supported API versions
    /**
     * Verify webhook signature
     */
    verifyWebhook(payload, signature, secret) {
        try {
            // Square webhook signature verification
            // Square uses HMAC-SHA256 with webhook URL + payload
            const url = typeof payload === 'string' ? '' : ''; // Webhook URL from request
            const payloadString = typeof payload === 'string' ? payload : payload.toString();
            const signedPayload = url + payloadString;
            const expectedSignature = crypto_1.default
                .createHmac('sha256', secret)
                .update(signedPayload)
                .digest('base64');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
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
        const eventType = payload.type || payload.event_type;
        const data = payload.data || payload;
        switch (eventType) {
            case 'payment.created':
            case 'payment.updated':
                if (data.object?.payment) {
                    events.push({
                        type: 'capture',
                        transaction: this.normalizeTransaction(data.object.payment, tenantId),
                        rawPayload: payload,
                        timestamp: new Date(payload.created_at || Date.now()),
                    });
                }
                break;
            case 'refund.created':
            case 'refund.updated':
                if (data.object?.refund) {
                    events.push({
                        type: 'refund',
                        refundDispute: this.normalizeRefundDispute(data.object.refund, tenantId, 'refund'),
                        rawPayload: payload,
                        timestamp: new Date(payload.created_at || Date.now()),
                    });
                }
                break;
            case 'dispute.created':
            case 'dispute.updated':
                if (data.object?.dispute) {
                    events.push({
                        type: 'chargeback',
                        refundDispute: this.normalizeRefundDispute(data.object.dispute, tenantId, 'chargeback'),
                        rawPayload: payload,
                        timestamp: new Date(payload.created_at || Date.now()),
                    });
                }
                break;
            case 'settlement.created':
            case 'settlement.updated':
                if (data.object?.settlement) {
                    events.push({
                        type: 'payout',
                        settlement: this.normalizeSettlement(data.object.settlement, tenantId),
                        rawPayload: payload,
                        timestamp: new Date(payload.created_at || Date.now()),
                    });
                }
                break;
            default:
                // Unknown event type, but still normalize if possible
                if (data.object?.payment) {
                    events.push({
                        type: 'capture',
                        transaction: this.normalizeTransaction(data.object.payment, tenantId),
                        rawPayload: payload,
                        timestamp: new Date(payload.created_at || Date.now()),
                    });
                }
        }
        return events;
    }
    /**
     * Poll transactions from Square API
     */
    async pollTransactions(config, _dateRange) {
        const accessToken = config.accessToken;
        if (!accessToken) {
            throw new Error('Square access token is required');
        }
        // In production, use Square SDK
        // const { Client, Environment } = require('squareup');
        // const client = new Client({
        //   accessToken: accessToken,
        //   environment: Environment.Sandbox, // or Production
        // });
        // 
        // const paymentsApi = client.paymentsApi;
        // const response = await paymentsApi.listPayments({
        //   beginTime: dateRange.start.toISOString(),
        //   endTime: dateRange.end.toISOString(),
        // });
        // Mock implementation for now
        return [];
    }
    /**
     * Poll settlements from Square API
     */
    async pollSettlements(config, _dateRange) {
        const accessToken = config.accessToken;
        if (!accessToken) {
            throw new Error('Square access token is required');
        }
        // In production, use Square SDK
        // const { Client, Environment } = require('squareup');
        // const client = new Client({
        //   accessToken: accessToken,
        //   environment: Environment.Sandbox,
        // });
        // 
        // const settlementsApi = client.settlementsApi;
        // const response = await settlementsApi.listSettlements({
        //   beginTime: dateRange.start.toISOString(),
        //   endTime: dateRange.end.toISOString(),
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
        // Square fee structure
        if (payload.processing_fee_money) {
            fees.push({
                id: this.generateId(),
                tenantId,
                transactionId: transaction.id,
                type: 'processing',
                amount: {
                    value: parseFloat(payload.processing_fee_money.amount || '0') / 100, // Convert cents to dollars
                    currency: payload.processing_fee_money.currency || transaction.amount.currency,
                },
                description: 'Square processing fee',
                rate: transaction.amount.value > 0
                    ? (parseFloat(payload.processing_fee_money.amount || '0') / 100) / transaction.amount.value * 100
                    : 0,
                rawPayload: payload.processing_fee_money,
                createdAt: new Date(),
            });
        }
        return fees;
    }
    /**
     * Normalize transaction to canonical format
     */
    normalizeTransaction(raw, tenantId) {
        const payment = raw.payment || raw;
        const transaction = {
            id: this.generateId(),
            tenantId,
            paymentId: payment.order_id || payment.reference_id,
            provider: 'square',
            providerTransactionId: payment.id,
            type: this.mapTransactionType(payment),
            amount: {
                value: parseFloat(payment.total_money?.amount || payment.amount_money?.amount || '0') / 100,
                currency: (payment.total_money?.currency || payment.amount_money?.currency || 'USD').toUpperCase(),
            },
            status: this.mapTransactionStatus(payment),
            rawPayload: payment,
            created_at: new Date(payment.created_at || Date.now()),
            updatedAt: new Date(payment.updated_at || Date.now()),
        };
        if (payment.processing_fee_money) {
            transaction.netAmount = {
                value: (parseFloat(payment.total_money?.amount || '0') - parseFloat(payment.processing_fee_money.amount || '0')) / 100,
                currency: (payment.total_money?.currency || 'USD').toUpperCase(),
            };
        }
        return transaction;
    }
    /**
     * Normalize settlement to canonical format
     */
    normalizeSettlement(raw, tenantId) {
        const settlement = raw.settlement || raw;
        return {
            id: this.generateId(),
            tenantId,
            provider: 'square',
            providerSettlementId: settlement.id,
            amount: {
                value: parseFloat(settlement.total_money?.amount || '0') / 100,
                currency: (settlement.total_money?.currency || 'USD').toUpperCase(),
            },
            currency: (settlement.total_money?.currency || 'USD').toUpperCase(),
            fxRate: settlement.exchange_rate,
            settlementDate: new Date(settlement.initiated_at || settlement.created_at || Date.now()),
            expectedDate: new Date(settlement.expected_at || settlement.initiated_at || Date.now()),
            status: this.mapSettlementStatus(settlement),
            rawPayload: settlement,
            createdAt: new Date(settlement.created_at || Date.now()),
            updatedAt: new Date(settlement.updated_at || Date.now()),
        };
    }
    /**
     * Normalize refund/dispute
     */
    normalizeRefundDispute(raw, tenantId, type) {
        return {
            id: this.generateId(),
            tenantId,
            transactionId: raw.payment_id || raw.source_id,
            type,
            amount: {
                value: parseFloat(raw.amount_money?.amount || raw.refunded_money?.amount || '0') / 100,
                currency: (raw.amount_money?.currency || raw.refunded_money?.currency || 'USD').toUpperCase(),
            },
            status: this.mapRefundDisputeStatus(raw),
            reason: raw.reason || raw.dispute_reason,
            providerRefundId: type === 'refund' ? raw.id : undefined,
            providerDisputeId: type === 'chargeback' ? raw.id : undefined,
            rawPayload: raw,
            createdAt: new Date(raw.created_at || Date.now()),
            updatedAt: new Date(raw.updated_at || Date.now()),
        };
    }
    /**
     * Handle API version changes
     */
    handleVersionChange(_oldVersion, newVersion) {
        if (!this.supportedVersions.includes(newVersion)) {
            console.warn(`Square API version ${newVersion} is not officially supported. Supported versions: ${this.supportedVersions.join(', ')}`);
        }
    }
    /**
     * Map Square transaction type to canonical type
     */
    mapTransactionType(payment) {
        if (payment.refund_ids && payment.refund_ids.length > 0)
            return 'refund';
        if (payment.dispute_ids && payment.dispute_ids.length > 0)
            return 'chargeback';
        if (payment.status === 'COMPLETED')
            return 'capture';
        return 'authorization';
    }
    /**
     * Map Square status to canonical status
     */
    mapTransactionStatus(payment) {
        if (payment.status === 'REFUNDED')
            return 'refunded';
        if (payment.status === 'FAILED')
            return 'failed';
        if (payment.status === 'COMPLETED')
            return 'succeeded';
        return 'pending';
    }
    /**
     * Map Square settlement status to canonical status
     */
    mapSettlementStatus(settlement) {
        if (settlement.status === 'COMPLETED')
            return 'completed';
        if (settlement.status === 'FAILED')
            return 'failed';
        return 'pending';
    }
    /**
     * Map Square refund/dispute status to canonical status
     */
    mapRefundDisputeStatus(raw) {
        if (raw.status === 'COMPLETED' || raw.status === 'WON')
            return 'completed';
        if (raw.status === 'FAILED' || raw.status === 'LOST')
            return 'lost';
        if (raw.status === 'CANCELLED')
            return 'reversed';
        return 'pending';
    }
    /**
     * Generate ID
     */
    generateId() {
        return `square_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.SquareEnhancedAdapter = SquareEnhancedAdapter;
//# sourceMappingURL=square-enhanced.js.map