"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeAdapter = void 0;
class StripeAdapter {
  name = "stripe";
  version = "1.0.0";
  async fetch(options) {
    const { config } = options;
    const apiKey = config.apiKey;
    if (!apiKey) {
      throw new Error("Stripe API key is required");
    }
    // In production, use Stripe SDK
    // const stripe = new Stripe(apiKey);
    // const charges = await stripe.charges.list({
    //   created: { gte: Math.floor(dateRange.start.getTime() / 1000) }
    // });
    // Mock implementation
    return [
      {
        id: "ch_1234567890",
        amount: 99.99,
        currency: "usd",
        date: new Date(),
        metadata: { order_id: "order_123" },
        sourceId: "ch_1234567890",
        referenceId: "order_123",
      },
    ];
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
