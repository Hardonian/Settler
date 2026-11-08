import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
import Stripe from "stripe";

const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

const THREE_DECIMAL_CURRENCIES = new Set(["BHD", "JOD", "KWD", "OMR", "TND"]);

function currencyMinorUnitDivisor(currency: string): number {
  const upper = currency.toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(upper)) return 1;
  if (THREE_DECIMAL_CURRENCIES.has(upper)) return 1000;
  return 100;
}

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
      apiVersion: "2024-11-20.acacia" as any,
    });

    const createdParams: { gte?: number; lte?: number } = {};
    if (dateRange?.start) {
      createdParams.gte = Math.floor(dateRange.start.getTime() / 1000);
    }
    if (dateRange?.end) {
      createdParams.lte = Math.floor(dateRange.end.getTime() / 1000);
    }

    const hasCreatedParams = Object.keys(createdParams).length > 0;
    const maxPages = typeof config.maxPages === "number" ? config.maxPages : 10;
    const allNormalized: NormalizedData[] = [];
    let startingAfter: string | undefined;

    for (let page = 0; page < maxPages; page++) {
      const charges = await stripe.charges.list({
        ...(hasCreatedParams ? { created: createdParams } : {}),
        ...(startingAfter ? { starting_after: startingAfter } : {}),
        limit: 100,
      });

      for (const charge of charges.data) {
        allNormalized.push(this.normalize(charge));
      }

      if (!charges.has_more || charges.data.length === 0) {
        break;
      }
      startingAfter = charges.data[charges.data.length - 1]?.id;
      if (!startingAfter) {
        break;
      }
    }

    return allNormalized;
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

    const currency = charge.currency.toUpperCase();
    const divisor = currencyMinorUnitDivisor(currency);

    const normalized: NormalizedData = {
      id: charge.id,
      amount: charge.amount / divisor,
      currency,
      date: new Date(charge.created * 1000),
      metadata: {
        ...(charge.metadata || {}),
        amountMinorUnits: charge.amount,
      },
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
