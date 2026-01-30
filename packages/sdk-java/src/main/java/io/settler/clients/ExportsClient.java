package io.settler.clients;

import io.settler.SettlerConfig;
import io.settler.exceptions.*;
import io.settler.models.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

/**
 * Client for interacting with the Exports API.
 */
public class ExportsClient {
    private static final Logger logger = LoggerFactory.getLogger(ExportsClient.class);
    private static final String BASE_PATH = "/exports";

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final SettlerConfig config;

    public ExportsClient(OkHttpClient httpClient, ObjectMapper objectMapper, SettlerConfig config) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.config = config;
    }

    /**
     * Creates an export in the specified format.
     *
     * @param request the export request parameters
     * @return the export result
     * @throws SettlerException if the request fails
     */
    public ExportResult createExport(ExportRequest request) throws SettlerException {
        return createExport(request, false);
    }

    /**
     * Creates an export in the specified format.
     *
     * @param request the export request parameters
     * @param returnRawCsv if true, returns raw CSV content as string in ExportResult
     * @return the export result
     * @throws SettlerException if the request fails
     */
    public ExportResult createExport(ExportRequest request, boolean returnRawCsv) throws SettlerException {
        HttpUrl url = HttpUrl.parse(config.getBaseUrl() + BASE_PATH);
        
        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(request);
        } catch (IOException e) {
            throw new ValidationException("Failed to serialize export request: " + e.getMessage());
        }

        RequestBody body = RequestBody.create(
            MediaType.parse("application/json"),
            jsonBody
        );

        MediaType acceptType = returnRawCsv && request.getFormat() == ExportRequest.Format.CSV
            ? MediaType.parse("text/csv")
            : MediaType.parse("application/json");

        Request.Builder requestBuilder = new Request.Builder()
                .url(url)
                .post(body)
                .header("Accept", acceptType.toString())
                .header("Content-Type", "application/json");

        if (config.getApiKey() != null) {
            requestBuilder.header("X-API-Key", config.getApiKey());
        } else if (config.getBearerToken() != null) {
            requestBuilder.header("Authorization", "Bearer " + config.getBearerToken());
        }

        try (Response response = httpClient.newCall(requestBuilder.build()).execute()) {
            handleErrorResponse(response);
            
            String responseBody = response.body().string();
            
            // Handle CSV response
            if (response.header("Content-Type") != null && 
                response.header("Content-Type").contains("text/csv")) {
                ExportResult result = new ExportResult();
                result.setMatches(null); // CSV doesn't have structured matches
                return result;
            }
            
            // Handle JSON response
            JsonNode root = objectMapper.readTree(responseBody);
            return objectMapper.treeToValue(root, ExportResult.class);
        } catch (IOException e) {
            logger.error("Network error while creating export", e);
            throw new NetworkException("Failed to create export: " + e.getMessage(), e);
        }
    }

    /**
     * Creates a QuickBooks format export.
     *
     * @param jobId the reconciliation job ID
     * @param dateRange the date range for the export
     * @return the export result
     * @throws SettlerException if the request fails
     */
    public ExportResult createQuickBooksExport(java.util.UUID jobId, ExportRequest.DateRange dateRange) throws SettlerException {
        ExportRequest request = new ExportRequest();
        request.setJobId(jobId);
        request.setFormat(ExportRequest.Format.QUICKBOOKS);
        request.setDateRange(dateRange);
        return createExport(request);
    }

    /**
     * Creates a CSV format export.
     *
     * @param jobId the reconciliation job ID
     * @param dateRange the date range for the export
     * @return the export result
     * @throws SettlerException if the request fails
     */
    public ExportResult createCsvExport(java.util.UUID jobId, ExportRequest.DateRange dateRange) throws SettlerException {
        ExportRequest request = new ExportRequest();
        request.setJobId(jobId);
        request.setFormat(ExportRequest.Format.CSV);
        request.setDateRange(dateRange);
        return createExport(request);
    }

    /**
     * Creates a JSON format export.
     *
     * @param jobId the reconciliation job ID
     * @param dateRange the date range for the export
     * @return the export result
     * @throws SettlerException if the request fails
     */
    public ExportResult createJsonExport(java.util.UUID jobId, ExportRequest.DateRange dateRange) throws SettlerException {
        ExportRequest request = new ExportRequest();
        request.setJobId(jobId);
        request.setFormat(ExportRequest.Format.JSON);
        request.setDateRange(dateRange);
        return createExport(request);
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
                throw new NotFoundException("Export", null, requestId);
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
