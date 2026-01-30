package io.settler.clients;

import io.settler.SettlerConfig;
import io.settler.exceptions.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Client for interacting with the Webhooks API.
 */
public class WebhooksClient {
    private static final Logger logger = LoggerFactory.getLogger(WebhooksClient.class);
    private static final String BASE_PATH = "/webhooks/receive";

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final SettlerConfig config;

    public WebhooksClient(OkHttpClient httpClient, ObjectMapper objectMapper, SettlerConfig config) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.config = config;
    }

    /**
     * Receives a webhook from a payment provider.
     *
     * @param adapter the payment provider adapter (stripe, paypal, square)
     * @param payload the webhook payload
     * @return the processing result
     * @throws SettlerException if the request fails
     */
    public WebhookResult receive(String adapter, Map<String, Object> payload) throws SettlerException {
        validateAdapter(adapter);
        
        HttpUrl url = HttpUrl.parse(config.getBaseUrl() + BASE_PATH + "/" + adapter);
        
        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(payload);
        } catch (IOException e) {
            throw new ValidationException("Failed to serialize webhook payload: " + e.getMessage());
        }

        RequestBody body = RequestBody.create(
            MediaType.parse("application/json"),
            jsonBody
        );

        Request.Builder requestBuilder = new Request.Builder()
                .url(url)
                .post(body)
                .header("Accept", "application/json")
                .header("Content-Type", "application/json");

        if (config.getApiKey() != null) {
            requestBuilder.header("X-API-Key", config.getApiKey());
        } else if (config.getBearerToken() != null) {
            requestBuilder.header("Authorization", "Bearer " + config.getBearerToken());
        }

        try (Response response = httpClient.newCall(requestBuilder.build()).execute()) {
            handleErrorResponse(response);
            
            String responseBody = response.body().string();
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode data = root.get("data");
            
            WebhookResult result = new WebhookResult();
            result.setProcessed(data.get("processed").asBoolean());
            
            if (data.has("events")) {
                result.setEvents(objectMapper.readValue(
                    data.get("events").toString(),
                    new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {}
                ));
            }
            
            return result;
        } catch (IOException e) {
            logger.error("Network error while receiving webhook", e);
            throw new NetworkException("Failed to receive webhook: " + e.getMessage(), e);
        }
    }

    /**
     * Receives a Stripe webhook.
     *
     * @param payload the webhook payload
     * @return the processing result
     * @throws SettlerException if the request fails
     */
    public WebhookResult receiveStripe(Map<String, Object> payload) throws SettlerException {
        return receive("stripe", payload);
    }

    /**
     * Receives a PayPal webhook.
     *
     * @param payload the webhook payload
     * @return the processing result
     * @throws SettlerException if the request fails
     */
    public WebhookResult receivePayPal(Map<String, Object> payload) throws SettlerException {
        return receive("paypal", payload);
    }

    /**
     * Receives a Square webhook.
     *
     * @param payload the webhook payload
     * @return the processing result
     * @throws SettlerException if the request fails
     */
    public WebhookResult receiveSquare(Map<String, Object> payload) throws SettlerException {
        return receive("square", payload);
    }

    private void validateAdapter(String adapter) throws ValidationException {
        if (adapter == null || adapter.isEmpty()) {
            throw new ValidationException("Adapter name is required", "adapter");
        }
        
        List<String> validAdapters = List.of("stripe", "paypal", "square");
        if (!validAdapters.contains(adapter.toLowerCase())) {
            throw new ValidationException(
                "Invalid adapter. Must be one of: stripe, paypal, square", 
                "adapter"
            );
        }
    }

    private void handleErrorResponse(Response response) throws SettlerException {
        if (response.isSuccessful()) {
            return;
        }

        int code = response.code();
        String requestId = response.header("X-Request-ID");
        String message = "Unknown error";

        try {
            String body = response.body() != null ? response.body().string() : "";
            if (!body.isEmpty()) {
                JsonNode root = objectMapper.readTree(body);
                if (root.has("message")) {
                    message = root.get("message").asText();
                }
            }
        } catch (IOException ignored) {}

        switch (code) {
            case 400:
                throw new ValidationException(message, requestId);
            case 401:
                throw new AuthException(message, requestId);
            case 404:
                throw new NotFoundException("Webhook adapter", null, requestId);
            case 429:
                int retryAfter = 60;
                try {
                    String retryHeader = response.header("Retry-After");
                    if (retryHeader != null) {
                        retryAfter = Integer.parseInt(retryHeader);
                    }
                } catch (NumberFormatException ignored) {}
                throw new RateLimitException(message, retryAfter, requestId);
            case 500:
            case 502:
            case 503:
            case 504:
                throw new ServerException(message, code, requestId);
            default:
                throw new SettlerException(message, code, "unknown_error", requestId);
        }
    }

    /**
     * Represents the result of a webhook processing operation.
     */
    public static class WebhookResult {
        private boolean processed;
        private List<Map<String, Object>> events;

        public boolean isProcessed() {
            return processed;
        }

        public void setProcessed(boolean processed) {
            this.processed = processed;
        }

        public List<Map<String, Object>> getEvents() {
            return events;
        }

        public void setEvents(List<Map<String, Object>> events) {
            this.events = events;
        }

        @Override
        public String toString() {
            return "WebhookResult{" +
                    "processed=" + processed +
                    ", events=" + (events != null ? events.size() : 0) +
                    '}';
        }
    }
}
