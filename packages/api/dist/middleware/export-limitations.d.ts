/**
 * Export Limitations Middleware
 *
 * Limits export frequency and requires approval for large exports.
 * This creates switching friction by making exports less convenient.
 *
 * PHASE: Workflow Lock-In Reinforcement
 */
import { Request, Response, NextFunction } from "express";
export interface ExportLimits {
    dailyLimit: number;
    monthlyLimit: number;
    sizeLimit: number;
    approvalRequired: boolean;
}
/**
 * Export Limitations Middleware
 */
export declare function exportLimitationsMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Get export limits for tenant
 */
export declare function getExportLimits(tenantId: string): Promise<ExportLimits>;
//# sourceMappingURL=export-limitations.d.ts.map