"use strict";
/**
 * Currency Conversion Service
 * Handles currency conversion during reconciliation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExchangeRate = getExchangeRate;
exports.addExchangeRate = addExchangeRate;
exports.convertCurrency = convertCurrency;
exports.fetchExchangeRatesFromAPI = fetchExchangeRatesFromAPI;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
/**
 * Get exchange rate for a currency pair on a specific date
 */
async function getExchangeRate(fromCurrency, toCurrency, date) {
    try {
        if (fromCurrency === toCurrency) {
            return 1.0;
        }
        const dateStr = date.toISOString().split("T")[0];
        // Try exact date first
        let result = await (0, db_1.query)(`SELECT rate FROM currency_rates
       WHERE from_currency = $1 AND to_currency = $2 AND date = $3
       ORDER BY created_at DESC
       LIMIT 1`, [fromCurrency, toCurrency, dateStr]);
        // If not found, try latest available rate
        if (result.length === 0) {
            result = await (0, db_1.query)(`SELECT rate FROM currency_rates
         WHERE from_currency = $1 AND to_currency = $2 AND date <= $3
         ORDER BY date DESC
         LIMIT 1`, [fromCurrency, toCurrency, dateStr]);
        }
        // If still not found, try reverse (and invert rate)
        if (result.length === 0) {
            result = await (0, db_1.query)(`SELECT rate FROM currency_rates
         WHERE from_currency = $1 AND to_currency = $2 AND date <= $3
         ORDER BY date DESC
         LIMIT 1`, [toCurrency, fromCurrency, dateStr]);
            if (result.length > 0 && result[0]) {
                return 1 / result[0].rate;
            }
        }
        return result.length > 0 && result[0] ? result[0].rate : null;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get exchange rate", error, { fromCurrency, toCurrency, date });
        throw error;
    }
}
/**
 * Add exchange rate
 */
async function addExchangeRate(fromCurrency, toCurrency, rate, date, source = "manual") {
    try {
        const result = await (0, db_1.query)(`INSERT INTO currency_rates (from_currency, to_currency, rate, date, source)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (from_currency, to_currency, date, source) DO UPDATE
       SET rate = EXCLUDED.rate
       RETURNING id`, [
            fromCurrency,
            toCurrency,
            rate,
            date.toISOString().split("T")[0],
            source,
        ]);
        const rateId = result[0]?.id || '';
        (0, logger_1.logInfo)("Exchange rate added", { rateId, fromCurrency, toCurrency, rate, date });
        return rateId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to add exchange rate", error, { fromCurrency, toCurrency, rate });
        throw error;
    }
}
/**
 * Convert amount between currencies
 */
async function convertCurrency(tenantId, amount, fromCurrency, toCurrency, date, options = {}) {
    try {
        const rate = await getExchangeRate(fromCurrency, toCurrency, date);
        if (!rate) {
            throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency} on ${date.toISOString()}`);
        }
        const convertedAmount = amount * rate;
        // Log conversion
        if (options.reconciliationRunId || options.transactionId) {
            await (0, db_1.query)(`INSERT INTO currency_conversions (
          tenant_id, reconciliation_run_id, transaction_id,
          from_currency, to_currency, original_amount, converted_amount,
          exchange_rate, rate_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
                tenantId,
                options.reconciliationRunId || null,
                options.transactionId || null,
                fromCurrency,
                toCurrency,
                amount,
                convertedAmount,
                rate,
                date.toISOString().split("T")[0],
            ]);
        }
        return {
            originalAmount: amount,
            convertedAmount,
            exchangeRate: rate,
            fromCurrency,
            toCurrency,
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to convert currency", error, {
            tenantId,
            amount,
            fromCurrency,
            toCurrency,
        });
        throw error;
    }
}
/**
 * Fetch exchange rates from external API (placeholder for integration)
 */
async function fetchExchangeRatesFromAPI(fromCurrency, toCurrency, date) {
    try {
        // Use exchangerate-api.com (free tier: 1,500 requests/month)
        // Alternative: fixer.io, currencylayer.com, openexchangerates.org
        const apiKey = process.env.EXCHANGE_RATE_API_KEY;
        const apiProvider = process.env.EXCHANGE_RATE_PROVIDER || 'exchangerate-api';
        if (!apiKey) {
            (0, logger_1.logInfo)("Exchange rate API key not configured", { fromCurrency, toCurrency });
            return null;
        }
        // Format date as YYYY-MM-DD
        const dateStr = date.toISOString().split('T')[0];
        let rate = null;
        if (apiProvider === 'exchangerate-api' || apiProvider === 'exchangerate-api.com') {
            // exchangerate-api.com (free tier)
            const url = `https://api.exchangerate-api.com/v4/historical/${fromCurrency.toUpperCase()}/${dateStr}`;
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`Exchange rate API returned ${response.status}`);
            }
            const data = await response.json();
            rate = data.rates?.[toCurrency.toUpperCase()] || null;
        }
        else if (apiProvider === 'fixer.io') {
            // Fixer.io (requires API key)
            const url = `http://data.fixer.io/${dateStr}?access_key=${apiKey}&base=${fromCurrency.toUpperCase()}&symbols=${toCurrency.toUpperCase()}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Fixer.io API returned ${response.status}`);
            }
            const data = await response.json();
            if (data.success && data.rates) {
                rate = data.rates[toCurrency.toUpperCase()] || null;
            }
        }
        else if (apiProvider === 'openexchangerates') {
            // Open Exchange Rates (requires API key)
            const url = `https://openexchangerates.org/api/historical/${dateStr}.json?app_id=${apiKey}&base=${fromCurrency.toUpperCase()}&symbols=${toCurrency.toUpperCase()}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Open Exchange Rates API returned ${response.status}`);
            }
            const data = await response.json();
            rate = data.rates?.[toCurrency.toUpperCase()] || null;
        }
        if (rate) {
            (0, logger_1.logInfo)("Exchange rate fetched successfully", {
                fromCurrency,
                toCurrency,
                date: dateStr,
                rate,
                provider: apiProvider,
            });
            return rate;
        }
        (0, logger_1.logInfo)("Exchange rate not found", { fromCurrency, toCurrency, date: dateStr });
        return null;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to fetch exchange rate from API", error, {
            fromCurrency,
            toCurrency,
            date,
        });
        return null;
    }
}
//# sourceMappingURL=currency-conversion.js.map