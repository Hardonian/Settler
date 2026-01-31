package io.settler.clients;

import io.settler.exceptions.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ClientTest {

    @Test
    void jobsClientCanBeInstantiated() {
        JobsClient client = new JobsClient("http://localhost:3000/api/v1", "sk_test");
        assertNotNull(client);
    }

    @Test
    void reportsClientCanBeInstantiated() {
        ReportsClient client = new ReportsClient("http://localhost:3000/api/v1", "sk_test");
        assertNotNull(client);
    }

    @Test
    void transactionsClientCanBeInstantiated() {
        TransactionsClient client = new TransactionsClient("http://localhost:3000/api/v1", "sk_test");
        assertNotNull(client);
    }

    @Test
    void settlementsClientCanBeInstantiated() {
        SettlementsClient client = new SettlementsClient("http://localhost:3000/api/v1", "sk_test");
        assertNotNull(client);
    }

    @Test
    void feesClientCanBeInstantiated() {
        FeesClient client = new FeesClient("http://localhost:3000/api/v1", "sk_test");
        assertNotNull(client);
    }

    @Test
    void currencyClientCanBeInstantiated() {
        CurrencyClient client = new CurrencyClient("http://localhost:3000/api/v1", "sk_test");
        assertNotNull(client);
    }

    @Test
    void exportsClientCanBeInstantiated() {
        ExportsClient client = new ExportsClient("http://localhost:3000/api/v1", "sk_test");
        assertNotNull(client);
    }

    @Test
    void webhooksClientCanBeInstantiated() {
        WebhooksClient client = new WebhooksClient("http://localhost:3000/api/v1", "sk_test");
        assertNotNull(client);
    }

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
}
