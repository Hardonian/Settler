package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.SettlerException;
import io.settler.http.HttpExecutor;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Client for reconciliation run operations.
 */
public class RunsClient {
    private final HttpExecutor http;

    public RunsClient(HttpExecutor http) {
        this.http = http;
    }

    public JsonNode list(Integer page, Integer limit, String status) throws SettlerException {
        Map<String, String> params = new LinkedHashMap<>();
        if (page != null) params.put("page", page.toString());
        if (limit != null) params.put("limit", limit.toString());
        if (status != null) params.put("status", status);
        return http.get("/runs", params);
    }

    public JsonNode get(String runId) throws SettlerException {
        return http.get("/runs/" + runId, null);
    }

    public JsonNode create(String jobId) throws SettlerException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("jobId", jobId);
        return http.post("/runs", body);
    }

    public JsonNode getProofpack(String runId) throws SettlerException {
        return http.get("/runs/" + runId + "/proofpack", null);
    }

    public JsonNode getDelta(String runId) throws SettlerException {
        return http.get("/runs/" + runId + "/delta", null);
    }

    public JsonNode recordAdjudication(String runId, String exceptionId, String resolution, String resolutionReason) throws SettlerException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("exceptionId", exceptionId);
        body.put("resolution", resolution);
        if (resolutionReason != null) {
            body.put("resolutionReason", resolutionReason);
        }
        return http.post("/runs/" + runId + "/adjudications", body);
    }
}
