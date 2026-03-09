import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { handleRouteError } from "../utils/error-handler";
import {
  buildPlatformOverview,
  loadTenantTelemetry,
} from "../services/ops-intelligence/control-plane-analytics";

export const platformControlPlaneRouter: Router = Router();

platformControlPlaneRouter.get(
  "/platform-control-plane/overview",
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(400).json({
        error: "Tenant context required",
        errorCode: "TENANT_CONTEXT_REQUIRED",
      });
      return;
    }

    try {
      const days = Number(req.query.days || 7);
      const telemetry = await loadTenantTelemetry(
        tenantId,
        Number.isFinite(days) ? Math.max(1, days) : 7
      );
      const overview = buildPlatformOverview(telemetry);

      res.json({
        data: overview,
        metadata: {
          tenantId,
          recordCount: telemetry.length,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to load platform control plane overview", 500, {
        tenantId,
        userId: req.userId,
      });
    }
  }
);

platformControlPlaneRouter.get(
  "/platform-control-plane/analytics/export",
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res
        .status(400)
        .json({ error: "Tenant context required", errorCode: "TENANT_CONTEXT_REQUIRED" });
      return;
    }

    try {
      const format = (req.query.format as string) || "json";
      const days = Number(req.query.days || 30);
      const telemetry = await loadTenantTelemetry(
        tenantId,
        Number.isFinite(days) ? Math.max(1, days) : 30
      );

      if (format === "csv") {
        const header = [
          "execution_id",
          "trace_id",
          "timestamp",
          "component",
          "status",
          "latency_ms",
          "queue_ms",
          "compute_ms",
          "storage_bytes",
          "network_egress_bytes",
          "logging_bytes",
          "policy_violations",
          "failure_class",
        ];
        const rows = telemetry.map((t) => [
          t.executionId,
          t.traceId,
          t.timestamp,
          t.component,
          t.status,
          t.latencyMs,
          t.queueMs,
          t.computeMs,
          t.storageBytes,
          t.networkEgressBytes,
          t.loggingBytes,
          t.policyViolationCount,
          t.failureClass || "",
        ]);
        const csv = [header, ...rows]
          .map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
          .join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=tenant-${tenantId}-telemetry.csv`
        );
        res.send(csv);
        return;
      }

      res.json({
        data: telemetry,
        metadata: {
          tenantId,
          count: telemetry.length,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to export analytics dataset", 500, {
        tenantId,
        userId: req.userId,
      });
    }
  }
);
