import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";

/**
 * Google Analytics GA4 Deep Sync Adapter
 * Fetches e-commerce event data from GA4 API
 */
export class GA4DeepSyncAdapter implements Adapter {
  name = "ga4-deep-sync";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const { config, dateRange } = options;
    const propertyId = config.propertyId as string;
    const credentials = config.credentials as string; // JSON service account credentials

    if (!propertyId || !credentials) {
      throw new Error("GA4 property ID and credentials are required");
    }

    // GA4 Data API endpoint
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

    const requestBody: any = {
      dateRanges: [
        {
          startDate: dateRange?.start
            ? dateRange.start.toISOString().split("T")[0]
            : "30daysAgo",
          endDate: dateRange?.end
            ? dateRange.end.toISOString().split("T")[0]
            : "today",
        },
      ],
      dimensions: [{ name: "date" }, { name: "transactionId" }],
      metrics: [
        { name: "purchaseRevenue" },
        { name: "transactions" },
        { name: "totalRevenue" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: {
            matchType: "EXACT",
            value: "purchase",
          },
        },
      },
    };

    // In production, use Google Auth library to get access token
    const accessToken = await this.getAccessToken(credentials);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`GA4 API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.rows || [];

    return rows.map((row: unknown) => this.normalize(row));
  }

  async getAccessToken(credentials: string): Promise<string> {
    // In production, implement OAuth2 flow with service account
    // For now, return a placeholder
    // This would use google-auth-library in Node.js
    return "access_token_placeholder";
  }

  normalize(data: unknown): NormalizedData {
    const row = data as {
      dimensionValues: Array<{ value: string }>;
      metricValues: Array<{ value: string }>;
    };

    const date = row.dimensionValues[0]?.value || "";
    const transactionId = row.dimensionValues[1]?.value || "";
    const revenue = parseFloat(row.metricValues[0]?.value || "0");

    return {
      id: `ga4_${transactionId}_${date}`,
      amount: revenue,
      currency: "USD", // GA4 typically uses configured currency
      date: new Date(date),
      metadata: {
        transaction_id: transactionId,
        source: "ga4",
        event_type: "purchase",
      },
      sourceId: transactionId,
      referenceId: transactionId,
    };
  }

  validate(data: NormalizedData): ValidationResult {
    const errors: string[] = [];

    if (!data.id) {
      errors.push("ID is required");
    }
    if (data.amount < 0) {
      errors.push("Amount cannot be negative");
    }
    if (!data.currency) {
      errors.push("Currency is required");
    }
    if (!data.date) {
      errors.push("Date is required");
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
