package io.settler.http;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.settler.SettlerConfig;
import io.settler.exceptions.*;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Closeable;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Centralized HTTP executor for the Settler Java SDK.
 *
 * <p>Consolidates all HTTP concerns that were previously duplicated across 8 client classes:
 * <ul>
 *   <li>Authentication (API key vs Bearer token)</li>
 *   <li>Exponential backoff retry on 502/503/504</li>
 *   <li>Request ID generation ({@code X-Request-ID})</li>
 *   <li>Idempotency key support ({@code Idempotency-Key}) for POST/PUT</li>
 *   <li>Compression negotiation ({@code Accept-Encoding: gzip})</li>
 *   <li>Rate limit header parsing</li>
 *   <li>Unified error handling</li>
 * </ul>
 *
 * <p>Uses a single shared {@link OkHttpClient} and {@link ObjectMapper} instance
 * for connection pooling and minimal memory footprint.
 */
public final class HttpExecutor implements Closeable {
    private static final Logger logger = LoggerFactory.getLogger(HttpExecutor.class);
    private static final MediaType JSON_MEDIA_TYPE = MediaType.parse("application/json");
    private static final List<Integer> RETRYABLE_STATUS_CODES = List.of(502, 503, 504);

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final SettlerConfig config;

    /**
     * Creates a new HttpExecutor with the given configuration.
     *
     * @param config the SDK configuration
     */
    public HttpExecutor(SettlerConfig config) {
        this.config = config;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(config.getTimeout().toMillis(), TimeUnit.MILLISECONDS)
                .readTimeout(config.getTimeout().toMillis(), TimeUnit.MILLISECONDS)
                .writeTimeout(config.getTimeout().toMillis(), TimeUnit.MILLISECONDS)
                .build();
        this.objectMapper = new ObjectMapper();
        this.objectMapper.findAndRegisterModules();
    }

