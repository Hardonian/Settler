/**
 * FX Service
 *
 * Handles multi-currency operations: FX rate tracking, base-currency conversion,
 * and currency-aware matching as specified in the Product & Technical Specification.
 */
import { FXConversion, Money } from "@settler/types";
export interface FXRate {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    rateDate: Date;
    provider: string;
}
export declare class FXService {
    /**
     * Record FX conversion
     */
    recordFXConversion(tenantId: string, transactionId: string, fromCurrency: string, toCurrency: string, fromAmount: number, toAmount: number, fxRate: number, provider?: string, rateDate?: Date): Promise<FXConversion>;
    /**
     * Get FX rate for currency pair
     * First checks database, then fetches from external provider if not found
     */
    getFXRate(tenantId: string, fromCurrency: string, toCurrency: string, date?: Date): Promise<number | null>;
    /**
     * Convert amount to base currency
     */
    convertToBaseCurrency(tenantId: string, amount: Money, baseCurrency: string, conversionDate?: Date): Promise<Money | null>;
    /**
     * Get base currency for tenant
     */
    getBaseCurrency(tenantId: string): Promise<string>;
    /**
     * Get all FX rates for a tenant
     * Fetches missing rates from external provider if needed
     */
    getFXRates(tenantId: string, date?: Date): Promise<FXRate[]>;
    /**
     * Sync FX rates from external provider
     * Fetches and stores rates for common currency pairs
     */
    syncFXRates(tenantId: string, baseCurrency?: string, date?: Date): Promise<number>;
    /**
     * Generate ID
     */
    private generateId;
}
//# sourceMappingURL=FXService.d.ts.map