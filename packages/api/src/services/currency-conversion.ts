/**
 * Currency Conversion Service
 * Handles currency conversion during reconciliation
 */

import { query } from "../db";
import { logError, logInfo } from "../utils/logger";
import { getRedisClient, isRedisConfigured } from "../infrastructure/redis/client";

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: Date;
  source: string;
}

/**
 * Get exchange rate for a currency pair on a specific date
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  date: Date
): Promise<number | null> {
  try {
    if (fromCurrency === toCurrency) {
      return 1.0;
    }

    const dateStr = date.toISOString().split("T")[0] as string;
    const cacheKey = `exchange_rate:${fromCurrency}:${toCurrency}:${dateStr}`;

    const redis = getRedisClient();
    if (isRedisConfigured() && redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return parseFloat(cached as string);
      }
    }

    let rate: number | null = null;

    // Try exact date first
    let result = await query<{ rate: number }>(
      `SELECT rate FROM currency_rates
       WHERE from_currency = $1 AND to_currency = $2 AND date = $3
       ORDER BY created_at DESC
       LIMIT 1`,
      [fromCurrency, toCurrency, dateStr]
    );

    if (result.length > 0 && result[0]) {
      rate = result[0].rate;
    }

    // If not found, try latest available rate
    if (rate === null) {
      result = await query<{ rate: number }>(
        `SELECT rate FROM currency_rates
         WHERE from_currency = $1 AND to_currency = $2 AND date <= $3
         ORDER BY date DESC
         LIMIT 1`,
        [fromCurrency, toCurrency, dateStr]
      );
      if (result.length > 0 && result[0]) {
        rate = result[0].rate;
      }
    }

    // If still not found, try reverse (and invert rate)
    if (rate === null) {
      result = await query<{ rate: number }>(
        `SELECT rate FROM currency_rates
         WHERE from_currency = $1 AND to_currency = $2 AND date <= $3
         ORDER BY date DESC
         LIMIT 1`,
        [toCurrency, fromCurrency, dateStr]
      );

      if (result.length > 0 && result[0]) {
        rate = 1 / result[0].rate;
      }
    }

    if (rate !== null) {
      if (isRedisConfigured() && redis) {
        // Cache the rate for 24 hours (exchange rates for a specific past date don't change)
        await redis.set(cacheKey, rate.toString(), { ex: 86400 });
      }
    }

    return rate;
  } catch (error) {
    logError("Failed to get exchange rate", error, { fromCurrency, toCurrency, date });
    throw error;
  }
}

/**
 * Add exchange rate
 */
export async function addExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  date: Date,
  source: string = "manual"
): Promise<string> {
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO currency_rates (from_currency, to_currency, rate, date, source)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (from_currency, to_currency, date, source) DO UPDATE
       SET rate = EXCLUDED.rate
       RETURNING id`,
      [fromCurrency, toCurrency, rate, date.toISOString().split("T")[0] as string, source] as (
        | string
        | number
        | boolean
        | null
        | Date
      )[]
    );

    const rateId = result[0]?.id || "";
    logInfo("Exchange rate added", { rateId, fromCurrency, toCurrency, rate, date });

    // Invalidate the cache for this currency pair and date
    const dateStr = date.toISOString().split("T")[0] as string;
    const cacheKey = `exchange_rate:${fromCurrency}:${toCurrency}:${dateStr}`;
    const redis = getRedisClient();
    if (isRedisConfigured() && redis) {
      await redis.del(cacheKey);
    }

    return rateId;
  } catch (error) {
    logError("Failed to add exchange rate", error, { fromCurrency, toCurrency, rate });
    throw error;
  }
}

/**
 * Convert amount between currencies
 */
export async function convertCurrency(
  tenantId: string,
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  date: Date,
  options: {
    reconciliationRunId?: string;
    transactionId?: string;
  } = {}
): Promise<{
  originalAmount: number;
  convertedAmount: number;
  exchangeRate: number;
  fromCurrency: string;
  toCurrency: string;
}> {
  try {
    const rate = await getExchangeRate(fromCurrency, toCurrency, date);

    if (!rate) {
      throw new Error(
        `Exchange rate not found for ${fromCurrency} to ${toCurrency} on ${date.toISOString()}`
      );
    }

    const convertedAmount = amount * rate;

    // Log conversion
    if (options.reconciliationRunId || options.transactionId) {
      await query(
        `INSERT INTO currency_conversions (
          tenant_id, reconciliation_run_id, transaction_id,
          from_currency, to_currency, original_amount, converted_amount,
          exchange_rate, rate_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          tenantId,
          options.reconciliationRunId || null,
          options.transactionId || null,
          fromCurrency,
          toCurrency,
          amount,
          convertedAmount,
          rate,
          date.toISOString().split("T")[0] as string,
        ] as (string | number | boolean | null | Date)[]
      );
    }

    return {
      originalAmount: amount,
      convertedAmount,
      exchangeRate: rate,
      fromCurrency,
      toCurrency,
    };
  } catch (error) {
    logError("Failed to convert currency", error, {
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
export async function fetchExchangeRatesFromAPI(
  fromCurrency: string,
  toCurrency: string,
  date: Date
): Promise<number | null> {
  try {
    // Use exchangerate-api.com (free tier: 1,500 requests/month)
    // Alternative: fixer.io, currencylayer.com, openexchangerates.org
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const apiProvider = process.env.EXCHANGE_RATE_PROVIDER || "exchangerate-api";

    if (!apiKey) {
      logInfo("Exchange rate API key not configured", { fromCurrency, toCurrency });
      return null;
    }

    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split("T")[0];

    let rate: number | null = null;

    if (apiProvider === "exchangerate-api" || apiProvider === "exchangerate-api.com") {
      // exchangerate-api.com (free tier)
      const url = `https://api.exchangerate-api.com/v4/historical/${fromCurrency.toUpperCase()}/${dateStr}`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Exchange rate API returned ${response.status}`);
      }

      const data = (await response.json()) as { rates?: Record<string, number> };
      rate = data.rates?.[toCurrency.toUpperCase()] || null;
    } else if (apiProvider === "fixer.io") {
      // Fixer.io (requires API key)
      const url = `http://data.fixer.io/${dateStr}?access_key=${apiKey}&base=${fromCurrency.toUpperCase()}&symbols=${toCurrency.toUpperCase()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Fixer.io API returned ${response.status}`);
      }

      const data = (await response.json()) as { success?: boolean; rates?: Record<string, number> };
      if (data.success && data.rates) {
        rate = data.rates[toCurrency.toUpperCase()] || null;
      }
    } else if (apiProvider === "openexchangerates") {
      // Open Exchange Rates (requires API key)
      const url = `https://openexchangerates.org/api/historical/${dateStr}.json?app_id=${apiKey}&base=${fromCurrency.toUpperCase()}&symbols=${toCurrency.toUpperCase()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open Exchange Rates API returned ${response.status}`);
      }

      const data = (await response.json()) as { rates?: Record<string, number> };
      rate = data.rates?.[toCurrency.toUpperCase()] || null;
    }

    if (rate) {
      logInfo("Exchange rate fetched successfully", {
        fromCurrency,
        toCurrency,
        date: dateStr,
        rate,
        provider: apiProvider,
      });
      return rate;
    }

    logInfo("Exchange rate not found", { fromCurrency, toCurrency, date: dateStr });
    return null;
  } catch (error) {
    logError("Failed to fetch exchange rate from API", error, {
      fromCurrency,
      toCurrency,
      date,
    });
    return null;
  }
}
