"use strict";
/**
 * Validation Helpers
 * Type-safe validation utilities using Zod
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateRangeSchema = exports.paginationSchema = exports.emailSchema = exports.uuidSchema = void 0;
exports.safeParse = safeParse;
exports.parseOrThrow = parseOrThrow;
const zod_1 = require("zod");
/**
 * Safe parse with typed error handling
 */
function safeParse(schema, data) {
    const result = schema.safeParse(data);
    return result;
}
/**
 * Parse or throw typed error
 */
function parseOrThrow(schema, data, errorMessage) {
    const result = schema.safeParse(data);
    if (!result.success) {
        const error = new zod_1.z.ZodError(result.error.errors);
        if (errorMessage) {
            // Create a new error with the custom message since message is read-only
            const customError = new zod_1.z.ZodError(result.error.errors);
            Object.defineProperty(customError, 'message', {
                value: errorMessage,
                writable: true,
                configurable: true
            });
            throw customError;
        }
        throw error;
    }
    return result.data;
}
/**
 * Validate UUID string
 */
exports.uuidSchema = zod_1.z.string().uuid();
/**
 * Validate email
 */
exports.emailSchema = zod_1.z.string().email();
/**
 * Validate pagination params
 */
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(1000).default(100),
});
/**
 * Validate date range
 */
exports.dateRangeSchema = zod_1.z.object({
    start: zod_1.z.date(),
    end: zod_1.z.date(),
}).refine((data) => data.end >= data.start, {
    message: 'End date must be after start date',
});
//# sourceMappingURL=validation-helpers.js.map