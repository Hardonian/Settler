/**
 * API Contract Versioning
 *
 * Ensures stable API contracts that create breaking change risk for competitors.
 * Versioned APIs create switching friction when competitors try to clone Settler.
 *
 * PHASE: Workflow Lock-In Reinforcement
 */
import { Request, Response, NextFunction } from "express";
export interface APIVersion {
    version: string;
    deprecated: boolean;
    deprecatedAt?: Date;
    sunsetAt?: Date;
    breakingChanges: string[];
}
/**
 * API Contract Versioning Middleware
 *
 * Enforces API versioning and tracks usage for breaking change analysis
 */
export declare function apiContractVersioningMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Get API version info
 */
export declare function getAPIVersion(version: string): APIVersion | null;
/**
 * Mark API version as deprecated
 */
export declare function deprecateAPIVersion(version: string, sunsetAt?: Date): void;
/**
 * Add breaking change to version
 */
export declare function addBreakingChange(version: string, change: string): void;
/**
 * Get all API versions
 */
export declare function getAllAPIVersions(): Record<string, APIVersion>;
//# sourceMappingURL=api-contract-versioning.d.ts.map