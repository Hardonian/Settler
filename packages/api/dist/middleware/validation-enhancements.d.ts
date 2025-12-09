/**
 * Validation Enhancements
 * Additional validations for common endpoints
 */
import { Request, Response, NextFunction } from "express";
/**
 * Validate UUID format
 */
export declare function validateUUID(req: Request, res: Response, next: NextFunction): void;
export declare function validateEmail(email: string): boolean;
/**
 * Validate date range
 */
export declare function validateDateRange(startDate: string | undefined, endDate: string | undefined): {
    valid: boolean;
    error?: string;
};
/**
 * Validate pagination parameters
 */
export declare function validatePagination(page: number | undefined, limit: number | undefined): {
    valid: boolean;
    error?: string;
    page?: number;
    limit?: number;
};
export declare function validateCurrencyCode(currency: string): boolean;
/**
 * Validate job name
 */
export declare function validateJobName(name: string): {
    valid: boolean;
    error?: string;
};
export declare function validateWebhookURL(url: string): {
    valid: boolean;
    error?: string;
};
/**
 * Middleware to validate common request patterns
 */
export declare function commonValidationsMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=validation-enhancements.d.ts.map