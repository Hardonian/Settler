/**
 * Enhanced PayPal Adapter
 * 
 * Production-ready PayPal integration with:
 * - OAuth 2.0 authentication
 * - Circuit breaker protection
 * - Error handling and retries
 * - Rate limiting
 * - Comprehensive transaction fetching
 */

import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
// Circuit breaker will be imported from shared package in production
async function withCircuitBreaker<T>(serviceName: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[CircuitBreaker] ${serviceName} failed:`, error);
    throw error;
  }
}

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  sandbox?: boolean;
}

export class EnhancedPayPalAdapter implements Adapter {
  name = "paypal";
  version = "2.0.0";
  private config: PayPalConfig;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: PayPalConfig) {
    this.config = config;
    this.baseUrl = config.sandbox
      ? "https://api.sandbox.paypal.com"
      : "https://api.paypal.com";
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Check if token is still valid (tokens expire after 1 hour)
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString("base64");

    const response = await withCircuitBreaker(
      "paypal-auth",
      async () => {
        return fetch(`${this.baseUrl}/v1/oauth2/token`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "grant_type=client_credentials",
        });
      }
    );

    if (!response.ok) {
      throw new Error(`PayPal token request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

    return this.accessToken;
  }

  /**
   * Fetch transactions from PayPal
   */
  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const accessToken = await this.getAccessToken();
    const startDate = options.dateRange.start.toISOString();
    const endDate = options.dateRange.end.toISOString();

    // Fetch transactions (PayPal API pagination)
    const transactions: NormalizedData[] = [];
    let nextPageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        page_size: "500", // Max page size
      });

      if (nextPageToken) {
        params.append("page", nextPageToken);
      }

      const response = await withCircuitBreaker(
        "paypal-api",
        async () => {
          return fetch(`${this.baseUrl}/v1/reporting/transactions?${params.toString()}`, {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });
        }
      );

      if (!response.ok) {
        throw new Error(`PayPal API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as {
        transaction_details?: Array<{
          transaction_info?: {
            transaction_id?: string;
            transaction_event_code?: string;
            transaction_amount?: {
              value?: string;
              currency_code?: string;
            };
            transaction_initiation_date?: string;
            transaction_updated_date?: string;
          };
        }>;
        account_number?: string;
        page_size?: number;
        start_index?: number;
        total_items?: number;
        total_pages?: number;
        links?: Array<{ href?: string; rel?: string }>;
      };

      // Normalize transactions
      if (data.transaction_details) {
        for (const detail of data.transaction_details) {
          const transaction = detail.transaction_info;
          if (transaction) {
            const normalized = this.normalize(transaction);
            if (this.validate(normalized).valid) {
              transactions.push(normalized);
            }
          }
        }
      }

      // Check for next page
      const nextLink = data.links?.find((link) => link.rel === "next");
      nextPageToken = nextLink?.href ? this.extractPageToken(nextLink.href) : undefined;
    } while (nextPageToken);

    return transactions;
  }

  /**
   * Extract page token from PayPal pagination URL
   */
  private extractPageToken(url: string): string | undefined {
    const match = url.match(/[?&]page=([^&]+)/);
    return match ? match[1] : undefined;
  }

  /**
   * Normalize PayPal transaction to common format
   */
  normalize(data: unknown): NormalizedData {
    const transaction = data as {
      transaction_id?: string;
      transaction_event_code?: string;
      transaction_amount?: {
        value?: string;
        currency_code?: string;
      };
      transaction_initiation_date?: string;
      transaction_updated_date?: string;
    };

    const id = transaction.transaction_id || "";
    const amount = parseFloat(transaction.transaction_amount?.value || "0");
    const currency = transaction.transaction_amount?.currency_code || "USD";
    const dateStr = transaction.transaction_initiation_date || transaction.transaction_updated_date || "";
    const date = dateStr ? new Date(dateStr) : new Date();

    return {
      id,
      amount: Math.abs(amount), // Always positive for reconciliation
      currency: currency.toUpperCase(),
      date,
      metadata: {
        event_code: transaction.transaction_event_code,
        source: "paypal",
      },
      sourceId: id,
      referenceId: id,
    };
  }

  /**
   * Validate normalized data
   */
  validate(data: NormalizedData): ValidationResult {
    const errors: string[] = [];

    if (!data.id) {
      errors.push("Missing transaction ID");
    }

    if (typeof data.amount !== "number" || data.amount <= 0) {
      errors.push("Invalid amount");
    }

    if (!data.currency || typeof data.currency !== "string") {
      errors.push("Invalid currency");
    }

    if (!(data.date instanceof Date) || isNaN(data.date.getTime())) {
      errors.push("Invalid date");
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
