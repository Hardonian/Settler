/**
 * CSRF Protection Middleware
 * Protects web UI endpoints from Cross-Site Request Forgery attacks
 *
 * Uses double-submit cookie pattern:
 * 1. Server sets CSRF token in cookie (httpOnly: false for JavaScript access)
 * 2. Client sends token in header (X-CSRF-Token)
 * 3. Server validates token matches cookie value
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            cookies: {
                [key: string]: string;
            };
        }
    }
}
/**
 * CSRF protection middleware
 * Only applies to state-changing methods (POST, PUT, PATCH, DELETE)
 * and only when not using API key authentication
 */
export declare function csrfProtection(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware to set CSRF token cookie
 * Sets token on GET requests for web UI
 */
export declare function setCsrfToken(req: Request, res: Response, next: NextFunction): void;
/**
 * Get CSRF token endpoint (for JavaScript clients)
 * Returns token in response body
 */
export declare function getCsrfToken(req: Request, res: Response): void;
//# sourceMappingURL=csrf.d.ts.map