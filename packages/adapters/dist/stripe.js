"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeAdapter = void 0;
const stripe_1 = __importDefault(require("stripe"));
class StripeAdapter {
    name = "stripe";
    version = "1.0.0";
    async fetch(options) {
        const { config, dateRange } = options;
        const apiKey = config.apiKey;
        if (!apiKey) {
            throw new Error("Stripe API key is required");
        }
        const stripe = new stripe_1.default(apiKey, {
            apiVersion: "2024-11-20.acacia",
        });
        const createdParams = {};
        if (dateRange?.start) {
            createdParams.gte = Math.floor(dateRange.start.getTime() / 1000);
        }
        if (dateRange?.end) {
            createdParams.lte = Math.floor(dateRange.end.getTime() / 1000);
        }
        const hasCreatedParams = Object.keys(createdParams).length > 0;
        const charges = await stripe.charges.list({
            ...(hasCreatedParams ? { created: createdParams } : {}),
            limit: 100,
        });
        return charges.data.map((charge) => this.normalize(charge));
    }
    normalize(data) {
        // In production, normalize Stripe charge/payment object
        const charge = data;
        const normalized = {
            id: charge.id,
            amount: charge.amount / 100, // Convert cents to dollars
            currency: charge.currency.toUpperCase(),
            date: new Date(charge.created * 1000),
            metadata: charge.metadata || {},
            sourceId: charge.id,
        };
        if (charge.metadata?.order_id) {
            normalized.referenceId = charge.metadata.order_id;
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
        if (!data.currency) {
            errors.push("Currency is required");
        }
        if (!data.date) {
            errors.push("Date is required");
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
exports.StripeAdapter = StripeAdapter;
//# sourceMappingURL=stripe.js.map