    /**
     * Creates a new HttpExecutor with a custom OkHttpClient (for testing / advanced use).
     *
     * @param config the SDK configuration
     * @param httpClient custom OkHttpClient
     * @param objectMapper custom ObjectMapper
     */
    public HttpExecutor(SettlerConfig config, OkHttpClient httpClient, ObjectMapper objectMapper) {
        this.config = config;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Gets the shared ObjectMapper for deserialization in clients.
     *
     * @return the ObjectMapper instance
     */
    public ObjectMapper getObjectMapper() {
        return objectMapper;
    }

    /**
     * Gets the SDK configuration.
     *
     * @return the configuration
     */
    public SettlerConfig getConfig() {
        return config;
    }

    // ─── GET ─────────────────────────────────────────────────────────

    /**
     * Executes a GET request and returns the raw JSON tree.
     *
     * @param path API path (e.g., "/transactions")
     * @param queryParams optional query parameters
     * @return parsed JSON response
     * @throws SettlerException on API errors
     */
    public JsonNode get(String path, Map<String, String> queryParams) throws SettlerException {
        Request request = buildRequest("GET", path, null, queryParams);
        return executeWithRetry(request);
    }

    /**
     * Executes a GET request and deserializes to a specific type.
     *
     * @param path API path
     * @param queryParams optional query parameters
     * @param typeRef target type reference
     * @param <T> the target type
     * @return deserialized response
     * @throws SettlerException on API errors
     */
    public <T> T get(String path, Map<String, String> queryParams, TypeReference<T> typeRef) throws SettlerException {
        JsonNode json = get(path, queryParams);
        try {
            return objectMapper.convertValue(json, typeRef);
        } catch (Exception e) {
            throw new NetworkException("Failed to deserialize response: " + e.getMessage(), e);
        }
    }

    // ─── POST ────────────────────────────────────────────────────────

    /**
     * Executes a POST request with a JSON body.
     *
     * @param path API path
     * @param body request body (will be serialized to JSON)
     * @return parsed JSON response
     * @throws SettlerException on API errors
     */
    public JsonNode post(String path, Object body) throws SettlerException {
        String jsonBody = serializeBody(body);
        Request request = buildRequest("POST", path, jsonBody, null);
        return executeWithRetry(request);
    }

    /**
     * Executes a POST request with no body.
     *
     * @param path API path
     * @return parsed JSON response
     * @throws SettlerException on API errors
     */
    public JsonNode post(String path) throws SettlerException {
        Request request = buildRequest("POST", path, "", null);
        return executeWithRetry(request);
    }

    // ─── PUT ─────────────────────────────────────────────────────────

    /**
     * Executes a PUT request with a JSON body.
     *
     * @param path API path
     * @param body request body
     * @return parsed JSON response
     * @throws SettlerException on API errors
     */
    public JsonNode put(String path, Object body) throws SettlerException {
        String jsonBody = serializeBody(body);
        Request request = buildRequest("PUT", path, jsonBody, null);
        return executeWithRetry(request);
    }

    // ─── DELETE ──────────────────────────────────────────────────────

    /**
     * Executes a DELETE request.
     *
     * @param path API path
     * @throws SettlerException on API errors
     */
    public void delete(String path) throws SettlerException {
        Request request = buildRequest("DELETE", path, null, null);
        executeWithRetry(request);
    }

    // ─── Internal ────────────────────────────────────────────────────

    private Request buildRequest(String method, String path, String body, Map<String, String> queryParams) {
        HttpUrl.Builder urlBuilder = HttpUrl.parse(config.getBaseUrl() + path).newBuilder();
        if (queryParams != null) {
            queryParams.forEach((key, value) -> {
                if (value != null && !value.isEmpty()) {
                    urlBuilder.addQueryParameter(key, value);
                }
            });
        }

        Request.Builder builder = new Request.Builder()
                .url(urlBuilder.build())
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("Accept-Encoding", "gzip")
                .header("User-Agent", config.getUserAgent())
                .header("X-Request-ID", UUID.randomUUID().toString());

        // Authentication
        if (config.isApiKeyAuth()) {
            builder.header("X-API-Key", config.getAuthCredential());
        } else {
            builder.header("Authorization", "Bearer " + config.getAuthCredential());
        }

        // Idempotency key for write operations
        if ("POST".equals(method) || "PUT".equals(method)) {
            builder.header("Idempotency-Key", UUID.randomUUID().toString());
        }

        // Set HTTP method and body
        RequestBody requestBody = null;
        if (body != null) {
            requestBody = RequestBody.create(body, JSON_MEDIA_TYPE);
        }

        switch (method) {
            case "GET":
                builder.get();
                break;
            case "DELETE":
                builder.delete();
                break;
            case "POST":
                builder.post(requestBody != null ? requestBody : RequestBody.create("", JSON_MEDIA_TYPE));
                break;
            case "PUT":
                builder.put(requestBody != null ? requestBody : RequestBody.create("", JSON_MEDIA_TYPE));
                break;
            default:
                builder.method(method, requestBody);
        }

        return builder.build();
    }

    private JsonNode executeWithRetry(Request request) throws SettlerException {
        int maxAttempts = config.getMaxRetries() + 1;

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            try (Response response = httpClient.newCall(request).execute()) {
                int statusCode = response.code();

                // Retry on transient server errors
                if (RETRYABLE_STATUS_CODES.contains(statusCode) && attempt < maxAttempts - 1) {
                    long backoff = (long) Math.pow(2, attempt) * 1000L;
                    logger.debug("Retrying request to {} after {}ms (attempt {}/{})",
                            request.url(), backoff, attempt + 1, maxAttempts);
                    try {
                        Thread.sleep(backoff);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new NetworkException("Retry interrupted", ie);
                    }
                    continue;
                }

                String responseBody = response.body() != null ? response.body().string() : "";

                if (!response.isSuccessful()) {
                    throw parseError(statusCode, responseBody, response);
                }

                if (responseBody.isEmpty()) {
                    return null;
                }

                return objectMapper.readTree(responseBody);
            } catch (IOException e) {
                if (attempt < maxAttempts - 1) {
                    long backoff = (long) Math.pow(2, attempt) * 1000L;
                    logger.debug("Network error, retrying after {}ms: {}", backoff, e.getMessage());
                    try {
                        Thread.sleep(backoff);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new NetworkException("Retry interrupted", ie);
                    }
                    continue;
                }
                throw new NetworkException("Request failed after " + maxAttempts + " attempts: " + e.getMessage(), e);
            }
        }

        throw new NetworkException("Request failed after " + maxAttempts + " attempts");
    }

    private SettlerException parseError(int code, String body, Response response) {
        String message = "Unknown error";
        String requestId = response.header("X-Request-ID");

        try {
            if (!body.isEmpty()) {
                JsonNode json = objectMapper.readTree(body);
                if (json.has("message")) {
                    message = json.get("message").asText();
                } else if (json.has("error")) {
                    message = json.get("error").asText();
                }
            }
        } catch (Exception ignored) {
            if (!body.isEmpty()) {
                message = body;
            }
        }

        switch (code) {
            case 400:
                return new ValidationException(message, null, requestId);
            case 401:
            case 403:
                return new AuthException(message, requestId);
            case 404:
                return new NotFoundException(message);
            case 429:
                int retryAfter = 60;
                try {
                    String retryHeader = response.header("Retry-After");
                    if (retryHeader != null) {
                        retryAfter = Integer.parseInt(retryHeader);
                    }
                } catch (NumberFormatException ignored) {
                }
                return new RateLimitException(message, retryAfter, requestId);
            default:
                if (code >= 500) {
                    return new ServerException(message, code, requestId);
                }
                return new SettlerException(message, code, "api_error", requestId);
        }
    }

    private String serializeBody(Object body) throws SettlerException {
        try {
            return objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            throw new ValidationException("Failed to serialize request body: " + e.getMessage());
        }
    }

    @Override
    public void close() {
        httpClient.dispatcher().executorService().shutdown();
        httpClient.connectionPool().evictAll();
    }
}
