package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.*;
import io.settler.http.HttpExecutor;

import java.util.*;

/**
 * Client for reconciliation job operations.
 *
 * <pre>{@code
 * SettlerClient client = SettlerClient.create("sk_test");
 * JsonNode job = client.jobs().create("stripe", "2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z", null);
 * JsonNode allJobs = client.jobs().list(1, 100, null, null);
 * }</pre>
 */
public class JobsClient {
    private final HttpExecutor http;

    /**
     * Creates a JobsClient with a shared HttpExecutor.
     *
     * @param http the shared HTTP executor
     */
    public JobsClient(HttpExecutor http) {
        this.http = http;
    }

    /**
     * @deprecated Use {@link #JobsClient(HttpExecutor)} via SettlerClient instead.
     */
    @Deprecated
    public JobsClient(String baseUrl, String apiKey) {
        this(new HttpExecutor(
            io.settler.SettlerConfig.builder().apiKey(apiKey).baseUrl(baseUrl).build()
        ));
    }

    /**
     * Create a new reconciliation job.
     *
     * @param provider  Payment provider (stripe, paypal, square, bank)
     * @param startDate Start of date range (ISO 8601)
     * @param endDate   End of date range (ISO 8601)
     * @param options   Optional job options (autoReconcile, notifyOnComplete)
     * @return The created job data
     * @throws SettlerException if the request fails
     */
    public JsonNode create(String provider, String startDate, String endDate, Map<String, Object> options) throws SettlerException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("provider", provider);
        Map<String, String> dateRange = new LinkedHashMap<>();
        dateRange.put("start", startDate);
        dateRange.put("end", endDate);
        body.put("dateRange", dateRange);
        if (options != null) {
            body.put("options", options);
        }
        return http.post("/jobs", body);
    }

    /**
     * List reconciliation jobs with optional filtering.
     *
     * @param page     page number (nullable)
     * @param limit    items per page (nullable)
     * @param status   filter by status (nullable)
     * @param provider filter by provider (nullable)
     * @return paginated job list
     * @throws SettlerException if the request fails
     */
    public JsonNode list(Integer page, Integer limit, String status, String provider) throws SettlerException {
        Map<String, String> params = new LinkedHashMap<>();
        if (page != null) params.put("page", page.toString());
        if (limit != null) params.put("limit", limit.toString());
        if (status != null) params.put("status", status);
        if (provider != null) params.put("provider", provider);
        return http.get("/jobs", params);
    }

    /**
     * Get a reconciliation job by ID.
     *
     * @param jobId the job ID
     * @return the job details
     * @throws SettlerException if the request fails
     */
    public JsonNode get(String jobId) throws SettlerException {
        return http.get("/jobs/" + jobId, null);
    }

    /**
     * Run a reconciliation job.
     *
     * @param jobId the job ID
     * @return the run result
     * @throws SettlerException if the request fails
     */
    public JsonNode run(String jobId) throws SettlerException {
        return http.post("/jobs/" + jobId + "/run");
    }

    /**
     * Delete a reconciliation job.
     *
     * @param jobId the job ID
     * @throws SettlerException if the request fails
     */
    public void delete(String jobId) throws SettlerException {
        http.delete("/jobs/" + jobId);
    }
}
