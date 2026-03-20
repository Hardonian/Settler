/**
 * SLO Alerting Routes
 *
 * API routes for per-tenant SLO alerting dashboard
 * Mounted at /api/v1/slo
 */

import { Router } from "express";
import { sloRouter } from "../services/slo-alerting/routes";

const router: Router = Router();

// Mount SLO alerting routes
router.use("/", sloRouter);

export { router as sloAlertingRouter };
