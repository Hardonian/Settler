/**
 * Currency Conversion Service
 * Handles currency conversion during reconciliation
 */

import { query } from "../db";
import { logError, logInfo } from "../utils/logger";

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
    
    // Try exact date first
    let result = await query<{ rate: number }>(
      `SELECT rate FROM currency_rates
       WHERE from_currency = $1 AND to_currency = $2 AND date = $3
       ORDER BY created_at DESC
       LIMIT 1`,
      [fromCurrency, toCurrency, dateStr]
    );

    // If not found, try latest available rate
    if (result.length === 0) {
      result = await query<{ rate: number }>(
        `SELECT rate FROM currency_rates
         WHERE from_currency = $1 AND to_currency = $2 AND date <= $3
         ORDER BY date DESC
         LIMIT 1`,
        [fromCurrency, toCurrency, dateStr]
      );
    }

    // If still not found, try reverse (and invert rate)
    if (result.length === 0) {
      result = await query<{ rate: number }>(
        `SELECT rate FROM currency_rates
         WHERE from_currency = $1 AND to_currency = $2 AND date <= $3
         ORDER BY date DESC
         LIMIT 1`,
        [toCurrency, fromCurrency, dateStr]
      );

      if (result.length > 0 && result[0]) {
        return 1 / result[0].rate;
      }
    }

    return result.length > 0 && result[0] ? result[0].rate : null;
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
      [
        fromCurrency,
        toCurrency,
        rate,
        date.toISOString().split("T")[0] as string,
        source,
      ] as (string | number | boolean | null | Date)[]
    );

    const rateId = result[0]?.id || '';
    logInfo("Exchange rate added", { rateId, fromCurrency, toCurrency, rate, date });
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
    // TODO: Integrate with exchange rate API (e.g., exchangerate-api.com, fixer.io)
    // For now, return null to indicate manual rate entry required
    logInfo("Exchange rate API fetch not implemented", { fromCurrency, toCurrency, date });
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
