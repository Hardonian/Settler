import { definePolicy } from "../types";

export const demoStrictPolicy = definePolicy({
  id: "demo.strict",
  version: "1.0.0",
  requiredRole: "operator",
  requiredScopes: ["reconcile:run"],
  evidenceLevel: "full",
  replayRequired: true,
  maxComputeUnits: 1_500,
  maxMemoryUnits: 5_000,
  maxCasIoUnits: 200,
  maxReplayCalls: 3,
  retentionDays: 90,
});
