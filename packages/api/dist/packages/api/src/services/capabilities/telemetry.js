"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observeCapabilityStatus = observeCapabilityStatus;
const prom_client_1 = require("prom-client");
const metrics_1 = require("../../infrastructure/observability/metrics");
const capabilityStatusObservedTotal = new prom_client_1.Counter({
    name: "capability_status_observed_total",
    help: "Capability status observations from API routes",
    labelNames: ["capability", "state", "source", "route"],
    registers: [metrics_1.register],
});
function observeCapabilityStatus(status, route) {
    capabilityStatusObservedTotal.inc({
        capability: status.key,
        state: status.state,
        source: status.source,
        route,
    });
}
//# sourceMappingURL=telemetry.js.map