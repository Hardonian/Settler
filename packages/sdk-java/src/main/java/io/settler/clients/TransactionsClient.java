package io.settler.clients;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.*;
import io.settler.http.HttpExecutor;
import io.settler.models.*;

import java.time.Instant;
import java.util.*;

/**
 * Client for interacting with the Transactions API.
 *
 * <pre>{@code
 * SettlerClient client = SettlerClient.create("sk_test");
 * PaginatedResult<Transaction> txns = client.transactions().list();
 * Transaction txn = client.transactions().get(UUID.fromString("..."));
 * }</pre>
 */
public class TransactionsClient {
    private static final String BASE_PATH = "/transactions";

    private final HttpExecutor http;

    /**
     * Creates a TransactionsClient with a shared HttpExecutor.
     *
     * @param http the shared HTTP executor
     */
    public TransactionsClient(HttpExecutor http) {
        this.http = http;
    }

    /**
     * Lists transactions with optional filtering and pagination.
     *
     * @param page    the page number (1-based)
     * @param limit   the number of items per page
     * @param filters optional filter parameters
     * @return a paginated list of transactions
     * @throws SettlerException if the request fails
     */
    public PaginatedResult<Transaction> list(int page, int limit, Map<String, String> filters) throws SettlerException {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("page", String.valueOf(page));
        params.put("limit", String.valueOf(limit));
        if (filters != null) {
            filters.forEach((key, value) -> {
                if (value != null && !value.isEmpty()) {
                    params.put(key, value);
                }
            });
        }
        return executeListRequest(params);
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
     * @throws SettlerException if the request fails
     */
    public Transaction get(UUID id) throws SettlerException {
        JsonNode json = http.get(BASE_PATH + "/" + id, null);
        try {
            JsonNode data = json.has("data") ? json.get("data") : json;
            return http.getObjectMapper().treeToValue(data, Transaction.class);
        } catch (Exception e) {
            throw new NetworkException("Failed to deserialize transaction: " + e.getMessage(), e);
        }
    }

    /**
     * Lists transactions for a specific payment.
     *
     * @param paymentId the payment ID
     * @param page      the page number
     * @param limit     the number of items per page
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
     * @param page     the page number
     * @param limit    the number of items per page
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
     * @param endDate   the end date
     * @param page      the page number
     * @param limit     the number of items per page
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

    private PaginatedResult<Transaction> executeListRequest(Map<String, String> params) throws SettlerException {
        JsonNode json = http.get(BASE_PATH, params);
        try {
            List<Transaction> data = http.getObjectMapper().readValue(
                json.get("data").toString(),
                new TypeReference<List<Transaction>>() {}
            );
            Pagination pagination = http.getObjectMapper().treeToValue(json.get("pagination"), Pagination.class);
            return new PaginatedResult<>(data, pagination);
        } catch (Exception e) {
            throw new NetworkException("Failed to deserialize transaction list: " + e.getMessage(), e);
        }
    }
}
