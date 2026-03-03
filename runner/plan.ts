import type { EnforcementPlan } from "../policies/compile";

export interface ExecutionPlan {
  enforcement: EnforcementPlan;
  runId: string;
  outputDir: string;
}
