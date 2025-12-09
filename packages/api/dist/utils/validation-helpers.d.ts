/**
 * Validation Helpers
 * Type-safe validation utilities using Zod
 */
import { z } from 'zod';
/**
 * Safe parse with typed error handling
 */
export declare function safeParse<T extends z.ZodType>(schema: T, data: unknown): {
    success: true;
    data: z.infer<T>;
} | {
    success: false;
    error: z.ZodError;
};
/**
 * Parse or throw typed error
 */
export declare function parseOrThrow<T extends z.ZodType>(schema: T, data: unknown, errorMessage?: string): z.infer<T>;
/**
 * Validate UUID string
 */
export declare const uuidSchema: z.ZodString;
/**
 * Validate email
 */
export declare const emailSchema: z.ZodString;
/**
 * Validate pagination params
 */
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
}, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
/**
 * Validate date range
 */
export declare const dateRangeSchema: z.ZodEffects<z.ZodObject<{
    start: z.ZodDate;
    end: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    end: Date;
    start: Date;
}, {
    end: Date;
    start: Date;
}>, {
    end: Date;
    start: Date;
}, {
    end: Date;
    start: Date;
}>;
//# sourceMappingURL=validation-helpers.d.ts.map