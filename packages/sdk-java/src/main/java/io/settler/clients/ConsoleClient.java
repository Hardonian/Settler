package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.SettlerException;
import io.settler.http.HttpExecutor;

import java.util.HashMap;
import java.util.Map;

/**
 * Client for managing Console resources (API keys, usage, activities).
 */
public class ConsoleClient {
    private final HttpExecutor executor;

    public ConsoleClient(HttpExecutor executor) {
        this.executor = executor;
    }

    /**
     * List all API keys
     */
    public JsonNode listApiKeys() throws SettlerException {
        return executor.get("/api/console/api-keys");
    }

    /**
     * Create a new API key
     *
     * @param request The API key request configuration
     * @return the created API key
     */
    public JsonNode createApiKey(Map<String, Object> request) throws SettlerException {
        return executor.post("/api/console/api-keys", request);
    }

    /**
     * Revoke an API key
     *
     * @param keyId the API key ID
     */
    public void revokeApiKey(String keyId) throws SettlerException {
        executor.delete("/api/console/api-keys/" + keyId);
    }

    /**
     * Get usage statistics
     *
     * @param days number of days to look back
     * @return usage summary and events
     */
    public JsonNode getUsage(int days) throws SettlerException {
        Map<String, Object> query = new HashMap<>();
        query.put("days", days);
        return executor.get("/api/console/usage", query);
    }

    /**
     * List receipts
     */
    public JsonNode listReceipts() throws SettlerException {
        return executor.get("/api/console/receipts");
    }

    /**
     * Get receipt detail
     *
     * @param receiptId the receipt ID
     */
    public JsonNode getReceipt(String receiptId) throws SettlerException {
        return executor.get("/api/console/receipts/" + receiptId);
    }

    /**
     * List feature flags
     */
    public JsonNode listFeatureFlags() throws SettlerException {
        return executor.get("/api/console/feature-flags");
    }

    /**
     * Get recent activities
     */
    public JsonNode getActivities() throws SettlerException {
        return executor.get("/api/console/activities");
    }

    /**
     * Check Console health
     */
    public JsonNode health() throws SettlerException {
        return executor.get("/api/health/console");
    }
}
