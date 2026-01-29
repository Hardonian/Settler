/**
 * API Response Types for External Services
 *
 * Provides TypeScript interfaces for all external API responses to eliminate `any` types
 */

// Amazon SP-API Response Types
export interface AmazonTokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
  refresh_token?: string;
}

export interface AmazonFinancialEventsResponse {
  payload?: {
    FinancialEvents?: AmazonFinancialEvent[];
    NextToken?: string;
  };
}

export interface AmazonFinancialEvent {
  ShipmentEventList?: AmazonShipmentEvent[];
  [key: string]: unknown;
}

export interface AmazonShipmentEvent {
  ShipmentId?: string;
  ShipmentAmount?: {
    CurrencyCode?: string;
    Value?: number;
  };
  [key: string]: unknown;
}

// Chargebee Response Types
export interface ChargebeeSubscriptionResponse {
  list?: ChargebeeSubscription[];
}

export interface ChargebeeSubscription {
  subscription: {
    id: string;
    customer_id: string;
    plan_id: string;
    plan_name?: string;
    status: string;
    billing_period_unit?: string;
    mrr?: number;
    currency_code?: string;
    current_term_start?: number;
    current_term_end?: number;
    cancel_at_term_end?: boolean;
    cancelled_at?: number;
    [key: string]: unknown;
  };
}

export interface ChargebeeInvoiceResponse {
  list?: ChargebeeInvoice[];
}

export interface ChargebeeInvoice {
  invoice: {
    id: string;
    number?: string;
    customer_id?: string;
    total?: number;
    currency_code?: string;
    status: string;
    date?: number;
    paid_at?: number;
    subscription_id?: string;
    [key: string]: unknown;
  };
}

// eBay Response Types
export interface EbayTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
}

export interface EbayError {
  error?: string;
  error_description?: string;
}

export interface EbayPrivilegeResponse {
  user?: EbayUser;
}

export interface EbayUser {
  userId?: string;
  username?: string;
}

export interface EbayPayoutsResponse {
  payouts?: EbayPayout[];
}

export interface EbayPayout {
  payoutId: string;
  amount?: {
    value?: number;
    currency?: string;
  };
  payoutStatus?: string;
  payoutDate?: string;
  [key: string]: unknown;
}

export interface EbayTransactionsResponse {
  transactions?: EbayTransaction[];
}

export interface EbayTransaction {
  transactionId: string;
  transactionType?: string;
  amount?: {
    value?: number;
    currency?: string;
  };
  transactionDate?: string;
  transactionMemo?: string;
  orderId?: string;
  [key: string]: unknown;
}

// Etsy Response Types
export interface EtsyTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
}

export interface EtsyError {
  error?: string;
  error_description?: string;
}

export interface EtsyShopsResponse {
  results?: EtsyShop[];
}

export interface EtsyShop {
  shop_id: string;
  shop_name?: string;
  [key: string]: unknown;
}

export interface EtsyReceiptsResponse {
  results?: EtsyReceipt[];
}

export interface EtsyReceipt {
  receipt_id: number;
  total_tax_cost?: {
    amount?: number;
    currency_code?: string;
  };
  creation_timestamp: number;
  buyer_email?: string;
  [key: string]: unknown;
}

// Generic API Response Types
export interface ApiResponse {
  ok: boolean;
  status?: number;
  statusText?: string;
  headers?: Headers;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

// Type Guards for API Responses
export function isAmazonTokenResponse(data: unknown): data is AmazonTokenResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as AmazonTokenResponse).access_token === "string"
  );
}

export function isChargebeeSubscriptionResponse(
  data: unknown
): data is ChargebeeSubscriptionResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as ChargebeeSubscriptionResponse).list)
  );
}

export function isChargebeeInvoiceResponse(data: unknown): data is ChargebeeInvoiceResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as ChargebeeInvoiceResponse).list)
  );
}

export function isEbayTokenResponse(data: unknown): data is EbayTokenResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as EbayTokenResponse).access_token === "string"
  );
}

export function isEtsyTokenResponse(data: unknown): data is EtsyTokenResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as EtsyTokenResponse).access_token === "string"
  );
}

export function isEbayPayoutsResponse(data: unknown): data is EbayPayoutsResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as EbayPayoutsResponse).payouts)
  );
}

export function isEbayTransactionsResponse(data: unknown): data is EbayTransactionsResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as EbayTransactionsResponse).transactions)
  );
}

export function isEtsyShopsResponse(data: unknown): data is EtsyShopsResponse {
  return (
    typeof data === "object" && data !== null && Array.isArray((data as EtsyShopsResponse).results)
  );
}

export function isEtsyReceiptsResponse(data: unknown): data is EtsyReceiptsResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as EtsyReceiptsResponse).results)
  );
}

// Error Type Guards
export function isEbayError(data: unknown): data is EbayError {
  return (
    typeof data === "object" &&
    data !== null &&
    (typeof (data as EbayError).error === "string" ||
      typeof (data as EbayError).error_description === "string")
  );
}

export function isEtsyError(data: unknown): data is EtsyError {
  return (
    typeof data === "object" &&
    data !== null &&
    (typeof (data as EtsyError).error === "string" ||
      typeof (data as EtsyError).error_description === "string")
  );
}

// Validation helpers
export function validateRequiredFields(obj: unknown, fields: string[]): boolean {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const record = obj as Record<string, unknown>;
  return fields.every((field) => field in record && record[field] !== undefined);
}

export function extractStringField(obj: unknown, field: string): string | null {
  if (typeof obj !== "object" || obj === null) {
    return null;
  }

  const value = (obj as Record<string, unknown>)[field];
  return typeof value === "string" ? value : null;
}

export function extractNumberField(obj: unknown, field: string): number | null {
  if (typeof obj !== "object" || obj === null) {
    return null;
  }

  const value = (obj as Record<string, unknown>)[field];
  return typeof value === "number" ? value : null;
}
