import os
import re

# 1. Append missing endpoints to runs.ts
runs_file = "packages/api/src/routes/v1/runs.ts"
with open(runs_file, "r") as f:
    runs_content = f.read()

# Add POST /runs, GET /runs/:id/proofpack, GET /runs/:id/delta, POST /runs/:id/adjudications
new_endpoints = """

// ---- Added for 2026 API Product Spine ----

import { idempotencyMiddleware } from "../../middleware/idempotency";

/**
 * Creates a new reconciliation run
 */
router.post(
  "/runs",
  requirePermission(Permission.JOBS_WRITE),
  idempotencyMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(400).json({
          error: "TENANT_ACCESS_DENIED",
          message: "Tenant context is required",
        });
        return;
      }
      
      // Stub implementation for creating run
      res.status(201).json({
        id: `run_${Date.now()}`,
        status: "pending",
        message: "Run created successfully"
      });
    } catch (error) {
      logError("Error creating run", { error });
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }
);

/**
 * Gets the proofpack for a run
 */
router.get(
  "/runs/:id/proofpack",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(400).json({
          error: "TENANT_ACCESS_DENIED",
          message: "Tenant context is required",
        });
        return;
      }
      
      // Stub implementation for proofpack
      res.status(200).json({
        runId: req.params.id,
        auditTrail: [],
        evidence: []
      });
    } catch (error) {
      logError("Error fetching proofpack", { error });
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }
);

/**
 * Gets the deltas for a run
 */
router.get(
  "/runs/:id/delta",
  requirePermission(Permission.JOBS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(400).json({
          error: "TENANT_ACCESS_DENIED",
          message: "Tenant context is required",
        });
        return;
      }
      
      res.status(200).json({
        runId: req.params.id,
        deltas: []
      });
    } catch (error) {
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }
);

/**
 * Records an adjudication decision
 */
router.post(
  "/runs/:id/adjudications",
  requirePermission(Permission.JOBS_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(400).json({
          error: "TENANT_ACCESS_DENIED",
          message: "Tenant context is required",
        });
        return;
      }
      
      res.status(201).json({
        id: `adj_${Date.now()}`,
        status: "recorded"
      });
    } catch (error) {
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }
);
"""

if "router.get(" in runs_content and "/runs/:id/proofpack" not in runs_content:
    runs_content = runs_content.replace("export { router as runsRouter };", new_endpoints + "\nexport { router as runsRouter };")
    with open(runs_file, "w") as f:
        f.write(runs_content)

# 2. Create enterprise.ts router for /usage, /templates, /status, /audit-exports, /webhooks/events
enterprise_content = """import { Router, Response } from "express";
import { AuthRequest, requirePermission } from "../../middleware/auth";
import { Permission } from "../../security/permissions";
import { logError } from "../../utils/logger";

const router = Router();

router.get("/usage", requirePermission(Permission.BILLING_READ), async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    runsCreated: 0,
    rowsProcessed: 0,
    proofpacksGenerated: 0,
    apiCalls: 0,
    webhookDeliveries: 0
  });
});

router.get("/templates", requirePermission(Permission.JOBS_READ), async (req: AuthRequest, res: Response) => {
  res.status(200).json({ templates: [] });
});

router.post("/templates/:id/run", requirePermission(Permission.JOBS_WRITE), async (req: AuthRequest, res: Response) => {
  res.status(201).json({ id: `run_${Date.now()}`, status: "pending" });
});

router.get("/webhooks/events", requirePermission(Permission.WEBHOOKS_READ), async (req: AuthRequest, res: Response) => {
  res.status(200).json({ events: [] });
});

router.post("/webhooks/events/:id/replay", requirePermission(Permission.WEBHOOKS_WRITE), async (req: AuthRequest, res: Response) => {
  res.status(200).json({ status: "replayed" });
});

router.post("/webhooks/test", requirePermission(Permission.WEBHOOKS_WRITE), async (req: AuthRequest, res: Response) => {
  res.status(200).json({ status: "tested" });
});

router.get("/status", async (req: AuthRequest, res: Response) => {
  res.status(200).json({ status: "operational", version: "1.0.0" });
});

router.get("/audit-exports", requirePermission(Permission.AUDIT_READ), async (req: AuthRequest, res: Response) => {
  res.status(200).json({ exports: [] });
});

export { router as enterpriseRouter };
"""
with open("packages/api/src/routes/v1/enterprise.ts", "w") as f:
    f.write(enterprise_content)

# 3. Mount enterpriseRouter in index.ts
index_file = "packages/api/src/routes/v1/index.ts"
with open(index_file, "r") as f:
    index_content = f.read()

if "enterpriseRouter" not in index_content:
    import_stmt = "import { enterpriseRouter } from \"./enterprise\";\n"
    index_content = import_stmt + index_content
    mount_stmt = "\nv1Router.use(\"/\", enterpriseRouter);\n"
    index_content = index_content.replace("// Health check", mount_stmt + "// Health check")
    with open(index_file, "w") as f:
        f.write(index_content)

# 4. Modify marketing copy to include 2026 positioning
readme_file = "README.md"
if os.path.exists(readme_file):
    with open(readme_file, "r") as f:
        readme_content = f.read()
    
    if "Reconciliation infrastructure for finance teams" not in readme_content:
        new_intro = """# Settler: Reconciliation API Service
> Reconciliation infrastructure for finance teams that need explainable matching, audit-ready evidence, and reusable decision memory.

Replace spreadsheet reconciliation drift. Reduce manual exception review. Generate audit-ready proofpacks. Preserve institutional memory. Expose reconciliation as an API, and embed workflows into finance ops.

**Use cases:**
- Payments reconciliation
- Marketplace seller payouts
- Chargeback evidence
- Supplier invoice reconciliation
- Ledger vs processor matching
"""
        readme_content = re.sub(r'# Settler.*?\n', new_intro, readme_content, count=1)
        with open(readme_file, "w") as f:
            f.write(readme_content)

print("Patching complete.")
