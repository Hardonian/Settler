"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementsClient = void 0;
/**
 * Client for settlement operations.
 */
class SettlementsClient {
    client;
    constructor(client) {
        this.client = client;
    }
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
        if (params.startDate)
            query.startDate = params.startDate;
        if (params.endDate)
            query.endDate = params.endDate;
        return this.client.request("GET", "/api/v1/settlements", { query });
    }
    async get(id) {
        return this.client.request("GET", `/api/v1/settlements/${encodeURIComponent(id)}`);
    }
}
exports.SettlementsClient = SettlementsClient;
//# sourceMappingURL=settlements.js.map