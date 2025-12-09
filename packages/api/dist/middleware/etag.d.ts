/**
 * ETag Middleware
 * Implements HTTP ETags for cache validation on GET requests
 */
import { Request, Response, NextFunction } from 'express';
export interface ETagRequest extends Request {
    etag?: string;
}
/**
 * ETag middleware for GET requests
 */
export declare function etagMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Generate ETag from data object (for manual ETag generation)
 */
export declare function generateETagFromData(data: unknown): string;
//# sourceMappingURL=etag.d.ts.map