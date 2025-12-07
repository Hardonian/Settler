import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";

/**
 * Google Pay Adapter
 * Fetches payment data from Google Pay API
 */
export class GooglePayAdapter implements Adapter {
  name = "google-pay";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const { config, dateRange } = options;
    const apiKey = config.apiKey as string;
    const merchantId = config.merchantId as string;

    if (!apiKey || !merchantId) {
      throw new Error("Google Pay API key and merchant ID are required");
    }

    // Google Pay API endpoint (example)
    const url = `https://payments.google.com/api/v1/merchants/${merchantId}/transactions`;
    const params = new URLSearchParams({
      api_key: apiKey,
    });

    if (dateRange?.start && dateRange?.end) {
      params.append("start_date", dateRange.start.toISOString());
      params.append("end_date", dateRange.end.toISOString());
    }

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Google Pay API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const transactions = data.transactions || data.items || [];

    return transactions.map((transaction: unknown) => this.normalize(transaction));
  }

  normalize(data: unknown): NormalizedData {
    const transaction = data as {
      id: string;
      amount: number;
      currency: string;
      created_at: string;
      metadata?: Record<string, unknown>;
      order_id?: string;
    };

    const normalized: NormalizedData = {
      id: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency.toUpperCase(),
      date: new Date(transaction.created_at),
      metadata: transaction.metadata || {},
      sourceId: transaction.id,
    };

    if (transaction.order_id) {
      normalized.referenceId = transaction.order_id;
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

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  }
}
