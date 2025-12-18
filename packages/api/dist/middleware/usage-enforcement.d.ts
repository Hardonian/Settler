/**
 * Usage Enforcement Middleware
 *
 * Checks usage limits before allowing operations.
 * Works with Supabase client used in API routes.
 */
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
/**
 * Middleware to check usage limit for ingestions
 */
export declare function checkIngestionLimit(): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware to check usage limit for exports
 */
export declare function checkExportLimit(): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=usage-enforcement.d.ts.map