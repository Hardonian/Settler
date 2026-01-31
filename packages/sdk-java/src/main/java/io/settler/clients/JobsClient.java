package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.settler.exceptions.*;
import okhttp3.*;

import java.io.IOException;
import java.util.*;

/**
 * Client for reconciliation job operations.
 *
 * <pre>{@code
 * JobsClient jobs = new JobsClient(baseUrl, apiKey);
 * JsonNode job = jobs.create("stripe", "2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z", null);
 * List<JsonNode> allJobs = jobs.list(1, 100, null, null);
 * }</pre>
 */
public class JobsClient {
    private final String baseUrl;
    private final String apiKey;
    private final OkHttpClient httpClient;
    private final ObjectMapper mapper;

    public JobsClient(String baseUrl, String apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                .build();
        this.mapper = new ObjectMapper();
        this.mapper.findAndRegisterModules();
    }

    /**
     * Create a new reconciliation job.
     *
     * @param provider  Payment provider (stripe, paypal, square, bank)
     * @param startDate Start of date range (ISO 8601)
     * @param endDate   End of date range (ISO 8601)
     * @param options   Optional job options (autoReconcile, notifyOnComplete)
     * @return The created job data
     */
    public JsonNode create(String provider, String startDate, String endDate, Map<String, Object> options) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("provider", provider);
        Map<String, String> dateRange = new LinkedHashMap<>();
        dateRange.put("start", startDate);
        dateRange.put("end", endDate);
        body.put("dateRange", dateRange);
        if (options != null) {
            body.put("options", options);
        }

        Request request = buildRequest("POST", "/jobs", mapper.writeValueAsString(body), null);
        return executeRequest(request);
    }

    /**
     * List reconciliation jobs with optional filtering.
     */
    public JsonNode list(Integer page, Integer limit, String status, String provider) throws IOException {
        Map<String, String> params = new LinkedHashMap<>();
        if (page != null) params.put("page", page.toString());
        if (limit != null) params.put("limit", limit.toString());
        if (status != null) params.put("status", status);
        if (provider != null) params.put("provider", provider);

        Request request = buildRequest("GET", "/jobs", null, params);
        return executeRequest(request);
    }

    /**
     * Get a reconciliation job by ID.
     */
    public JsonNode get(String jobId) throws IOException {
        Request request = buildRequest("GET", "/jobs/" + jobId, null, null);
        return executeRequest(request);
    }

    /**
     * Run a reconciliation job.
     */
    public JsonNode run(String jobId) throws IOException {
        Request request = buildRequest("POST", "/jobs/" + jobId + "/run", null, null);
        return executeRequest(request);
    }

    /**
     * Delete a reconciliation job.
     */
    public void delete(String jobId) throws IOException {
        Request request = buildRequest("DELETE", "/jobs/" + jobId, null, null);
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                handleError(response);
            }
        }
    }

    private Request buildRequest(String method, String path, String body, Map<String, String> params) {
        HttpUrl.Builder urlBuilder = HttpUrl.parse(baseUrl + path).newBuilder();
        if (params != null) {
            params.forEach(urlBuilder::addQueryParameter);
        }

        Request.Builder builder = new Request.Builder()
                .url(urlBuilder.build())
                .header("Content-Type", "application/json")
                .header("User-Agent", "settler-java/1.0.0");

        if (apiKey.startsWith("rk_") || apiKey.startsWith("sk_")) {
            builder.header("X-API-Key", apiKey);
        } else {
            builder.header("Authorization", "Bearer " + apiKey);
        }

        if (body != null) {
            builder.method(method, RequestBody.create(body, MediaType.parse("application/json")));
        } else if ("POST".equals(method)) {
            builder.method(method, RequestBody.create("", MediaType.parse("application/json")));
        } else if ("DELETE".equals(method)) {
            builder.delete();
        } else {
            builder.method(method, null);
        }

        return builder.build();
    }

    private JsonNode executeRequest(Request request) throws IOException {
        try (Response response = httpClient.newCall(request).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) {
                handleError(response.code(), responseBody);
            }
            return mapper.readTree(responseBody);
        }
    }

    private void handleError(Response response) throws IOException {
        String body = response.body() != null ? response.body().string() : "";
        handleError(response.code(), body);
    }

    private void handleError(int code, String body) throws IOException {
        String message = "Unknown error";
        try {
            JsonNode json = mapper.readTree(body);
            if (json.has("message")) message = json.get("message").asText();
            else if (json.has("error")) message = json.get("error").asText();
        } catch (Exception ignored) {
            message = body.isEmpty() ? message : body;
        }

        switch (code) {
            case 400: throw new ValidationException(message);
            case 401: case 403: throw new AuthException(message);
            case 404: throw new NotFoundException(message);
            case 429: throw new RateLimitException(message);
            default:
                if (code >= 500) throw new ServerException(message);
                throw new SettlerException(message);
        }
    }
}
