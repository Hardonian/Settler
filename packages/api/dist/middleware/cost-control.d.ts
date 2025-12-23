/**
 * Cost Control Middleware
 *
 * Enforces cost limits before processing requests
 * Implements backpressure and degradation paths
 */
import { Response, NextFunction } from 'express';
import { TenantRequest } from './tenant';
export interface CostControlOptions {
    costDriverId: string;
    quantity?: number;
    failOpen?: boolean;
    degradedMode?: boolean;
}
/**
 * Middleware to enforce cost limits
 */
export declare function enforceCostControl(options: CostControlOptions): (req: TenantRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check for abuse scenarios
 */
export declare function checkAbuse(): (req: TenantRequest, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=cost-control.d.ts.map