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
export class TransactionsClient {
  constructor(private readonly client: SettlerClient) {}

  /**
   * List transactions with optional filtering and pagination.
   */
  async list(params: ListTransactionsParams = {}): Promise<TransactionListResponse> {
    const query: Record<string, string> = {};
    if (params.page !== undefined) query.page = String(params.page);
    if (params.limit !== undefined) query.limit = String(params.limit);
    if (params.provider) query.provider = params.provider;
    if (params.status) query.status = params.status;
    if (params.type) query.type = params.type;
    if (params.paymentId) query.paymentId = params.paymentId;
    if (params.startDate) query.startDate = params.startDate;
    if (params.endDate) query.endDate = params.endDate;

    return this.client.request<TransactionListResponse>("GET", "/api/v1/transactions", { query });
  }

  /**
   * Get a single transaction by ID.
   */
  async get(id: string): Promise<TransactionResponse> {
    return this.client.request<TransactionResponse>(
      "GET",
      `/api/v1/transactions/${encodeURIComponent(id)}`
    );
  }
}
