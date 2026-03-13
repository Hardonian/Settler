"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCanonicalUsageEventName = resolveCanonicalUsageEventName;
exports.meterValidatedUsageEvent = meterValidatedUsageEvent;
exports.meterFromLegacyUsageMetric = meterFromLegacyUsageMetric;
const logger_1 = require("../../utils/logger");
const usage_meter_provider_db_1 = require("./usage-meter-provider-db");
const usage_metering_contract_1 = require("./usage-metering-contract");
const usageMeterProvider = (0, usage_meter_provider_db_1.createDatabaseUsageMeterProviderFromEnv)();
const LEGACY_METRIC_TO_CANONICAL = {
    reconciliations: usage_metering_contract_1.USAGE_EVENT_NAME.RUNS_EXECUTED,
    exports: usage_metering_contract_1.USAGE_EVENT_NAME.IMPORTS_PROCESSED,
    playground_runs: usage_metering_contract_1.USAGE_EVENT_NAME.OPERATOR_ACTIONS,
};
function resolveCanonicalUsageEventName(metricType) {
    return LEGACY_METRIC_TO_CANONICAL[metricType] ?? null;
}
async function meterValidatedUsageEvent(event) {
    const parsed = usage_metering_contract_1.usageEventSchema.safeParse(event);
    if (!parsed.success) {
        (0, logger_1.logError)("Invalid usage metering event payload", new Error(parsed.error.message), {
            event,
        });
        return;
    }
    try {
        await usageMeterProvider.meter(parsed.data);
    }
    catch {
        // metering is non-blocking by contract
    }
}
async function meterFromLegacyUsageMetric(params) {
    const eventName = resolveCanonicalUsageEventName(params.metricType);
    if (!eventName) {
        return;
    }
    await meterValidatedUsageEvent({
        tenant_id: params.tenantId,
        run_id: params.runId,
        event_name: eventName,
        quantity: params.quantity,
        occurred_at: new Date().toISOString(),
        metadata: {
            metric_type: params.metricType,
            ...(params.metadata ?? {}),
        },
    });
}
//# sourceMappingURL=metering.js.map