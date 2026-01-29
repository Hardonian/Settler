/**
 * User Routes
 * User-specific endpoints
 */

import { Router } from "express";
import onboardingProgressRouter from "./onboarding-progress";

const router: Router = Router();

router.use("/onboarding-progress", onboardingProgressRouter);

export default router;
