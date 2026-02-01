"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeesClient = void 0;
/**
 * Client for fee visibility and reporting.
 */
class FeesClient {
    client;
    constructor(client) {
        this.client = client;
    }
    async list(params = {}) {
        const query = {};
        if (params.transactionId)
            query.transactionId = params.transactionId;
        if (params.settlementId)
            query.settlementId = params.settlementId;
        if (params.type)
            query.type = params.type;
        return this.client.request("GET", "/api/v1/fees", { query });
    }
    async getEffectiveRate(params = {}) {
        const query = {};
        if (params.transactionId)
            query.transactionId = params.transactionId;
        if (params.provider)
            query.provider = params.provider;
        if (params.startDate)
            query.startDate = params.startDate;
        if (params.endDate)
            query.endDate = params.endDate;
        return this.client.request("GET", "/api/v1/fees/effective-rate", { query });
    }
}
exports.FeesClient = FeesClient;
//# sourceMappingURL=fees.js.map