/**
 * Platform Intelligence Services
 *
 * Consolidated exports for intelligence services
 */

export { UsageOptimizer } from "./usage-optimizer";
export { HealthOptimizer } from "./health-optimizer";
export { ProductEvolutionAI } from "./product-evolution";
export { PatternExtractor } from "./pattern-extractor";
export { PredictiveRouter } from "./predictive-router";
export { AdjudicationMemoryService } from "./adjudication-memory";
export { RunDeltaService } from "./run-delta";
export { PriorRunDeltaAnalystService, PRIOR_RUN_DELTA_ANALYST_KEY } from "./prior-run-delta-analyst";

export type { ExtractedPattern } from "./pattern-extractor";
export type { RoutingDecision } from "./predictive-router";
export type {
  SimilarCase,
  WhyFlaggedResult,
  PolicyTuningHint,
  FlagReason,
  AdjudicationMemoryInput,
  AdjudicationMemoryRecord,
} from "./adjudication-memory";
export type { RunDeltaInput, RunDeltaResult, ConfigDrift, RunComparisonMetrics } from "./run-delta";
