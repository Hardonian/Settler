import { SettlerClient } from "../client";
/** Filter parameters for listing transactions */
export interface ListTransactionsParams {
    page?: number;
    limit?: number;
    provider?: "stripe" | "paypal" | "square" | "bank";
    status?: "pending" | "succeeded" | "failed" | "refunded" | "disputed";
    type?: "authorization" | "capture" | "refund" | "chargeback" | "adjustment";
    paymentId?: string;
    startDate?: string;
    endDate?: string;
}
/** Monetary amount with currency */
export interface Money {
    value: number;
    currency: string;
}
/** Pagination metadata */
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
/** A transaction record */
export interface Transaction {
    id: string;
    tenantId: string;
    paymentId: string;
    provider: string;
    providerTransactionId: string;
    type: string;
    amount: Money;
    netAmount: Money;
    status: string;
    rawPayload?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}
/** Paginated list of transactions */
export interface TransactionListResponse {
    data: Transaction[];
    pagination: PaginationInfo;
}
/** Single transaction response */
export interface TransactionResponse {
    data: Transaction;
}
/**
 * Client for transaction operations.
 *
 * @example
 * ```typescript
 * const result = await client.transactions.list({ provider: "stripe", limit: 50 });
 * const tx = await client.transactions.get("tx-uuid");
 * ```
 */
export declare class TransactionsClient {
    private readonly client;
    constructor(client: SettlerClient);
    /**
     * List transactions with optional filtering and pagination.
     */
    list(params?: ListTransactionsParams): Promise<TransactionListResponse>;
    /**
     * Get a single transaction by ID.
     */
    get(id: string): Promise<TransactionResponse>;
}
//# sourceMappingURL=transactions.d.ts.map