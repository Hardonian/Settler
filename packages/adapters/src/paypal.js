"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayPalAdapter = void 0;
class PayPalAdapter {
    name = "paypal";
    version = "1.0.0";
    async fetch(options) {
        const { config } = options;
        const clientId = config.clientId;
        const clientSecret = config.clientSecret;
        if (!clientId || !clientSecret) {
            throw new Error("PayPal client ID and secret are required");
        }
        // In production, use PayPal SDK
        // Mock implementation
        return [
            {
                id: "payment_123",
                amount: 99.99,
                currency: "USD",
                date: new Date(),
                metadata: { payment_id: "payment_123" },
                sourceId: "payment_123",
                referenceId: "payment_123",
            },
        ];
    }
    normalize(data) {
        const payment = data;
        const normalized = {
            id: payment.id,
            amount: parseFloat(payment.amount.total),
            currency: payment.amount.currency.toUpperCase(),
            date: new Date(payment.create_time),
            metadata: {
                custom: payment.custom,
            },
            sourceId: payment.id,
        };
        if (payment.custom) {
            normalized.referenceId = payment.custom;
        }
        return normalized;
    }
    validate(data) {
        const errors = [];
        if (!data.id) {
            errors.push("ID is required");
        }
        if (data.amount <= 0) {
            errors.push("Amount must be greater than 0");
        }
        const result = {
            valid: errors.length === 0,
        };
        if (errors.length > 0) {
            result.errors = errors;
        }
        return result;
    }
}
exports.PayPalAdapter = PayPalAdapter;
//# sourceMappingURL=paypal.js.map