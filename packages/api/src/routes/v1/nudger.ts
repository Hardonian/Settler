import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { enforceFreezeState } from "../../middleware/governance";
import { decisionEngine } from "../../services/nudger/decision-engine";

const router = Router();

router.use(requireAuth);

const EvaluateSchema = z.object({
  mode: z.enum(["dry_run", "execute"]).default("dry_run"),
  candidates: z.array(
    z.object({
      invoiceId: z.string(),
      targetContact: z.string().email(),
      amount: z.number().positive(),
      dueDate: z.string().datetime(),
    })
  ),
});

// POST /api/v1/nudger/evaluate
router.post("/evaluate", enforceFreezeState(), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const result = EvaluateSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ error: "Invalid request body", details: result.error });
    }

    const { mode, candidates } = result.data;

    // Convert string due dates to Date objects
    const parsedCandidates = candidates.map(c => ({
      ...c,
      dueDate: new Date(c.dueDate),
    }));

    const evaluationResult = await decisionEngine.evaluate(tenantId, parsedCandidates, mode);

    res.json(evaluationResult);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/nudger/analytics
router.get("/analytics", async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const analytics = await decisionEngine.getAnalytics(tenantId);
    
    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

export default router;
