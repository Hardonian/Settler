/**
 * Route Validation Utilities
 * Common validation schemas for routes
 */
import { z } from "zod";
/**
 * UUID parameter validation
 */
export declare const uuidParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
}, {
    params: {
        id: string;
    };
}>;
/**
 * Pagination query parameters
 */
export declare const paginationSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
        offset: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        page: number;
        offset?: number | undefined;
    }, {
        limit?: string | undefined;
        offset?: string | undefined;
        page?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        limit: number;
        page: number;
        offset?: number | undefined;
    };
}, {
    query: {
        limit?: string | undefined;
        offset?: string | undefined;
        page?: string | undefined;
    };
}>;
/**
 * Standard pagination limits
 */
export declare const PAGINATION_LIMITS: {
    readonly MIN: 1;
    readonly MAX: 1000;
    readonly DEFAULT: 100;
};
/**
 * Validate and normalize pagination parameters
 */
export declare function normalizePagination(page?: number, limit?: number, offset?: number): {
    limit: number;
    offset: number;
};
/**
 * Admin route parameter validation
 */
export declare const adminSagaParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        sagaType: z.ZodString;
        sagaId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sagaType: string;
        sagaId: string;
    }, {
        sagaType: string;
        sagaId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        sagaType: string;
        sagaId: string;
    };
}, {
    params: {
        sagaType: string;
        sagaId: string;
    };
}>;
export declare const adminAggregateParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        aggregateType: z.ZodString;
        aggregateId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        aggregateId: string;
        aggregateType: string;
    }, {
        aggregateId: string;
        aggregateType: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        aggregateId: string;
        aggregateType: string;
    };
}, {
    params: {
        aggregateId: string;
        aggregateType: string;
    };
}>;
export declare const adminCorrelationParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        correlationId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        correlationId: string;
    }, {
        correlationId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        correlationId: string;
    };
}, {
    params: {
        correlationId: string;
    };
}>;
//# sourceMappingURL=validation-routes.d.ts.map