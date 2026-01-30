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
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Client for interacting with the Fees API.
 */
public class FeesClient {
    private static final Logger logger = LoggerFactory.getLogger(FeesClient.class);
    private static final String BASE_PATH = "/fees";

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final SettlerConfig config;

    public FeesClient(OkHttpClient httpClient, ObjectMapper objectMapper, SettlerConfig config) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.config = config;
    }

    /**
     * Lists fees with optional filtering.
     *
     * @param filters optional filter parameters (transactionId, settlementId, type)
     * @return a list of fees
     * @throws SettlerException if the request fails
     */
    public List<Fee> list(Map<String, String> filters) throws SettlerException {
        HttpUrl.Builder urlBuilder = HttpUrl.parse(config.getBaseUrl() + BASE_PATH).newBuilder();

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
     * Lists all fees.
     *
     * @return a list of fees
     * @throws SettlerException if the request fails
     */
    public List<Fee> list() throws SettlerException {
        return list(null);
    }

    /**
     * Gets fees for a specific transaction.
     *
     * @param transactionId the transaction ID
     * @return a list of fees
     * @throws SettlerException if the request fails
     */
    public List<Fee> listByTransaction(UUID transactionId) throws SettlerException {
        Map<String, String> filters = new HashMap<>();
        filters.put("transactionId", transactionId.toString());
        return list(filters);
    }

    /**
     * Gets fees for a specific settlement.
     *
     * @param settlementId the settlement ID
     * @return a list of fees
     * @throws SettlerException if the request fails
     */
    public List<Fee> listBySettlement(UUID settlementId) throws SettlerException {
        Map<String, String> filters = new HashMap<>();
        filters.put("settlementId", settlementId.toString());
        return list(filters);
    }

    /**
     * Gets fees by type.
     *
     * @param type the fee type (processing, fx, chargeback, refund, adjustment, other)
     * @return a list of fees
     * @throws SettlerException if the request fails
     */
    public List<Fee> listByType(String type) throws SettlerException {
        Map<String, String> filters = new HashMap<>();
        filters.put("type", type);
        return list(filters);
    }

    /**
     * Calculates the effective processing rate for transactions.
     *
     * @param transactionId optional transaction ID
     * @param provider optional provider filter
     * @param startDate optional start date
     * @param endDate optional end date
     * @return a list of effective rate results
     * @throws SettlerException if the request fails
     */
    public List<EffectiveRateResult> getEffectiveRate(UUID transactionId, String provider, Instant startDate, Instant endDate) throws SettlerException {
        HttpUrl.Builder urlBuilder = HttpUrl.parse(config.getBaseUrl() + BASE_PATH + "/effective-rate").newBuilder();

        if (transactionId != null) {
            urlBuilder.addQueryParameter("transactionId", transactionId.toString());
        }
        if (provider != null && !provider.isEmpty()) {
            urlBuilder.addQueryParameter("provider", provider);
        }
        if (startDate != null) {
            urlBuilder.addQueryParameter("startDate", startDate.toString());
        }
        if (endDate != null) {
            urlBuilder.addQueryParameter("endDate", endDate.toString());
        }

        Request request = buildRequest(urlBuilder.build());
        
        try (Response response = httpClient.newCall(request).execute()) {
            handleErrorResponse(response);
            
            String body = response.body().string();
            JsonNode root = objectMapper.readTree(body);
            
            return objectMapper.readValue(
                root.get("data").toString(),
                new TypeReference<List<EffectiveRateResult>>() {}
            );
        } catch (IOException e) {
            logger.error("Network error while calculating effective rate", e);
            throw new NetworkException("Failed to calculate effective rate: " + e.getMessage(), e);
        }
    }

    /**
     * Gets the effective rate for a single transaction.
     *
     * @param transactionId the transaction ID
     * @return the effective rate result
     * @throws SettlerException if the request fails or no result found
     */
    public EffectiveRateResult getEffectiveRateForTransaction(UUID transactionId) throws SettlerException {
        List<EffectiveRateResult> results = getEffectiveRate(transactionId, null, null, null);
        if (results.isEmpty()) {
            throw new NotFoundException("Effective rate", transactionId.toString());
        }
        return results.get(0);
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

    private List<Fee> executeListRequest(Request request) throws SettlerException {
        try (Response response = httpClient.newCall(request).execute()) {
            handleErrorResponse(response);
            
            String body = response.body().string();
            JsonNode root = objectMapper.readTree(body);
            
            return objectMapper.readValue(
                root.get("data").toString(),
                new TypeReference<List<Fee>>() {}
            );
        } catch (IOException e) {
            logger.error("Network error while listing fees", e);
            throw new NetworkException("Failed to list fees: " + e.getMessage(), e);
        }
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
                throw new NotFoundException("Fee", null, requestId);
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

    /**
     * Represents an effective rate calculation result.
     */
    public static class EffectiveRateResult {
        private String transactionId;
        private String provider;
        private BigDecimal transactionAmount;
        private BigDecimal totalFees;
        private Double effectiveRate;

        public String getTransactionId() {
            return transactionId;
        }

        public void setTransactionId(String transactionId) {
            this.transactionId = transactionId;
        }

        public String getProvider() {
            return provider;
        }

        public void setProvider(String provider) {
            this.provider = provider;
        }

        public BigDecimal getTransactionAmount() {
            return transactionAmount;
        }

        public void setTransactionAmount(BigDecimal transactionAmount) {
            this.transactionAmount = transactionAmount;
        }

        public BigDecimal getTotalFees() {
            return totalFees;
        }

        public void setTotalFees(BigDecimal totalFees) {
            this.totalFees = totalFees;
        }

        public Double getEffectiveRate() {
            return effectiveRate;
        }

        public void setEffectiveRate(Double effectiveRate) {
            this.effectiveRate = effectiveRate;
        }
    }
}
