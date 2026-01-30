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
 * Client for interacting with the Transactions API.
 */
public class TransactionsClient {
    private static final Logger logger = LoggerFactory.getLogger(TransactionsClient.class);
    private static final String BASE_PATH = "/transactions";

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final SettlerConfig config;

    public TransactionsClient(OkHttpClient httpClient, ObjectMapper objectMapper, SettlerConfig config) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.config = config;
    }

    /**
     * Lists transactions with optional filtering and pagination.
     *
     * @param page the page number (1-based)
     * @param limit the number of items per page
     * @param filters optional filter parameters
     * @return a paginated list of transactions
     * @throws SettlerException if the request fails
     */
    public PaginatedResult<Transaction> list(int page, int limit, Map<String, String> filters) throws SettlerException {
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
     * Lists transactions with default pagination.
     *
     * @return a paginated list of transactions
     * @throws SettlerException if the request fails
     */
    public PaginatedResult<Transaction> list() throws SettlerException {
        return list(1, 100, null);
    }

    /**
     * Gets a transaction by its ID.
     *
     * @param id the transaction ID
     * @return the transaction
     * @throws NotFoundException if the transaction doesn't exist
     * @throws SettlerException if the request fails
     */
    public Transaction get(UUID id) throws SettlerException {
        HttpUrl url = HttpUrl.parse(config.getBaseUrl() + BASE_PATH + "/" + id);
        Request request = buildRequest(url);
        return executeSingleRequest(request);
    }

    /**
     * Lists transactions for a specific payment.
     *
     * @param paymentId the payment ID
     * @param page the page number
     * @param limit the number of items per page
     * @return a paginated list of transactions
     * @throws SettlerException if the request fails
     */
    public PaginatedResult<Transaction> listByPayment(UUID paymentId, int page, int limit) throws SettlerException {
        Map<String, String> filters = new HashMap<>();
        filters.put("paymentId", paymentId.toString());
        return list(page, limit, filters);
    }

    /**
     * Lists transactions for a specific provider.
     *
     * @param provider the provider name (e.g., "stripe", "paypal")
     * @param page the page number
     * @param limit the number of items per page
     * @return a paginated list of transactions
     * @throws SettlerException if the request fails
     */
    public PaginatedResult<Transaction> listByProvider(String provider, int page, int limit) throws SettlerException {
        Map<String, String> filters = new HashMap<>();
        filters.put("provider", provider);
        return list(page, limit, filters);
    }

    /**
     * Lists transactions within a date range.
     *
     * @param startDate the start date
     * @param endDate the end date
     * @param page the page number
     * @param limit the number of items per page
     * @return a paginated list of transactions
     * @throws SettlerException if the request fails
     */
    public PaginatedResult<Transaction> listByDateRange(Instant startDate, Instant endDate, int page, int limit) throws SettlerException {
        Map<String, String> filters = new HashMap<>();
        if (startDate != null) {
            filters.put("startDate", startDate.toString());
        }
        if (endDate != null) {
            filters.put("endDate", endDate.toString());
        }
        return list(page, limit, filters);
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

    private PaginatedResult<Transaction> executeListRequest(Request request) throws SettlerException {
        try (Response response = httpClient.newCall(request).execute()) {
            handleErrorResponse(response);
            
            String body = response.body().string();
            JsonNode root = objectMapper.readTree(body);
            
            List<Transaction> data = objectMapper.readValue(
                root.get("data").toString(),
                new TypeReference<List<Transaction>>() {}
            );
            
            Pagination pagination = objectMapper.treeToValue(root.get("pagination"), Pagination.class);
            
            return new PaginatedResult<>(data, pagination);
        } catch (IOException e) {
            logger.error("Network error while listing transactions", e);
            throw new NetworkException("Failed to list transactions: " + e.getMessage(), e);
        }
    }

    private Transaction executeSingleRequest(Request request) throws SettlerException {
        try (Response response = httpClient.newCall(request).execute()) {
            handleErrorResponse(response);
            
            String body = response.body().string();
            JsonNode root = objectMapper.readTree(body);
            
            return objectMapper.treeToValue(root.get("data"), Transaction.class);
        } catch (IOException e) {
            logger.error("Network error while getting transaction", e);
            throw new NetworkException("Failed to get transaction: " + e.getMessage(), e);
        }
    }

    private void handleErrorResponse(Response response) throws SettlerException {
        if (response.isSuccessful()) {
            return;
        }

        int code = response.code();
        String requestId = response.header("X-Request-ID");
        String body;
        String error = "unknown_error";
        String message = "Unknown error";

        try {
            body = response.body() != null ? response.body().string() : "";
            if (!body.isEmpty()) {
                JsonNode root = objectMapper.readTree(body);
                if (root.has("error")) {
                    error = root.get("error").asText();
                }
                if (root.has("message")) {
                    message = root.get("message").asText();
                }
            }
        } catch (IOException e) {
            body = "";
        }

        switch (code) {
            case 400:
                throw new ValidationException(message, requestId);
            case 401:
                throw new AuthException(message, requestId);
            case 404:
                throw new NotFoundException("Transaction", null, requestId);
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
                throw new SettlerException(message, code, error, requestId);
        }
    }
}
