import { Counter } from "prom-client";
import { register } from "../../infrastructure/observability/metrics";
import type { CapabilityStatus } from "./types";

const capabilityStatusObservedTotal = new Counter({
  name: "capability_status_observed_total",
  help: "Capability status observations from API routes",
  labelNames: ["capability", "state", "source", "route"],
  registers: [register],
});

export function observeCapabilityStatus(status: CapabilityStatus, route: string): void {
  capabilityStatusObservedTotal.inc({
    capability: status.key,
    state: status.state,
    source: status.source,
    route,
  });
}
