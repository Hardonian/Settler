package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.settler.exceptions.*;
import okhttp3.*;

import java.io.IOException;

/**
 * Client for reconciliation report operations.
 */
public class ReportsClient {
    private final String baseUrl;
    private final String apiKey;
    private final OkHttpClient httpClient;
    private final ObjectMapper mapper;

    public ReportsClient(String baseUrl, String apiKey) {
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
     * Get a reconciliation report for a job.
     */
    public JsonNode get(String jobId) throws IOException {
        Request request = buildRequest("GET", "/reports/" + jobId);
        return executeRequest(request);
    }

    /**
     * Get unmatched transactions for a job.
     */
    public JsonNode getUnmatched(String jobId) throws IOException {
        Request request = buildRequest("GET", "/reports/" + jobId + "/unmatched");
        return executeRequest(request);
    }

    private Request buildRequest(String method, String path) {
        HttpUrl url = HttpUrl.parse(baseUrl + path);

        Request.Builder builder = new Request.Builder()
                .url(url)
                .header("Content-Type", "application/json")
                .header("User-Agent", "settler-java/1.0.0");

        if (apiKey.startsWith("rk_") || apiKey.startsWith("sk_")) {
            builder.header("X-API-Key", apiKey);
        } else {
            builder.header("Authorization", "Bearer " + apiKey);
        }

        builder.method(method, null);
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
