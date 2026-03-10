import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { handleRouteError } from "../utils/error-handler";
import {
  getOperatorIntelligenceProvider,
  getUnavailableOperatorIntelligenceProvider,
} from "../services/capabilities/registry";
import { isMissingOptionalCapabilityDependency } from "../services/capabilities/errors";

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
      const provider = await getOperatorIntelligenceProvider();
      const overview = await provider.getPlatformOverview(
        tenantId,
        Number.isFinite(days) ? Math.max(1, days) : 7
      );

      res.json({
        data: overview,
        capability: provider.status(),
        metadata: {
          tenantId,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (isMissingOptionalCapabilityDependency(error)) {
        const provider = getUnavailableOperatorIntelligenceProvider(
          "Operator intelligence storage tables are not present in OSS mode"
        );
        res.status(200).json({
          data: await provider.getPlatformOverview(tenantId, 7),
          capability: provider.status(),
          metadata: { tenantId, generatedAt: new Date().toISOString() },
        });
        return;
      }

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
      const provider = await getOperatorIntelligenceProvider();
      const telemetry = await provider.getTelemetryForExport(
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
        capability: provider.status(),
        metadata: {
          tenantId,
          count: telemetry.length,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (isMissingOptionalCapabilityDependency(error)) {
        const provider = getUnavailableOperatorIntelligenceProvider(
          "Operator intelligence storage tables are not present in OSS mode"
        );
        res.status(200).json({
          data: await provider.getTelemetryForExport(tenantId, 30),
          capability: provider.status(),
          metadata: { tenantId, count: 0, generatedAt: new Date().toISOString() },
        });
        return;
      }

      handleRouteError(res, error, "Failed to export analytics dataset", 500, {
        tenantId,
        userId: req.userId,
      });
    }
  }
);
