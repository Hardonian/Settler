"use strict";
/**
 * Console Client
 *
 * Client for managing Console resources (API keys, usage, activities)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleClient = void 0;
/**
 * Console Client for managing Console resources
 */
class ConsoleClient {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * List all API keys
     */
    async listApiKeys() {
        const data = await this.client.request("GET", "/api/console/api-keys");
        return {
            data: data.keys || [],
            count: data.keys?.length || 0,
        };
    }
    /**
     * Create a new API key
     */
    async createApiKey(request) {
        return this.client.request("POST", "/api/console/api-keys", { body: request });
    }
    /**
     * Revoke an API key
     */
    async revokeApiKey(keyId) {
        await this.client.request("DELETE", `/api/console/api-keys/${keyId}`);
    }
    /**
     * Get usage statistics
     */
    async getUsage(days = 7) {
        return this.client.request("GET", "/api/console/usage", {
            query: { days: days.toString() },
        });
    }
    /**
     * List receipts
     * @param limit - Maximum number of receipts to return (currently not used by API)
     */
    async listReceipts(_limit = 50) {
        const data = await this.client.request("GET", "/api/console/receipts");
        return {
            data: data.receipts || [],
            count: data.receipts?.length || 0,
        };
    }
    /**
     * Get receipt detail
     */
    async getReceipt(receiptId) {
        const data = await this.client.request("GET", `/api/console/receipts/${receiptId}`);
        return data.receipt;
    }
    /**
     * List feature flags
     */
    async listFeatureFlags() {
        const data = await this.client.request("GET", "/api/console/feature-flags");
        return {
            data: data.flags || [],
            count: data.flags?.length || 0,
        };
    }
    /**
     * Get recent activities
     * @param limit - Maximum number of activities to return (currently not used by API)
     */
    async getActivities(_limit = 10) {
        const data = await this.client.request("GET", "/api/console/activities");
        return data.activities || [];
    }
    /**
     * Check Console health
     */
    async health() {
        return this.client.request("GET", "/api/health/console");
    }
}
exports.ConsoleClient = ConsoleClient;
//# sourceMappingURL=console.js.map