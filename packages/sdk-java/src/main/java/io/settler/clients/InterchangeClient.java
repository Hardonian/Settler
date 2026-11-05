package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.SettlerException;
import io.settler.http.HttpExecutor;

import java.util.HashMap;
import java.util.Map;

/**
 * Client for interchange analysis, rates, and L2/L3 optimization.
 */
public class InterchangeClient {
    private final HttpExecutor executor;

    public InterchangeClient(HttpExecutor executor) {
        this.executor = executor;
    }

    /**
     * Fetch interchange benchmark rates.
     */
    public JsonNode rates(String rail, String cardTier) throws SettlerException {
        Map<String, Object> query = new HashMap<>();
        if (rail != null) {
            query.put("rail", rail);
        }
        if (cardTier != null) {
            query.put("cardTier", cardTier);
        }
        return executor.get("/api/v1/interchange/rates", query);
    }

    /**
     * Analyze transaction fee breakdowns against interchange schedules.
     */
    public JsonNode analyze(Object transactions) throws SettlerException {
        Map<String, Object> body = new HashMap<>();
        body.put("transactions", transactions);
        return executor.post("/api/v1/interchange/analyze", body);
    }

    /**
     * Fetch tenant interchange portfolio optimization metrics.
     */
    public JsonNode portfolio(String tenantId) throws SettlerException {
        Map<String, Object> query = new HashMap<>();
        if (tenantId != null) {
            query.put("tenantId", tenantId);
        }
        return executor.get("/api/v1/interchange/portfolio", query);
    }

    /**
     * Synthesize Level 2/3 line-item and tax data for B2B card qualification.
     */
    public JsonNode enrichL3(Object transactions) throws SettlerException {
        Map<String, Object> body = new HashMap<>();
        body.put("transactions", transactions);
        return executor.post("/api/v1/interchange/enrich-l3", body);
    }
}
