import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";

const router: Router = Router();

/**
 * GET /api/v1/security/data-residency
 * Returns data residency settings and PII redaction policies for CISO lock-in.
 */
router.get(
  "/",
  authMiddleware,
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    return res.json({
      data: {
        primaryRegion: "eu-central-1",
        failoverRegion: "eu-west-1",
        piiRedaction: {
          enabled: true,
          maskingLevel: "strict",
          redactedFields: ["customerName", "ssn", "creditCard", "email", "address"],
        },
        dataRetentionDays: 365,
        complianceCertifications: ["SOC2 Type II", "GDPR", "PCI-DSS Level 1", "HIPAA"],
      },
    });
  }
);

export { router as dataResidencyRouter };
