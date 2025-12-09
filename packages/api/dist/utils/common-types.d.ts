/**
 * Common Type Utilities
 * Provides reusable type utilities for the codebase
 */
/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = {
    success: true;
    data: T;
} | {
    success: false;
    error: E;
};
/**
 * Option type for nullable values
 */
export type Option<T> = T | null | undefined;
/**
 * Branded type for IDs to prevent mixing different ID types
 */
export type Branded<T, B> = T & {
    __brand: B;
};
/**
 * User ID type
 */
export type UserId = Branded<string, 'UserId'>;
/**
 * Tenant ID type
 */
export type TenantId = Branded<string, 'TenantId'>;
/**
 * Job ID type
 */
export type JobId = Branded<string, 'JobId'>;
/**
 * Execution ID type
 */
export type ExecutionId = Branded<string, 'ExecutionId'>;
/**
 * Webhook ID type
 */
export type WebhookId = Branded<string, 'WebhookId'>;
/**
 * Paginated response type
 */
export interface Paginated<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
/**
 * Date range type
 */
export interface DateRange {
    start: Date;
    end: Date;
}
/**
 * Async function type
 */
export type AsyncFunction<TArgs extends unknown[] = [], TReturn = unknown> = (...args: TArgs) => Promise<TReturn>;
/**
 * Type guard for checking if value is not null/undefined
 */
export declare function isNotNull<T>(value: T | null | undefined): value is T;
/**
 * Type guard for checking if value is a string
 */
export declare function isString(value: unknown): value is string;
/**
 * Type guard for checking if value is a number
 */
export declare function isNumber(value: unknown): value is number;
/**
 * Type guard for checking if value is a plain object
 */
export declare function isPlainObject(value: unknown): value is Record<string, unknown>;
/**
 * Safe JSON parse with type guard
 */
export declare function safeJsonParse<T = unknown>(json: string): Result<T, Error>;
/**
 * Deep partial type
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
/**
 * Required fields type
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
/**
 * Omit and make required
 */
export type OmitRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
//# sourceMappingURL=common-types.d.ts.map