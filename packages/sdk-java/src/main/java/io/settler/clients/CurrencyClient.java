package io.settler.clients;

import com.fasterxml.jackson.databind.JsonNode;
import io.settler.exceptions.*;
import io.settler.http.HttpExecutor;

import java.util.*;

/**
 * Client for multi-currency and FX operations.
 */
public class CurrencyClient {
    private static final String BASE_PATH = "/currency";

    private final HttpExecutor http;

    public CurrencyClient(HttpExecutor http) {
        this.http = http;
    }

    /**
     * Convert an amount to a target currency.
     *
     * @param value        the amount to convert
     * @param fromCurrency source currency code (e.g., "USD")
     * @param toCurrency   target currency code (e.g., "EUR")
     * @param date         optional date for historical rates (ISO 8601)
     * @return the conversion result
     * @throws SettlerException if the request fails
     */
    public JsonNode convert(double value, String fromCurrency, String toCurrency, String date) throws SettlerException {
        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, Object> amount = new LinkedHashMap<>();
        amount.put("value", value);
        amount.put("currency", fromCurrency);
        body.put("amount", amount);
        body.put("toCurrency", toCurrency);
        if (date != null) {
            body.put("date", date);
        }
        return http.post(BASE_PATH + "/convert", body);
    }

    /**
     * Get the FX rate for a currency pair.
     *
     * @param fromCurrency source currency code
     * @param toCurrency   target currency code
     * @param date         optional date for historical rates (ISO 8601)
     * @return the FX rate data
     * @throws SettlerException if the request fails
     */
    public JsonNode getFxRate(String fromCurrency, String toCurrency, String date) throws SettlerException {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("fromCurrency", fromCurrency);
        params.put("toCurrency", toCurrency);
        if (date != null) {
            params.put("date", date);
        }
        return http.get(BASE_PATH + "/fx-rate", params);
    }
}
