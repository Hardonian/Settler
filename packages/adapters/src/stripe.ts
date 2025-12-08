import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
import Stripe from "stripe";

export class StripeAdapter implements Adapter {
  name = "stripe";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const { config, dateRange } = options;
    const apiKey = config.apiKey as string;

    if (!apiKey) {
      throw new Error("Stripe API key is required");
    }

    const stripe = new Stripe(apiKey, {
      apiVersion: "2024-11-20.acacia",
    });

    const charges = await stripe.charges.list({
      created: {
        gte: dateRange?.start ? Math.floor(dateRange.start.getTime() / 1000) : undefined,
        lte: dateRange?.end ? Math.floor(dateRange.end.getTime() / 1000) : undefined,
      },
      limit: 100,
    });

    return charges.data.map((charge) => this.normalize(charge));
  }

  normalize(data: unknown): NormalizedData {
    // In production, normalize Stripe charge/payment object
    const charge = data as {
      id: string;
      amount: number;
      currency: string;
      created: number;
      metadata?: Record<string, unknown>;
    };

    const normalized: NormalizedData = {
      id: charge.id,
      amount: charge.amount / 100, // Convert cents to dollars
      currency: charge.currency.toUpperCase(),
      date: new Date(charge.created * 1000),
      metadata: charge.metadata || {},
      sourceId: charge.id,
    };

    if (charge.metadata?.order_id) {
      normalized.referenceId = charge.metadata.order_id as string;
    }

    return normalized;
  }

  validate(data: NormalizedData): ValidationResult {
    const errors: string[] = [];

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

    const result: ValidationResult = {
      valid: errors.length === 0,
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    return result;
  }
}
