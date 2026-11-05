package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.SettlerException;
import io.settler.http.HttpExecutor;

import java.util.HashMap;
import java.util.Map;

/**
 * Client for multi-rail settlement graph analysis.
 */
public class CrossRailClient {
    private final HttpExecutor executor;

    public CrossRailClient(HttpExecutor executor) {
        this.executor = executor;
    }

    /**
     * Analyze cross-rail transactions and bank sweeps for arbitrage and double-refunds.
     */
    public JsonNode analyze(Object transactions, Object bankSweeps) throws SettlerException {
        Map<String, Object> body = new HashMap<>();
        body.put("transactions", transactions);
        if (bankSweeps != null) {
            body.put("bankSweeps", bankSweeps);
        }
        return executor.post("/api/v1/reconciliation/cross-rail", body);
    }
}
