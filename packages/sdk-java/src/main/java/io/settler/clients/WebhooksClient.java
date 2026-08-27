package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.*;
import io.settler.http.HttpExecutor;

import java.util.*;

/**
 * Client for interacting with the Webhooks API.
 *
 * <pre>{@code
 * SettlerClient client = SettlerClient.create("sk_test");
 * JsonNode result = client.webhooks().receive("stripe", payload);
 * }</pre>
 */
public class WebhooksClient {
    private final HttpExecutor http;

    public WebhooksClient(HttpExecutor http) {
        this.http = http;
    }

    /**
     * Receives a webhook from a payment provider.
     *
     * @param adapter the payment provider adapter (stripe, paypal, square)
     * @param payload the webhook payload
     * @return the processing result
     * @throws SettlerException if the request fails
     */
    public JsonNode receive(String adapter, Map<String, Object> payload) throws SettlerException {
        if (adapter == null || adapter.isEmpty()) {
            throw new ValidationException("Adapter name is required", "adapter");
        }
        return http.post("/webhooks/receive/" + adapter, payload);
    }

    /**
     * Receives a Stripe webhook.
     *
     * @param payload the webhook payload
     * @return the processing result
     * @throws SettlerException if the request fails
     */
    public JsonNode receiveStripe(Map<String, Object> payload) throws SettlerException {
        return receive("stripe", payload);
    }

    /**
     * Receives a PayPal webhook.
     *
     * @param payload the webhook payload
     * @return the processing result
     * @throws SettlerException if the request fails
     */
    public JsonNode receivePayPal(Map<String, Object> payload) throws SettlerException {
        return receive("paypal", payload);
    }

    /**
     * Receives a Square webhook.
     *
     * @param payload the webhook payload
     * @return the processing result
     * @throws SettlerException if the request fails
     */
    public JsonNode receiveSquare(Map<String, Object> payload) throws SettlerException {
        return receive("square", payload);
    }

    /**
     * Creates a webhook subscription.
     *
     * @param url    the destination URL for webhook delivery
     * @param events optional list of event types to subscribe to
     * @param secret optional signing secret
     * @return the created webhook
     * @throws SettlerException if the request fails
     */
    public JsonNode create(String url, List<String> events, String secret) throws SettlerException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("url", url);
        if (events != null) body.put("events", events);
        if (secret != null) body.put("secret", secret);
        return http.post("/webhooks", body);
    }

    /**
     * Lists webhook subscriptions.
     *
     * @param cursor optional cursor for pagination
     * @param limit  optional page size
     * @return the webhooks list
     * @throws SettlerException if the request fails
     */
    public JsonNode list(String cursor, Integer limit) throws SettlerException {
        Map<String, String> params = new LinkedHashMap<>();
        if (cursor != null) params.put("cursor", cursor);
        if (limit != null) params.put("limit", limit.toString());
        return http.get("/webhooks", params);
    }

    /**
     * Gets a webhook by ID.
     *
     * @param webhookId the webhook ID
     * @return the webhook details
     * @throws SettlerException if the request fails
     */
    public JsonNode get(String webhookId) throws SettlerException {
        return http.get("/webhooks/" + webhookId, null);
    }

    /**
     * Deletes a webhook by ID.
     *
     * @param webhookId the webhook ID
     * @throws SettlerException if the request fails
     */
    public void delete(String webhookId) throws SettlerException {
        http.delete("/webhooks/" + webhookId);
    }

    /**
     * Tests a webhook endpoint.
     *
     * @param url the URL to test
     * @return the test result
     * @throws SettlerException if the request fails
     */
    public JsonNode test(String url) throws SettlerException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("url", url);
        return http.post("/webhooks/test", body);
    }
}
