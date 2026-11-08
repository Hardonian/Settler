package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.SettlerException;
import io.settler.http.HttpExecutor;

import java.util.HashMap;
import java.util.Map;

/**
 * Client for cryptographic audit proofs and zero-knowledge verification.
 */
public class ProofsClient {
    private final HttpExecutor executor;

    public ProofsClient(HttpExecutor executor) {
        this.executor = executor;
    }

    /**
     * Verify an RFC 6962 proofpack or SMT inclusion proof.
     */
    public JsonNode verify(Object proofpack) throws SettlerException {
        return executor.post("/api/v1/zkp/verify", proofpack);
    }

    /**
     * Execute deterministic Monetary Unit Sampling (MUS) with Merkle manifest.
     */
    public JsonNode auditSampling(Object population, Integer sampleSize, String seed) throws SettlerException {
        Map<String, Object> body = new HashMap<>();
        body.put("population", population);
        if (sampleSize != null) {
            body.put("sampleSize", sampleSize);
        }
        if (seed != null) {
            body.put("seed", seed);
        }
        return executor.post("/api/v1/auditor/samples", body);
    }
}
