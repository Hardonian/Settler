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
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Client for interacting with the Currency API.
 */
public class CurrencyClient {
    private static final Logger logger = LoggerFactory.getLogger(CurrencyClient.class);
    private static final String BASE_PATH = "/currency";

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final SettlerConfig config;

    public CurrencyClient(OkHttpClient httpClient, ObjectMapper objectMapper, SettlerConfig config) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.config = config;
    }

    /**
     * Converts an amount from one currency to another.
     *
     * @param amount the amount to convert
     * @param toCurrency the target currency code (e.g., "USD", "EUR")
     * @param date optional date for historical conversion
     * @return the conversion result with original and converted amounts
     * @throws SettlerException if the request fails
     */
    public ConversionResult convert(Money amount, String toCurrency, Instant date) throws SettlerException {
        HttpUrl url = HttpUrl.parse(config.getBaseUrl() + BASE_PATH + "/convert");
        
        Map<String, Object> body = new HashMap<>();
        body.put("amount", amount);
        body.put("toCurrency", toCurrency);
        if (date != null) {
            body.put("date", date.toString());
        }

        RequestBody requestBody = RequestBody.create(
            MediaType.parse("application/json"),
            objectMapper.writeValueAsString(body)
        );

        Request request = buildPostRequest(url, requestBody);
        return executeConversionRequest(request);
    }

    /**
     * Converts an amount to the base currency using current rates.
     *
     * @param amount the amount to convert
     * @param toCurrency the target currency code
     * @return the conversion result
     * @throws SettlerException if the request fails
     */
    public ConversionResult convert(Money amount, String toCurrency) throws SettlerException {
        return convert(amount, toCurrency, null);
    }

    /**
     * Gets the foreign exchange rate for a currency pair.
     *
     * @param fromCurrency the source currency code
     * @param toCurrency the target currency code
     * @param date optional date for historical rates
     * @return the FX rate information
     * @throws SettlerException if the request fails
     */
    public FxRate getFxRate(String fromCurrency, String toCurrency, Instant date) throws SettlerException {
        HttpUrl.Builder urlBuilder = HttpUrl.parse(config.getBaseUrl() + BASE_PATH + "/fx-rate").newBuilder()
                .addQueryParameter("fromCurrency", fromCurrency)
                .addQueryParameter("toCurrency", toCurrency);

        if (date != null) {
            urlBuilder.addQueryParameter("date", date.toString());
        }

        Request request = buildGetRequest(urlBuilder.build());
        return executeFxRateRequest(request);
    }

    /**
     * Gets the current FX rate for a currency pair.
     *
     * @param fromCurrency the source currency code
     * @param toCurrency the target currency code
     * @return the FX rate information
     * @throws SettlerException if the request fails
     */
    public FxRate getFxRate(String fromCurrency, String toCurrency) throws SettlerException {
        return getFxRate(fromCurrency, toCurrency, null);
    }

    private Request buildGetRequest(HttpUrl url) {
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

    private Request buildPostRequest(HttpUrl url, RequestBody body) {
        Request.Builder builder = new Request.Builder()
                .url(url)
                .post(body)
                .header("Accept", "application/json")
                .header("Content-Type", "application/json");

        if (config.getApiKey() != null) {
            builder.header("X-API-Key", config.getApiKey());
        } else if (config.getBearerToken() != null) {
            builder.header("Authorization", "Bearer " + config.getBearerToken());
        }

        return builder.build();
    }

    private ConversionResult executeConversionRequest(Request request) throws SettlerException {
        try (Response response = httpClient.newCall(request).execute()) {
            handleErrorResponse(response);
            
            String body = response.body().string();
            JsonNode root = objectMapper.readTree(body);
            JsonNode data = root.get("data");
            
            ConversionResult result = new ConversionResult();
            result.setOriginal(objectMapper.treeToValue(data.get("original"), Money.class));
            result.setConverted(objectMapper.treeToValue(data.get("converted"), Money.class));
            
            return result;
        } catch (IOException e) {
            logger.error("Network error while converting currency", e);
            throw new NetworkException("Failed to convert currency: " + e.getMessage(), e);
        }
    }

    private FxRate executeFxRateRequest(Request request) throws SettlerException {
        try (Response response = httpClient.newCall(request).execute()) {
            handleErrorResponse(response);
            
            String body = response.body().string();
            JsonNode root = objectMapper.readTree(body);
            JsonNode data = root.get("data");
            
            return objectMapper.treeToValue(data, FxRate.class);
        } catch (IOException e) {
            logger.error("Network error while getting FX rate", e);
            throw new NetworkException("Failed to get FX rate: " + e.getMessage(), e);
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
                throw new NotFoundException("Currency rate", null, requestId);
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
     * Represents a currency conversion result.
     */
    public static class ConversionResult {
        private Money original;
        private Money converted;

        public Money getOriginal() {
            return original;
        }

        public void setOriginal(Money original) {
            this.original = original;
        }

        public Money getConverted() {
            return converted;
        }

        public void setConverted(Money converted) {
            this.converted = converted;
        }

        @Override
        public String toString() {
            return String.format("%s -> %s", original.format(), converted.format());
        }
    }

    /**
     * Represents an FX rate.
     */
    public static class FxRate {
        private String fromCurrency;
        private String toCurrency;
        private Double rate;
        private Instant date;

        public String getFromCurrency() {
            return fromCurrency;
        }

        public void setFromCurrency(String fromCurrency) {
            this.fromCurrency = fromCurrency;
        }

        public String getToCurrency() {
            return toCurrency;
        }

        public void setToCurrency(String toCurrency) {
            this.toCurrency = toCurrency;
        }

        public Double getRate() {
            return rate;
        }

        public void setRate(Double rate) {
            this.rate = rate;
        }

        public Instant getDate() {
            return date;
        }

        public void setDate(Instant date) {
            this.date = date;
        }

        @Override
        public String toString() {
            return String.format("%s/%s: %f", fromCurrency, toCurrency, rate);
        }
    }
}
