/**
 * Usage Quota Middleware
 * Enforces plan limits and tracks usage
 */
import { Request, Response, NextFunction } from "express";
/**
 * Check usage quota before allowing operation
 */
export declare function checkUsageQuota(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Track usage after successful operation
 */
export declare function trackUsageAfterOperation(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=usage-quota.d.ts.map