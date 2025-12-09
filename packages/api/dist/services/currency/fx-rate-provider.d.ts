/**
 * FX Rate Provider Service
 * Fetches exchange rates from external providers
 */
export interface FXRateProvider {
    name: string;
    fetchRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<number | null>;
    fetchRates(baseCurrency: string, targetCurrencies: string[], date?: Date): Promise<Record<string, number>>;
}
/**
 * ECB (European Central Bank) FX Rate Provider
 * Free, reliable, updates daily
 * https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html
 */
export declare class ECBProvider implements FXRateProvider {
    name: string;
    private readonly baseUrl;
    fetchRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<number | null>;
    fetchRates(baseCurrency: string, targetCurrencies: string[], date?: Date): Promise<Record<string, number>>;
}
/**
 * Fallback Provider (Manual Entry)
 * Allows manual rate entry when external providers fail
 */
export declare class ManualProvider implements FXRateProvider {
    name: string;
    fetchRate(_fromCurrency: string, _toCurrency: string, _date?: Date): Promise<number | null>;
    fetchRates(_baseCurrency: string, _targetCurrencies: string[], _date?: Date): Promise<Record<string, number>>;
}
/**
 * FX Rate Provider Manager
 * Manages multiple providers with fallback logic
 */
export declare class FXRateProviderManager {
    private providers;
    constructor();
    /**
     * Fetch FX rate using available providers
     */
    fetchRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<{
        rate: number;
        provider: string;
    } | null>;
    /**
     * Fetch multiple FX rates
     */
    fetchRates(baseCurrency: string, targetCurrencies: string[], date?: Date): Promise<Record<string, {
        rate: number;
        provider: string;
    }>>;
}
export declare const fxRateProviderManager: FXRateProviderManager;
//# sourceMappingURL=fx-rate-provider.d.ts.map