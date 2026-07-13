package io.settler.clients;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.*;
import io.settler.http.HttpExecutor;
import io.settler.models.*;

import java.time.Instant;
import java.util.*;

/**
 * Client for interacting with the Settlements API.
 */
public class SettlementsClient {
    private static final String BASE_PATH = "/settlements";

    private final HttpExecutor http;

    public SettlementsClient(HttpExecutor http) {
        this.http = http;
    }

    public PaginatedResult<Settlement> list(int page, int limit, Map<String, String> filters) throws SettlerException {
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

    public PaginatedResult<Settlement> list() throws SettlerException {
        return list(1, 100, null);
    }

    public Settlement get(UUID id) throws SettlerException {
        JsonNode json = http.get(BASE_PATH + "/" + id, null);
        try {
            JsonNode data = json.has("data") ? json.get("data") : json;
            return http.getObjectMapper().treeToValue(data, Settlement.class);
        } catch (Exception e) {
            throw new NetworkException("Failed to deserialize settlement: " + e.getMessage(), e);
        }
    }

    public PaginatedResult<Settlement> listByProvider(String provider, int page, int limit) throws SettlerException {
        Map<String, String> filters = new HashMap<>();
        filters.put("provider", provider);
        return list(page, limit, filters);
    }

    public PaginatedResult<Settlement> listByStatus(String status, int page, int limit) throws SettlerException {
        Map<String, String> filters = new HashMap<>();
        filters.put("status", status);
        return list(page, limit, filters);
    }

    public PaginatedResult<Settlement> listByDateRange(Instant startDate, Instant endDate, int page, int limit) throws SettlerException {
        Map<String, String> filters = new HashMap<>();
        if (startDate != null) filters.put("startDate", startDate.toString());
        if (endDate != null) filters.put("endDate", endDate.toString());
        return list(page, limit, filters);
    }

    public PaginatedResult<Settlement> listPending(int page, int limit) throws SettlerException {
        return listByStatus("pending", page, limit);
    }

    public PaginatedResult<Settlement> listCompleted(int page, int limit) throws SettlerException {
        return listByStatus("completed", page, limit);
    }

    private PaginatedResult<Settlement> executeListRequest(Map<String, String> params) throws SettlerException {
        JsonNode json = http.get(BASE_PATH, params);
        try {
            List<Settlement> data = http.getObjectMapper().readValue(
                json.get("data").toString(),
                new TypeReference<List<Settlement>>() {}
            );
            Pagination pagination = http.getObjectMapper().treeToValue(json.get("pagination"), Pagination.class);
            return new PaginatedResult<>(data, pagination);
        } catch (Exception e) {
            throw new NetworkException("Failed to deserialize settlement list: " + e.getMessage(), e);
        }
    }
}
