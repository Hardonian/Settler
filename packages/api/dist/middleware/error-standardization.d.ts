/**
 * Error Standardization Middleware
 * Ensures all errors follow consistent format
 */
import { Response, Request } from "express";
export interface StandardizedError {
    error: string;
    message: string;
    traceId?: string;
    details?: unknown;
    timestamp: string;
}
/**
 * Standardize error response
 */
export declare function standardizeErrorResponse(error: unknown, req: Request, res: Response): void;
/**
 * Error handler middleware
 */
export declare function errorStandardizationMiddleware(error: unknown, req: Request, res: Response, _next: () => void): void;
//# sourceMappingURL=error-standardization.d.ts.map