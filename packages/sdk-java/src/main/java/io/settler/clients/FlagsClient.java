package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.SettlerException;
import io.settler.http.HttpExecutor;

import java.util.HashMap;
import java.util.Map;

/**
 * Client for evaluating feature flags.
 */
public class FlagsClient {
    private final HttpExecutor executor;

    public FlagsClient(HttpExecutor executor) {
        this.executor = executor;
    }

    /**
     * Evaluates a feature flag for a given context.
     *
     * @param flagKey the key of the flag to evaluate
     * @param context the evaluation context (e.g., userId, email, etc.)
     * @param defaultValue the fallback value if evaluation fails
     * @return a JSON object containing the evaluation result
     * @throws SettlerException if the API request fails
     */
    public JsonNode evaluate(String flagKey, Map<String, Object> context, Object defaultValue) throws SettlerException {
        Map<String, Object> body = new HashMap<>();
        body.put("flagKey", flagKey);
        body.put("context", context == null ? new HashMap<>() : context);
        if (defaultValue != null) {
            body.put("defaultValue", defaultValue);
        }

        return executor.post("/v1/feature-flags/evaluate", body);
    }
}
