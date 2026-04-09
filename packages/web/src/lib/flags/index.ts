/**
 * Feature Flags & Experiments
 *
 * Centralized exports for feature flags and experiment system
 */

export * from "./flags";
export * from "./resolver";
export * from "./hooks";

// Re-export types for convenience
export type { FlagKey } from "./flags";
export type { UserContext, FlagResolutionResult } from "./resolver";

// Re-export hooks for convenience
export {
  useFeatureFlag,
  useExperimentVariant,
  useFeatureFlags,
  useExperiment,
  useExperimentConversion,
} from "./hooks";
