"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnavailableOperatorIntelligenceProvider = exports.OssOperatorIntelligenceProvider = void 0;
const control_plane_analytics_1 = require("../../ops-intelligence/control-plane-analytics");
const runtime_events_1 = require("../../ops-intelligence/runtime-events");
class OssOperatorIntelligenceProvider {
    status() {
        return {
            key: "operator_intelligence",
            state: "available",
            available: true,
            source: "oss",
            reason: "Using OSS operator intelligence implementation",
        };
    }
    getSystemHealthSnapshot(tenantId, days) {
        return (0, runtime_events_1.getSystemHealthSnapshot)(tenantId, days);
    }
    getRunExplorer(tenantId, filters) {
        return (0, runtime_events_1.getRunExplorer)(tenantId, filters);
    }
    async getPlatformOverview(tenantId, days) {
        const telemetry = await (0, control_plane_analytics_1.loadTenantTelemetry)(tenantId, days);
        return (0, control_plane_analytics_1.buildPlatformOverview)(telemetry);
    }
    getTelemetryForExport(tenantId, days) {
        return (0, control_plane_analytics_1.loadTenantTelemetry)(tenantId, days);
    }
}
exports.OssOperatorIntelligenceProvider = OssOperatorIntelligenceProvider;
class UnavailableOperatorIntelligenceProvider {
    reason;
    constructor(reason) {
        this.reason = reason;
    }
    status() {
        return {
            key: "operator_intelligence",
            state: "unavailable",
            available: false,
            source: "oss",
            reason: this.reason,
        };
    }
    async getSystemHealthSnapshot() {
        return this.emptySnapshot();
    }
    async getRunExplorer() {
        return [];
    }
    async getPlatformOverview() {
        return {
            telemetry: {
                systemHealth: 0,
                executionThroughputPerMinute: 0,
                replayRate: 0,
                policyViolations: 0,
                failureTrends: {},
                infrastructureUtilization: { avgLatencyMs: 0, p95LatencyMs: 0, avgQueueMs: 0 },
            },
            analytics: {
                executionSuccessRate: 0,
                mttrMinutes: 0,
                failureRecurrenceClusters: [],
                apiEndpointAdoption: [],
                latencyTrend: "stable",
                infrastructureTrend: "stable",
            },
            costs: { perExecutionAverageUsd: 0, totalUsd: 0, byTenantUsd: 0 },
            autonomousOperations: { recommendations: [], controlledAutoRemediation: [] },
            leaderboard: [],
        };
    }
    async getTelemetryForExport() {
        return [];
    }
    emptySnapshot() {
        return {
            runsPerDay: 0,
            recordsProcessed: 0,
            matchRate: 0,
            manualReviewRate: 0,
            runDurationMsP50: 0,
            runDurationMsP95: 0,
            runFailureRate: 0,
            apiLatencyMsP50: 0,
            apiLatencyMsP95: 0,
            errorRate: 0,
        };
    }
}
exports.UnavailableOperatorIntelligenceProvider = UnavailableOperatorIntelligenceProvider;
//# sourceMappingURL=operator-intelligence-provider.js.map