package io.settler;

import io.settler.clients.*;
import io.settler.http.HttpExecutor;

import java.io.Closeable;

/**
 * Production-grade Java SDK client for the Settler Reconciliation API.
 *
 * <p>This is the main entry point for the SDK. It manages a shared HTTP client,
 * connection pool, and JSON serializer, and exposes typed sub-clients for each
 * API domain.
 *
 * <p><b>Usage:</b>
 * <pre>{@code
 * // Create client with API key
 * SettlerClient client = SettlerClient.create("sk_live_your_api_key");
 *
 * // Or use the builder for advanced configuration
 * SettlerClient client = SettlerClient.builder()
 *     .apiKey("sk_live_your_api_key")
 *     .baseUrl("https://api.settler.dev/api/v1")
 *     .build();
 *
 * // Use sub-clients
 * JsonNode jobs = client.jobs().list(1, 100, null, null);
 * JsonNode txns = client.transactions().list();
 * JsonNode report = client.reports().get("job_123");
 *
 * // Always close when done to release connection pool
 * client.close();
 * }</pre>
 *
 * <p><b>Try-with-resources:</b>
 * <pre>{@code
 * try (SettlerClient client = SettlerClient.create("sk_live_key")) {
 *     JsonNode jobs = client.jobs().list(1, 50, null, null);
 * }
 * }</pre>
 */
public final class SettlerClient implements Closeable {

    private final HttpExecutor httpExecutor;
    private final SettlerConfig config;

    // Lazily-initialized sub-clients (thread-safe via final field publishing)
    private final JobsClient jobs;
    private final ReportsClient reports;
    private final TransactionsClient transactions;
    private final SettlementsClient settlements;
    private final FeesClient fees;
    private final ExportsClient exports;
    private final CurrencyClient currency;
    private final WebhooksClient webhooks;
    private final FlagsClient flags;
    private final ReceiptsClient receipts;
    private final AdaptersClient adapters;
    private final ConsoleClient console;

    private SettlerClient(SettlerConfig config) {
        this.config = config;
        this.httpExecutor = new HttpExecutor(config);

        // Initialize all sub-clients with the shared executor
        this.jobs = new JobsClient(httpExecutor);
        this.reports = new ReportsClient(httpExecutor);
        this.transactions = new TransactionsClient(httpExecutor);
        this.settlements = new SettlementsClient(httpExecutor);
        this.fees = new FeesClient(httpExecutor);
        this.exports = new ExportsClient(httpExecutor);
        this.currency = new CurrencyClient(httpExecutor);
        this.webhooks = new WebhooksClient(httpExecutor);
        this.flags = new FlagsClient(httpExecutor);
        this.receipts = new ReceiptsClient(httpExecutor);
        this.adapters = new AdaptersClient(httpExecutor);
        this.console = new ConsoleClient(httpExecutor);
    }

    /**
     * Creates a client with the given API key and default settings.
     *
     * @param apiKey API key (starting with {@code sk_} or {@code rk_})
     * @return a new SettlerClient instance
     */
    public static SettlerClient create(String apiKey) {
        SettlerConfig config = SettlerConfig.builder()
                .apiKey(apiKey)
                .build();
        return new SettlerClient(config);
    }

    /**
     * Creates a client with the given configuration.
     *
     * @param config the SDK configuration
     * @return a new SettlerClient instance
     */
    public static SettlerClient create(SettlerConfig config) {
        return new SettlerClient(config);
    }

    /**
     * Returns a new builder for configuring the client.
     *
     * @return a new builder
     */
    public static Builder builder() {
        return new Builder();
    }

    // ─── Sub-client accessors ────────────────────────────────────────

    /**
     * Gets the Jobs client for reconciliation job operations.
     *
     * @return the jobs client
     */
    public JobsClient jobs() {
        return jobs;
    }

    /**
     * Gets the Reports client for reconciliation reports.
     *
     * @return the reports client
     */
    public ReportsClient reports() {
        return reports;
    }

    /**
     * Gets the Transactions client for transaction operations.
     *
     * @return the transactions client
     */
    public TransactionsClient transactions() {
        return transactions;
    }

    /**
     * Gets the Settlements client for settlement operations.
     *
     * @return the settlements client
     */
    public SettlementsClient settlements() {
        return settlements;
    }

    /**
     * Gets the Fees client for fee visibility and reporting.
     *
     * @return the fees client
     */
    public FeesClient fees() {
        return fees;
    }

    /**
     * Gets the Exports client for data export operations.
     *
     * @return the exports client
     */
    public ExportsClient exports() {
        return exports;
    }

    /**
     * Gets the Currency client for FX and conversion operations.
     *
     * @return the currency client
     */
    public CurrencyClient currency() {
        return currency;
    }

    /**
     * Gets the Webhooks client for webhook operations.
     *
     * @return the webhooks client
     */
    public WebhooksClient webhooks() {
        return webhooks;
    }

    /**
     * Gets the Flags client for evaluating feature flags.
     *
     * @return the flags client
     */
    public FlagsClient flags() {
        return flags;
    }

    /**
     * Gets the Receipts client for processing and parsing receipts.
     *
     * @return the receipts client
     */
    public ReceiptsClient receipts() {
        return receipts;
    }

    /**
     * Gets the Adapters client for managing integrations.
     *
     * @return the adapters client
     */
    public AdaptersClient adapters() {
        return adapters;
    }

    /**
     * Gets the Console client for managing API keys and usage.
     *
     * @return the console client
     */
    public ConsoleClient console() {
        return console;
    }

    /**
     * Gets the underlying HTTP executor (for advanced use).
     *
     * @return the HTTP executor
     */
    public HttpExecutor getHttpExecutor() {
        return httpExecutor;
    }

    /**
     * Gets the SDK configuration.
     *
     * @return the configuration
     */
    public SettlerConfig getConfig() {
        return config;
    }

    /**
     * Closes the client and releases all resources (connection pool, threads).
     */
    @Override
    public void close() {
        httpExecutor.close();
    }

    /**
     * Builder for creating a {@link SettlerClient} with custom configuration.
     */
    public static final class Builder {
        private final SettlerConfig.Builder configBuilder = SettlerConfig.builder();

        private Builder() {
        }

        /**
         * Sets the API key.
         *
         * @param apiKey the API key
         * @return this builder
         */
        public Builder apiKey(String apiKey) {
            configBuilder.apiKey(apiKey);
            return this;
        }

        /**
         * Sets the bearer token.
         *
         * @param bearerToken the JWT token
         * @return this builder
         */
        public Builder bearerToken(String bearerToken) {
            configBuilder.bearerToken(bearerToken);
            return this;
        }

        /**
         * Sets the base URL.
         *
         * @param baseUrl the API base URL
         * @return this builder
         */
        public Builder baseUrl(String baseUrl) {
            configBuilder.baseUrl(baseUrl);
            return this;
        }

        /**
         * Sets the request timeout.
         *
         * @param timeout the timeout duration
         * @return this builder
         */
        public Builder timeout(java.time.Duration timeout) {
            configBuilder.timeout(timeout);
            return this;
        }

        /**
         * Sets max retries on transient errors.
         *
         * @param maxRetries max retry count
         * @return this builder
         */
        public Builder maxRetries(int maxRetries) {
            configBuilder.maxRetries(maxRetries);
            return this;
        }

        /**
         * Builds the client.
         *
         * @return a new SettlerClient instance
         */
        public SettlerClient build() {
            return new SettlerClient(configBuilder.build());
        }
    }
}
