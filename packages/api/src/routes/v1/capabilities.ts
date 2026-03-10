import { Router } from "express";
import { getCapabilityRegistry } from "../../services/capabilities/registry";
import { handleRouteError } from "../../utils/error-handler";

const router: Router = Router();

router.get("/capabilities", async (_req, res) => {
  try {
    const registry = await getCapabilityRegistry();
    res.json({ data: registry.list() });
  } catch (error) {
    return handleRouteError(res, error, "Failed to load capability registry", 500);
  }
});

export default router;
