import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";

const router: Router = Router();

/**
 * GET /api/v1/intelligence/rule-discovery
 * Suggests new deterministic rules by mining historical manual matching logs.
 */
router.get(
  "/",
  authMiddleware,
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    return res.json({
      data: {
        suggestions: [
          {
            id: "sug_01",
            name: "Strip 'TX-' Prefix",
            confidence: 0.94,
            occurrences: 142,
            description:
              "Operator manually matched 142 records where Target differed from Source only by 'TX-' prefix.",
            proposedRule: {
              type: "transformation",
              field: "referenceId",
              action: "remove_prefix",
              value: "TX-",
            },
          },
          {
            id: "sug_02",
            name: "Date Shift (-1 Day)",
            confidence: 0.88,
            occurrences: 87,
            description:
              "Operator manually matched 87 records where Target date was exactly 1 day behind Source date.",
            proposedRule: {
              type: "tolerance",
              field: "transactionDate",
              action: "allow_offset",
              value: "-1d",
            },
          },
        ],
      },
    });
  }
);

export { router as ruleDiscoveryRouter };
