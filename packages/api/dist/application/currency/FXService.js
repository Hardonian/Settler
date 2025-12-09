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
     */
    async getFXRate(tenantId, fromCurrency, toCurrency, date) {
        if (fromCurrency === toCurrency) {
            return 1.0;
        }
        const targetDate = date || new Date();
        const result = await (0, db_1.query)(`SELECT fx_rate FROM fx_conversions
       WHERE tenant_id = $1 
         AND from_currency = $2 
         AND to_currency = $3
         AND rate_date <= $4
       ORDER BY rate_date DESC
       LIMIT 1`, [tenantId, fromCurrency, toCurrency, targetDate]);
        if (result.length === 0 || !result[0]) {
            return null; // No FX rate available
        }
        return result[0].fx_rate;
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
            if (typeof baseCurrency === 'string') {
                return baseCurrency;
            }
        }
        return 'USD'; // Default
    }
    /**
     * Get all FX rates for a tenant
     */
    async getFXRates(tenantId, date) {
        const targetDate = date || new Date();
        const result = await (0, db_1.query)(`SELECT DISTINCT ON (from_currency, to_currency)
         from_currency, to_currency, fx_rate, rate_date, provider
       FROM fx_conversions
       WHERE tenant_id = $1 AND rate_date <= $2
       ORDER BY from_currency, to_currency, rate_date DESC`, [tenantId, targetDate]);
        return result.map(row => ({
            fromCurrency: row.from_currency,
            toCurrency: row.to_currency,
            rate: row.fx_rate,
            rateDate: row.rate_date,
            provider: row.provider ?? 'unknown',
        }));
    }
    /**
     * Sync FX rates for a tenant
     */
    async syncFXRates(_tenantId, _baseCurrency) {
        // This would typically fetch rates from an external provider
        // For now, return 0 as a placeholder
        // TODO: Implement actual FX rate syncing from provider
        // Parameters are prefixed with _ to indicate they're intentionally unused for now
        return 0;
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