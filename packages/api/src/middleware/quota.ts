/**
 * Quota Enforcement Middleware
 * Enforces quotas before processing requests
 */

import { Response, NextFunction } from "express";
import { TenantRequest } from "./tenant";
import { QuotaService, QuotaType } from "../application/services/QuotaService";
import { Container } from "../infrastructure/di/Container";

export function quotaMiddleware(quotaType: QuotaType, requestedValue: number = 1) {
  return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        res.status(403).json({ error: "TenantNotFound", message: "Tenant context required" });
        return;
      }

      const container = Container.getInstance();
      const quotaService = container.get<QuotaService>("QuotaService");
      await quotaService.enforceQuota(req.tenantId, quotaType, requestedValue);
      next();
    } catch (error: unknown) {
      if (error instanceof Error && "name" in error && error.name === "QuotaExceededError") {
        const quotaError = error as Error & {
          quotaType?: string;
          currentUsage?: number;
          limit?: number;
        };
        res.status(429).json({
          error: "QuotaExceeded",
          message: quotaError.message,
          quotaType: quotaError.quotaType,
          currentUsage: quotaError.currentUsage,
          limit: quotaError.limit,
        });
        return;
      }
      next(error);
    }
  };
}
