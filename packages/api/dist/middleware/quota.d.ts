/**
 * Quota Enforcement Middleware
 * Enforces quotas before processing requests
 */
import { Response, NextFunction } from 'express';
import { TenantRequest } from './tenant';
import { QuotaType } from '../application/services/QuotaService';
export declare function quotaMiddleware(quotaType: QuotaType, requestedValue?: number): (req: TenantRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=quota.d.ts.map