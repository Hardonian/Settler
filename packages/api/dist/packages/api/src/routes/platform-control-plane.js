"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformControlPlaneRouter = void 0;
const express_1 = require("express");
const error_handler_1 = require("../utils/error-handler");
const registry_1 = require("../services/capabilities/registry");
const errors_1 = require("../services/capabilities/errors");
const telemetry_1 = require("../services/capabilities/telemetry");
const db_1 = require("../db");
exports.platformControlPlaneRouter = (0, express_1.Router)();
async function getRecentImportWorkbenchSummary(tenantId) {
    const rowsResult = await (0, db_1.query)(`SELECT id, completed_at, metadata
       FROM ingestions
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 20`, [tenantId]);
    const rows = Array.isArray(rowsResult) ? rowsResult : [];
    let importsWithBlockingDiagnostics = 0;
    const first = rows[0];
    for (const row of rows) {
        const metadata = typeof row.metadata === "string"
            ? JSON.parse(row.metadata)
            : row.metadata || {};
        const workbench = (metadata.importWorkbench || {});
        const diagnosticsSummary = (workbench.diagnosticsSummary || {});
        const blocking = Number(diagnosticsSummary.blocking || 0);
        if (blocking > 0) {
            importsWithBlockingDiagnostics += 1;
        }
    }
    let latest;
    if (first && typeof first.id === "string") {
        const metadata = typeof first.metadata === "string"
            ? JSON.parse(first.metadata)
            : first.metadata || {};
        const workbench = (metadata.importWorkbench || {});
        latest = {
            ingestionId: first.id,
            completedAt: first.completed_at instanceof Date ? first.completed_at.toISOString() : null,
            canProceed: typeof workbench.canProceed === "boolean" ? workbench.canProceed : undefined,
        };
    }
    return {
        totalImports: rows.length,
        importsWithBlockingDiagnostics,
        latest,
    };
}
exports.platformControlPlaneRouter.get("/platform-control-plane/overview", async (req, res) => {
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
        const provider = await (0, registry_1.getOperatorIntelligenceProvider)();
        const analyticsCapability = (0, registry_1.getEnterpriseAnalyticsProvider)().status();
        const overview = await provider.getPlatformOverview(tenantId, Number.isFinite(days) ? Math.max(1, days) : 7);
        const importWorkbench = await getRecentImportWorkbenchSummary(tenantId);
        const capability = provider.status();
        (0, telemetry_1.observeCapabilityStatus)(capability, "/platform-control-plane/overview");
        (0, telemetry_1.observeCapabilityStatus)(analyticsCapability, "/platform-control-plane/overview");
        res.json({
            data: {
                ...overview,
                importWorkbench,
            },
            capability: { operatorIntelligence: capability, enterpriseAnalytics: analyticsCapability },
            metadata: {
                tenantId,
                generatedAt: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        if ((0, errors_1.isMissingOptionalCapabilityDependency)(error)) {
            const provider = (0, registry_1.getUnavailableOperatorIntelligenceProvider)("Operator intelligence storage tables are not present in OSS mode");
            const capability = provider.status();
            const analyticsCapability = (0, registry_1.getEnterpriseAnalyticsProvider)().status();
            (0, telemetry_1.observeCapabilityStatus)(capability, "/platform-control-plane/overview");
            (0, telemetry_1.observeCapabilityStatus)(analyticsCapability, "/platform-control-plane/overview");
            res.status(200).json({
                data: {
                    ...(await provider.getPlatformOverview(tenantId, 7)),
                    importWorkbench: await getRecentImportWorkbenchSummary(tenantId),
                },
                capability: {
                    operatorIntelligence: capability,
                    enterpriseAnalytics: analyticsCapability,
                },
                metadata: { tenantId, generatedAt: new Date().toISOString() },
            });
            return;
        }
        (0, error_handler_1.handleRouteError)(res, error, "Failed to load platform control plane overview", 500, {
            tenantId,
            userId: req.userId,
        });
    }
});
exports.platformControlPlaneRouter.get("/platform-control-plane/analytics/export", async (req, res) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
        res
            .status(400)
            .json({ error: "Tenant context required", errorCode: "TENANT_CONTEXT_REQUIRED" });
        return;
    }
    try {
        const format = req.query.format || "json";
        const days = Number(req.query.days || 30);
        const provider = await (0, registry_1.getOperatorIntelligenceProvider)();
        const analyticsCapability = (0, registry_1.getEnterpriseAnalyticsProvider)().status();
        const telemetry = await provider.getTelemetryForExport(tenantId, Number.isFinite(days) ? Math.max(1, days) : 30);
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
            res.setHeader("Content-Disposition", `attachment; filename=tenant-${tenantId}-telemetry.csv`);
            (0, telemetry_1.observeCapabilityStatus)(provider.status(), "/platform-control-plane/analytics/export");
            (0, telemetry_1.observeCapabilityStatus)(analyticsCapability, "/platform-control-plane/analytics/export");
            res.send(csv);
            return;
        }
        const capability = provider.status();
        (0, telemetry_1.observeCapabilityStatus)(capability, "/platform-control-plane/analytics/export");
        (0, telemetry_1.observeCapabilityStatus)(analyticsCapability, "/platform-control-plane/analytics/export");
        res.json({
            data: telemetry,
            capability: { operatorIntelligence: capability, enterpriseAnalytics: analyticsCapability },
            metadata: {
                tenantId,
                count: telemetry.length,
                generatedAt: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        if ((0, errors_1.isMissingOptionalCapabilityDependency)(error)) {
            const provider = (0, registry_1.getUnavailableOperatorIntelligenceProvider)("Operator intelligence storage tables are not present in OSS mode");
            const capability = provider.status();
            const analyticsCapability = (0, registry_1.getEnterpriseAnalyticsProvider)().status();
            (0, telemetry_1.observeCapabilityStatus)(capability, "/platform-control-plane/analytics/export");
            (0, telemetry_1.observeCapabilityStatus)(analyticsCapability, "/platform-control-plane/analytics/export");
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
        (0, error_handler_1.handleRouteError)(res, error, "Failed to export analytics dataset", 500, {
            tenantId,
            userId: req.userId,
        });
    }
});
//# sourceMappingURL=platform-control-plane.js.map