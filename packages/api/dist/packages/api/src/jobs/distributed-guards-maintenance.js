"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDistributedGuardsMaintenanceJob = startDistributedGuardsMaintenanceJob;
const distributed_guards_1 = require("../services/distributed-guards");
const logger_1 = require("../utils/logger");
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
function startDistributedGuardsMaintenanceJob() {
    const intervalMs = Number(process.env.DISTRIBUTED_GUARD_CLEANUP_INTERVAL_MS || DEFAULT_INTERVAL_MS);
    const timer = setInterval(() => {
        (0, distributed_guards_1.cleanupExpiredDistributedGuardRecords)().catch((error) => {
            (0, logger_1.logError)("distributed_guard_cleanup_failed", error);
        });
    }, intervalMs);
    (0, logger_1.logInfo)("distributed_guard_cleanup_started", { intervalMs });
    return timer;
}
//# sourceMappingURL=distributed-guards-maintenance.js.map