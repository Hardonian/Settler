package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.SettlerException;
import io.settler.http.HttpExecutor;

import java.util.HashMap;
import java.util.Map;

/**
 * Client for receipt processing and parsing operations.
 */
public class ReceiptsClient {
    private final HttpExecutor executor;

    public ReceiptsClient(HttpExecutor executor) {
        this.executor = executor;
    }

    /**
     * Parses a receipt from a URL or base64 content.
     *
     * @param file    URL or base64 string
     * @param options Parsing options (e.g., forceOcr)
     * @return the parsed receipt JSON
     * @throws SettlerException if the request fails
     */
    public JsonNode parse(String file, Map<String, Object> options) throws SettlerException {
        Map<String, Object> body = new HashMap<>();
        if (file.startsWith("http")) {
            body.put("url", file);
        } else {
            body.put("content", file);
        }
        
        if (options != null) {
            body.put("options", options);
        }
        
        return executor.post("/v1/receipts/parse", body);
    }

    /**
     * Retrieves a parsed receipt by ID.
     *
     * @param id The receipt ID
     * @return the receipt JSON
     * @throws SettlerException if the request fails
     */
    public JsonNode get(String id) throws SettlerException {
        return executor.get("/v1/receipts/" + id);
    }
}
