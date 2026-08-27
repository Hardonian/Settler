package io.settler.clients;

import io.settler.SettlerClient;
import io.settler.SettlerConfig;
import io.settler.exceptions.*;
import io.settler.http.HttpExecutor;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ClientTest {

    // ─── SettlerClient integration ────────────────────────────────────

    @Test
    void settlerClientCanBeCreatedWithApiKey() {
        SettlerClient client = SettlerClient.create("sk_test_123");
        assertNotNull(client);
        assertNotNull(client.jobs());
        assertNotNull(client.reports());
        assertNotNull(client.transactions());
        assertNotNull(client.settlements());
        assertNotNull(client.fees());
        assertNotNull(client.exports());
        assertNotNull(client.currency());
        assertNotNull(client.webhooks());
        client.close();
    }

    @Test
    void settlerClientBuilderWorks() {
        SettlerClient client = SettlerClient.builder()
                .apiKey("sk_test_123")
                .baseUrl("http://localhost:3000/api/v1")
                .maxRetries(5)
                .build();
        assertNotNull(client);
        assertEquals("http://localhost:3000/api/v1", client.getConfig().getBaseUrl());
        assertEquals(5, client.getConfig().getMaxRetries());
        client.close();
    }

    @Test
    void settlerClientRequiresCredentials() {
        assertThrows(IllegalStateException.class, () -> {
            SettlerClient.builder().build();
        });
    }

    @Test
    void settlerConfigApiKeyAuth() {
        SettlerConfig config = SettlerConfig.builder()
                .apiKey("sk_test_123")
                .build();
        assertTrue(config.isApiKeyAuth());
        assertEquals("sk_test_123", config.getAuthCredential());
    }

    @Test
    void settlerConfigBearerAuth() {
        SettlerConfig config = SettlerConfig.builder()
                .bearerToken("eyJhbGciOiJIUzI1NiJ9.test")
                .build();
        assertFalse(config.isApiKeyAuth());
        assertEquals("eyJhbGciOiJIUzI1NiJ9.test", config.getAuthCredential());
    }

    @Test
    void settlerConfigTrimTrailingSlash() {
        SettlerConfig config = SettlerConfig.builder()
                .apiKey("sk_test")
                .baseUrl("https://api.settler.dev/api/v1/")
                .build();
        assertEquals("https://api.settler.dev/api/v1", config.getBaseUrl());
    }

    // ─── Sub-client instantiation via HttpExecutor ───────────────────

    @Test
    void subClientsCanBeInstantiatedDirectly() {
        SettlerConfig config = SettlerConfig.builder()
                .apiKey("sk_test")
                .baseUrl("http://localhost:3000/api/v1")
                .build();
        HttpExecutor executor = new HttpExecutor(config);

        assertNotNull(new JobsClient(executor));
        assertNotNull(new ReportsClient(executor));
        assertNotNull(new TransactionsClient(executor));
        assertNotNull(new SettlementsClient(executor));
        assertNotNull(new FeesClient(executor));
        assertNotNull(new ExportsClient(executor));
        assertNotNull(new CurrencyClient(executor));
        assertNotNull(new WebhooksClient(executor));

        executor.close();
    }

    // ─── Backward compat: deprecated constructors ────────────────────

    @SuppressWarnings("deprecation")
    @Test
    void jobsClientDeprecatedConstructor() {
        JobsClient client = new JobsClient("http://localhost:3000/api/v1", "sk_test");
        assertNotNull(client);
    }

    @SuppressWarnings("deprecation")
    @Test
    void reportsClientDeprecatedConstructor() {
        ReportsClient client = new ReportsClient("http://localhost:3000/api/v1", "sk_test");
        assertNotNull(client);
    }

    // ─── Exception hierarchy ─────────────────────────────────────────

    @Test
    void exceptionHierarchy() {
        assertTrue(new ValidationException("test") instanceof SettlerException);
        assertTrue(new AuthException("test") instanceof SettlerException);
        assertTrue(new NotFoundException("test") instanceof SettlerException);
        assertTrue(new RateLimitException("test") instanceof SettlerException);
        assertTrue(new ServerException("test") instanceof SettlerException);
        assertTrue(new NetworkException("test") instanceof SettlerException);
    }

    @Test
    void exceptionMessages() {
        assertEquals("test", new ValidationException("test").getMessage());
        assertEquals("auth failed", new AuthException("auth failed").getMessage());
        assertEquals("not here", new NotFoundException("not here").getMessage());
    }

    @Test
    void rateLimitExceptionRetryAfter() {
        RateLimitException e = new RateLimitException("rate limited", 120, "req_123");
        assertEquals(120, e.getRetryAfter());
        assertEquals("req_123", e.getRequestId());
        assertNotNull(e.getResetTime());
    }

    @Test
    void validationExceptionField() {
        ValidationException e = new ValidationException("invalid", "email");
        assertEquals("email", e.getField());
        assertEquals(400, e.getStatusCode());
    }

    @Test
    void notFoundExceptionResource() {
        NotFoundException e = new NotFoundException("Transaction", "txn_123");
        assertEquals("Transaction", e.getResourceType());
        assertEquals("txn_123", e.getResourceId());
    }

    @Test
    void networkExceptionRetryable() {
        NetworkException e = new NetworkException("timeout");
        assertTrue(e.isRetryable());

        NetworkException e2 = new NetworkException("bad cert", null, false);
        assertFalse(e2.isRetryable());
    }
}
