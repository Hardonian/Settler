"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseUsageMeterProvider = void 0;
exports.createDatabaseUsageMeterProviderFromEnv = createDatabaseUsageMeterProviderFromEnv;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
class DatabaseUsageMeterProvider {
    enabled;
    providerName = "database_audit_log";
    status;
    constructor(enabled) {
        this.enabled = enabled;
        this.status = enabled ? "configured" : "unavailable";
    }
    async meter(event) {
        if (!this.enabled) {
            return;
        }
        try {
            await (0, db_1.query)(`INSERT INTO audit_logs (event, tenant_id, metadata, path)
         VALUES ($1, $2, $3::jsonb, $4)`, [
                "usage_metered",
                event.tenant_id,
                JSON.stringify({
                    usage_event_name: event.event_name,
                    run_id: event.run_id ?? null,
                    quantity: event.quantity,
                    occurred_at: event.occurred_at,
                    metadata: event.metadata ?? {},
                }),
                "/internal/usage-meter",
            ]);
        }
        catch (error) {
            (0, logger_1.logError)("Failed to persist usage metering event", error, {
                tenantId: event.tenant_id,
                eventName: event.event_name,
            });
            throw error;
        }
    }
}
exports.DatabaseUsageMeterProvider = DatabaseUsageMeterProvider;
function createDatabaseUsageMeterProviderFromEnv() {
    const enabled = process.env.USAGE_METER_DB_ENABLED === "1" || process.env.USAGE_METER_DB_ENABLED === "true";
    return new DatabaseUsageMeterProvider(enabled);
}
//# sourceMappingURL=usage-meter-provider-db.js.map