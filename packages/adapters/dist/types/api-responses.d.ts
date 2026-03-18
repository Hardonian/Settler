/**
 * API Response Types for External Services
 *
 * Provides TypeScript interfaces for all external API responses to eliminate `any` types
 */
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
export interface ApiResponse {
    ok: boolean;
    status?: number;
    statusText?: string;
    headers?: Headers;
    json(): Promise<unknown>;
    text(): Promise<string>;
}
export declare function isAmazonTokenResponse(data: unknown): data is AmazonTokenResponse;
export declare function isChargebeeSubscriptionResponse(data: unknown): data is ChargebeeSubscriptionResponse;
export declare function isChargebeeInvoiceResponse(data: unknown): data is ChargebeeInvoiceResponse;
export declare function isEbayTokenResponse(data: unknown): data is EbayTokenResponse;
export declare function isEtsyTokenResponse(data: unknown): data is EtsyTokenResponse;
export declare function isEbayPayoutsResponse(data: unknown): data is EbayPayoutsResponse;
export declare function isEbayTransactionsResponse(data: unknown): data is EbayTransactionsResponse;
export declare function isEtsyShopsResponse(data: unknown): data is EtsyShopsResponse;
export declare function isEtsyReceiptsResponse(data: unknown): data is EtsyReceiptsResponse;
export declare function isEbayError(data: unknown): data is EbayError;
export declare function isEtsyError(data: unknown): data is EtsyError;
export declare function validateRequiredFields(obj: unknown, fields: string[]): boolean;
export declare function extractStringField(obj: unknown, field: string): string | null;
export declare function extractNumberField(obj: unknown, field: string): number | null;
//# sourceMappingURL=api-responses.d.ts.map