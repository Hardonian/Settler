import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";

/**
 * Wix Stores Adapter
 * Fetches order data from Wix Stores API
 */
export class WixStoresAdapter implements Adapter {
  name = "wix-stores";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const { config, dateRange } = options;
    const apiKey = config.apiKey as string;
    const siteId = config.siteId as string;

    if (!apiKey || !siteId) {
      throw new Error("Wix API key and site ID are required");
    }

    const url = `https://www.wixapis.com/stores/v1/orders/query`;

    const query: any = {
      query: {},
      sort: [{ fieldName: "number", order: "DESC" }],
      paging: { limit: 100 },
    };

    if (dateRange?.start && dateRange?.end) {
      query.query.filter = {
        dateCreated: {
          $gte: dateRange.start.toISOString(),
          $lte: dateRange.end.toISOString(),
        },
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
        "wix-site-id": siteId,
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`Wix API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const orders = data.orders || [];

    return orders.map((order: unknown) => this.normalize(order));
  }

  normalize(data: unknown): NormalizedData {
    const order = data as {
      id: string;
      number: string;
      priceData: {
        total: string;
        currency: string;
      };
      dateCreated: string;
      paymentStatus: string;
      fulfillmentStatus: string;
    };

    const normalized: NormalizedData = {
      id: order.id,
      amount: parseFloat(order.priceData.total),
      currency: order.priceData.currency.toUpperCase(),
      date: new Date(order.dateCreated),
      metadata: {
        order_number: order.number,
        payment_status: order.paymentStatus,
        fulfillment_status: order.fulfillmentStatus,
        source: "wix_stores",
      },
      sourceId: order.id,
      referenceId: order.number,
    };

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
