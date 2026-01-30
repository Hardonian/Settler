package io.settler.clients;

import io.settler.SettlerConfig;
import io.settler.exceptions.*;
import io.settler.models.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Client for interacting with the Settlements API.
 */
public class SettlementsClient {
    private static final Logger logger = LoggerFactory.getLogger(SettlementsClient.class);
    private static final String BASE_PATH = "/settlements";

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final SettlerConfig config;

    public SettlementsClient(OkHttpClient httpClient, ObjectMapper objectMapper, SettlerConfig config) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.config = config;
    }

    /**
     * Lists settlements with optional filtering and pagination.
     *
     * @param page the page number (1-based)
     * @param limit the number of items per page
     * @param filters optional filter parameters
     * @return a paginated list of settlements
     * @throws SettlerException if the request fails
     */
    public PaginatedResult<Settlement> list(int page, int limit, Map<String, String> filters) throws SettlerException {
        HttpUrl.Builder urlBuilder = HttpUrl.parse(config.getBaseUrl() + BASE_PATH).newBuilder()
                .addQueryParameter("page", String.valueOf(page))
                .addQueryParameter("limit", String.valueOf(limit));

        if (filters != null) {
            filters.forEach((key, value) -> {
                if (value != null && !value.isEmpty()) {
                    urlBuilder.addQueryParameter(key, value);
                }
            });
        }

        Request request = buildRequest(urlBuilder.build());
        return executeListRequest(request);
    }

    /**
     * Lists settlements with default pagination.
     *
     * @return a paginated list of settlements
     * @throws SettlerException if the request fails
     */
    public PaginatedResult<Settlement> list() throws SettlerException {
        return list(1, 100, null);
    }

    /**
     * Gets a settlement by its ID.
     *
     * @param id the settlement ID
     * @return the settlement
     * @throws NotFoundException if the settlement doesn't exist
     * @throws SettlerException if the request fails
     */
    public Settlement get(UUID id) throws SettlerException {
        HttpUrl url = HttpUrl.parse(config.getBaseUrl() + BASE_PATH + "/" + id);
        Request request = buildRequest(url);
        return executeSingleRequest(request);
    }

    /**
     * Lists settlements for a specific provider.
     *
     * @param provider the provider name (e.g., "stripe", "paypal")
     * @param page the page number
     * @param limit the number of items per page
     * @return a paginated list of settlements
     * @throws SettlerException if the request fails
     */
    public PaginatedResult<Settlement> listByProvider(String provider, int page, int limit) throws SettlerException {
        Map<String, String> filters = new HashMap<>();
        filters.put("provider", provider);
        return list(page, limit, filters);
    }

    /**
     * Lists settlements by status.
     *
     * @param status the settlement status (pending, completed, failed)
     * @param page the page number
     * @param limit the number of items per page
     * @return a paginated list of settlements
     * @throws SettlerException if the request fails
     */
    public PaginatedResult<Settlement> listByStatus(String status, int page, int limit) throws SettlerException {
        Map<String, String> filters = new HashMap<>();
        filters.put("status", status);
        return list(page, limit, filters);
    }

    /**
     * Lists settlements within a date range.
     *
     * @param startDate the start date
     * @param endDate the end date
     * @param page the page number
     * @param limit the number of items per page
     * @return a paginated list of settlements
     * @throws SettlerException if the request fails
     */
    public PaginatedResult<Settlement> listByDateRange(Instant startDate, Instant endDate, int page, int limit) throws SettlerException {
        Map<String, String> filters = new HashMap<>();
        if (startDate != null) {
            filters.put("startDate", startDate.toString());
        }
        if (endDate != null) {
            filters.put("endDate", endDate.toString());
        }
        return list(page, limit, filters);
    }

    /**
     * Lists pending settlements.
     *
     * @param page the page number
     * @param limit the number of items per page
     * @return a paginated list of pending settlements
     * @throws SettlerException if the request fails
     */
    public PaginatedResult<Settlement> listPending(int page, int limit) throws SettlerException {
        return listByStatus("pending", page, limit);
    }

    /**
     * Lists completed settlements.
     *
     * @param page the page number
     * @param limit the number of items per page
     * @return a paginated list of completed settlements
     * @throws SettlerException if the request fails
     */
    public PaginatedResult<Settlement> listCompleted(int page, int limit) throws SettlerException {
        return listByStatus("completed", page, limit);
    }

    private Request buildRequest(HttpUrl url) {
        Request.Builder builder = new Request.Builder()
                .url(url)
                .header("Accept", "application/json");

        if (config.getApiKey() != null) {
            builder.header("X-API-Key", config.getApiKey());
        } else if (config.getBearerToken() != null) {
            builder.header("Authorization", "Bearer " + config.getBearerToken());
        }

        return builder.build();
    }

    private PaginatedResult<Settlement> executeListRequest(Request request) throws SettlerException {
        try (Response response = httpClient.newCall(request).execute()) {
            handleErrorResponse(response);
            
            String body = response.body().string();
            JsonNode root = objectMapper.readTree(body);
            
            List<Settlement> data = objectMapper.readValue(
                root.get("data").toString(),
                new TypeReference<List<Settlement>>() {}
            );
            
            Pagination pagination = objectMapper.treeToValue(root.get("pagination"), Pagination.class);
            
            return new PaginatedResult<>(data, pagination);
        } catch (IOException e) {
            logger.error("Network error while listing settlements", e);
            throw new NetworkException("Failed to list settlements: " + e.getMessage(), e);
        }
    }

    private Settlement executeSingleRequest(Request request) throws SettlerException {
        try (Response response = httpClient.newCall(request).execute()) {
            handleErrorResponse(response);
            
            String body = response.body().string();
            JsonNode root = objectMapper.readTree(body);
            
            return objectMapper.treeToValue(root.get("data"), Settlement.class);
        } catch (IOException e) {
            logger.error("Network error while getting settlement", e);
            throw new NetworkException("Failed to get settlement: " + e.getMessage(), e);
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
                throw new NotFoundException("Settlement", null, requestId);
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
}
