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
export { RunDeltaIntelligence } from "./run-delta-intelligence";
export { AdjudicationMemoryService } from "./adjudication-memory";

export type { ExtractedPattern } from "./pattern-extractor";
export type { RoutingDecision } from "./predictive-router";
export type {
  RunDeltaAnalysis,
  RunDeltaResult,
  RunSummary,
  InputDelta,
  CountDelta,
  SeverityDelta,
  NewExceptionPattern,
  ResolvedPattern,
  ConfigDrift,
} from "./run-delta-intelligence";
export type {
  SimilarCase,
  WhyFlaggedResult,
  PolicyTuningHint,
  FlagReason,
  AdjudicationRecord,
  AdjudicationInput,
} from "./adjudication-memory";
