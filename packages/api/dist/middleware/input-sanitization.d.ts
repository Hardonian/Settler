/**
 * Input Sanitization Middleware
 * Provides additional input sanitization beyond Zod validation
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Sanitize request body to prevent XSS and injection attacks
 * This is a defense-in-depth measure - Zod validation is primary
 */
export declare function sanitizeInput(req: Request, _res: Response, next: NextFunction): void;
/**
 * Validate and sanitize URL parameters
 */
export declare function sanitizeUrlParams(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=input-sanitization.d.ts.map