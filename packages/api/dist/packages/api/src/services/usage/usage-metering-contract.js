"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopUsageMeterProvider = exports.usageEventSchema = exports.USAGE_EVENT_NAME = void 0;
const zod_1 = require("zod");
exports.USAGE_EVENT_NAME = {
    RUNS_EXECUTED: "runs_executed",
    RECORDS_PROCESSED: "records_processed",
    IMPORTS_PROCESSED: "imports_processed",
    REPLAY_RUNS: "replay_runs",
    OPERATOR_ACTIONS: "operator_actions",
    API_CALLS: "api_calls",
};
exports.usageEventSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1),
    run_id: zod_1.z.string().optional(),
    event_name: zod_1.z.enum([
        exports.USAGE_EVENT_NAME.RUNS_EXECUTED,
        exports.USAGE_EVENT_NAME.RECORDS_PROCESSED,
        exports.USAGE_EVENT_NAME.IMPORTS_PROCESSED,
        exports.USAGE_EVENT_NAME.REPLAY_RUNS,
        exports.USAGE_EVENT_NAME.OPERATOR_ACTIONS,
        exports.USAGE_EVENT_NAME.API_CALLS,
    ]),
    quantity: zod_1.z.number().nonnegative(),
    occurred_at: zod_1.z.string().datetime(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
class NoopUsageMeterProvider {
    providerName = "noop";
    status = "unavailable";
    async meter(_event) {
        return;
    }
}
exports.NoopUsageMeterProvider = NoopUsageMeterProvider;
//# sourceMappingURL=usage-metering-contract.js.map