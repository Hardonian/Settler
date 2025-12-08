"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopifyAdapter = void 0;
class ShopifyAdapter {
    name = "shopify";
    version = "1.0.0";
    async fetch(options) {
        const { config } = options;
        const apiKey = config.apiKey;
        const shopDomain = config.shopDomain;
        if (!apiKey || !shopDomain) {
            throw new Error("Shopify API key and shop domain are required");
        }
        // In production, use Shopify Admin API
        // const client = new Shopify.Clients.Rest(shopDomain, apiKey);
        // const orders = await client.get({ path: "orders", query: { created_at_min: dateRange.start.toISOString() } });
        // Mock implementation
        return [
            {
                id: "order_123456",
                amount: 99.99,
                currency: "USD",
                date: new Date(),
                metadata: { order_id: "order_123456", customer_email: "customer@example.com" },
                sourceId: "order_123456",
                referenceId: "order_123456",
            },
        ];
    }
    normalize(data) {
        // In production, normalize Shopify order object
        const order = data;
        const normalized = {
            id: order.id.toString(),
            amount: parseFloat(order.total_price),
            currency: order.currency.toUpperCase(),
            date: new Date(order.created_at),
            metadata: {
                order_name: order.name,
                customer_email: order.email,
            },
            sourceId: order.id.toString(),
        };
        if (order.name) {
            normalized.referenceId = order.name;
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
        const result = {
            valid: errors.length === 0,
        };
        if (errors.length > 0) {
            result.errors = errors;
        }
        return result;
    }
}
exports.ShopifyAdapter = ShopifyAdapter;
//# sourceMappingURL=shopify.js.map