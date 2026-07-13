package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.*;
import io.settler.http.HttpExecutor;

/**
 * Client for reconciliation report operations.
 *
 * <pre>{@code
 * SettlerClient client = SettlerClient.create("sk_test");
 * JsonNode report = client.reports().get("job_123");
 * JsonNode unmatched = client.reports().getUnmatched("job_123");
 * }</pre>
 */
public class ReportsClient {
    private final HttpExecutor http;

    /**
     * Creates a ReportsClient with a shared HttpExecutor.
     *
     * @param http the shared HTTP executor
     */
    public ReportsClient(HttpExecutor http) {
        this.http = http;
    }

    /**
     * @deprecated Use {@link #ReportsClient(HttpExecutor)} via SettlerClient instead.
     */
    @Deprecated
    public ReportsClient(String baseUrl, String apiKey) {
        this(new HttpExecutor(
            io.settler.SettlerConfig.builder().apiKey(apiKey).baseUrl(baseUrl).build()
        ));
    }

    /**
     * Get a reconciliation report for a job.
     *
     * @param jobId the job ID
     * @return the report data
     * @throws SettlerException if the request fails
     */
    public JsonNode get(String jobId) throws SettlerException {
        return http.get("/reports/" + jobId, null);
    }

    /**
     * Get unmatched transactions for a job.
     *
     * @param jobId the job ID
     * @return unmatched transaction data
     * @throws SettlerException if the request fails
     */
    public JsonNode getUnmatched(String jobId) throws SettlerException {
        return http.get("/reports/" + jobId + "/unmatched", null);
    }
}
