/**
 * Protocol Utilities
 * Helper functions for working with protocol types
 */
import { Money } from './index';
/**
 * Sanitize string input to prevent XSS
 */
export declare function sanitizeString(input: string): string;
/**
 * Validate ISO 8601 date string
 */
export declare function isValidISODate(dateString: string): boolean;
/**
 * Validate currency code (ISO 4217)
 */
export declare function isValidCurrency(currency: string): boolean;
/**
 * Validate money amount
 */
export declare function isValidMoney(money: Money): boolean;
/**
 * Format money for display
 */
export declare function formatMoney(money: Money, locale?: string): string;
/**
 * Sanitize transaction metadata
 */
export declare function sanitizeTransactionMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined;
/**
 * Validate transaction ID format
 */
export declare function validateTransactionId(id: string): boolean;
/**
 * Mask PII in strings
 */
export declare function maskPII(input: string, maskChar?: string): string;
/**
 * Generate secure random ID
 */
export declare function generateSecureId(prefix?: string): string;
/**
 * Deep clone object (for immutable updates)
 */
export declare function deepClone<T>(obj: T): T;
//# sourceMappingURL=utils.d.ts.map