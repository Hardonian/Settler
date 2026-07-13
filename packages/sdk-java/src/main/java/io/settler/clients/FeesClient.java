package io.settler.clients;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.*;
import io.settler.http.HttpExecutor;
import io.settler.models.*;

import java.util.*;

/**
 * Client for fee visibility and reporting.
 */
public class FeesClient {
    private static final String BASE_PATH = "/fees";

    private final HttpExecutor http;

    public FeesClient(HttpExecutor http) {
        this.http = http;
    }

    /**
     * Lists fees with optional filtering.
     *
     * @param transactionId filter by transaction ID (nullable)
     * @param settlementId  filter by settlement ID (nullable)
     * @param type          filter by fee type (nullable)
     * @return the fee list
     * @throws SettlerException if the request fails
     */
    public JsonNode list(String transactionId, String settlementId, String type) throws SettlerException {
        Map<String, String> params = new LinkedHashMap<>();
        if (transactionId != null) params.put("transactionId", transactionId);
        if (settlementId != null) params.put("settlementId", settlementId);
        if (type != null) params.put("type", type);
        return http.get(BASE_PATH, params);
    }

    /**
     * Lists all fees.
     *
     * @return the fee list
     * @throws SettlerException if the request fails
     */
    public JsonNode list() throws SettlerException {
        return list(null, null, null);
    }

    /**
     * Gets a fee by ID.
     *
     * @param feeId the fee ID
     * @return the fee details
     * @throws SettlerException if the request fails
     */
    public JsonNode get(String feeId) throws SettlerException {
        return http.get(BASE_PATH + "/" + feeId, null);
    }

    /**
     * Calculates the effective processing rate.
     *
     * @param transactionId optional transaction ID
     * @param provider      optional provider filter
     * @param startDate     optional start date (ISO 8601)
     * @param endDate       optional end date (ISO 8601)
     * @return the effective rate data
     * @throws SettlerException if the request fails
     */
    public JsonNode getEffectiveRate(String transactionId, String provider, String startDate, String endDate) throws SettlerException {
        Map<String, String> params = new LinkedHashMap<>();
        if (transactionId != null) params.put("transactionId", transactionId);
        if (provider != null) params.put("provider", provider);
        if (startDate != null) params.put("startDate", startDate);
        if (endDate != null) params.put("endDate", endDate);
        return http.get(BASE_PATH + "/effective-rate", params);
    }

    /**
     * Gets fees for a specific transaction.
     *
     * @param transactionId the transaction ID
     * @return the fee list
     * @throws SettlerException if the request fails
     */
    public JsonNode listByTransaction(String transactionId) throws SettlerException {
        return list(transactionId, null, null);
    }

    /**
     * Gets fees for a specific settlement.
     *
     * @param settlementId the settlement ID
     * @return the fee list
     * @throws SettlerException if the request fails
     */
    public JsonNode listBySettlement(String settlementId) throws SettlerException {
        return list(null, settlementId, null);
    }
}
