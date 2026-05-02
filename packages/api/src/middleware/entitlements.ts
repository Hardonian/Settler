import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { checkEntitlements } from "../ops/billing-hardening";
import { prisma } from "../infrastructure/db/prisma";

/**
 * Middleware to ensure the tenant has the required entitlements to perform mutating actions.
 * Assumes req.tenantId is already populated.
 */
export function checkEntitlement() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(401).json({ error: "Unauthorized", message: "Tenant context required" });
      }

      // Find the billing account associated with this tenant
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { billingAccountId: true },
      });

      if (!tenant || !tenant.billingAccountId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "No billing account associated with this tenant",
        });
      }

      const entitlement = await checkEntitlements(tenant.billingAccountId);

      if (!entitlement.canUseAPI) {
        return res.status(403).json({
          error: "Entitlement Required",
          message: entitlement.message || "Your current plan does not allow this operation.",
          upgradeUrl: entitlement.upgradeUrl,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error", message: "Failed to verify entitlements" });
    }
  };
}
