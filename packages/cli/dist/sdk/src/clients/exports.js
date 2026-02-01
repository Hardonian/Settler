"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportsClient = void 0;
/**
 * Client for data export operations.
 */
class ExportsClient {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Create an export of reconciled data.
     *
     * For CSV format the response is a raw string.
     * For JSON/QuickBooks the response is an ExportResult object.
     */
    async create(request) {
        return this.client.request("POST", "/api/v1/exports", { body: request });
    }
}
exports.ExportsClient = ExportsClient;
//# sourceMappingURL=exports.js.map