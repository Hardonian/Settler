"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsClient = void 0;
/**
 * Client for transaction operations.
 *
 * @example
 * ```typescript
 * const result = await client.transactions.list({ provider: "stripe", limit: 50 });
 * const tx = await client.transactions.get("tx-uuid");
 * ```
 */
class TransactionsClient {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * List transactions with optional filtering and pagination.
     */
    async list(params = {}) {
        const query = {};
        if (params.page !== undefined)
            query.page = String(params.page);
        if (params.limit !== undefined)
            query.limit = String(params.limit);
        if (params.provider)
            query.provider = params.provider;
        if (params.status)
            query.status = params.status;
        if (params.type)
            query.type = params.type;
        if (params.paymentId)
            query.paymentId = params.paymentId;
        if (params.startDate)
            query.startDate = params.startDate;
        if (params.endDate)
            query.endDate = params.endDate;
        return this.client.request("GET", "/api/v1/transactions", { query });
    }
    /**
     * Get a single transaction by ID.
     */
    async get(id) {
        return this.client.request("GET", `/api/v1/transactions/${encodeURIComponent(id)}`);
    }
}
exports.TransactionsClient = TransactionsClient;
//# sourceMappingURL=transactions.js.map