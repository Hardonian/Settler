/**
 * Currency Conversion Service
 * Handles currency conversion during reconciliation
 */
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
export declare function getExchangeRate(fromCurrency: string, toCurrency: string, date: Date): Promise<number | null>;
/**
 * Add exchange rate
 */
export declare function addExchangeRate(fromCurrency: string, toCurrency: string, rate: number, date: Date, source?: string): Promise<string>;
/**
 * Convert amount between currencies
 */
export declare function convertCurrency(tenantId: string, amount: number, fromCurrency: string, toCurrency: string, date: Date, options?: {
    reconciliationRunId?: string;
    transactionId?: string;
}): Promise<{
    originalAmount: number;
    convertedAmount: number;
    exchangeRate: number;
    fromCurrency: string;
    toCurrency: string;
}>;
/**
 * Fetch exchange rates from external API (placeholder for integration)
 */
export declare function fetchExchangeRatesFromAPI(fromCurrency: string, toCurrency: string, date: Date): Promise<number | null>;
//# sourceMappingURL=currency-conversion.d.ts.map