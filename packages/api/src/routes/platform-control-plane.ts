import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { handleRouteError } from "../utils/error-handler";
import {
  getEnterpriseAnalyticsProvider,
  getOperatorIntelligenceProvider,
  getUnavailableOperatorIntelligenceProvider,
} from "../services/capabilities/registry";
import { isMissingOptionalCapabilityDependency } from "../services/capabilities/errors";
import { observeCapabilityStatus } from "../services/capabilities/telemetry";

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
      const analyticsCapability = getEnterpriseAnalyticsProvider().status();
      const overview = await provider.getPlatformOverview(
        tenantId,
        Number.isFinite(days) ? Math.max(1, days) : 7
      );

      const capability = provider.status();
      observeCapabilityStatus(capability, "/platform-control-plane/overview");
      observeCapabilityStatus(analyticsCapability, "/platform-control-plane/overview");

      res.json({
        data: overview,
        capability: { operatorIntelligence: capability, enterpriseAnalytics: analyticsCapability },
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
        const capability = provider.status();
        const analyticsCapability = getEnterpriseAnalyticsProvider().status();
        observeCapabilityStatus(capability, "/platform-control-plane/overview");
        observeCapabilityStatus(analyticsCapability, "/platform-control-plane/overview");
        res.status(200).json({
          data: await provider.getPlatformOverview(tenantId, 7),
          capability: {
            operatorIntelligence: capability,
            enterpriseAnalytics: analyticsCapability,
          },
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
      const analyticsCapability = getEnterpriseAnalyticsProvider().status();
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
        observeCapabilityStatus(provider.status(), "/platform-control-plane/analytics/export");
        observeCapabilityStatus(analyticsCapability, "/platform-control-plane/analytics/export");
        res.send(csv);
        return;
      }

      const capability = provider.status();
      observeCapabilityStatus(capability, "/platform-control-plane/analytics/export");
      observeCapabilityStatus(analyticsCapability, "/platform-control-plane/analytics/export");
      res.json({
        data: telemetry,
        capability: { operatorIntelligence: capability, enterpriseAnalytics: analyticsCapability },
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
        const capability = provider.status();
        const analyticsCapability = getEnterpriseAnalyticsProvider().status();
        observeCapabilityStatus(capability, "/platform-control-plane/analytics/export");
        observeCapabilityStatus(analyticsCapability, "/platform-control-plane/analytics/export");
        res.status(200).json({
          data: await provider.getTelemetryForExport(tenantId, 30),
          capability: {
            operatorIntelligence: capability,
            enterpriseAnalytics: analyticsCapability,
          },
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
