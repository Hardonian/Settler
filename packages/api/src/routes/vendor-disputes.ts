import { Router, Response } from "express";
import { handleRouteError } from "../utils/error-handler";

const router: Router = Router();

/**
 * GET /api/v1/vendor-disputes
 * B2B Vendor Portal: fetch disputes associated with external vendors.
 */
router.get("/", async (req, res: Response) => {
  try {
    return res.json({
      data: {
        vendorName: "Acme Logistics Inc.",
        disputes: [
          {
            id: "disp_9912",
            invoiceId: "INV-2026-004",
            amountDisputed: 500,
            currency: "USD",
            status: "requires_evidence",
            reason: "Short shipment - 5 pallets missing",
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          },
          {
            id: "disp_9913",
            invoiceId: "INV-2026-010",
            amountDisputed: 1200,
            currency: "USD",
            status: "in_review",
            reason: "SLA breach penalty",
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          },
        ],
      },
    });
  } catch (error) {
    handleRouteError(res, error, "Failed to fetch vendor disputes", 500);
    return;
  }
});

export { router as vendorDisputesRouter };
