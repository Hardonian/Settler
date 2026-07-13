package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.*;
import io.settler.http.HttpExecutor;

import java.util.*;

/**
 * Client for data export operations.
 */
public class ExportsClient {
    private static final String BASE_PATH = "/exports";

    private final HttpExecutor http;

    public ExportsClient(HttpExecutor http) {
        this.http = http;
    }

    /**
     * Creates an export of reconciled data.
     *
     * @param jobId     the reconciliation job ID
     * @param format    export format (quickbooks, csv, json)
     * @param dateRange date range with "start" and "end" keys
     * @param options   optional export options
     * @return the export result
     * @throws SettlerException if the request fails
     */
    public JsonNode create(String jobId, String format, Map<String, String> dateRange, Map<String, Object> options) throws SettlerException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("jobId", jobId);
        body.put("format", format);
        body.put("dateRange", dateRange);
        if (options != null) {
            body.put("options", options);
        }
        return http.post(BASE_PATH, body);
    }

    /**
     * Gets an export by ID.
     *
     * @param exportId the export ID
     * @return the export details
     * @throws SettlerException if the request fails
     */
    public JsonNode get(String exportId) throws SettlerException {
        return http.get(BASE_PATH + "/" + exportId, null);
    }

    /**
     * Lists exports.
     *
     * @param page  page number (nullable)
     * @param limit items per page (nullable)
     * @return the exports list
     * @throws SettlerException if the request fails
     */
    public JsonNode list(Integer page, Integer limit) throws SettlerException {
        Map<String, String> params = new LinkedHashMap<>();
        if (page != null) params.put("page", page.toString());
        if (limit != null) params.put("limit", limit.toString());
        return http.get(BASE_PATH, params);
    }
}
