package io.settler;

import java.time.Duration;
import java.util.Objects;

/**
 * Configuration for the Settler SDK client.
 *
 * <p>Use the {@link Builder} to construct an instance:
 * <pre>{@code
 * SettlerConfig config = SettlerConfig.builder()
 *     .apiKey("sk_live_your_key")
 *     .baseUrl("https://api.settler.dev/api/v1")
 *     .timeout(Duration.ofSeconds(30))
 *     .build();
 * }</pre>
 *
 * <p>Authentication supports two modes:
 * <ul>
 *   <li>API key auth (keys starting with {@code rk_} or {@code sk_}) — sent as {@code X-API-Key} header</li>
 *   <li>Bearer token auth (JWT tokens) — sent as {@code Authorization: Bearer ...} header</li>
 * </ul>
 */
public final class SettlerConfig {
    private static final String DEFAULT_BASE_URL = "https://api.settler.dev/api/v1";
    private static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(30);
    private static final int DEFAULT_MAX_RETRIES = 3;
    private static final String DEFAULT_USER_AGENT = "settler-java/1.0.0";

    private final String apiKey;
    private final String bearerToken;
    private final String baseUrl;
    private final Duration timeout;
    private final int maxRetries;
    private final String userAgent;

    private SettlerConfig(Builder builder) {
        this.apiKey = builder.apiKey;
        this.bearerToken = builder.bearerToken;
        this.baseUrl = builder.baseUrl;
        this.timeout = builder.timeout;
        this.maxRetries = builder.maxRetries;
        this.userAgent = builder.userAgent;
    }

    /**
     * Gets the API key for X-API-Key authentication.
     *
     * @return the API key, or null if using bearer token auth
     */
    public String getApiKey() {
        return apiKey;
    }

    /**
     * Gets the bearer token for Authorization header authentication.
     *
     * @return the bearer token, or null if using API key auth
     */
    public String getBearerToken() {
        return bearerToken;
    }

    /**
     * Gets the base URL for API requests.
     *
     * @return the base URL (never null)
     */
    public String getBaseUrl() {
        return baseUrl;
    }

    /**
     * Gets the request timeout duration.
     *
     * @return the timeout duration (never null)
     */
    public Duration getTimeout() {
        return timeout;
    }

    /**
     * Gets the maximum number of retries for failed requests.
     *
     * @return the max retry count
     */
    public int getMaxRetries() {
        return maxRetries;
    }

    /**
     * Gets the User-Agent header value.
     *
     * @return the user agent string (never null)
     */
    public String getUserAgent() {
        return userAgent;
    }

    /**
     * Determines the authentication mode based on the configured credentials.
     *
     * @return true if using API key auth (X-API-Key header), false for Bearer token
     */
    public boolean isApiKeyAuth() {
        if (apiKey != null) {
            return apiKey.startsWith("rk_") || apiKey.startsWith("sk_");
        }
        return false;
    }

    /**
     * Gets the effective auth credential (API key or bearer token).
     *
     * @return the credential string
     */
    public String getAuthCredential() {
        return apiKey != null ? apiKey : bearerToken;
    }

    /**
     * Creates a new builder.
     *
     * @return a new Builder instance
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder for {@link SettlerConfig}.
     */
    public static final class Builder {
        private String apiKey;
        private String bearerToken;
        private String baseUrl = DEFAULT_BASE_URL;
        private Duration timeout = DEFAULT_TIMEOUT;
        private int maxRetries = DEFAULT_MAX_RETRIES;
        private String userAgent = DEFAULT_USER_AGENT;

        private Builder() {
        }

        /**
         * Sets the API key for authentication.
         * Use this for keys starting with {@code rk_} or {@code sk_}.
         *
         * @param apiKey the API key
         * @return this builder
         */
        public Builder apiKey(String apiKey) {
            this.apiKey = apiKey;
            return this;
        }

        /**
         * Sets the bearer token for JWT authentication.
         *
         * @param bearerToken the JWT token
         * @return this builder
         */
        public Builder bearerToken(String bearerToken) {
            this.bearerToken = bearerToken;
            return this;
        }

        /**
         * Sets the base URL for the API.
         *
         * @param baseUrl the base URL (default: https://api.settler.dev/api/v1)
         * @return this builder
         */
        public Builder baseUrl(String baseUrl) {
            this.baseUrl = Objects.requireNonNull(baseUrl, "baseUrl must not be null");
            return this;
        }

        /**
         * Sets the request timeout.
         *
         * @param timeout the timeout duration (default: 30 seconds)
         * @return this builder
         */
        public Builder timeout(Duration timeout) {
            this.timeout = Objects.requireNonNull(timeout, "timeout must not be null");
            return this;
        }

        /**
         * Sets the maximum number of retries on transient errors (502, 503, 504).
         *
         * @param maxRetries the max retry count (default: 3)
         * @return this builder
         */
        public Builder maxRetries(int maxRetries) {
            if (maxRetries < 0) {
                throw new IllegalArgumentException("maxRetries must be >= 0");
            }
            this.maxRetries = maxRetries;
            return this;
        }

        /**
         * Sets a custom User-Agent header.
         *
         * @param userAgent the user agent string
         * @return this builder
         */
        public Builder userAgent(String userAgent) {
            this.userAgent = Objects.requireNonNull(userAgent, "userAgent must not be null");
            return this;
        }

        /**
         * Builds the configuration.
         *
         * @return a new SettlerConfig instance
         * @throws IllegalStateException if no authentication credential is configured
         */
        public SettlerConfig build() {
            if (apiKey == null && bearerToken == null) {
                throw new IllegalStateException(
                    "Either apiKey or bearerToken must be configured. " +
                    "Use builder().apiKey(\"sk_...\") or builder().bearerToken(\"eyJ...\")"
                );
            }
            // Trim trailing slashes from base URL
            if (baseUrl.endsWith("/")) {
                baseUrl = baseUrl.replaceAll("/+$", "");
            }
            return new SettlerConfig(this);
        }
    }
}
