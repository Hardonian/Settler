import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";

const router: Router = Router();

/**
 * GET /api/v1/support/tickets
 * Customer Support Persona: fetch connected Zendesk/Salesforce tickets tied to exceptions.
 */
router.get(
  "/",
  authMiddleware,
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    return res.json({
      data: {
        integrationStatus: "connected",
        platform: "Zendesk",
        tickets: [
          {
            id: "ZD-8492",
            customerName: "Acme Corp",
            subject: "Missing Payout for Invoice #4892",
            status: "open",
            priority: "high",
            linkedExceptionId: "exc_4812",
            amountInDispute: 4500,
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
          {
            id: "ZD-8501",
            customerName: "Global Tech",
            subject: "Double charge inquiry",
            status: "pending",
            priority: "normal",
            linkedExceptionId: "exc_9912",
            amountInDispute: 120,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
    });
  }
);

export { router as supportTicketsRouter };
