"use strict";
/**
 * FX Service
 *
 * Handles multi-currency operations: FX rate tracking, base-currency conversion,
 * and currency-aware matching as specified in the Product & Technical Specification.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FXService = void 0;
const db_1 = require("../../db");
const fx_rate_provider_1 = require("../../services/currency/fx-rate-provider");
const logger_1 = require("../../utils/logger");
class FXService {
    /**
     * Record FX conversion
     */
    async recordFXConversion(tenantId, transactionId, fromCurrency, toCurrency, fromAmount, toAmount, fxRate, provider, rateDate) {
        const conversion = {
            id: this.generateId(),
            tenantId,
            transactionId,
            fromCurrency,
            toCurrency,
            fromAmount,
            toAmount,
            fxRate,
            rateDate: rateDate || new Date(),
            createdAt: new Date(),
        };
        if (provider) {
            conversion.provider = provider;
        }
        await (0, db_1.query)(`INSERT INTO fx_conversions (
        id, tenant_id, transaction_id, from_currency, to_currency,
        from_amount, to_amount, fx_rate, provider, rate_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT DO NOTHING`, [
            conversion.id,
            tenantId,
            transactionId,
            fromCurrency,
            toCurrency,
            fromAmount,
            toAmount,
            fxRate,
            conversion.provider || null,
            conversion.rateDate,
            conversion.createdAt,
        ]);
        return conversion;
    }
    /**
     * Get FX rate for currency pair
     * First checks database, then fetches from external provider if not found
     */
    async getFXRate(tenantId, fromCurrency, toCurrency, date) {
        if (fromCurrency === toCurrency) {
            return 1.0;
        }
        const targetDate = date || new Date();
        // First, check database for existing rate
        const result = await (0, db_1.query)(`SELECT fx_rate, provider FROM fx_conversions
       WHERE tenant_id = $1 
         AND from_currency = $2 
         AND to_currency = $3
         AND rate_date <= $4
       ORDER BY rate_date DESC
       LIMIT 1`, [tenantId, fromCurrency, toCurrency, targetDate]);
        if (result.length > 0 && result[0]) {
            return result[0].fx_rate;
        }
        // Rate not in database - fetch from external provider
        (0, logger_1.logInfo)("FX rate not found in database, fetching from provider", {
            tenantId,
            fromCurrency,
            toCurrency,
            date: targetDate.toISOString(),
        });
        try {
            const fetched = await fx_rate_provider_1.fxRateProviderManager.fetchRate(fromCurrency, toCurrency, targetDate);
            if (fetched) {
                // Store fetched rate in database for future use
                await this.recordFXConversion(tenantId, `auto_${Date.now()}`, fromCurrency, toCurrency, 1.0, // fromAmount (not used for rate storage)
                fetched.rate, // toAmount (not used for rate storage)
                fetched.rate, fetched.provider, targetDate);
                return fetched.rate;
            }
        }
        catch (error) {
            (0, logger_1.logWarn)("Failed to fetch FX rate from provider", {
                fromCurrency,
                toCurrency,
                error: error instanceof Error ? error.message : String(error),
            });
        }
        return null; // No FX rate available
    }
    /**
     * Convert amount to base currency
     */
    async convertToBaseCurrency(tenantId, amount, baseCurrency, conversionDate) {
        if (amount.currency === baseCurrency) {
            return amount;
        }
        const fxRate = await this.getFXRate(tenantId, amount.currency, baseCurrency, conversionDate);
        if (fxRate === null) {
            return null; // Cannot convert
        }
        return {
            value: amount.value * fxRate,
            currency: baseCurrency,
        };
    }
    /**
     * Get base currency for tenant
     */
    async getBaseCurrency(tenantId) {
        // Get from tenant config or default to USD
        const result = await (0, db_1.query)(`SELECT config FROM tenants WHERE id = $1 LIMIT 1`, [tenantId]);
        if (result.length > 0 && result[0]?.config?.baseCurrency) {
            const baseCurrency = result[0].config.baseCurrency;
            if (typeof baseCurrency === "string") {
                return baseCurrency;
            }
        }
        return "USD"; // Default
    }
    /**
     * Get all FX rates for a tenant
     * Fetches missing rates from external provider if needed
     */
    async getFXRates(tenantId, date) {
        const targetDate = date || new Date();
        const result = await (0, db_1.query)(`SELECT DISTINCT ON (from_currency, to_currency)
         from_currency, to_currency, fx_rate, rate_date, provider
       FROM fx_conversions
       WHERE tenant_id = $1 AND rate_date <= $2
       ORDER BY from_currency, to_currency, rate_date DESC`, [tenantId, targetDate]);
        return result.map((row) => ({
            fromCurrency: row.from_currency,
            toCurrency: row.to_currency,
            rate: row.fx_rate,
            rateDate: row.rate_date,
            provider: row.provider ?? "unknown",
        }));
    }
    /**
     * Sync FX rates from external provider
     * Fetches and stores rates for common currency pairs
     */
    async syncFXRates(tenantId, baseCurrency = "USD", date) {
        const targetDate = date || new Date();
        const commonCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY"];
        (0, logger_1.logInfo)("Syncing FX rates from provider", {
            tenantId,
            baseCurrency,
            date: targetDate.toISOString(),
        });
        let syncedCount = 0;
        for (const targetCurrency of commonCurrencies) {
            if (targetCurrency === baseCurrency) {
                continue;
            }
            try {
                const fetched = await fx_rate_provider_1.fxRateProviderManager.fetchRate(baseCurrency, targetCurrency, targetDate);
                if (fetched) {
                    await this.recordFXConversion(tenantId, `sync_${Date.now()}_${targetCurrency}`, baseCurrency, targetCurrency, 1.0, fetched.rate, fetched.rate, fetched.provider, targetDate);
                    syncedCount++;
                }
            }
            catch (error) {
                (0, logger_1.logWarn)("Failed to sync FX rate", {
                    baseCurrency,
                    targetCurrency,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        (0, logger_1.logInfo)("FX rate sync completed", {
            tenantId,
            syncedCount,
            totalAttempted: commonCurrencies.length - 1,
        });
        return syncedCount;
    }
    /**
     * Generate ID
     */
    generateId() {
        return `fx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.FXService = FXService;
//# sourceMappingURL=FXService.js.map