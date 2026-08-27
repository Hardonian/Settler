package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.SettlerException;
import io.settler.http.HttpExecutor;

import java.util.HashMap;
import java.util.Map;

/**
 * Client for managing integration adapters.
 */
public class AdaptersClient {
    private final HttpExecutor executor;

    public AdaptersClient(HttpExecutor executor) {
        this.executor = executor;
    }

    /**
     * Lists all available adapters.
     *
     * @param cursor Pagination cursor
     * @param limit  Max items to return
     * @return a JSON object containing the list of adapters
     * @throws SettlerException if the request fails
     */
    public JsonNode list(String cursor, Integer limit) throws SettlerException {
        Map<String, Object> query = new HashMap<>();
        if (cursor != null) {
            query.put("cursor", cursor);
        }
        if (limit != null) {
            query.put("limit", limit);
        }
        
        return executor.get("/api/v1/adapters", query);
    }

    /**
     * Gets an adapter by ID.
     *
     * @param id The adapter ID
     * @return the adapter JSON
     * @throws SettlerException if the request fails
     */
    public JsonNode get(String id) throws SettlerException {
        return executor.get("/api/v1/adapters/" + id);
    }
}
