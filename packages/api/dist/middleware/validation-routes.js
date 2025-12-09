"use strict";
/**
 * Route Validation Utilities
 * Common validation schemas for routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCorrelationParamSchema = exports.adminAggregateParamSchema = exports.adminSagaParamSchema = exports.PAGINATION_LIMITS = exports.paginationSchema = exports.uuidParamSchema = void 0;
exports.normalizePagination = normalizePagination;
const zod_1 = require("zod");
/**
 * UUID parameter validation
 */
exports.uuidParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid UUID format"),
    }),
});
/**
 * Pagination query parameters
 */
exports.paginationSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default("100"),
        offset: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});
/**
 * Standard pagination limits
 */
exports.PAGINATION_LIMITS = {
    MIN: 1,
    MAX: 1000,
    DEFAULT: 100,
};
/**
 * Validate and normalize pagination parameters
 */
function normalizePagination(page, limit, offset) {
    const normalizedLimit = Math.min(Math.max(limit || exports.PAGINATION_LIMITS.DEFAULT, exports.PAGINATION_LIMITS.MIN), exports.PAGINATION_LIMITS.MAX);
    const normalizedOffset = offset !== undefined ? offset : page ? (page - 1) * normalizedLimit : 0;
    return {
        limit: normalizedLimit,
        offset: normalizedOffset,
    };
}
/**
 * Admin route parameter validation
 */
exports.adminSagaParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        sagaType: zod_1.z.string().min(1),
        sagaId: zod_1.z.string().uuid("Invalid saga ID format"),
    }),
});
exports.adminAggregateParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        aggregateType: zod_1.z.string().min(1),
        aggregateId: zod_1.z.string().uuid("Invalid aggregate ID format"),
    }),
});
exports.adminCorrelationParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        correlationId: zod_1.z.string().min(1),
    }),
});
//# sourceMappingURL=validation-routes.js.map