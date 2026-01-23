/**
 * FX Rate Provider Service
 * Fetches exchange rates from external providers
 */

import { logInfo, logError } from "../../utils/logger";

export interface FXRateProvider {
  name: string;
  fetchRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<number | null>;
  fetchRates(
    baseCurrency: string,
    targetCurrencies: string[],
    date?: Date
  ): Promise<Record<string, number>>;
}

/**
 * ECB (European Central Bank) FX Rate Provider
 * Free, reliable, updates daily
 * https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html
 */
export class ECBProvider implements FXRateProvider {
  name = "ECB";

  private readonly baseUrl = "https://api.exchangerate.host";

  async fetchRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<number | null> {
    try {
      const targetDate = date || new Date();
      const dateStr = targetDate.toISOString().split("T")[0];

      // ECB provides EUR-based rates, so we need to convert
      if (fromCurrency === toCurrency) {
        return 1.0;
      }

      // If either currency is EUR, use direct rate
      if (fromCurrency === "EUR") {
        const response = await fetch(`${this.baseUrl}/${dateStr}?base=EUR&symbols=${toCurrency}`);
        const data = await response.json() as any;
        if (data.success && data.rates && data.rates[toCurrency]) {
          return data.rates[toCurrency];
        }
      } else if (toCurrency === "EUR") {
        const response = await fetch(`${this.baseUrl}/${dateStr}?base=EUR&symbols=${fromCurrency}`);
        const data = await response.json() as any;
        if (data.success && data.rates && data.rates[fromCurrency]) {
          return 1.0 / data.rates[fromCurrency]; // Inverse rate
        }
      } else {
        // Both non-EUR: convert via EUR
        const fromToEur = await this.fetchRate(fromCurrency, "EUR", date);
        const eurToTo = await this.fetchRate("EUR", toCurrency, date);
        if (fromToEur && eurToTo) {
          return fromToEur * eurToTo;
        }
      }

      return null;
    } catch (error) {
      logError("ECB FX rate fetch failed", error, { fromCurrency, toCurrency, date });
      return null;
    }
  }

  async fetchRates(
    baseCurrency: string,
    targetCurrencies: string[],
    date?: Date
  ): Promise<Record<string, number>> {
    const rates: Record<string, number> = {};

    for (const targetCurrency of targetCurrencies) {
      const rate = await this.fetchRate(baseCurrency, targetCurrency, date);
      if (rate !== null) {
        rates[targetCurrency] = rate;
      }
    }

    return rates;
  }
}

/**
 * Fallback Provider (Manual Entry)
 * Allows manual rate entry when external providers fail
 */
export class ManualProvider implements FXRateProvider {
  name = "manual";

  async fetchRate(
    _fromCurrency: string,
    _toCurrency: string,
    _date?: Date
  ): Promise<number | null> {
    // Manual provider doesn't fetch - rates must be entered via API
    return null;
  }

  async fetchRates(
    _baseCurrency: string,
    _targetCurrencies: string[],
    _date?: Date
  ): Promise<Record<string, number>> {
    return {};
  }
}

/**
 * FX Rate Provider Manager
 * Manages multiple providers with fallback logic
 */
export class FXRateProviderManager {
  private providers: FXRateProvider[] = [];

  constructor() {
    // Initialize providers in priority order
    this.providers = [
      new ECBProvider(), // Primary provider (free, reliable)
      new ManualProvider(), // Fallback for manual entry
    ];
  }

  /**
   * Fetch FX rate using available providers
   */
  async fetchRate(
    fromCurrency: string,
    toCurrency: string,
    date?: Date
  ): Promise<{ rate: number; provider: string } | null> {
    if (fromCurrency === toCurrency) {
      return { rate: 1.0, provider: "internal" };
    }

    // Try each provider in order
    for (const provider of this.providers) {
      if (provider.name === "manual") {
        continue; // Skip manual provider for automatic fetching
      }

      try {
        const rate = await provider.fetchRate(fromCurrency, toCurrency, date);
        if (rate !== null) {
          logInfo("FX rate fetched", {
            fromCurrency,
            toCurrency,
            rate,
            provider: provider.name,
            date: date?.toISOString(),
          });
          return { rate, provider: provider.name };
        }
      } catch (error) {
        logError(`FX rate fetch failed for ${provider.name}`, error, {
          fromCurrency,
          toCurrency,
        });
        // Continue to next provider
      }
    }

    return null;
  }

  /**
   * Fetch multiple FX rates
   */
  async fetchRates(
    baseCurrency: string,
    targetCurrencies: string[],
    date?: Date
  ): Promise<Record<string, { rate: number; provider: string }>> {
    const results: Record<string, { rate: number; provider: string }> = {};

    for (const targetCurrency of targetCurrencies) {
      const result = await this.fetchRate(baseCurrency, targetCurrency, date);
      if (result) {
        results[targetCurrency] = result;
      }
    }

    return results;
  }
}

// Singleton instance
export const fxRateProviderManager = new FXRateProviderManager();
