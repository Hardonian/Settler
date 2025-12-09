/**
 * API Versioning Middleware
 * Handles version routing and deprecation headers
 */
import { Request, Response, NextFunction } from 'express';
export interface VersionedRequest extends Request {
    apiVersion?: string;
}
/**
 * Extract API version from URL or header
 */
export declare function versionMiddleware(req: VersionedRequest, res: Response, next: NextFunction): void;
/**
 * Add deprecation headers for deprecated endpoints
 */
export declare function deprecateEndpoint(sunsetDate: string, migrationGuideUrl?: string): (_req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=versioning.d.ts.map